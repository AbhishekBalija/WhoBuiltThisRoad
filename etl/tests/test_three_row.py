import pytest
from parsers.builders.three_row import ThreeRowBuilder, ThreeRowExtractor


class TestThreeRowBuilder:
    def test_can_handle_gap3_no_gap1(self):
        info = {"serial_gap": 3, "serial_gaps": [3, 3, 3]}
        assert ThreeRowBuilder.can_handle(info) is True

    def test_cannot_handle_gap1(self):
        info = {"serial_gap": 1, "serial_gaps": [1, 1, 1]}
        assert ThreeRowBuilder.can_handle(info) is False

    def test_cannot_handle_gap_mixed(self):
        info = {"serial_gap": 3, "serial_gaps": [3, 1, 3]}
        assert ThreeRowBuilder.can_handle(info) is False

    def test_cannot_handle_no_serials(self):
        info = {"serial_gap": 0, "serial_gaps": []}
        assert ThreeRowBuilder.can_handle(info) is False

    def test_build_three_rows_per_record(self):
        rows = [
            ["1", "Road A", "", "", "", "01.01.2024", "5", "01.01.2029", "", "ABC", "AE1", ""],
            ["", "", "", "1.5", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
            ["2", "Road B", "", "", "", "01.02.2024", "5", "01.02.2029", "", "XYZ", "AE2", ""],
            ["", "", "", "2.0", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
        ]
        builder = ThreeRowBuilder()
        records = builder.build(rows, {})
        assert len(records) == 2
        assert len(records[0].rows) == 3
        assert records[0].rows[0][0] == "1"
        assert records[1].rows[0][0] == "2"

    def test_skips_non_serial_rows(self):
        rows = [
            ["Header", "", "", "", "", "", "", "", "", "", "", ""],
            ["1", "Road A", "", "", "", "01.01.2024", "5", "01.01.2029", "", "ABC", "AE1", ""],
            ["", "", "", "1.5", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
        ]
        builder = ThreeRowBuilder()
        records = builder.build(rows, {})
        assert len(records) == 1


class TestThreeRowExtractor:
    def test_extract_full_record(self):
        rec = type("LR", (), {"rows": [
            ["1", "Road A", "", "", "", "01.01.2024", "5", "01.01.2029", "", "ABC", "AE1", ""],
            ["", "", "", "1.5", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
        ]})()
        extractor = ThreeRowExtractor()
        result = extractor.extract(rec, {})
        assert result["serial_no"] == "1"
        assert result["road_name"] == "Road A"
        assert result["length_km"] == "1.5"
        assert result["completion_date"] == "01.01.2024"
        assert result["dlp_period_years"] == "5"
        assert result["dlp_expiry_date"] == "01.01.2029"
        assert result["contractor_raw"] == "ABC"
        assert result["ae_raw"] == "AE1"
        assert result["aee_raw"] is None
        assert result["ee_raw"] is None

    def test_extract_partial_record(self):
        rec = type("LR", (), {"rows": [
            ["1", "Road A", "", "", "", "01.01.2024", "5", "01.01.2029"],
            [],
            [],
        ]})()
        extractor = ThreeRowExtractor()
        result = extractor.extract(rec, {})
        assert result["serial_no"] == "1"
        assert result["road_name"] == "Road A"
        assert result["length_km"] is None
