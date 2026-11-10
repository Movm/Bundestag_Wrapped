"""How the Gen Z MPs at the lectern differ from their older colleagues.

Birth years come from the committed lookup built out of the Bundestag MdB
Stammdaten (scripts/build_speaker_gender.py). The word comparison holds the
party mix constant: older MPs' counts are reweighted to the Gen Z party shares,
so a word does not rank only because most Gen Z MPs sit in one party.
"""

from __future__ import annotations

import json
from collections import Counter
from functools import lru_cache
from pathlib import Path
from typing import Any

from noun_analysis.edition.comparison import _deduplicate_protocols
from noun_analysis.wrapped.gender import name_key
from noun_analysis.wrapped.speaker_export.constants import WORD_PATTERN
from noun_analysis.wrapped.speaker_export.signature_scoring import MIN_Z_SCORE, log_odds_score

BIRTH_YEAR_PATH = Path(__file__).resolve().parents[1] / "wrapped" / "reference" / "speaker_birth_year.json"
GEN_Z_BORN_FROM = 1997  # Pew Research Center's first Gen Z birth year.
MIN_GEN_Z_SPEAKERS = 5
MIN_WORD_COUNT = 8
MIN_WORD_SPEAKERS = 3  # A cohort word, not one person's topic.
WORD_LIMIT = 8
FEWER_LIMIT = 5


@lru_cache(maxsize=1)
def load_birth_years(path: Path = BIRTH_YEAR_PATH) -> dict[str, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {**data.get("abgeordnetenwatch", {}), **data.get("entries", {})}


def _birth_year(speech: dict[str, Any], years: dict[str, int]) -> int | None:
    first, last = str(speech.get("first_name") or ""), str(speech.get("last_name") or "")
    if not first or not last:
        return None
    # Protocols shorten middle names to bare initials ("Alexis L").
    return years.get(name_key(first, last)) or years.get(name_key(first.split()[0], last))


def _words(speeches: list[dict[str, Any]], stopwords: set[str]) -> Counter[str]:
    counts: Counter[str] = Counter()
    for speech in speeches:
        counts.update(w for w in WORD_PATTERN.findall(str(speech.get("text", "")).lower()) if len(w) >= 5 and w not in stopwords)
    return counts


def build_generations(speeches: list[dict[str, Any]], stopwords: set[str], years: dict[str, int] | None = None) -> dict[str, Any] | None:
    """Gen Z section for wrapped.json, or None when too few Gen Z MPs spoke."""
    years = load_birth_years() if years is None else years
    genz: list[dict[str, Any]] = []
    older: list[dict[str, Any]] = []
    birth: dict[tuple[str, str], int] = {}
    unknown: set[str] = set()
    for speech in _deduplicate_protocols(speeches):
        speaker, party = speech.get("speaker"), speech.get("party")
        # MPs only: government speeches and non-attached members have no party story.
        if not speaker or not party or party == "fraktionslos" or speech.get("is_government") or speech.get("type") == "ortskraefte":
            continue
        year = _birth_year(speech, years)
        if year is None:
            unknown.add(speaker)
            continue
        birth[(speaker, party)] = year
        (genz if year >= GEN_Z_BORN_FROM else older).append(speech)

    genz_people = Counter((s["speaker"], s["party"]) for s in genz)
    older_people = {(s["speaker"], s["party"]) for s in older}
    if len(genz_people) < MIN_GEN_Z_SPEAKERS or not older:
        return None

    genz_mix = Counter(s["party"] for s in genz)
    older_mix = Counter(s["party"] for s in older)
    weight = {p: (genz_mix[p] / len(genz)) / (older_mix[p] / len(older)) for p in genz_mix if older_mix[p]}
    genz_counts = _words(genz, stopwords)
    reference: Counter[str] = Counter()
    for party, party_speeches in _by_party(older).items():
        if party in weight:
            for word, count in _words(party_speeches, stopwords).items():
                reference[word] += count * weight[party]
    genz_total, reference_total = sum(genz_counts.values()), sum(reference.values())
    corpus = genz_counts + reference
    corpus_total = genz_total + reference_total
    word_speakers: dict[str, set[str]] = {}
    for speech in genz:
        for word in set(WORD_PATTERN.findall(str(speech.get("text", "")).lower())):
            word_speakers.setdefault(word, set()).add(speech["speaker"])

    def score(word: str):
        return log_odds_score(genz_counts[word], genz_total, reference[word], reference_total, corpus[word], corpus_total)

    more = []
    for word, count in genz_counts.items():
        if count < MIN_WORD_COUNT or len(word_speakers.get(word, ())) < MIN_WORD_SPEAKERS:
            continue
        result = score(word)
        if result.z_score >= MIN_Z_SCORE and result.ratio_low >= 1.5:
            more.append({"word": word, "count": count, "ratio": round(result.ratio_low, 1), "zScore": round(result.z_score, 2)})
    more.sort(key=lambda item: (-item["zScore"], item["word"]))

    fewer = []
    for word, ref_count in reference.items():
        if ref_count < MIN_WORD_COUNT * 4:
            continue
        # Same test with the groups swapped: what older MPs (same party mix) say more.
        result = log_odds_score(round(ref_count), round(reference_total), genz_counts[word], genz_total, corpus[word], corpus_total)
        if result.z_score >= MIN_Z_SCORE and result.ratio_low >= 1.5:
            fewer.append({"word": word, "ratio": round(result.ratio_low, 1), "zScore": round(result.z_score, 2)})
    fewer.sort(key=lambda item: (-item["zScore"], item["word"]))

    return {
        "cohort": "genz",
        "bornFrom": GEN_Z_BORN_FROM,
        "speakerCount": len(genz_people),
        "totalSpeakers": len(genz_people) + len(older_people),
        "unknownSpeakers": len(unknown),
        "parties": [{"party": p, "count": c} for p, c in sorted(Counter(p for _, p in genz_people).items(), key=lambda i: (-i[1], i[0]))],
        "speakers": [
            {"name": name, "party": party, "birthYear": birth[(name, party)], "speeches": count}
            for (name, party), count in sorted(genz_people.items(), key=lambda i: (-i[1], i[0][0]))
        ],
        "speechesPerSpeaker": round(len(genz) / len(genz_people), 1),
        "olderSpeechesPerSpeaker": round(len(older) / len(older_people), 1),
        "words": more[:WORD_LIMIT],
        "fewerWords": fewer[:FEWER_LIMIT],
    }


def _by_party(speeches: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for speech in speeches:
        grouped.setdefault(speech["party"], []).append(speech)
    return grouped
