import json

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
    assert result["youthLanguage"]["words"][0] == {"word": "safe", "count": 2, "previousCount": 1, "change": 1}
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
