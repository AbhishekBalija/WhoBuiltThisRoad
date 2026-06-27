"""ParseReport — tracks quality and provenance of every parser run.

Serialisable to JSON for historical comparison across parser versions.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
import json


PARSER_VERSION = "0.1.0"


@dataclass
class PageResult:
    """Statistics for one page in a parse run."""
    page_number: int
    division: str | None
    layout_parser: str | None       # class name that handled this page
    physical_rows: int = 0
    serial_rows: int = 0
    logical_records: int = 0        # groups produced by builder
    records_parsed: int = 0         # records that made it to output
    continuation_rows: int = 0      # non-serial rows merged into parent
    warnings: list = field(default_factory=list)


@dataclass
class ParseReport:
    """Full provenance for a parser execution."""

    parser_version: str = PARSER_VERSION
    source_file: str = ""
    document_type: str = "bbmp_dlp_pdf"

    started_at: str = ""
    completed_at: str = ""

    pages_total: int = 0
    pages_with_tables: int = 0
    pages_skipped: int = 0

    physical_rows_total: int = 0
    serial_rows_total: int = 0
    logical_records_total: int = 0
    records_parsed_total: int = 0
    records_skipped: int = 0
    continuation_rows_merged: int = 0
    forward_filled_values: int = 0

    divisions_seen: dict = field(default_factory=dict)
    layout_parsers_used: dict = field(default_factory=dict)
    unknown_layouts: list = field(default_factory=list)
    validation_warnings: list = field(default_factory=list)

    pages: list = field(default_factory=list)

    def complete(self):
        self.completed_at = datetime.now().isoformat()

    def to_dict(self):
        return asdict(self)

    def to_json(self, indent=2):
        return json.dumps(self.to_dict(), indent=indent, default=str)

    @classmethod
    def from_json(cls, path):
        with open(path) as f:
            data = json.load(f)
        return cls(**data)

    def save(self, path):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.to_json())

    @property
    def success_rate(self):
        if self.records_parsed_total == 0:
            return 0.0
        good = self.records_parsed_total - len(self.validation_warnings)
        return round(good / self.records_parsed_total * 100, 1)
