from noun_analysis.edition.generations import build_generations


def _speech(name, party, text, protocol, government=False):
    first, last = name.split(" ", 1)
    return {"speaker": name, "first_name": first, "last_name": last, "party": party, "text": text,
            "protocolId": protocol, "speechPosition": "1", "is_government": government, "type": "rede"}


YEARS = {f"genz{i}|anna": 1999 for i in range(6)} | {f"alt{i}|bernd": 1970 for i in range(6)} | {"minister|karl": 2000}


def _speeches():
    speeches = []
    for i in range(6):
        party = "LINKE" if i < 4 else "SPD"
        speeches.append(_speech(f"Anna Genz{i}", party, "Unsere Generation zahlt hohe Mieten. " * 400 + "Haushalt Haushalt.", f"g{i}"))
        speeches.append(_speech(f"Bernd Alt{i}", party, "Der Haushalt und die Haushaltsdebatte. " * 400 + "Generation.", f"a{i}"))
    speeches.append(_speech("Karl Minister", "SPD", "Generation " * 20, "m1", government=True))
    return speeches


def test_counts_genz_speakers_by_party_without_government_speeches():
    result = build_generations(_speeches(), set(), YEARS)
    assert result["speakerCount"] == 6
    assert result["totalSpeakers"] == 12
    assert result["parties"] == [{"party": "LINKE", "count": 4}, {"party": "SPD", "count": 2}]
    assert all(s["birthYear"] == 1999 for s in result["speakers"])


def test_words_compare_against_older_mps_of_the_same_parties():
    result = build_generations(_speeches(), set(), YEARS)
    assert {"generation", "mieten"} <= {w["word"] for w in result["words"]}
    assert "haushaltsdebatte" in [w["word"] for w in result["fewerWords"]]


def test_initials_in_the_first_name_still_match():
    speeches = _speeches()
    speeches[0]["first_name"] = "Anna L"
    assert build_generations(speeches, set(), YEARS)["speakerCount"] == 6


def test_too_few_genz_speakers_give_no_section():
    speeches = [s for s in _speeches() if s["speaker"] not in {"Anna Genz0", "Anna Genz1"}]
    assert build_generations(speeches, set(), YEARS) is None
