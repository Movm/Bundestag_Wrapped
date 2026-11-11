from noun_analysis.edition.chancellor import AREA_BY_WORD, build_chancellor, side_of


def _speech(name, text, protocol, government=False, category="rede", type_="rede", date="2026-03-01"):
    first, last = name.split(" ", 1)
    return {"speaker": name, "first_name": first, "last_name": last, "party": "CDU/CSU" if government else "SPD",
            "text": text, "protocolId": protocol, "protocolDate": date, "speechPosition": "1",
            "is_government": government, "category": category, "type": type_, "words": len(text.split())}


CHANCELLOR = "Karl Kanzler"
FOREIGN = "Wir sprechen über Europa und die Ukraine und die Bundeswehr und Zölle. "
DOMESTIC = "Wir sprechen über die Rente und die Polizei und die Unternehmen. "


def _speeches():
    return [
        _speech(CHANCELLOR, (FOREIGN * 3 + DOMESTIC) * 400, "p1", government=True),
        _speech(CHANCELLOR, "Wir sprechen über die Rente. Die Europäische Kommission. Danke, Frau Abgeordnete. " * 300, "p2", government=True,
                category="wortbeitrag", type_="befragung"),
        _speech(CHANCELLOR, "Die Kommission entscheidet. Danke, Frau Abgeordnete. " * 100, "p3", government=True,
                category="wortbeitrag", type_="befragung"),
        _speech(CHANCELLOR, "Die Kommission handelt. Danke, Frau Abgeordnete. " * 100, "p4", government=True,
                category="wortbeitrag", type_="befragung"),
        _speech("Anna Abgeordnete", (DOMESTIC * 3 + FOREIGN) * 400, "p1"),
        _speech("Bernd Abgeordneter", DOMESTIC * 1200, "p2"),
    ]


def test_sides_follow_the_documented_mapping():
    assert side_of(AREA_BY_WORD["europa"]) == "aussen"
    assert AREA_BY_WORD["bundeswehr"] == "verteidigung" and side_of("verteidigung") == "aussen"
    assert AREA_BY_WORD["zölle"] == "aussenhandel" and side_of("aussenhandel") == "aussen"
    # Inner security and migration stay domestic; "handel" alone also means retail.
    assert side_of(AREA_BY_WORD["polizei"]) == "innen"
    assert side_of(AREA_BY_WORD["grenzkontrollen"]) == "innen"
    assert side_of(AREA_BY_WORD["handel"]) == "innen"


def test_counts_only_the_chancellors_own_contributions_against_the_rest():
    result = build_chancellor(_speeches(), CHANCELLOR, set())
    assert (result["contributions"], result["speeches"], result["answers"]) == (4, 1, 3)
    # Speech 1: 4 foreign + 3 domestic words per block, 3 foreign blocks per domestic one.
    # Speech 2 adds 300 × "rente"; speeches 3 and 4 have no lexicon word.
    foreign, domestic = 4 * 3 * 400, 3 * 400 + 300
    assert result["topicWords"] == foreign + domestic
    assert result["foreignShare"] == round(100 * foreign / (foreign + domestic), 1)
    assert result["chamberForeignShare"] < result["foreignShare"]
    assert {area["id"] for area in result["areas"]} >= {"europa", "verteidigung", "aussenhandel", "soziales"}
    assert result["foreignWords"][0]["count"] == 1200
    assert "previous" not in result


def test_hot_words_are_recurring_nouns_not_sentence_starts_or_names():
    result = build_chancellor(_speeches(), CHANCELLOR, set())
    words = [item["word"] for item in result["hotWords"]]
    assert "kommission" in words
    # "Danke" opens a sentence; "Abgeordnete" is a speaker's last name.
    assert "danke" not in words and "abgeordnete" not in words
    assert all(item["ratio"] >= 1.5 for item in result["hotWords"])


def test_previous_year_counts_only_contributions_as_chancellor():
    prior = [
        _speech(CHANCELLOR, DOMESTIC * 50, "o1", date="2025-02-01"),  # still an MP: not counted
        _speech(CHANCELLOR, FOREIGN * 10 + DOMESTIC * 10, "o2", government=True, date="2025-06-01"),
    ]
    result = build_chancellor(_speeches(), CHANCELLOR, set(), (2025, prior))
    assert result["previous"] == {"year": 2025, "contributions": 1, "words": 10 * 12 + 10 * 11, "foreignShare": round(100 * 40 / 70, 1)}


def test_no_section_without_contributions_as_chancellor():
    speeches = [s for s in _speeches() if s["speaker"] != CHANCELLOR]
    assert build_chancellor(speeches, CHANCELLOR, set()) is None
