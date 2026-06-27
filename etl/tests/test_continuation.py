import pytest
from parsers.builders.continuation import (
    ContinuationBuilder,
    ContinuationExtractor,
    _clean,
    _merge_road,
    _looks_like_number,
    _looks_like_date_str,
    _looks_like_period,
)


class TestContinuationBuilder:
    def test_can_handle_mixed_gaps(self):
        info = {
            "serial_gaps": [1, 4, 1, 5, 1, 3, 1],
            "serial_count": 8,
        }
        assert ContinuationBuilder.can_handle(info) is True

    def test_cannot_handle_few_serials(self):
        info = {"serial_gaps": [1], "serial_count": 2}
        assert ContinuationBuilder.can_handle(info) is False

    def test_cannot_handle_insufficient_cont_gaps(self):
        info = {
            "serial_gaps": [1, 1, 1, 1, 1, 1],
            "serial_count": 7,
        }
        assert ContinuationBuilder.can_handle(info) is False

    def test_cannot_handle_gap3_run_threshold(self):
        info = {
            "serial_gaps": [1, 3, 3, 1, 1, 1, 1],
            "serial_count": 8,
        }
        assert ContinuationBuilder.can_handle(info) is False

    def test_build_groups_serial_with_continuations(self):
        rows = [
            ["1", "Road", "", "", "", "", "", ""],
            ["", "Name Cont", "", "", "", "", "", ""],
            ["", "More Cont", "", "", "", "", "", ""],
            ["2", "Another Road", "", "", "", "", "", ""],
            ["", "Cont", "", "", "", "", "", ""],
        ]
        builder = ContinuationBuilder()
        records = builder.build(rows, {})
        assert len(records) == 2
        assert len(records[0].rows) == 3
        assert len(records[1].rows) == 2

    def test_build_handles_non_serial_before_first(self):
        rows = [
            ["Header", "", "", "", "", "", "", ""],
            ["1", "Road", "", "", "", "", "", ""],
        ]
        builder = ContinuationBuilder()
        records = builder.build(rows, {})
        assert len(records) == 1

    def test_handles_empty_case(self):
        builder = ContinuationBuilder()
        records = builder.build([], {})
        assert records == []


class TestContinuationExtractor:
    def test_extract_no_shift(self):
        rec = type("LR", (), {"rows": [
            ["1", "Main Road", "1.5", "01.01.2024", "5", "01.01.2029", "ABC", "AE1"],
        ]})()
        extractor = ContinuationExtractor()
        config = {"date_formats": ["%d.%m.%Y", "%d.%m.%y", "%d-%m-%Y", "%b %Y", "%b-%Y", "%Y-%m-%d"]}
        result = extractor.extract(rec, config)
        assert result["serial_no"] == "1"
        assert result["road_name"] == "Main Road"
        assert result["length_km"] == "1.5"
        assert result["completion_date"] == "01.01.2024"

    def test_extract_with_shift(self):
        rec = type("LR", (), {"rows": [
            ["1", None, "Main Road", "1.5", "01.01.2024", "5", "01.01.2029", "ABC", "AE1"],
        ]})()
        extractor = ContinuationExtractor()
        result = extractor.extract(rec, {})
        assert result["road_name"] == "Main Road"

    def test_merges_continuation_rows(self):
        rec = type("LR", (), {"rows": [
            ["1", "Main", "", "", "", "", "", ""],
            ["", "Road", "", "", "", "", "", ""],
            ["", "Extension", "", "", "", "", "", ""],
        ]})()
        extractor = ContinuationExtractor()
        result = extractor.extract(rec, {})
        assert result["road_name"] == "Main Road Extension"

    def test_empty_record(self):
        rec = type("LR", (), {"rows": []})()
        extractor = ContinuationExtractor()
        result = extractor.extract(rec, {})
        assert result == {}

    def test_column_shift_detection(self):
        assert ContinuationExtractor._detect_column_shift(["1", "Shor", "Long Road Name  "]) == 1
        assert ContinuationExtractor._detect_column_shift(["1", "Long Road Name Here", "Extra"]) == 0
        assert ContinuationExtractor._detect_column_shift(["1", None, "Long Road"]) == 1
        assert ContinuationExtractor._detect_column_shift(["1", "Roads", "Extra"]) == 0


class TestMergeRoad:
    def test_basic_merge(self):
        assert _merge_road(["Main", "Road"]) == "Main Road"

    def test_filters_none(self):
        assert _merge_road(["Main", None, "Road"]) == "Main Road"

    def test_empty_list(self):
        assert _merge_road([]) is None

    def test_no_valid_parts(self):
        assert _merge_road([None, None]) is None

    def test_trailing_punctuation_removed(self):
        result = _merge_road(["Main Road", ","])
        assert result == "Main Road"

    def test_single_part(self):
        assert _merge_road(["Main Road"]) == "Main Road"


class TestLookups:
    def test_looks_like_number(self):
        assert _looks_like_number("1.5") is True
        assert _looks_like_number("100") is True
        assert _looks_like_number("1,500") is True
        assert _looks_like_number("ABC") is False
        assert _looks_like_number("") is False

    def test_looks_like_date_str(self):
        assert _looks_like_date_str("01.01.2024", ["%d.%m.%Y"]) is True
        assert _looks_like_date_str("01-01-2024", ["%d-%m-%Y"]) is True
        assert _looks_like_date_str("Jan 2024", ["%b %Y"]) is True
        assert _looks_like_date_str("not-a-date", ["%d.%m.%Y"]) is False
        assert _looks_like_date_str("", ["%d.%m.%Y"]) is False

    def test_looks_like_period(self):
        assert _looks_like_period("5 years") is True
        assert _looks_like_period("5 YEARS") is True
        assert _looks_like_period("5 Year") is True
        assert _looks_like_period("DLP 5 years") is True
        assert _looks_like_period("ABC") is False
        assert _looks_like_period("") is False


class TestClean:
    def test_cleans_text(self):
        assert _clean("Hello\nWorld") == "Hello World"
        assert _clean("  spaced  out  ") == "spaced out"
        assert _clean(None) is None
        assert _clean("") is None
        assert _clean("  ") is None
