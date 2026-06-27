"""Page inspector — analyses a PDF page and returns metadata about its
structure: division, layout type, column count, serial pattern, etc.

The inspector does *not* parse records.  It only describes the page so the
correct layout parser can be selected.
"""

import re
from collections import Counter

DIVISION_PATTERNS = [
    re.compile(r"(East)\s+Division", re.IGNORECASE),
    re.compile(r"(West)\s+[dD]ivision"),
    re.compile(r"(South)\s+Division", re.IGNORECASE),
    re.compile(r"(Dasarahalli)\s+Division", re.IGNORECASE),
    re.compile(r"(Yelahanka)\s+Division", re.IGNORECASE),
    re.compile(r"(RR\s*NAGAR)\s+DIVISION", re.IGNORECASE),
    re.compile(r"(Mahadevapura)\s+Division", re.IGNORECASE),
    re.compile(r"(Bommanahalli)\s+Division", re.IGNORECASE),
]

SERIAL_RE = re.compile(r"^\d{1,6}$")


def inspect_page(page, current_division=None):
    """Examine a single PDF page and return a dict of metadata.

    Returns
    -------
    dict with keys:
        division        — str or None  (detected or carried forward)
        division_source — "detected" | "carried" | None
        num_cols        — int  (raw column count from pdfplumber)
        num_rows        — int  (raw row count)
        has_tables      — bool
        serial_count    — int  (rows whose first cell is a serial)
        serial_gap      — int  (rows between serial-bearing rows; 0 if <2 serials)
        has_title       — bool (page has a division title)
        raw_rows        — list of lists (the raw table rows for parsing)
    """
    text = page.extract_text() or ""
    tables = page.extract_tables()

    info = {
        "division": current_division,
        "division_source": "carried" if current_division else None,
        "num_cols": 0,
        "num_rows": 0,
        "has_tables": bool(tables),
        "serial_count": 0,
        "serial_gap": 0,
        "serial_gaps": [],
        "has_title": False,
        "raw_rows": [],
    }

    # Detect division from title text
    for pattern in DIVISION_PATTERNS:
        m = pattern.search(text)
        if m:
            name = m.group(1).upper().replace(" ", "")
            name = _normalise_division(name)
            info["division"] = name
            info["division_source"] = "detected"
            info["has_title"] = True
            break

    if not tables:
        return info

    table = tables[0]
    info["num_cols"] = len(table[0]) if table else 0
    info["num_rows"] = len(table)
    info["raw_rows"] = table

    # Find serial-bearing row indices
    serial_indices = []
    for j, row in enumerate(table):
        first = _first_non_none(row)
        if first is not None and SERIAL_RE.match(first.strip()):
            serial_indices.append(j)

    info["serial_count"] = len(serial_indices)

    # Calculate serial gap — use the *most frequent* gap (mode), not min.
    # This handles page-boundary truncation where the last group is incomplete.
    if len(serial_indices) >= 2:
        gaps = [
            serial_indices[k + 1] - serial_indices[k]
            for k in range(len(serial_indices) - 1)
        ]
        info["serial_gaps"] = gaps
        info["serial_gap"] = _mode(gaps)
    elif len(serial_indices) == 1:
        info["serial_gap"] = 1  # single data row, treat as standard

    return info


def _first_non_none(row):
    for cell in row:
        if cell is not None:
            return cell
    return None


def _mode(values):
    """Return the most common value in a list."""
    return Counter(values).most_common(1)[0][0]


def _normalise_division(name):
    mapping = {
        "RRNAGAR": "RR Nagar",
        "EAST": "East",
        "WEST": "West",
        "SOUTH": "South",
        "DASARAHALLI": "Dasarahalli",
        "YELAHANKA": "Yelahanka",
        "MAHADEVAPURA": "Mahadevapura",
        "BOMANAHALLI": "Bommanahalli",
    }
    return mapping.get(name, name.title())
