"""Abstract base for all row-builders and field-extractors.

A builder groups physical pdfplumber rows into **logical records**
(a list of rows that belong to one road entry).

The pipeline:
    raw_rows  →  Builder.build()  →  list[LogicalRecord]
    LogicalRecord  →  Extractor.extract()  →  dict  (raw field values)

A **LayoutParser** combines a Builder + Extractor pair for convenience.
"""

from dataclasses import dataclass, field


@dataclass
class LogicalRecord:
    """One logical road record, built from 1+ physical PDF rows."""
    rows: list = field(default_factory=list)
    meta: dict = field(default_factory=dict)


class BaseBuilder:
    """Groups physical rows into logical records."""

    @staticmethod
    def can_handle(page_info):
        """Return True if this builder can handle the page described by *page_info*."""
        raise NotImplementedError

    def build(self, raw_rows, page_info):
        """Return list[LogicalRecord]."""
        raise NotImplementedError


class BaseExtractor:
    """Extracts field values from a LogicalRecord."""

    def extract(self, logical_record, config):
        """Return a flat dict of field values (serial_no, road_name, …)."""
        raise NotImplementedError


class BaseLayoutParser:
    """Convenience: combines a Builder + Extractor pair.

    Subclasses define ``can_handle`` (from the builder) and call
    ``self.builder`` / ``self.extractor`` in ``parse()``.
    """

    builder_cls = None   # subclass must set
    extractor_cls = None

    def __init__(self):
        self.builder = self.builder_cls() if self.builder_cls else None
        self.extractor = self.extractor_cls() if self.extractor_cls else None

    @staticmethod
    def can_handle(page_info):
        raise NotImplementedError

    def parse(self, table, division, config):
        records = []
        logical = self.builder.build(table, {})
        for lr in logical:
            rec = self.extractor.extract(lr, config)
            rec["division"] = division
            records.append(rec)
        return records
