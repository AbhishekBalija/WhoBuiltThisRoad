"""SingleRow layout: 1 physical row = 1 logical record.

Column layout (after normalising to 10):
    0: serial_no       5: dlp_expiry_date
    1: road_name       6: contractor_raw
    2: length_km       7: ae_raw
    3: completion_date 8: aee_raw
    4: dlp_period      9: ee_raw

Acts as a fallback: handles any page with serial-bearing rows that
wasn't claimed by a more specific builder.
"""

import re

from .base import BaseBuilder, BaseExtractor, BaseLayoutParser, LogicalRecord

SERIAL_RE = re.compile(r"^\d{1,6}$")
TARGET_COLUMNS = 10


class SingleRowBuilder(BaseBuilder):
    """Groups each serial-bearing row into its own logical record.

    Fallback builder — matches any page with serials (gap ≤ 3).
    """

    @staticmethod
    def can_handle(page_info):
        gap = page_info.get("serial_gap", 0)
        serial_count = page_info.get("serial_count", 0)
        return gap <= 3 and serial_count > 0

    def build(self, raw_rows, page_info):
        records = []
        for row in raw_rows:
            first = _first_non_none(row)
            if first is not None and SERIAL_RE.match(first.strip()):
                records.append(LogicalRecord(rows=[row]))
        return records


class SingleRowExtractor(BaseExtractor):
    """Extract fields from a single-row logical record."""

    def extract(self, logical_record, config):
        row = logical_record.rows[0]
        cells = _normalise_width(row, TARGET_COLUMNS)
        # Target schema (10 cols): 0=serial,1=road,2=length,3=date,
        # 4=dlp_period,5=dlp_expiry,6=contractor,7=ae,8=aee,9=ee
        return {
            "serial_no": cells[0],
            "road_name": _clean(cells[1]) if len(cells) > 1 else None,
            "length_km": _clean(cells[2]) if len(cells) > 2 else None,
            "completion_date": _clean(cells[3]) if len(cells) > 3 else None,
            "dlp_period_years": _clean(cells[4]) if len(cells) > 4 else None,
            "dlp_expiry_date": _clean(cells[5]) if len(cells) > 5 else None,
            "contractor_raw": _clean(cells[6]) if len(cells) > 6 else None,
            "ae_raw": _clean(cells[7]) if len(cells) > 7 else None,
            "aee_raw": _clean(cells[8]) if len(cells) > 8 else None,
            "ee_raw": _clean(cells[9]) if len(cells) > 9 else None,
        }


class SingleRowParser(BaseLayoutParser):
    builder_cls = SingleRowBuilder
    extractor_cls = SingleRowExtractor

    @staticmethod
    def can_handle(page_info):
        return SingleRowBuilder.can_handle(page_info)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------
def _first_non_none(row):
    for cell in row:
        if cell is not None:
            return cell
    return None


def _normalise_width(row, target):
    """Normalise row to target length using the PDF's column layout.

    Target schema (10 cols): 0=serial,1=road,2=length,3=date,
    4=dlp_period,5=dlp_expiry,6=contractor,7=ae,8=aee,9=ee

    Column layouts found in the PDF:
    -  10 cols: already in target schema
    -  12 cols: structural Nones at indices 4,5 (merged header cells).
               Remove them to match the 10-col schema.
    -  16 cols: data in indices 0-7 matching cols 0-7 of target schema.
               Keep first 8, pad to 10.
    -  30 cols: data every 3rd index (0,3,6,...27) matching target schema.
    -  other: strip all Nones (original fallback).
    """
    cleaned = list(row)
    # Collapse pdfplumber column-span artifact: if the road_name column
    # (position 1) is empty but position 2 has data, remove the empty cell.
    # Only check position 1 — position 2 is a structural None in 30-col layout.
    if len(cleaned) > 2:
        cur = _clean(cleaned[1])
        nxt = _clean(cleaned[2])
        if not cur and nxt:
            del cleaned[1]

    w = len(cleaned)
    if w == 10:
        pass
    elif w == 11 and _clean(cleaned[3]) is None and _clean(cleaned[4]) is None:
        # 12-col with span artifact (pos 1 removed): Nones now at 3,4
        cleaned = cleaned[:3] + cleaned[5:]
    elif w == 12:
        # 12-col layout: remove structural Nones at 4,5
        cleaned = cleaned[:4] + cleaned[6:]
    elif 14 <= w <= 18:
        # 16-col layout: data in first 8 columns
        cleaned = cleaned[:8]
    elif w >= 27:
        # 30-col layout: data every 3rd column
        cleaned = [cleaned[i] for i in range(0, min(w, 30), 3)]
    else:
        # Fallback: strip all Nones
        cleaned = [c for c in cleaned if c is not None]

    if len(cleaned) > target:
        cleaned = cleaned[:target]
    while len(cleaned) < target:
        cleaned.append(None)
    return cleaned


def _clean(text):
    if not text:
        return None
    cleaned = text.replace("\n", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()
