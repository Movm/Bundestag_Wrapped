"""Official-first speaker gender assignment."""

import json

from noun_analysis.wrapped.gender import (
    OFFICIAL_LOOKUP_PATH,
    GenderDetector,
    load_official_lookup,
    name_key,
)


def detector(**official):
    return GenderDetector(official_lookup=official)


def test_official_beats_name_guessing():
    d = detector(**{name_key("Micha", "Fehre"): "male", name_key("Esra", "Limbacher"): "male"})
    # The first-name chain alone guesses female for both (-a / dictionary endings).
    assert GenderDetector(official_lookup={}).detect("Esra").gender == "female"
    for first, last in (("Micha", "Fehre"), ("Esra", "Limbacher")):
        r = d.detect_speaker(first, last)
        assert (r.gender, r.gender_source) == ("male", "official")


def test_fallback_marks_source():
    d = detector()
    assert d.detect_speaker("Peter", "Unbekannt").gender_source == "name_dictionary"
    assert d.detect_speaker("Qwxzy", "Unbekannt").gender_source == "unknown"
    assert d.detect_speaker("Bettina", "Nobody").gender == "female"


def test_custom_mapping_file_wins_over_official():
    d = GenderDetector(
        custom_mappings={"alex": "female"},
        official_lookup={name_key("Alex", "Muster"): "male"},
    )
    r = d.detect_speaker("Alex", "Muster")
    assert (r.gender, r.gender_source) == ("female", "override")


def test_lookup_tolerates_prefixes_umlauts_and_multiple_first_names():
    d = detector(**{name_key("Jan", "Aken"): "male", name_key("Evelyn", "Schotz"): "female"})
    assert d.detect_speaker("Jan", "van Aken").gender_source == "official"
    assert d.detect_speaker("Evelyn", "Schötz").gender == "female"
    assert d.detect_speaker("Evelyn Maria", "Schötz").gender_source == "official"


def test_gitta_is_female_in_dictionary():
    assert GenderDetector(official_lookup={}).detect("Gitta").gender == "female"
    assert "gitta" not in GenderDetector.MALE_NAMES


def test_committed_lookup_covers_reported_cases():
    load_official_lookup.cache_clear()
    d = GenderDetector()
    expected = {
        ("Nancy", "Faeser"): "female",
        ("Gitta", "Connemann"): "female",
        ("Micha", "Fehre"): "male",
        ("Esra", "Limbacher"): "male",
        ("Christin", "Willnat"): "female",
        ("Vivian", "Tauschwitz"): "female",
    }
    for (first, last), gender in expected.items():
        r = d.detect_speaker(first, last)
        assert (r.gender, r.gender_source) == (gender, "official"), (first, last)


def test_diverse_entries_stay_unknown_but_official():
    d = detector(**{name_key("X", "Y"): "unknown"})
    r = d.detect_speaker("X", "Y")
    assert (r.gender, r.gender_source) == ("unknown", "official")


def test_committed_lookup_is_wellformed():
    data = json.loads(OFFICIAL_LOOKUP_PATH.read_text(encoding="utf-8"))
    assert data["entries"] and set(data["entries"].values()) <= {"male", "female", "diverse"}
    assert set(data["abgeordnetenwatch"].values()) <= {"male", "female", "diverse"}
