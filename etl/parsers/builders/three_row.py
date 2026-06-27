"""ThreeRow layout: 3 consecutive physical rows → 1 logical record.

Row 0: serial | road_name | _ | _ | _ | comp_date | dlp | dlp_exp | _ | contractor | ae | _
Row 1: _      | _         | _ | len | _ | _         | _   | _       | _ | _          | _  | _
Row 2: _      | _         | _ | _   | _ | _         | _   | _       | _ | _          | _  | _
"""

import re

from .base import BaseBuilder, BaseExtractor, BaseLayoutParser, LogicalRecord

SERIAL_RE = re.compile(r"^\d{1,6}$")


class ThreeRowBuilder(BaseBuilder):
    """Groups 3 physical rows per serial-bearing start row."""

    @staticmethod
    def can_handle(page_info):
        gap = page_info.get("serial_gap", 0)
        gaps = page_info.get("serial_gaps", [])
        if gap != 3:
            return False
        has_gap1 = any(g == 1 for g in gaps)
        return not has_gap1

    def build(self, raw_rows, page_info):
        records = []
        i = 0
        while i < len(raw_rows):
            first = _first_non_none(raw_rows[i])
            if first is not None and SERIAL_RE.match(first.strip()):
                chunk = raw_rows[i:i + 3]
                records.append(LogicalRecord(rows=chunk, meta={"row_start": i}))
                i += 3
            else:
                i += 1
        return records


class ThreeRowExtractor(BaseExtractor):
    """Extract fields from a 3-row logical record."""

    def extract(self, logical_record, config):
        rows = logical_record.rows
        r0 = rows[0] if len(rows) > 0 else []
        r1 = rows[1] if len(rows) > 1 else []
        r2 = rows[2] if len(rows) > 2 else []

        def cell(row, idx):
            return _clean(row[idx]) if idx < len(row) else None

        return {
            "serial_no": cell(r0, 0),
            "road_name": cell(r0, 1),
            "length_km": cell(r1, 3),
            "completion_date": cell(r0, 5),
            "dlp_period_years": cell(r0, 6),
            "dlp_expiry_date": cell(r0, 7),
            "contractor_raw": cell(r0, 9),
            "ae_raw": cell(r0, 10),
            "aee_raw": None,
            "ee_raw": None,
        }


class ThreeRowParser(BaseLayoutParser):
    builder_cls = ThreeRowBuilder
    extractor_cls = ThreeRowExtractor

    @staticmethod
    def can_handle(page_info):
        return ThreeRowBuilder.can_handle(page_info)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------
def _first_non_none(row):
    for cell in row:
        if cell is not None:
            return cell
    return None


def _clean(text):
    if not text:
        return None
    cleaned = text.replace("\n", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()
