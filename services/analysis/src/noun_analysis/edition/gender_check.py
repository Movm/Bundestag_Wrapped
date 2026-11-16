"""Männer gegen Frauen: which words and topics women and men in the Bundestag
use more often, compared at the same party mix.

What is counted: formal speeches only (``category == "rede"``, protocol
duplicates removed), by members of the five groups AfD, CDU/CSU, SPD, GRÜNE and
DIE LINKE (no fraktionslos). The speaker's gender comes from the pipeline's own
``GenderDetector`` (official Stammdaten first, then the name dictionary), so
ministers who are not MdB get one too; speakers it cannot place are skipped.

Tokens are the edition's usual ones: lowercase words of 4+ letters. Rates are
per 10,000 tokens.

Party standardisation: women and men are not spread evenly over the parties
(and the parties talk about different things), so a raw rate would partly
measure party. For a term, ``rate_G = Σ_p w_p · count(p,G) / tokens(p,G)`` with
``w_p`` the party's share of all tokens of the five groups (both genders
together): each gender is judged as if it had the same party mix.
``factor = max(rate_F, rate_M) / min(...)``; the larger side wins. ``split`` is
the female share of ``rate_F + rate_M`` in whole percent (male = 100 - female).
``consistentParties`` is how many of the five parties show the same direction
in their own raw rates; a duel with fewer than four is not usable and the
builder returns None.

Words: nouns only (≥ 90 % of a word's occurrences are capitalised), minus
shared stopwords, forms of address and inflections of the duel word itself. A word qualifies with ≥ 40 uses,
≥ 25 distinct speakers of the favoured gender, a standardised rate of ≥ 1.0
per 10,000 and ≥ 4 consistent parties; the top six by factor are kept per side.
Topics use the topic lexicons: every token that is in a lexicon counts once for
its topic (a later lexicon wins for words in several, as in the chancellor
analysis).
"""

from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from typing import Any

from noun_analysis.edition.comparison import _deduplicate_protocols
from noun_analysis.lexicons import TOPIC_LEXICONS
from noun_analysis.wrapped.gender import GenderDetector
from noun_analysis.wrapped.speaker_export.constants import WORD_PATTERN

# The edition tokeniser, but case-blind: it keeps the written form so nouns can be told apart.
CASED_WORD_PATTERN = re.compile(WORD_PATTERN.pattern, re.IGNORECASE)

PARTIES = ("AfD", "CDU/CSU", "SPD", "GRÜNE", "DIE LINKE")
MIN_CONSISTENT_PARTIES = 4
MIN_WORD_COUNT = 40
MIN_WORD_SPEAKERS = 25
MIN_WORD_RATE = 1.0
NOUN_CAPITALISED_SHARE = 0.9
WORDS_PER_SIDE = 6

# Forms of address and procedure: they say who is speaking to whom, not what
# about, and would otherwise top both lists.
ADDRESS_WORDS = frozenset({
    "damen", "herren", "herr", "herrn", "frau", "kolleginnen", "kollegen", "kollegin", "kollege",
    "präsidentin", "präsident", "abgeordnete", "abgeordneten", "abgeordneter", "redner", "rednerin",
})

# Same word → topic rule as the topic analysis: a later lexicon wins.
TOPIC_BY_WORD: dict[str, str] = {word: topic.value for topic, words in TOPIC_LEXICONS.items() for word in words}

Rates = dict[str, dict[str, float]]  # party -> gender -> raw rate per 10k


def _tokens_by_group(speeches: list[dict[str, Any]], detector: GenderDetector):
    """Per-speech tokens with party and gender; speeches that cannot be placed are dropped."""
    rows = []
    for speech in speeches:
        party = str(speech.get("party") or "")
        if party not in PARTIES:
            continue
        gender = detector.detect_speaker(str(speech.get("first_name") or ""), str(speech.get("last_name") or "")).gender
        if gender not in ("male", "female"):
            continue
        original = CASED_WORD_PATTERN.findall(str(speech.get("text", "")))
        rows.append((speech, party, gender, original))
    return rows


def _standardise(counts: dict[tuple[str, str], float], tokens: dict[tuple[str, str], int]) -> dict[str, Any]:
    """Standardised rates, factor, side and per-party rows for one term."""
    party_tokens = {p: tokens[(p, "male")] + tokens[(p, "female")] for p in PARTIES}
    total = sum(party_tokens.values())
    rate = {"male": 0.0, "female": 0.0}
    raw: Rates = {}
    for party in PARTIES:
        raw[party] = {}
        for gender in ("male", "female"):
            n = tokens[(party, gender)]
            share = counts.get((party, gender), 0) / n if n else 0.0
            raw[party][gender] = share * 10000
            rate[gender] += party_tokens[party] / total * share
    rate = {g: v * 10000 for g, v in rate.items()}
    if min(rate.values()) <= 0:
        return {"usable": False, "rate": rate, "raw": raw}
    side = "female" if rate["female"] >= rate["male"] else "male"
    other = "male" if side == "female" else "female"
    consistent = sum(1 for p in PARTIES if raw[p][side] > raw[p][other])
    female = round(100 * rate["female"] / (rate["female"] + rate["male"]))
    return {
        "usable": True, "rate": rate, "raw": raw, "side": side, "factor": rate[side] / rate[other],
        "consistent": consistent, "split": {"male": 100 - female, "female": female},
    }


def _duel(term: str, result: dict[str, Any]) -> dict[str, Any] | None:
    if not result["usable"] or result["consistent"] < MIN_CONSISTENT_PARTIES:
        return None
    return {
        "term": term,
        "answer": result["side"],
        "split": result["split"],
        "factor": round(result["factor"], 2),
        "consistentParties": result["consistent"],
        "totalParties": len(PARTIES),
        "parties": [
            {"party": p, "male": round(result["raw"][p]["male"], 2), "female": round(result["raw"][p]["female"], 2)}
            for p in PARTIES
        ],
    }


def build_gender_check(speeches: list[dict[str, Any]], config: dict[str, Any], stopwords: set[str]) -> dict[str, Any] | None:
    """Gender-check section for wrapped.json, or None when a duel is not usable."""
    word = str(config["word"])
    topic = str(config["topic"])
    if topic not in {t.value for t in TOPIC_LEXICONS}:
        raise ValueError(f"unknown topic {topic!r}")
    formal = [s for s in _deduplicate_protocols(speeches) if s.get("category") == "rede"]
    rows = _tokens_by_group(formal, GenderDetector())
    if not rows:
        return None

    tokens: Counter[tuple[str, str]] = Counter()
    word_counts: Counter[tuple[str, str]] = Counter()
    topic_counts: dict[str, Counter[tuple[str, str]]] = defaultdict(Counter)
    uses: Counter[str] = Counter()  # per lowercase token, all occurrences
    capitalised: Counter[str] = Counter()
    written: dict[str, Counter[str]] = defaultdict(Counter)
    group_counts: dict[str, Counter[tuple[str, str]]] = defaultdict(Counter)
    speakers: dict[str, dict[str, set[str]]] = defaultdict(lambda: {"male": set(), "female": set()})
    top_speaker: dict[str, Counter[tuple[str, str]]] = {"male": Counter(), "female": Counter()}
    speeches_by_gender = Counter()
    target = word.lower()

    for speech, party, gender, found in rows:
        speeches_by_gender[gender] += 1
        key = (party, gender)
        name = str(speech.get("speaker") or "")
        tokens[key] += len(found)
        for raw in found:
            low = raw.lower()
            if low == target:
                word_counts[key] += 1
                top_speaker[gender][(name, party)] += 1
            area = TOPIC_BY_WORD.get(low)
            if area:
                topic_counts[area][key] += 1
            uses[low] += 1
            if raw[:1].isupper():
                capitalised[low] += 1
            group_counts[low][key] += 1
            speakers[low][gender].add(name)
            written[low][raw] += 1

    if not all(tokens[(p, g)] for p in PARTIES for g in ("male", "female")):
        return None

    word_result = _standardise(word_counts, tokens)
    word_duel = _duel(word, word_result)
    topic_duel = _duel(topic, _standardise(topic_counts[topic], tokens))
    if not word_duel or not topic_duel:
        return None
    (name, party), count = top_speaker[word_duel["answer"]].most_common(1)[0]
    word_duel["topSpeaker"] = {"name": name, "party": party, "count": count}

    topics = []
    for area in sorted(topic_counts):
        result = _standardise(topic_counts[area], tokens)
        if result["usable"]:
            topics.append({
                "topic": area, "side": result["side"], "factor": round(result["factor"], 2),
                "consistentParties": result["consistent"], "_sort": math.log(result["rate"]["female"] / result["rate"]["male"]),
            })
    topics.sort(key=lambda t: (-t["_sort"], t["topic"]))
    for t in topics:
        del t["_sort"]

    excluded = {w.casefold() for w in stopwords} | ADDRESS_WORDS
    candidates: dict[str, list[dict[str, Any]]] = {"male": [], "female": []}
    for low, total in uses.items():
        if total < MIN_WORD_COUNT or low in excluded or low.startswith(target) or capitalised[low] / total < NOUN_CAPITALISED_SHARE:
            continue
        result = _standardise(group_counts[low], tokens)
        if not result["usable"]:
            continue
        side = result["side"]
        if (
            len(speakers[low][side]) < MIN_WORD_SPEAKERS
            or result["rate"][side] < MIN_WORD_RATE
            or result["consistent"] < MIN_CONSISTENT_PARTIES
        ):
            continue
        display = max(written[low].items(), key=lambda i: (i[1], i[0]))[0]
        candidates[side].append({
            "word": display, "factor": round(result["factor"], 1),
            "consistentParties": result["consistent"], "count": total, "_f": result["factor"],
        })
    words: dict[str, list[dict[str, Any]]] = {}
    for side, items in candidates.items():
        items.sort(key=lambda i: (-i["_f"], i["word"]))
        words[side] = [{k: v for k, v in i.items() if k != "_f"} for i in items[:WORDS_PER_SIDE]]

    return {
        "speeches": {"male": speeches_by_gender["male"], "female": speeches_by_gender["female"]},
        "totalParties": len(PARTIES),
        "wordDuel": word_duel,
        "topicDuel": topic_duel,
        "topics": topics,
        "words": words,
    }
