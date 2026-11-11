import json
from collections import Counter
from pathlib import Path

import pytest

from noun_analysis.edition.export import EditionValidationError, build_manifest, publish_edition, validate_edition
from noun_analysis.wrapped.speaker_export.match import (
    MATCH_PARTIES,
    MIN_MP_WORDS,
    MatchMpInput,
    build_match_payload,
    noun_counts_from_frame,
    select_match_words,
    word_ratio,
)

ROOT = Path(__file__).resolve().parents[3]


def mp(party, total=10_000, **counts):
    return MatchMpInput(party, counts, total)


def corpus():
    """20 MPs per party; each party has two own words, everyone shares 'haus'."""
    own = {0: ("wachstum", "markt"), 1: ("tarif", "stabil"), 2: ("klimakrise", "natur"), 3: ("armut", "enteignung")}
    mps = []
    for party in range(4):
        for _ in range(20):
            counts = {"haushalt": 30, "gemeinde": 4}
            counts.update({w: 12 for w in own[party]})
            mps.append(MatchMpInput(party, counts, 10_000))
    return mps, own


TOPICS = {"wachstum": "wirtschaft", "markt": "wirtschaft", "klimakrise": "klima", "armut": "soziales"}
VOCAB = {"wachstum", "markt", "tarif", "stabil", "klimakrise", "natur", "armut", "enteignung", "haushalt", "gemeinde"}


def test_selection_is_deterministic_and_party_leaning():
    mps, own = corpus()
    first = select_match_words(mps, VOCAB, TOPICS, set())
    second = select_match_words(list(reversed(mps)), VOCAB, TOPICS, set())
    assert first == second
    words = {c.word: c for c in first}
    assert "haushalt" not in words and "gemeinde" not in words  # shared by every party, no lean
    owner = {word: party for party, party_words in own.items() for word in party_words}
    assert words and all(owner[word] == choice.party for word, choice in words.items())
    assert {choice.party for choice in words.values()} == {0, 1, 2, 3}


def test_selection_respects_caps_and_exclusions():
    mps, _ = corpus()
    chosen = select_match_words(mps, VOCAB, TOPICS, {"armut"})
    assert "armut" not in {c.word for c in chosen}
    topics = Counter(c.topic for c in chosen if c.topic)
    assert max(topics.values()) <= 2
    assert sum(c.topic is None for c in chosen) <= 2


def test_selection_needs_enough_users_and_noun_vocabulary():
    mps, _ = corpus()
    mps.append(mp(0, seltenwort=50))  # one MP only
    chosen = {c.word for c in select_match_words(mps, VOCAB | {"seltenwort"}, TOPICS, set())}
    assert "seltenwort" not in chosen
    assert "wachstum" not in {c.word for c in select_match_words(mps, VOCAB - {"wachstum"}, TOPICS, set())}


def test_inflections_of_one_word_are_not_both_chosen():
    mps = [mp(p % 4, klima=10, klimakrise=10) for p in range(80)]
    mps += [mp(2, klimakrise=10, klimakrisen=10) for _ in range(20)]
    chosen = {c.word for c in select_match_words(mps, {"klimakrise", "klimakrisen", "klima"}, {}, set())}
    assert len(chosen & {"klimakrise", "klimakrisen"}) <= 1


def test_word_ratio_is_smoothed():
    assert word_ratio(0, 1000, 0.001) == round(1 / 2 * 10)
    assert word_ratio(9, 1000, 0.001) == 50  # (9+1)/(1+1)*10


def speaker(slug, party, words=5000, animal="biber", topics=None):
    return {
        "slug": slug,
        "name": slug.title(),
        "party": party,
        "totalWords": words,
        "topics": {"scores": topics or {"klima": 1.234, "arbeit": 0.5}},
        "spiritAnimal": {"id": animal} if animal else None,
    }


ANIMALS = {"biber": {"emoji": "B", "name": "Biber"}, "adler": {"emoji": "A", "name": "Adler"}}


def build(speakers, counts=None):
    counts = counts or {s["slug"]: {"wachstum": 3} for s in speakers}
    totals = {s["slug"]: 4000 for s in speakers}
    return build_match_payload(speakers, counts, totals, {"wachstum"}, {"wachstum": "wirtschaft"}, ["arbeit", "klima"], ANIMALS)


def test_payload_excludes_afd_fraktionslos_and_small_speakers():
    speakers = [speaker("a", "CDU/CSU"), speaker("b", "AfD"), speaker("c", "fraktionslos"), speaker("d", "SPD", words=MIN_MP_WORDS - 1), speaker("e", "SPD")]
    payload, _ = build(speakers)
    assert [m["slug"] for m in payload["mps"]] == ["a", "e"]
    assert payload["parties"] == list(MATCH_PARTIES)
    assert payload["topics"] == ["arbeit", "klima"]
    assert [m["party"] for m in payload["mps"]] == [0, 1]
    assert payload["mps"][0]["topics"] == [50, 123]


def test_payload_animals_sorted_by_count_with_minus_one_for_none():
    speakers = [speaker("a", "SPD", animal="adler"), speaker("b", "SPD", animal="biber"), speaker("c", "GRÜNE", animal="biber"), speaker("d", "GRÜNE", animal=None)]
    payload, _ = build(speakers)
    assert payload["animals"] == [{"id": "biber", "emoji": "B", "name": "Biber", "count": 2}, {"id": "adler", "emoji": "A", "name": "Adler", "count": 1}]
    assert {m["slug"]: m["animal"] for m in payload["mps"]} == {"a": 1, "b": 0, "c": 0, "d": -1}


def test_noun_counts_from_frame_sums_party_columns():
    import pandas as pd

    frame = pd.DataFrame({"word": ["Rente"], "SPD_count": [2], "SPD_per1000": [9.0], "AfD_count": [3], "AfD_per1000": [1.0]})
    assert noun_counts_from_frame(frame) == {"rente": 5}


def test_match_asset_is_validated_compact_and_listed_in_manifest(tmp_path):
    wrapped = json.loads((ROOT / "apps/wrapped/public/wrapped.json").read_text(encoding="utf-8"))
    speeches = [{"protocolId": 1, "protocolDate": "2026-01-01", "protocolNumber": "21/1", "wahlperiode": 21, "speechPosition": 1}]
    payload, _ = build([speaker("a", "SPD")])
    artifacts = {
        "wrapped.json": wrapped,
        "speakers/index.json": {"speakers": [{"slug": "a"}]},
        "speakers/a.json": {"slug": "a"},
        "speeches.json": {"speeches": speeches},
        "words.json": {"parties": []},
        "word_rankings.json": {"parties": []},
        "topic_rankings.json": {"topics": []},
        "content.json": {"editionId": "2026", "year": 2026},
        "match.json": payload,
    }
    manifest = build_manifest("2026", 2026, "t", "2027-01-02T08:00:00Z", "2026-01-01", "2026-12-31", [21], speeches, False, with_match=True)
    target = publish_edition(tmp_path, "2026", "t", manifest, artifacts)
    assert manifest["assets"]["match"] == "match.json"
    assert "\n  " not in (target / "match.json").read_text()  # compact
    validate_edition(target)

    broken = json.loads((target / "match.json").read_text())
    broken["mps"][0]["extra"] = 1
    with pytest.raises(EditionValidationError):
        publish_edition(tmp_path, "2026", "t2", {**manifest, "dataVersion": "t2"}, {**artifacts, "match.json": broken})


def test_manifest_without_match_stays_valid():
    speeches = [{"protocolId": 1, "protocolDate": "2026-01-01"}]
    manifest = build_manifest("2026", 2026, "t", "2027-01-02T08:00:00Z", "2026-01-01", "2026-12-31", [21], speeches, False)
    assert "match" not in manifest["assets"]


def test_match_animal_text_has_no_stat_placeholders():
    from noun_analysis.wrapped.speaker_export.constants import SPIRIT_ANIMALS
    from noun_analysis.wrapped.speaker_export.match import match_animal

    for animal_id, animal in SPIRIT_ANIMALS.items():
        entry = match_animal(animal_id, animal, 1)
        assert entry["title"] and entry["text"]
        assert "{" not in entry["text"], animal_id
