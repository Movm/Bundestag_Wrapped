from noun_analysis.text_utils import extract_name_parts


def test_keeps_letters_outside_latin_1():
    assert extract_name_parts("Boris Mijatović")["last_name"] == "Mijatović"


def test_still_splits_titles():
    parts = extract_name_parts("Dr. Alexander Gauland")
    assert (parts["acad_title"], parts["first_name"], parts["last_name"]) == ("Dr", "Alexander", "Gauland")
