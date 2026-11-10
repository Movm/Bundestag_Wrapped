import json

import pytest

from noun_analysis.edition.mentions import build_mentions


def write_config(tmp_path, mentions):
    path = tmp_path / "mentions.json"
    path.write_text(json.dumps({"version": "test-v1", "mentions": mentions}), encoding="utf-8")
    return path


def test_counts_mentions_per_speaker_with_the_first_quote(tmp_path):
    config = write_config(tmp_path, [{"id": "timmy", "label": "Timmy der Wal", "aliases": ["timmy"]}])
    speeches = [
        {"speaker": "B", "party": "Y", "protocolId": 2, "protocolDate": "2026-05-01", "speechPosition": 1,
         "text": "Danke. - Nein, es wird nicht um Timmy gehen. Sondern um Häfen."},
        {"speaker": "A", "party": "X", "protocolId": 1, "protocolDate": "2026-04-15", "speechPosition": 1,
         "text": "Der Wal Timmy stirbt. Gibt es Hoffnung für Timmys Artgenossen? Timothy zählt nicht."},
        {"speaker": "C", "party": "Z", "protocolId": 1, "protocolDate": "2026-04-15", "speechPosition": 2,
         "text": "Kein Wal hier."},
    ]

    [timmy] = build_mentions(speeches, config)

    assert timmy["id"] == "timmy" and timmy["count"] == 3
    assert [(s["name"], s["count"]) for s in timmy["speakers"]] == [("A", 2), ("B", 1)]
    assert timmy["speakers"][0] == {"name": "A", "party": "X", "count": 2, "date": "2026-04-15", "quote": "Der Wal Timmy stirbt."}
    assert timmy["speakers"][1]["quote"] == "Nein, es wird nicht um Timmy gehen."


def test_omits_a_mention_nobody_made(tmp_path):
    config = write_config(tmp_path, [{"id": "timmy", "label": "Timmy", "aliases": ["timmy"]}])
    assert build_mentions([{"speaker": "A", "party": "X", "text": "Nichts.", "protocolDate": "2026-01-01"}], config) == []


def test_shortens_a_long_sentence_around_the_match(tmp_path):
    config = write_config(tmp_path, [{"id": "timmy", "label": "Timmy", "aliases": ["timmy"]}])
    text = "wort " * 80 + "Timmy" + " wort" * 80 + "."
    [mention] = build_mentions([{"speaker": "A", "party": "X", "text": text, "protocolDate": "2026-01-01"}], config)
    quote = mention["speakers"][0]["quote"]
    assert "Timmy" in quote and quote.startswith("… ") and quote.endswith(" …") and len(quote) <= 245


@pytest.mark.parametrize("mention", [
    {"id": "Timmy", "label": "Timmy", "aliases": ["timmy"]},
    {"id": "timmy", "label": "", "aliases": ["timmy"]},
    {"id": "timmy", "label": "Timmy", "aliases": []},
])
def test_rejects_invalid_config(tmp_path, mention):
    with pytest.raises(ValueError):
        build_mentions([], write_config(tmp_path, [mention]))


def test_carries_background_and_source_from_the_config(tmp_path):
    config = write_config(tmp_path, [{"id": "timmy", "label": "Timmy", "aliases": ["timmy"], "background": ["3. März: Gesichtet."], "source": "Wikipedia", "headline": "Er hat sich das nicht ausgesucht.", "subtitle": "Ein Wal."}])
    [mention] = build_mentions([{"speaker": "A", "party": "X", "text": "Timmy.", "protocolDate": "2026-01-01"}], config)
    assert mention["background"] == ["3. März: Gesichtet."] and mention["source"] == "Wikipedia"
    assert mention["headline"] == "Er hat sich das nicht ausgesucht." and mention["subtitle"] == "Ein Wal."
