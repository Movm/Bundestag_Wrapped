"""Compact payload for the "Perfect Match" feature (``match.json``).

The browser scores every MP against a visitor's answers, so it needs one small
asset instead of 600+ speaker files. Only the four parties a visitor can rank
are included (CDU/CSU, SPD, GRÜNE, DIE LINKE); AfD and fraktionslos are left
out on purpose, and MPs with too little speech text are skipped.

Word ratio (per MP and candidate word)::

    expected = bundestag_rate(word) * mp_counted_words
    ratio    = (count + 1) / (expected + 1)          # stored as round(ratio * 10)

``bundestag_rate`` is the word's share of all counted tokens of the *included*
parties (not the full Bundestag), so the ratio is "how much more than the
four-party average does this MP use the word". "Counted tokens" are the 4+
letter lowercase tokens that the exporter's per-speaker counters already use,
the same vocabulary the signature words come from. The +1 smooths MPs who
speak little.

Candidate words (step 3 of the feature) are chosen by :func:`select_match_words`
with no hand-curation, see its docstring for the rules.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from collections.abc import Iterable, Mapping
from dataclasses import dataclass

MATCH_PARTIES: tuple[str, ...] = ("CDU/CSU", "SPD", "GRÜNE", "DIE LINKE")
MIN_MP_WORDS = 1500  # spoken words (speaker-file ``totalWords``) to be included

TARGET_WORDS = 12
MIN_PER_PARTY = 2
MAX_PER_TOPIC = 2
MAX_PER_PARTY = 4
MAX_WITHOUT_TOPIC = 2
MIN_USER_MPS = 15  # MPs that used the word at least MIN_USER_COUNT times
MIN_USER_COUNT = 2
MIN_LEAN = 1.6  # leading party's rate vs. the pooled rate of the other three
NO_TOPIC_PENALTY = 0.5
MIN_NOUN_SHARE = 0.6  # share of a token's uses that spaCy tagged as noun
MIN_STEM = 5  # shared prefix length that makes two words "the same word"

# Parliamentary filler, role words (government vs. opposition says them for
# structural, not political reasons) and procedure words. Matched on top of the
# shared stopword lists and of every token of an MP's name.
MATCH_EXCLUDED_WORDS: frozenset[str] = frozenset({
    "kollege", "kollegen", "kollegin", "kolleginnen", "petition", "petitionen", "antrag", "anträge",
    "präsidentin", "präsident", "vizepräsidentin", "vizepräsident", "abgeordnete", "abgeordneten",
    "bundesregierung", "regierung", "koalition", "koalitionen", "opposition", "ampel", "union",
    "minister", "ministerin", "bundeskanzler", "bundeskanzlerin", "kanzler", "kanzlerin",
    "ministerium", "bundesminister", "bundesministerin", "staatssekretär", "staatssekretärin",
    "ausschuss", "ausschuss", "gesetzentwurf", "änderungsantrag", "entschließungsantrag",
    "tagesordnung", "drucksache", "fraktion", "fraktionen", "bundestag", "plenum", "haus",
    "beifall", "zuruf", "zurufe", "zwischenruf", "zwischenrufe", "zwischenfrage", "lachen",
    "heiterkeit", "unruhe", "widerspruch", "redezeit", "rednerin", "redner", "landesregierung",
    "bundesland", "bundesländer", "bundesrat", "deutschland", "land", "länder", "menschen",
    "leute", "mensch", "bürgerinnen", "bürger", "damen", "herren", "union", "grünen", "linken",
    "sozialdemokraten", "sozialdemokratie", "christdemokraten", "merz", "habeck", "scholz",
})

_TOKEN = re.compile(r"[a-zäöüß]{4,}")


@dataclass(frozen=True)
class MatchMpInput:
    """What the selection needs per included MP."""

    party: int  # index into MATCH_PARTIES
    counts: Mapping[str, int]
    total: int  # counted tokens (denominator of ``counts``)


@dataclass(frozen=True)
class WordChoice:
    word: str
    topic: str | None
    party: int  # party the word leans towards
    lean: float  # leading party's rate vs pooled rate of the others
    users: int  # MPs with >= MIN_USER_COUNT uses
    score: float


def _eligible(word: str, vocabulary: set[str], excluded: Iterable[str]) -> bool:
    return bool(_TOKEN.fullmatch(word)) and word in vocabulary and word not in excluded


def _same_stem(a: str, b: str) -> bool:
    """Inflections and compounds of one another (fossile/fossilen, digital/digitalisierung)."""
    short, long_ = sorted((a, b), key=len)
    return len(short) >= MIN_STEM and long_.startswith(short)


def noun_counts_from_frame(frame) -> dict[str, int]:
    """Total noun uses per lemma from the analysis ``nouns.csv`` frame."""
    count_columns = [c for c in frame.columns if c.endswith("_count")]
    totals = frame[count_columns].sum(axis=1)
    return {str(word).strip().casefold(): int(total) for word, total in zip(frame["word"], totals)}


def rank_match_candidates(
    mps: list[MatchMpInput],
    vocabulary: set[str],
    topic_of: Mapping[str, str],
    excluded: Iterable[str],
    party_count: int = len(MATCH_PARTIES),
) -> list[WordChoice]:
    """All qualifying words, best score first (steps 1 and 2 of the selection)."""
    excluded_set = set(excluded)
    party_totals = [0] * party_count
    totals: Counter[str] = Counter()
    per_party: list[Counter[str]] = [Counter() for _ in range(party_count)]
    users: Counter[str] = Counter()
    for mp in mps:
        party_totals[mp.party] += mp.total
        for word, count in mp.counts.items():
            per_party[mp.party][word] += count
            totals[word] += count
            if count >= MIN_USER_COUNT:
                users[word] += 1
    grand_total = sum(party_totals)

    candidates: list[WordChoice] = []
    for word, user_count in users.items():
        if user_count < MIN_USER_MPS or not _eligible(word, vocabulary, excluded_set):
            continue
        rates = [(per_party[p][word] + 0.5) / max(party_totals[p], 1) for p in range(party_count)]
        lead = max(range(party_count), key=lambda p: (rates[p], -p))
        rest_count = totals[word] - per_party[lead][word]
        rest_rate = (rest_count + 0.5) / max(grand_total - party_totals[lead], 1)
        lean = rates[lead] / rest_rate
        if lean < MIN_LEAN:
            continue
        topic = topic_of.get(word)
        score = lean * math.log(user_count) * (1.0 if topic else NO_TOPIC_PENALTY)
        candidates.append(WordChoice(word, topic, lead, round(lean, 2), user_count, round(score, 3)))
    candidates.sort(key=lambda c: (-c.score, c.word))
    return candidates


def select_match_words(
    mps: list[MatchMpInput],
    vocabulary: set[str],
    topic_of: Mapping[str, str],
    excluded: Iterable[str],
    party_count: int = len(MATCH_PARTIES),
    target: int = TARGET_WORDS,
) -> list[WordChoice]:
    """Pick the candidate words for step 3, deterministically.

    1. A word qualifies if it is a noun of the analysed corpus (``vocabulary``; the
       caller keeps only tokens spaCy tags as noun in >= ``MIN_NOUN_SHARE`` of uses),
       not excluded, and used at least ``MIN_USER_COUNT`` times by at least
       ``MIN_USER_MPS`` included MPs.
    2. Its party lean is ``rate(leading party) / pooled rate(other parties)``
       with +0.5 smoothing; it must be at least ``MIN_LEAN``. The score is
       ``lean * log(users)``, times ``NO_TOPIC_PENALTY`` if the word is in no
       topic lexicon (so topic-carrying words win ties).
    3. Words that are the stem of an already chosen word (or vice versa) are skipped.
    4. Selection is greedy in score order: first the best ``MIN_PER_PARTY``
       words per party, then the best remaining words until ``target`` is
       reached, never more than ``MAX_PER_TOPIC`` per topic,
       ``MAX_WITHOUT_TOPIC`` topic-less words or ``MAX_PER_PARTY`` per party.
    """
    candidates = rank_match_candidates(mps, vocabulary, topic_of, excluded, party_count)

    chosen: list[WordChoice] = []
    per_party_n = [0] * party_count
    per_topic_n: Counter[str] = Counter()
    untopiced = 0

    def can_take(c: WordChoice) -> bool:
        if any(_same_stem(c.word, other.word) for other in chosen):
            return False
        if per_party_n[c.party] >= MAX_PER_PARTY:
            return False
        if c.topic is None:
            return untopiced < MAX_WITHOUT_TOPIC
        return per_topic_n[c.topic] < MAX_PER_TOPIC

    def take(c: WordChoice) -> None:
        nonlocal untopiced
        chosen.append(c)
        per_party_n[c.party] += 1
        if c.topic is None:
            untopiced += 1
        else:
            per_topic_n[c.topic] += 1

    for party in range(party_count):
        for c in candidates:
            if per_party_n[party] >= MIN_PER_PARTY:
                break
            if c.party == party and c not in chosen and can_take(c):
                take(c)
    for c in candidates:
        if len(chosen) >= target:
            break
        if c not in chosen and can_take(c):
            take(c)
    chosen.sort(key=lambda c: (c.party, -c.score, c.word))
    return chosen


def word_ratio(count: int, total: int, rate: float) -> int:
    """Smoothed ratio of an MP's use of a word to the expected use, times 10."""
    return round((count + 1) / (rate * total + 1) * 10)


def match_animal(animal_id: str, animal: Mapping, count: int) -> dict:
    """One pickable animal. ``text`` is the profile reason without stats:
    ``match_text`` replaces a reason that needs the MP's numbers."""
    entry = {"id": animal_id, "emoji": animal["emoji"], "name": animal["name"], "count": count}
    if animal.get("title_n"):
        entry["title"] = animal["title_n"]
    text = animal.get("match_text") or animal.get("reason")
    if text:
        entry["text"] = text
    return entry


def build_match_payload(
    speakers: Iterable[Mapping],
    word_counts: Mapping[str, Mapping[str, int]],
    counted_totals: Mapping[str, int],
    vocabulary: set[str],
    topic_of: Mapping[str, str],
    topic_ids: list[str],
    animals: Mapping[str, Mapping],
    excluded: Iterable[str] = (),
) -> tuple[dict, list[WordChoice]]:
    """Build ``match.json`` and also return the chosen words for reporting.

    ``speakers`` are the finished speaker files (``slug``, ``name``, ``party``,
    ``totalWords``, ``topics.scores``, ``spiritAnimal.id``); ``word_counts`` and
    ``counted_totals`` are the exporter's per-speaker counters keyed by slug.
    """
    party_index = {party: i for i, party in enumerate(MATCH_PARTIES)}
    included = sorted(
        (s for s in speakers if s["party"] in party_index and s["totalWords"] >= MIN_MP_WORDS
         and counted_totals.get(s["slug"], 0) > 0),
        key=lambda s: s["slug"],
    )
    name_tokens = {t for s in included for t in _TOKEN.findall(s["name"].lower())}
    inputs = [
        MatchMpInput(party_index[s["party"]], word_counts[s["slug"]], counted_totals[s["slug"]])
        for s in included
    ]
    choices = select_match_words(inputs, vocabulary, topic_of, set(excluded) | name_tokens)

    pooled: Counter[str] = Counter()
    pooled_total = 0
    for mp in inputs:
        pooled_total += mp.total
        for choice in choices:
            pooled[choice.word] += mp.counts.get(choice.word, 0)
    rates = {c.word: pooled[c.word] / pooled_total for c in choices}

    animal_counts = Counter(
        s["spiritAnimal"]["id"] for s in included if s.get("spiritAnimal") and s["spiritAnimal"]["id"] in animals
    )
    animal_ids = sorted(animal_counts, key=lambda a: (-animal_counts[a], a))
    animal_pos = {a: i for i, a in enumerate(animal_ids)}

    mps = []
    for speaker, mp in zip(included, inputs):
        scores = (speaker.get("topics") or {}).get("scores", {})
        animal = (speaker.get("spiritAnimal") or {}).get("id")
        mps.append({
            "slug": speaker["slug"],
            "name": speaker["name"],
            "party": mp.party,
            "animal": animal_pos.get(animal, -1),
            "topics": [round(scores.get(topic, 0) * 100) for topic in topic_ids],
            "words": [word_ratio(mp.counts.get(c.word, 0), mp.total, rates[c.word]) for c in choices],
        })
    payload = {
        "schemaVersion": 1,
        "parties": list(MATCH_PARTIES),
        "topics": list(topic_ids),
        "words": [{"word": c.word, "topic": c.topic} for c in choices],
        "animals": [match_animal(a, animals[a], animal_counts[a]) for a in animal_ids],
        "mps": mps,
    }
    return payload, choices


def build_match_from_exporter(
    exporter,
    speakers: Mapping[str, Mapping],
    noun_counts: Mapping[str, int],
    extra_excluded: Iterable[str] = (),
) -> tuple[dict, list[WordChoice]]:
    """Wire :func:`build_match_payload` to a :class:`SpeakerExporter`.

    ``speakers`` maps exporter speaker keys to their finished speaker files and
    ``noun_counts`` are the noun-tagged uses per lemma of the analysis results.
    A token only counts as noun when at least ``MIN_NOUN_SHARE`` of its uses in
    the speeches were tagged as noun (drops verbs/adverbs spaCy mislabelled).
    """
    from noun_analysis.lexicons import TopicCategory
    from noun_analysis.stopwords import STOPWORD_GENERIC, STOPWORD_NOUNS

    from .constants import SPIRIT_ANIMALS, TOPIC_WORD_TO_CATEGORY

    slug_of = {key: speaker["slug"] for key, speaker in speakers.items()}
    word_counts = {slug_of[k]: c for k, c in exporter._speaker_word_counts.items() if k in slug_of}
    totals = {slug_of[k]: t for k, t in exporter._speaker_total_words.items() if k in slug_of}
    excluded = set(STOPWORD_GENERIC) | set(STOPWORD_NOUNS) | set(MATCH_EXCLUDED_WORDS) | set(extra_excluded)
    corpus = exporter._bundestag_word_counts
    vocabulary = {
        word for word, nouns in noun_counts.items()
        if corpus.get(word, 0) > 0 and nouns >= MIN_NOUN_SHARE * corpus[word]
    }
    return build_match_payload(
        speakers.values(),
        word_counts,
        totals,
        vocabulary,
        {word: topic.value for word, topic in TOPIC_WORD_TO_CATEGORY.items()},
        sorted(t.value for t in TopicCategory),
        SPIRIT_ANIMALS,
        excluded,
    )
