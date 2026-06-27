import json
import pytest
from parsers.report import ParseReport, PageResult


class TestPageResult:
    def test_defaults(self):
        pr = PageResult(page_number=0, division="East", layout_parser="SingleRowParser")
        assert pr.physical_rows == 0
        assert pr.serial_rows == 0
        assert pr.logical_records == 0
        assert pr.records_parsed == 0
        assert pr.warnings == []


class TestParseReport:
    def test_empty_report(self):
        report = ParseReport()
        assert report.success_rate == 0.0
        assert report.records_parsed_total == 0

    def test_success_rate(self):
        report = ParseReport()
        report.records_parsed_total = 100
        assert report.success_rate == 100.0

    def test_success_rate_with_warnings(self):
        report = ParseReport()
        report.records_parsed_total = 100
        report.validation_warnings = [{"serial": "1", "page": 0, "warnings": ["Missing date"]}]
        assert report.success_rate == 99.0

    def test_complete_sets_timestamp(self):
        report = ParseReport()
        report.complete()
        assert report.completed_at is not None

    def test_to_dict(self):
        report = ParseReport(source_file="test.pdf")
        d = report.to_dict()
        assert d["source_file"] == "test.pdf"
        assert d["parser_version"] == "0.1.0"

    def test_to_json(self):
        report = ParseReport(source_file="test.pdf")
        j = json.loads(report.to_json())
        assert j["source_file"] == "test.pdf"

    def test_from_json_roundtrip(self, tmp_path):
        report = ParseReport(source_file="test.pdf")
        report.records_parsed_total = 42
        report.validation_warnings = [{"serial": "5", "page": 1, "warnings": ["test"]}]

        path = tmp_path / "report.json"
        report.save(str(path))

        loaded = ParseReport.from_json(str(path))
        assert loaded.source_file == "test.pdf"
        assert loaded.records_parsed_total == 42
        assert len(loaded.validation_warnings) == 1

    def test_divisions_seen(self):
        report = ParseReport()
        report.divisions_seen = {"East": 10, "West": 20}
        assert report.divisions_seen["East"] == 10

    def test_layout_parsers_used(self):
        report = ParseReport()
        report.layout_parsers_used["SingleRowParser"] = 15
        assert report.layout_parsers_used["SingleRowParser"] == 15
