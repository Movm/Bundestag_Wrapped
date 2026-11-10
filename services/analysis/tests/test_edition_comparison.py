import json
import pytest

from noun_analysis.edition.comparison import build_year_over_year


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_builds_rank_movements_and_youth_language_counts(tmp_path):
    baseline = tmp_path / "baseline"
    write_json(baseline / "manifest.json", {
        "editionId": "2025",
        "period": {"start": "2025-01-01", "end": "2025-12-31"},
    })
    write_json(baseline / "wrapped.json", {
        "topicAnalysis": {"topTopics": [{"topic": "Finanzen"}, {"topic": "Wirtschaft"}]},
        "hotTopics": ["land", "mensch", "euro", "dank"],
        "parties": [{"party": "A", "signatureWords": [
            {"word": "alt", "ratio": 2.0}, {"word": "sinkt", "ratio": 1.5}, {"word": "bleibt", "ratio": 1.2},
        ]}],
    })
    write_json(baseline / "speeches.json", {"speeches": [
        {"speaker": "Alt Person", "party": "A", "text": "Safe, das ist wild. Nicht unsicher."},
    ]})
    lexicon = tmp_path / "youth.json"
    write_json(lexicon, {"version": "test-v1", "terms": ["safe", "wild", "bro", "lowkey"]})

    result = build_year_over_year(
        {
            "topicAnalysis": {"topTopics": [{"topic": "Wirtschaft"}, {"topic": "Finanzen"}]},
            "hotTopics": ["mensch", "dank", "land", "euro"],
            "parties": [{"party": "A", "signatureWords": [
                {"word": "bleibt", "ratio": 2.1}, {"word": "neu", "ratio": 1.8}, {"word": "sinkt", "ratio": 1.1},
            ]}],
        },
        [
            {"speaker": "Berta Beispiel", "party": "B", "text": "Safe safe, Bro!"},
            {"speaker": "Anna Beispiel", "party": "A", "text": "Lowkey wild."},
        ],
        baseline,
        lexicon,
    )

    assert result["baseline"]["editionId"] == "2025"
    assert result["topics"][0] == {"label": "Wirtschaft", "currentRank": 1, "previousRank": 2, "rankChange": 1}
    assert result["words"][0]["label"] == "dank"
    assert result["signatureWords"] == [{
        "party": "A",
        "risers": [
            {"word": "bleibt", "currentRank": 1, "previousRank": 3},
            {"word": "neu", "currentRank": 2, "previousRank": None},
        ],
        "fallers": [
            {"word": "alt", "currentRank": None, "previousRank": 1},
            {"word": "sinkt", "currentRank": 3, "previousRank": 2},
        ],
    }]
    assert result["youthLanguage"]["words"][0] == {
        "word": "safe", "count": 2, "previousCount": 1, "change": 1,
        "speakers": [{"name": "Berta Beispiel", "party": "B", "count": 2}],
    }
    assert result["youthLanguage"]["byParty"] == [{"party": "B", "count": 3}, {"party": "A", "count": 2}]
    assert result["youthLanguage"]["bySpeaker"] == [
        {"name": "Berta Beispiel", "party": "B", "count": 3},
        {"name": "Anna Beispiel", "party": "A", "count": 2},
    ]


def test_context_rules_and_complete_protocol_deduplication(tmp_path):
    baseline = tmp_path / "baseline"
    write_json(baseline / "manifest.json", {
        "editionId": "2025",
        "period": {"start": "2025-01-01", "end": "2025-12-31"},
    })
    write_json(baseline / "wrapped.json", {"topicAnalysis": {"topTopics": []}, "hotTopics": []})
    write_json(baseline / "speeches.json", {"speeches": []})
    lexicon = tmp_path / "youth.json"
    write_json(lexicon, {
        "version": "context-v1",
        "terms": [
            {"word": "wild/wyld", "aliases": ["wild", "wyld"], "includeContexts": ["so\\s+wild"]},
            {"word": "schere", "includeContexts": ["schere\\s*!"]},
            "lowkey",
            "sus",
        ],
    })
    protocol = [
        {"protocolId": 1, "speechPosition": 1, "speaker": "A", "party": "P", "text": "Das ist so wild! Die Schere zwischen Arm und Reich wächst."},
        {"protocolId": 1, "speechPosition": 2, "speaker": "B", "party": "P", "text": "Lowkey sus."},
    ]
    duplicate = [{**speech, "protocolId": 2} for speech in protocol]

    result = build_year_over_year(
        {"topicAnalysis": {"topTopics": []}, "hotTopics": []},
        protocol + duplicate,
        baseline,
        lexicon,
    )

    counts = {item["word"]: item["count"] for item in result["youthLanguage"]["words"]}
    assert counts == {"wild/wyld": 1, "lowkey": 1, "sus": 1, "schere": 0}
    assert result["youthLanguage"]["byParty"] == [{"party": "P", "count": 3}]


def test_lexicon_keeps_winner_year_and_rejects_invalid_ones(tmp_path):

    lexicon = tmp_path / "youth.json"
    write_json(lexicon, {"version": "v", "terms": ["safe", "wild", "bro", {"word": "ragebait", "winner": 2026}]})
    terms = {term["word"]: term["winner"] for term in _lexicon(lexicon)[1]}
    assert terms == {"safe": None, "wild": None, "bro": None, "ragebait": 2026}

    write_json(lexicon, {"version": "v", "terms": ["safe", "wild", "bro", {"word": "ragebait", "winner": "2026"}]})
    with pytest.raises(ValueError, match="winner"):
        _lexicon(lexicon)


from noun_analysis.edition.comparison import _contextual_count, _lexicon, _term_pattern


def _term(word, **extra):
    return {"word": word, "aliases": extra.pop("aliases", [word]), "includeContexts": [], "excludeContexts": [], **extra}


@pytest.mark.parametrize("text", [
    "Er liefert Ragebait ab.",
    "mit Trollfarmen, Bots und Ragebaits überrennen",
    "Das ist RAGEBAIT.",
    "ein Rage-Bait der Regierung",
    "ein Rage Bait der Regierung",
    "wegen des Ragebaits",
    "mit Ragebaiten",
])
def test_variants_of_a_term_are_counted(text):
    assert _contextual_count(text, _term("ragebait")) == 1


@pytest.mark.parametrize("text", [
    "Das Bait liegt im Wasser.",
    "Das ist Rage und Wut.",
    "Ragebaiter überall.",
    "Sie lieben Anti-Ragebait nicht.",
])
def test_unrelated_forms_are_not_counted(text):
    assert _contextual_count(text, _term("ragebait")) == 0


def test_two_uses_in_one_speech_are_both_counted():
    assert _contextual_count("Ragebait hier, Ragebaits dort.", _term("ragebait")) == 2


def test_multi_word_alias_accepts_hyphen_and_plural():
    assert _contextual_count("ein Side-Eye und zwei Side Eyes", _term("side eye")) == 2


def test_short_and_ambiguous_terms_get_no_loose_variants():
    # no join variants for short words, no endings for terms with context rules
    assert _contextual_count("Der Bus us", _term("sus")) == 0
    ambiguous = _term("wild", includeContexts=["so\\s+wild"])
    assert _contextual_count("so wild", ambiguous) == 1
    assert _contextual_count("so wilde Tiere", ambiguous) == 0
    assert _contextual_count("wild", ambiguous) == 0


def test_context_rules_still_apply_to_spelling_variants():
    term = _term("crashout", includeContexts=["totaler"])
    assert _contextual_count("ein totaler Crash-out", term) == 1
    assert _contextual_count("ein Crash-out", term) == 0


def test_term_pattern_is_shared_for_every_alias():
    assert _term_pattern("ragebait").search("Ragebaits")


def test_ragebait_regression_fixtures_from_2026_preview(tmp_path):
    baseline = tmp_path / "baseline"
    write_json(baseline / "manifest.json", {"editionId": "2025", "period": {"start": "2025-01-01", "end": "2025-12-31"}})
    write_json(baseline / "wrapped.json", {})
    write_json(baseline / "speeches.json", {"speeches": []})
    lexicon = tmp_path / "youth.json"
    write_json(lexicon, {"version": "t", "terms": [
        {"word": "ragebait", "winner": 2026}, "safe", "wild", "bro",
    ]})
    speeches = [
        {"speaker": "Awet Tesfaiesus", "party": "GRÜNE", "text": "… mit Trollfarmen, Bots und Ragebaits überrennen …"},
        {"speaker": "Marcel Emmerich", "party": "GRÜNE", "text": "Er liefert Ragebait ab."},
        {"speaker": "Marcel Emmerich", "party": "GRÜNE", "text": "Noch einmal Ragebait."},
    ]
    result = build_year_over_year({}, speeches, baseline, lexicon)
    words = {item["word"]: item for item in result["youthLanguage"]["words"]}
    assert words["ragebait"]["count"] == 3
    assert words["ragebait"]["speakers"] == [
        {"name": "Marcel Emmerich", "party": "GRÜNE", "count": 2},
        {"name": "Awet Tesfaiesus", "party": "GRÜNE", "count": 1},
    ]
    assert "speakers" not in words["safe"]
    assert result["youthLanguage"]["bySpeaker"][0]["name"] == "Marcel Emmerich"


def test_speakers_sort_by_count_then_name(tmp_path):
    baseline = tmp_path / "baseline"
    write_json(baseline / "manifest.json", {"editionId": "2025", "period": {"start": "a", "end": "b"}})
    write_json(baseline / "wrapped.json", {})
    write_json(baseline / "speeches.json", {"speeches": []})
    lexicon = tmp_path / "youth.json"
    write_json(lexicon, {"version": "t", "terms": ["safe", "wild", "bro", "lowkey"]})
    speeches = [
        {"speaker": "Zora", "party": "A", "text": "safe"},
        {"speaker": "Adam", "party": "B", "text": "safe"},
        {"speaker": "Mia", "party": "A", "text": "safe safe"},
    ]
    result = build_year_over_year({}, speeches, baseline, lexicon)
    safe = next(item for item in result["youthLanguage"]["words"] if item["word"] == "safe")
    assert [item["name"] for item in safe["speakers"]] == ["Mia", "Adam", "Zora"]
