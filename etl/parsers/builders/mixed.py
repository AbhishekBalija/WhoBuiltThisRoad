"""MixedLayout: a page where multiple row-grouping strategies coexist.

For example, Bommanahalli page 32 has 3-row records (gap=3 × 6) followed
by single-row records (gap=1 × 7) on the same page.

The builder detects runs of consecutive same-valued gaps and delegates
to the appropriate sub-builder per run.
"""

import re

from .base import BaseBuilder, BaseLayoutParser, LogicalRecord
from .single_row import SingleRowBuilder, SingleRowExtractor
from .three_row import ThreeRowBuilder, ThreeRowExtractor

SERIAL_RE = re.compile(r"^\d{1,6}$")
CONTINUATION_GAP = 0  # sentinel: non-serial rows inside a 3-row group


class MixedLayoutBuilder(BaseBuilder):
    """Builds records by segmenting the page at gap-change boundaries."""

    MIN_SERIALS_FOR_MIXED = 4

    @staticmethod
    def can_handle(page_info):
        gaps = page_info.get("serial_gaps", [])
        if not gaps:
            return False
        serial_count = page_info.get("serial_count", 0)
        if serial_count < MixedLayoutBuilder.MIN_SERIALS_FOR_MIXED:
            return False

        has_gap1 = any(g == 1 for g in gaps)
        has_gap3 = any(g == 3 for g in gaps)
        if not (has_gap1 and has_gap3):
            return False

        # Require at least 3 consecutive gap=3 (to distinguish from
        # continuation spacing where isolated gap=3 appears).
        def has_run(target, length):
            count = 0
            for g in gaps:
                if g == target:
                    count += 1
                    if count >= length:
                        return True
                else:
                    count = 0
            return False

        return has_run(3, 3)

    def build(self, raw_rows, page_info):
        records = []
        serial_indices, _ = _find_serials(raw_rows)

        if len(serial_indices) < 2:
            return records

        gaps = [
            serial_indices[k + 1] - serial_indices[k]
            for k in range(len(serial_indices) - 1)
        ]

        # Segment: find runs of consecutive same gaps
        segments = _segment_by_gap_run(serial_indices, gaps)

        for seg_serials, gap_type in segments:
            sub_table = raw_rows[seg_serials[0]:seg_serials[-1] + 3] if gap_type == 3 else raw_rows[seg_serials[0]:seg_serials[-1] + 1]
            sub_table = raw_rows[seg_serials[0]:]

            if gap_type == 3:
                sub_end = seg_serials[-1] + 3
            else:
                sub_end = seg_serials[-1] + 1
            sub_table = raw_rows[seg_serials[0]:min(sub_end, len(raw_rows))]

            sub_info = {
                **page_info,
                "num_rows": len(sub_table),
                "serial_count": len(seg_serials),
                "serial_gap": gap_type,
            }

            if gap_type == 3:
                builder = ThreeRowBuilder()
            else:
                builder = SingleRowBuilder()

            recs = builder.build(sub_table, sub_info)
            records.extend(recs)

        return records


class MixedExtractor:
    """Delegates to the extractor matching the sub-builder's strategy."""


class MixedLayoutParser(BaseLayoutParser):
    builder_cls = MixedLayoutBuilder

    @staticmethod
    def can_handle(page_info):
        return MixedLayoutBuilder.can_handle(page_info)

    def parse(self, table, division, config):
        records = []
        si, _ = _find_serials(table)
        if len(si) < 2:
            return records

        gaps = [si[k + 1] - si[k] for k in range(len(si) - 1)]
        segments = _segment_by_gap_run(si, gaps)

        for seg_serials, gap_type in segments:
            if gap_type == 3:
                builder = ThreeRowBuilder()
                extractor = ThreeRowExtractor()
            else:
                builder = SingleRowBuilder()
                extractor = SingleRowExtractor()

            first_idx = seg_serials[0]
            last_idx = seg_serials[-1]
            if gap_type == 3:
                end = last_idx + 3
            else:
                end = last_idx + 1

            sub_table = table[first_idx:min(end, len(table))]
            logical = builder.build(sub_table, {})
            for lr in logical:
                rec = extractor.extract(lr, config)
                rec["division"] = division
                records.append(rec)

        return records


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _find_serials(raw_rows):
    indices = []
    for j, row in enumerate(raw_rows):
        first = None
        for cell in row:
            if cell is not None:
                first = cell
                break
        if first is not None and SERIAL_RE.match(first.strip()):
            indices.append(j)
    return indices, SERIAL_RE


def _segment_by_gap_run(serial_indices, gaps):
    """Split serial indices by consecutive-runs of same gap.

    Each gap belongs to the serial that STARTS that gap.  E.g. if
    gaps=[3,3,3,1,1], serial_indices[0:3] get gap=3 and
    serial_indices[3:5] get gap=1 — the boundary serial moves
    into the new gap's segment.
    """
    if not gaps:
        return [(serial_indices, 0)]

    segments = []
    row_start = 0
    gap_start = 0
    current_gap = gaps[0]

    for k in range(1, len(gaps)):
        if gaps[k] != current_gap:
            seg_serials = serial_indices[gap_start:k]
            if seg_serials:
                segments.append((seg_serials, current_gap))
            gap_start = k
            current_gap = gaps[k]

    seg_serials = serial_indices[gap_start:]
    if seg_serials:
        segments.append((seg_serials, current_gap))

    return segments
