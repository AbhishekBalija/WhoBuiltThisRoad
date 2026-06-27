"""Continuation layout: a serial-bearing row is followed by 0+ non-serial
rows that contain the continuation of the road name.

Detected by a mixture of gap=1 and gap>1 (but <10) serial spacing.

Record building:
    Serial row + all following non-serial rows (until next serial or exhausted)
    = 1 logical record.

Extraction uses direct column access (not normalised width) because
continuation pages have a shifted column layout due to the 30-column
header collapse — road_name may be in col 1 or col 2.
"""

import re

from .base import BaseBuilder, BaseExtractor, BaseLayoutParser, LogicalRecord

SERIAL_RE = re.compile(r"^\d{1,6}$")


class ContinuationBuilder(BaseBuilder):
    """Groups a serial row with its trailing non-serial continuation rows."""

    MIN_SERIALS = 6

    @staticmethod
    def can_handle(page_info):
        gaps = page_info.get("serial_gaps", [])
        serial_count = page_info.get("serial_count", 0)
        if not gaps or serial_count < ContinuationBuilder.MIN_SERIALS:
            return False

        cont_gaps = [g for g in gaps if 1 < g < 10]

        if len(cont_gaps) < 2:
            return False
        if len(cont_gaps) / len(gaps) < 0.25:
            return False

        has_one = any(g == 1 for g in gaps)

        # Reject if there's a RUN of 2+ consecutive gap=3 (that's
        # a 3-row layout, not continuation spacing).
        has_gap3_run = any(
            gaps[k] == 3 and k + 1 < len(gaps) and gaps[k + 1] == 3
            for k in range(len(gaps) - 1)
        )
        return has_one and not has_gap3_run

    def build(self, raw_rows, page_info):
        records = []
        current_group = []

        for row in raw_rows:
            first = _first_non_none(row)
            is_serial = first is not None and SERIAL_RE.match(first.strip())

            if is_serial:
                if current_group:
                    records.append(LogicalRecord(rows=current_group))
                current_group = [row]
            else:
                if current_group:
                    current_group.append(row)

        if current_group:
            records.append(LogicalRecord(rows=current_group))

        return records


class ContinuationExtractor(BaseExtractor):
    """Extract fields from continuation-pages, handling column shifts.

    Strategy:
        1. Detect road_name column (col 1 or col 2) from first group's
           serial row.
        2. Merge road_name parts from continuation rows.
        3. For dates/fields, walk columns rightward from the road_name
           column, looking for date-like and numeric values.
    """

    def extract(self, logical_record, config):
        rows = logical_record.rows
        if not rows:
            return {}

        r0 = rows[0]
        serial = _clean(r0[0]) if len(r0) > 0 else None

        shift = self._detect_column_shift(r0)
        road_idx = 1 + shift

        road_parts = []
        if len(r0) > road_idx:
            road_parts.append(_clean(r0[road_idx]))

        for row in rows[1:]:
            text = _clean(row[road_idx]) if len(row) > road_idx else None
            if text:
                road_parts.append(text)

        # Scan remaining columns for length, dates, and contractor fields
        length = None
        comp_date = None
        dlp_period = None
        dlp_exp = None
        contractor = None
        ae = None

        # Walk columns after road_name looking for patterns
        for c in range(road_idx + 1, len(r0)):
            val = _clean(r0[c])
            if not val:
                continue
            if _looks_like_number(val) and length is None:
                length = val
            elif _looks_like_date_str(val, config.get("date_formats", [])) and comp_date is None:
                comp_date = val
            elif _looks_like_period(val) and dlp_period is None:
                dlp_period = val
            elif _looks_like_date_str(val, config.get("date_formats", [])) and dlp_exp is None:
                dlp_exp = val
            elif val and contractor is None:
                contractor = val
            elif val and ae is None:
                ae = val

        return {
            "serial_no": serial,
            "road_name": _merge_road(road_parts),
            "length_km": length,
            "completion_date": comp_date,
            "dlp_period_years": dlp_period,
            "dlp_expiry_date": dlp_exp,
            "contractor_raw": contractor,
            "ae_raw": ae,
            "aee_raw": None,
            "ee_raw": None,
        }

    @staticmethod
    def _road_col(serial_row):
        col1 = _clean(serial_row[1]) if len(serial_row) > 1 else None
        col2 = _clean(serial_row[2]) if len(serial_row) > 2 else None
        if (not col1 or len(col1) < 5) and col2 and len(col2) >= 5:
            return 2
        return 1

    @staticmethod
    def _detect_column_shift(serial_row):
        """Return 0 if road_name is in col 1, 1 if in col 2."""
        col1 = _clean(serial_row[1]) if len(serial_row) > 1 else None
        col2 = _clean(serial_row[2]) if len(serial_row) > 2 else None
        if (not col1 or len(col1) < 5) and col2 and len(col2) >= 5:
            return 1
        return 0


class ContinuationParser(BaseLayoutParser):
    builder_cls = ContinuationBuilder
    extractor_cls = ContinuationExtractor

    @staticmethod
    def can_handle(page_info):
        return ContinuationBuilder.can_handle(page_info)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------
def _first_non_none(row):
    for cell in row:
        if cell is not None:
            return cell
    return None


def _clean(text):
    if text is None:
        return None
    cleaned = text.replace("\n", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip() or None


def _merge_road(parts):
    parts = [p for p in parts if p]
    if not parts:
        return None
    merged = " ".join(parts)
    merged = re.sub(r"\s+", " ", merged).strip()
    merged = re.sub(r"[, ]+$", "", merged)
    return merged or None


def _looks_like_number(text):
    """Check if text is a decimal or integer number."""
    text = text.strip().replace(",", "")
    try:
        float(text)
        return True
    except ValueError:
        return False


def _looks_like_date_str(text, formats):
    if not text:
        return False
    from datetime import datetime
    for fmt in formats:
        try:
            datetime.strptime(text.strip(), fmt)
            return True
        except ValueError:
            continue
    return False


def _looks_like_period(text):
    """Check if text contains 'year' or looks like a period specification."""
    t = text.lower().strip()
    if "year" in t:
        return True
    if re.match(r"^\d+\s*YEARS?", t, re.IGNORECASE):
        return True
    return False
