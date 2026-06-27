import json
import os
import pytest

from parsers.dlp_pdf_parser import parse_pdf, DEFAULT_CONFIG
from parsers.report import ParseReport


PDF_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "dlp_east_2017.pdf")
REPORT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "report.json")


@pytest.mark.skipif(not os.path.isfile(PDF_PATH), reason="PDF not found")
class TestPipelineIntegration:
    def test_parses_pdf_without_crashing(self):
        records, report = parse_pdf(PDF_PATH)
        assert isinstance(report, ParseReport)
        assert isinstance(records, list)
        assert report.records_parsed_total > 0

    def test_quality_gate(self):
        records, report = parse_pdf(PDF_PATH)
        assert report.records_parsed_total >= 400, f"Expected >=400 records, got {report.records_parsed_total}"
        assert report.success_rate >= 98.0, f"Success rate {report.success_rate}% below 98%"
        assert len(report.unknown_layouts) == 0, f"Unknown layouts: {report.unknown_layouts}"

    def test_no_empty_road_names(self):
        records, report = parse_pdf(PDF_PATH)
        empty = [r for r in records if not r.get("road_name")]
        assert len(empty) == 0, f"Found {len(empty)} records with empty road names"

    def test_all_divisions_present(self):
        records, report = parse_pdf(PDF_PATH)
        expected = {"East", "West", "South", "Dasarahalli", "Yelahanka", "RR Nagar", "Mahadevapura", "Bommanahalli"}
        present = set(report.divisions_seen.keys())
        missing = expected - present
        assert not missing, f"Missing divisions: {missing}"

    def test_non_zero_records_per_division(self):
        records, report = parse_pdf(PDF_PATH)
        for div, count in report.divisions_seen.items():
            assert count > 0, f"Division {div} has 0 records"

    def test_serial_numbers_present(self):
        records, report = parse_pdf(PDF_PATH)
        missing = [r for r in records if not r.get("serial_no")]
        assert len(missing) == 0, f"{len(missing)} records missing serial_no"

    def test_report_matches_previous(self):
        if not os.path.isfile(REPORT_PATH):
            pytest.skip("Previous report.json not found")

        with open(REPORT_PATH) as f:
            prev = json.load(f)

        records, report = parse_pdf(PDF_PATH)
        curr = report.to_dict()

        assert curr["records_parsed_total"] == prev["records_parsed_total"], \
            f"Records changed: {prev['records_parsed_total']} -> {curr['records_parsed_total']}"
        assert curr["unknown_layouts"] == prev["unknown_layouts"], \
            f"Unknown layouts changed: {prev['unknown_layouts']} -> {curr['unknown_layouts']}"

    def test_phone_as_length_known_issue(self):
        records, report = parse_pdf(PDF_PATH)
        phone_lengths = []
        for r in records:
            length = r.get("length_km")
            if length:
                try:
                    v = float(length.replace("km", "").strip())
                    if v >= 100:
                        phone_lengths.append((r["serial_no"], length, r.get("division")))
                except (ValueError, AttributeError):
                    pass
        if phone_lengths:
            for serial, length, div in phone_lengths:
                assert float(length.replace("km", "").strip()) >= 100, \
                    f"Serial {serial} in {div}: length_km={length}"


@pytest.mark.skipif(not os.path.isfile(REPORT_PATH), reason="No previous report.json to validate against")
class TestReportConsistency:
    def test_report_json_structure(self):
        with open(REPORT_PATH) as f:
            data = json.load(f)
        assert "parser_version" in data
        assert "records_parsed_total" in data
        assert "pages" in data
        assert "layout_parsers_used" in data
        assert "divisions_seen" in data
        assert "validation_warnings" in data
        assert "unknown_layouts" in data
