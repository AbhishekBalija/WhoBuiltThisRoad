import pytest
from normalizers.road_name_normalizer import normalize_road_name, generate_slug


class TestNormalizeRoadName:
    def test_rd_to_road(self):
        assert normalize_road_name("Main Rd") == "Main Road"

    def test_st_to_street(self):
        assert normalize_road_name("Cross St") == "Cross Street"

    def test_100ft_normalization(self):
        assert normalize_road_name("100 Feet Road") == "100ft Road"
        assert normalize_road_name("100-feet Road") == "100ft Road"
        assert normalize_road_name("100 ft Road") == "100ft Road"

    def test_strip_punctuation(self):
        assert normalize_road_name("Main Road;") == "Main Road"
        assert normalize_road_name("Main Road,") == "Main Road"
        assert normalize_road_name("Main Road.") == "Main Road"

    def test_empty_input(self):
        assert normalize_road_name("") == ""

    def test_none_input(self):
        assert normalize_road_name(None) == ""

    def test_whitespace_cleaned(self):
        assert normalize_road_name("  Main   Road  ") == "Main Road"

    def test_multiple_replacements(self):
        result = normalize_road_name("100 Ft Main Rd, St.")
        assert "Ft" in result
        assert "Road" in result
        assert "Street" in result
        assert "," not in result

    def test_phone_brackets_not_affected(self):
        result = normalize_road_name("Devarajayya")
        assert result == "Devarajayya"


class TestGenerateSlug:
    def test_basic_slug(self):
        assert generate_slug("Main Road") == "main-road"

    def test_special_chars_removed(self):
        assert generate_slug("100ft Road, Cross") == "100ft-road-cross"

    def test_dedup_consecutive_duplicates(self):
        slug = generate_slug("road road")
        assert slug == "road"

    def test_empty_input(self):
        assert generate_slug("") == ""

    def test_case_normalized(self):
        slug = generate_slug("RR Nagar Main Road")
        assert slug == "rr-nagar-main-road"

    def test_known_road_names(self):
        slugs = {
            "Kempegowda Road": "kempegowda-road",
            "Bannerghatta Main Road": "bannerghatta-main-road",
            "Kanaka Panambur Road": "kanaka-panambur-road",
            "100ft Road": "100ft-road",
        }
        for name, expected in slugs.items():
            assert generate_slug(name) == expected, f"Failed for {name}"

    def test_no_duplicate_slugs(self):
        names = [
            "Gollarahatti Road",
            "B Narayanapura Main Road",
            "K R Garden 100ft Road",
            "Magadi Road",
            "Mallasandra Road",
            "Kanaka Panambur Road",
            "Kempegowda Road",
            "Bannerghatta Main Road",
            "Kanakapura Road",
            "100ft Road",
        ]
        slugs = [generate_slug(n) for n in names]
        assert len(slugs) == len(set(slugs)), f"Duplicate slugs found: {slugs}"
