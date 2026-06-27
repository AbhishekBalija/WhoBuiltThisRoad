"""
BBMP DLP PDF Parser — generic pipeline with pluggable builders.

Pipeline:
    PDF
    → Page Inspector (division + structure detection)
    → Record Builder (groups physical rows into logical records)
    → Field Extractor (extracts field values from each logical record)
    → Normalizer (dates, phone numbers, names)
    → Validator
    → Export CSV + ParseReport
"""

import csv
import re
from datetime import datetime
from pathlib import Path

from .page_inspector import inspect_page
from .builders import REGISTRY
from .report import ParseReport, PageResult, PARSER_VERSION

# ---------------------------------------------------------------------------
# Default configuration
# ---------------------------------------------------------------------------
DEFAULT_CONFIG = {
    "phone_re": re.compile(r"\b[6-9]\d{9}\b"),
    "date_formats": [
        "%d.%m.%Y",
        "%d.%m.%y",
        "%d-%m-%Y",
        "%b %Y",
        "%b-%Y",
        "%Y-%m-%d",
    ],
    "dlp_period_re": re.compile(r"(\d+\.?\d*)"),
}

# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def parse_pdf(pdf_path, config=None):
    """Parse all pages of a DLP PDF.

    Returns
    -------
    (list of dict records, ParseReport)
    """
    config = config or DEFAULT_CONFIG
    import pdfplumber

    report = ParseReport(
        source_file=Path(pdf_path).name,
        started_at=datetime.now().isoformat(),
    )

    all_records = []
    current_division = None

    with pdfplumber.open(pdf_path) as pdf:
        report.pages_total = len(pdf.pages)

        for page_number in range(len(pdf.pages)):
            page = pdf.pages[page_number]

            page_info = inspect_page(page, current_division)
            current_division = page_info["division"] or current_division

            pr = PageResult(
                page_number=page_number,
                division=current_division,
                layout_parser=None,
                physical_rows=page_info["num_rows"],
                serial_rows=page_info["serial_count"],
            )

            if not page_info["has_tables"]:
                report.pages_skipped += 1
                pr.logical_records = 0
                report.pages.append(pr)
                continue

            report.pages_with_tables += 1

            parser = _select_parser(page_info)
            if parser is None:
                report.unknown_layouts.append(page_number)
                pr.layout_parser = None
                pr.logical_records = 0
                report.pages.append(pr)
                continue

            parser_name = type(parser).__name__
            pr.layout_parser = parser_name
            report.layout_parsers_used[parser_name] = (
                report.layout_parsers_used.get(parser_name, 0) + 1
            )

            records = parser.parse(
                page_info["raw_rows"],
                division=current_division,
                config=config,
            )

            pr.logical_records = len(records)

            clean_records = []
            for rec in records:
                _extract_name_phone(rec, config)
                rec["completion_date"] = _normalise_date(
                    rec.get("completion_date"), config["date_formats"]
                )
                rec["dlp_expiry_date"] = _normalise_date(
                    rec.get("dlp_expiry_date"), config["date_formats"]
                )
                rec["dlp_period_years"] = _normalise_dlp_period(
                    rec.get("dlp_period_years"), config["dlp_period_re"]
                )
                rec["_warnings"] = _validate(rec, config)

                # Drop bogus records (header artifacts, phone-as-serial) silently
                rn = rec.get("road_name")
                if not rn or len(rn) < 5:
                    report.records_skipped += 1
                    continue

                if rec["_warnings"]:
                    report.validation_warnings.append({
                        "serial": rec.get("serial_no"),
                        "page": page_number,
                        "warnings": rec["_warnings"],
                    })
                    pr.warnings.append(rec["_warnings"])
                clean_records.append(rec)

            records = clean_records
            pr.records_parsed = len(records)
            report.records_parsed_total += len(records)

            # Count continuation rows merged (approximate: records from
            # ContinuationBuilder have >1 physical rows)
            for rec in records:
                pass  # logical record row count not tracked here yet

            report.divisions_seen[current_division] = (
                report.divisions_seen.get(current_division, 0) + len(records)
            )

            report.pages.append(pr)
            all_records.extend(records)

    report.physical_rows_total = sum(
        p.physical_rows for p in report.pages
    )
    report.serial_rows_total = sum(
        p.serial_rows for p in report.pages
    )
    report.logical_records_total = sum(
        p.logical_records for p in report.pages
    )
    report.complete()

    return all_records, report


def _select_parser(page_info):
    """Pick the first layout parser that claims it can handle this page."""
    for ParserClass in REGISTRY:
        if ParserClass.can_handle(page_info):
            return ParserClass()
    return None


def _extract_name_phone(rec, config):
    """Split ``<raw>`` into ``<name>`` + ``<phone>`` fields."""
    phone_re = config["phone_re"]

    for field in ("contractor", "ae", "aee", "ee"):
        raw_key = f"{field}_raw"
        name_key = f"{field}_name"
        phone_key = f"{field}_phone"

        raw = rec.get(raw_key)
        if not raw:
            rec[name_key] = None
            rec[phone_key] = None
            continue

        phones = phone_re.findall(raw)
        rec[phone_key] = phones[0] if phones else None

        name = re.sub(r"\b[6-9]\d{9}\b", "", raw)
        name = re.sub(r"M/s\.?\s*", "", name, flags=re.IGNORECASE)
        name = re.sub(r"\s*\(\s*\)\s*", "", name)
        name = re.sub(r"\bMob\.?:?\s*", "", name, flags=re.IGNORECASE)
        name = re.sub(r"\(\s*\d[\d\s]{7,}\d\s*\)", "", name)
        name = re.sub(r"\s+", " ", name).strip()
        rec[name_key] = name or None


# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------
def _normalise_date(text, formats):
    if not text:
        return None
    text = text.strip()
    for fmt in formats:
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return text


def _normalise_dlp_period(text, pattern):
    if not text:
        return None
    m = pattern.search(text)
    return float(m.group(1)) if m else None


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
def _validate(rec, config):
    """Return a list of warning strings.  Empty list = valid."""
    warnings = []

    if not rec.get("serial_no"):
        warnings.append("Missing serial number")
    if not rec.get("road_name"):
        warnings.append("Missing road name")

    for field in ("completion_date", "dlp_expiry_date"):
        val = rec.get(field)
        if val and not _looks_like_date(val, config["date_formats"]):
            warnings.append(f"Unrecognised {field}: {val}")

    for field in ("contractor_phone", "ae_phone", "aee_phone", "ee_phone"):
        val = rec.get(field)
        if val and not config["phone_re"].match(val):
            warnings.append(f"Invalid phone in {field}: {val}")

    return warnings


def _looks_like_date(text, formats):
    if not text:
        return False
    for fmt in formats:
        try:
            datetime.strptime(text.strip(), fmt)
            return True
        except ValueError:
            continue
    return False


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------
CSV_HEADERS = [
    "serial_no",
    "road_name",
    "length_km",
    "completion_date",
    "dlp_period_years",
    "dlp_expiry_date",
    "contractor_name",
    "contractor_phone",
    "contractor_raw",
    "ae_name",
    "ae_phone",
    "ae_raw",
    "aee_name",
    "aee_phone",
    "aee_raw",
    "ee_name",
    "ee_phone",
    "ee_raw",
    "division",
]


def to_csv(records, output_path):
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Parse a BBMP DLP PDF")
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--output", default=None)
    ap.add_argument("--report", default=None,
                    help="Path to write JSON ParseReport")
    ap.add_argument(
        "--inspect",
        action="store_true",
        help="Print page-by-page metadata instead of parsing",
    )
    args = ap.parse_args()

    if args.inspect:
        import pdfplumber

        with pdfplumber.open(args.pdf) as pdf:
            div = None
            for i in range(len(pdf.pages)):
                info = inspect_page(pdf.pages[i], div)
                div = info["division"] or div
                print(
                    f"Page {i:2d}  div={info['division'] or '':12s}  "
                    f"src={info['division_source'] or '':8s}  "
                    f"cols={info['num_cols']:2d}  rows={info['num_rows']:2d}  "
                    f"serials={info['serial_count']:2d}  "
                    f"gap={info['serial_gap']}  "
                    f"gaps={str(info.get('serial_gaps', []))[:30]}  "
                    f"title={info['has_title']}"
                )
        raise SystemExit(0)

    records, report = parse_pdf(args.pdf)

    # Print summary
    print(f"Parsed {len(records)} records")
    print(f"Parser version: {report.parser_version}")
    print(f"Physical rows: {report.physical_rows_total}")
    print(f"Serial rows:   {report.serial_rows_total}")
    print(f"Logical recs:  {report.logical_records_total}")
    print(f"Success rate:  {report.success_rate}%")
    print(f"Layouts used:  {report.layout_parsers_used}")
    print(f"Divisions:     {report.divisions_seen}")

    if args.output:
        to_csv(records, args.output)
        print(f"\nWritten to {args.output}")

    if args.report:
        report.save(args.report)
        print(f"Report saved to {args.report}")

    # Print validation warnings
    warned = 0
    for rec in records:
        if rec.get("_warnings"):
            warned += 1
            if warned <= 20:
                print(f"  WARN [{rec.get('serial_no', '?')}]: {rec['_warnings']}")
    if warned > 20:
        print(f"  ... and {warned - 20} more records with warnings")
    if warned == 0:
        print("  No validation warnings")
