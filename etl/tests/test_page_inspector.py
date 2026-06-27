import pytest
from parsers.page_inspector import inspect_page, _first_non_none, _mode, _normalise_division


class MockPage:
    def __init__(self, text="", tables=None):
        self._text = text
        self._tables = tables or []

    def extract_text(self):
        return self._text

    def extract_tables(self):
        return self._tables


class TestInspectPage:
    def test_no_tables(self):
        page = MockPage(text="Some header text", tables=[])
        info = inspect_page(page)
        assert info["has_tables"] is False
        assert info["num_rows"] == 0
        assert info["serial_count"] == 0

    def test_detects_division(self):
        page = MockPage(
            text="East Division Report",
            tables=[[["1", "Road A", "1.5", "01.01.2024", "5", "01.01.2029", "ABC Const", "AE1", "AEE1", "EE1"]]],
        )
        info = inspect_page(page)
        assert info["division"] == "East"
        assert info["division_source"] == "detected"
        assert info["has_title"] is True

    def test_carries_division_forward(self):
        page = MockPage(tables=[[["1", "Road A", "1.5", "01.01.2024", "5", "01.01.2029", "ABC Const", "AE1", "AEE1", "EE1"]]])
        info = inspect_page(page, current_division="West")
        assert info["division"] == "West"
        assert info["division_source"] == "carried"

    def test_detects_serial_count(self):
        rows = [
            ["1", "Road A", "1.5"],
            ["2", "Road B", "2.0"],
            ["3", "Road C", "3.0"],
        ]
        page = MockPage(text="", tables=[rows])
        info = inspect_page(page)
        assert info["serial_count"] == 3
        assert info["serial_gap"] == 1

    def test_serial_gap_with_gap3(self):
        rows = [
            ["1", "Road A", "1.5", "d1", "5", "d2", "c1", "ae1", "aee1", "ee1", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
            ["2", "Road B", "2.0", "d1", "5", "d2", "c1", "ae1", "aee1", "ee1", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
        ]
        page = MockPage(text="", tables=[rows])
        info = inspect_page(page)
        assert info["serial_count"] == 2
        assert info["serial_gap"] == 3
        assert info["serial_gaps"] == [3]

    def test_all_divisions_detected(self):
        texts = [
            ("East Division", "East"),
            ("West Division Report", "West"),
            ("South Division", "South"),
            ("Dasarahalli Division", "Dasarahalli"),
            ("Yelahanka Division", "Yelahanka"),
            ("RR NAGAR DIVISION", "RR Nagar"),
            ("Mahadevapura Division", "Mahadevapura"),
            ("Bommanahalli Division", "Bommanahalli"),
        ]
        for text, expected in texts:
            page = MockPage(text=text, tables=[[["1", "Road"]]])
            info = inspect_page(page)
            assert info["division"] == expected, f"Failed for {text}"
            assert info["division_source"] == "detected"

    def test_ignores_non_serial_first_column(self):
        rows = [
            ["Header", "Col1", "Col2"],
            ["1", "Road A", "1.5"],
            ["2", "Road B", "2.0"],
        ]
        page = MockPage(text="", tables=[rows])
        info = inspect_page(page)
        assert info["serial_count"] == 2

    def test_single_serial_gap_defaults_to_1(self):
        rows = [["1", "Road A", "1.5"]]
        page = MockPage(text="", tables=[rows])
        info = inspect_page(page)
        assert info["serial_count"] == 1
        assert info["serial_gap"] == 1


class TestHelpers:
    def test_first_non_none(self):
        assert _first_non_none([None, None, "hello", "world"]) == "hello"
        assert _first_non_none([None, None]) is None
        assert _first_non_none([]) is None

    def test_mode(self):
        assert _mode([1, 2, 2, 3]) == 2
        assert _mode([1, 1, 1]) == 1
        assert _mode([3, 3, 1, 1, 3]) == 3

    def test_normalise_division(self):
        assert _normalise_division("EAST") == "East"
        assert _normalise_division("WEST") == "West"
        assert _normalise_division("RRNAGAR") == "RR Nagar"
        assert _normalise_division("MAHADEVAPURA") == "Mahadevapura"
        assert _normalise_division("Unknown") == "Unknown"
