import pytest
from loaders.db_loader import _parse_date, _parse_float


class TestParseDate:
    def test_valid_iso_date(self):
        from datetime import date
        assert _parse_date("2024-01-01") == date(2024, 1, 1)

    def test_none_input(self):
        assert _parse_date(None) is None

    def test_empty_string(self):
        assert _parse_date("") is None

    def test_non_date_string(self):
        assert _parse_date("hello") is None

    def test_wrong_format(self):
        assert _parse_date("01-01-2024") is None

    def test_invalid_date(self):
        assert _parse_date("2024-13-01") is None


class TestParseFloat:
    def test_valid_float(self):
        assert _parse_float("1.5") == 1.5

    def test_with_km_suffix(self):
        assert _parse_float("1.5 km") == 1.5
        assert _parse_float("1.5KM") == 1.5

    def test_none_input(self):
        assert _parse_float(None) is None

    def test_empty_string(self):
        assert _parse_float("") is None

    def test_non_numeric(self):
        assert _parse_float("abc") is None

    def test_caps_at_100(self):
        assert _parse_float("150") is None
        assert _parse_float("999999") is None

    def test_rejects_negative(self):
        assert _parse_float("-1") is None

    def test_edge_cases(self):
        assert _parse_float("0") == 0.0
        assert _parse_float("100") == 100.0
        assert _parse_float("100.01") is None
        assert _parse_float("99.99") == 99.99
