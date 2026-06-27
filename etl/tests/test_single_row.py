import pytest
from parsers.builders.single_row import (
    SingleRowBuilder,
    SingleRowExtractor,
    _normalise_width,
    _first_non_none,
    _clean,
)


class TestSingleRowBuilder:
    def test_can_handle_normal_pages(self):
        info = {"serial_gap": 1, "serial_count": 10}
        assert SingleRowBuilder.can_handle(info) is True

    def test_can_handle_gap3_pages(self):
        info = {"serial_gap": 3, "serial_count": 5}
        assert SingleRowBuilder.can_handle(info) is True

    def test_cannot_handle_no_serials(self):
        info = {"serial_gap": 0, "serial_count": 0}
        assert SingleRowBuilder.can_handle(info) is False

    def test_build_single_rows(self):
        rows = [
            ["1", "Road A", "1.5", "01.01.2024", "5", "01.01.2029", "ABC", "AE1", "", ""],
            ["2", "Road B", "2.0", "01.02.2024", "5", "01.02.2029", "XYZ", "AE2", "", ""],
        ]
        builder = SingleRowBuilder()
        records = builder.build(rows, {})
        assert len(records) == 2
        assert records[0].rows == [rows[0]]
        assert records[1].rows == [rows[1]]

    def test_skips_non_serial_rows(self):
        rows = [
            ["Header", "", "", "", "", "", "", "", "", ""],
            ["1", "Road A", "1.5", "01.01.2024", "5", "01.01.2029", "ABC", "AE1", "", ""],
        ]
        builder = SingleRowBuilder()
        records = builder.build(rows, {})
        assert len(records) == 1
        assert records[0].rows == [rows[1]]


class TestSingleRowExtractor:
    def test_extract_standard_10col(self):
        rec = type("LR", (), {"rows": [["1", "Road A", "1.5", "01.01.2024", "5", "01.01.2029", "ABC", "AE1", "", ""]]})()
        extractor = SingleRowExtractor()
        result = extractor.extract(rec, {})
        assert result["serial_no"] == "1"
        assert result["road_name"] == "Road A"
        assert result["length_km"] == "1.5"
        assert result["completion_date"] == "01.01.2024"
        assert result["dlp_period_years"] == "5"
        assert result["dlp_expiry_date"] == "01.01.2029"
        assert result["contractor_raw"] == "ABC"
        assert result["ae_raw"] == "AE1"

    def test_extract_short_row(self):
        rec = type("LR", (), {"rows": [["1", "Road A"]]})()
        extractor = SingleRowExtractor()
        result = extractor.extract(rec, {})
        assert result["serial_no"] == "1"
        assert result["road_name"] == "Road A"
        assert result["length_km"] is None
        assert result["ae_raw"] is None


class TestNormaliseWidth:
    def test_10col_passthrough(self):
        row = ["1", "Road A", "1.5", "01.01.2024", "5", "01.01.2029", "ABC", "AE1", "", ""]
        result = _normalise_width(row, 10)
        assert len(result) == 10
        assert result == row

    def test_12col_removes_indices_4_5(self):
        row = ["1", "Road A", "1.5", "01.01.2024", None, None, "5", "01.01.2029", "ABC", "AE1", "", ""]
        result = _normalise_width(row, 10)
        assert len(result) == 10
        assert result[4] == "5"
        assert result[5] == "01.01.2029"

    def test_16col_takes_first_8(self):
        row = ["1", "Road A", "1.5", "01.01.2024", "5", "01.01.2029", "ABC", "AE1", "extra1", "extra2", "extra3", "extra4", "extra5", "extra6", "extra7", "extra8"]
        result = _normalise_width(row, 10)
        assert len(result) == 10
        assert result[:8] == row[:8]
        assert result[8] is None
        assert result[9] is None

    def test_30col_samples_every_3rd(self):
        row = ["1", "x", "x", "Road A", "x", "x", "1.5", "x", "x", "01.01.2024", "x", "x", "5", "x", "x", "01.01.2029", "x", "x", "ABC", "x", "x", "AE1", "x", "x", "", "x", "x", "", "x", "x"]
        result = _normalise_width(row, 10)
        assert len(result) == 10
        assert result[0] == "1"
        assert result[1] == "Road A"
        assert result[2] == "1.5"
        assert result[3] == "01.01.2024"
        assert result[4] == "5"
        assert result[5] == "01.01.2029"
        assert result[6] == "ABC"
        assert result[7] == "AE1"
        assert result[8] == ""
        assert result[9] == ""

    def test_span_artifact_removal_pos1(self):
        row = ["1", None, "Road A", "1.5", "01.01.2024", "5", "01.01.2029", "ABC", "AE1", "", ""]
        result = _normalise_width(row, 10)
        assert result[1] == "Road A"

    def test_span_artifact_one_directional(self):
        row = ["1", None, "Road A", "1.5"]
        result = _normalise_width(row, 10)
        assert result[1] == "Road A"

    def test_span_artifact_not_removed_when_pos1_has_data(self):
        row = ["1", "Road A", None, "1.5"]
        result = _normalise_width(row, 10)
        assert result[1] == "Road A"

    def test_short_row_padded(self):
        row = ["1", "Road A"]
        result = _normalise_width(row, 10)
        assert len(result) == 10
        assert result[0] == "1"
        assert result[1] == "Road A"
        assert all(r is None for r in result[2:])

    def test_truncates_oversized(self):
        row = [str(i) for i in range(15)]
        result = _normalise_width(row, 10)
        assert len(result) == 10

    def test_fallback_strip_nones(self):
        row = ["1", None, "Road A", None, "1.5"]
        result = _normalise_width(row, 10)
        assert len(result) == 10
        assert result[0] == "1"
        assert result[1] == "Road A"
        assert result[2] == "1.5"


class TestClean:
    def test_newline_to_space(self):
        assert _clean("Road\nA") == "Road A"

    def test_multiple_spaces(self):
        assert _clean("Road   A") == "Road A"

    def test_none_input(self):
        assert _clean(None) is None

    def test_empty_string(self):
        assert _clean("") is None

    def test_whitespace_only(self):
        result = _clean("   ")
        assert result == "" or result is None

    def test_strip_whitespace(self):
        assert _clean("  Road A  ") == "Road A"
