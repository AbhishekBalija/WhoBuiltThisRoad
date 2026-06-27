import pytest
from parsers.builders.mixed import (
    MixedLayoutBuilder,
    MixedLayoutParser,
    _segment_by_gap_run,
    _find_serials,
)


class TestMixedLayoutBuilder:
    def test_can_handle_mixed_gaps(self):
        info = {
            "serial_gaps": [3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1],
            "serial_count": 14,
        }
        assert MixedLayoutBuilder.can_handle(info) is True

    def test_cannot_handle_gap1_only(self):
        info = {"serial_gaps": [1, 1, 1], "serial_count": 4}
        assert MixedLayoutBuilder.can_handle(info) is False

    def test_cannot_handle_gap3_only(self):
        info = {"serial_gaps": [3, 3, 3], "serial_count": 4}
        assert MixedLayoutBuilder.can_handle(info) is False

    def test_cannot_handle_few_serials(self):
        info = {"serial_gaps": [3, 1], "serial_count": 3}
        assert MixedLayoutBuilder.can_handle(info) is False

    def test_cannot_handle_no_gap3_run(self):
        info = {
            "serial_gaps": [3, 1, 3, 1, 3, 1],
            "serial_count": 7,
        }
        assert MixedLayoutBuilder.can_handle(info) is False

    def test_build_mixed_page(self):
        rows = [
            ["1", "Road A", "", "", "", "01.01.2024", "5", "01.01.2029", "", "ABC", "AE1", ""],
            ["", "", "", "1.5", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
            ["2", "Road B", "", "", "", "01.02.2024", "5", "01.02.2029", "", "XYZ", "AE2", ""],
            ["", "", "", "2.0", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
            ["3", "Road C", "3.0", "01.03.2024", "5", "01.03.2029", "Const C", "AE3", "", ""],
            ["4", "Road D", "4.0", "01.04.2024", "5", "01.04.2029", "Const D", "AE4", "", ""],
            ["5", "Road E", "5.0", "01.05.2024", "5", "01.05.2029", "Const E", "AE5", "", ""],
        ]
        builder = MixedLayoutBuilder()
        info = {
            "serial_gaps": [3, 3, 1, 1, 1],
            "serial_count": 5,
            "num_rows": len(rows),
        }
        records = builder.build(rows, info)
        assert len(records) == 5


class TestMixedLayoutParser:
    def test_parse_mixed_page(self):
        rows = [
            ["1", "Road A", "", "", "", "01.01.2024", "5", "01.01.2029", "", "ABC", "AE1", ""],
            ["", "", "", "1.5", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
            ["2", "Road B", "", "", "", "01.02.2024", "5", "01.02.2029", "", "XYZ", "AE2", ""],
            ["", "", "", "2.0", "", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", "", "", "", "", ""],
            ["3", "Road C", "3.0", "01.03.2024", "5", "01.03.2029", "Const C", "AE3", "", ""],
        ]
        parser = MixedLayoutParser()
        records = parser.parse(rows, division="Bommanahalli", config={})
        assert len(records) == 3
        assert records[0]["division"] == "Bommanahalli"
        assert records[0]["road_name"] == "Road A"
        assert records[0]["serial_no"] == "1"

    def test_parse_empty(self):
        parser = MixedLayoutParser()
        records = parser.parse([], division="Test", config={})
        assert records == []


class TestSegmentByGapRun:
    def test_single_type(self):
        result = _segment_by_gap_run([0, 1, 2], [1, 1])
        assert len(result) == 1

    def test_two_types(self):
        result = _segment_by_gap_run([0, 3, 6, 7, 8], [3, 3, 1, 1])
        assert len(result) == 2
        assert result[0][1] == 3
        assert result[1][1] == 1

    def test_empty_gaps(self):
        result = _segment_by_gap_run([0], [])
        assert len(result) == 1


class TestFindSerials:
    def test_finds_serials(self):
        rows = [
            ["1", "Road"],
            ["2", "Road"],
            ["NotSerial", "Road"],
        ]
        indices, regex = _find_serials(rows)
        assert indices == [0, 1]

    def test_empty_rows(self):
        indices, regex = _find_serials([])
        assert indices == []

    def test_handles_none_first_cell(self):
        rows = [
            [None, "1", "Road"],
            ["1", "Road"],
        ]
        indices, _ = _find_serials(rows)
        assert indices == [0, 1]
