"""Innen- oder Außenkanzler? How the chancellor's own words split between
domestic and foreign policy, and which words set him apart.

What is counted: every contribution the chancellor made in that role
(``is_government``), i.e. his speeches (Regierungserklärungen and other
debates) and his answers in the Befragung der Bundesregierung. Interjections
are not part of the speech data, so they never count.

Topics use the same lexicons and the same tokens as the edition's topic
analysis (``wrapped/export.py``): every 4+ letter word that is in a topic
lexicon counts once for its topic. Each topic word is then put on one side:

* außen: the whole "europa" lexicon (EU, Außenpolitik, Ukraine/Russland,
  other countries, international organisations, diplomacy), plus two areas
  split out of other lexicons: defence ("verteidigung", from "sicherheit")
  and foreign trade ("aussenhandel", from "wirtschaft").
* innen: everything else (Wirtschaft, Soziales, Finanzen, Migration, innere
  Sicherheit, Klima, …).

Ambiguous on purpose and decided here: the EU is counted as außen although
much EU law is domestic policy; defence (Bundeswehr, NATO) as außen; migration
and border control as innen; "handel" alone stays innen because it also means
retail. The share is the foreign topic words over all topic words, compared
with every other contribution in the same edition ("restlicher Bundestag").
"""

from __future__ import annotations

import re
from collections import Counter
from typing import Any

from noun_analysis.edition.comparison import _deduplicate_protocols
from noun_analysis.lexicons import TOPIC_LEXICONS
from noun_analysis.wrapped.speaker_export.constants import WORD_PATTERN
from noun_analysis.stopwords import is_content_word
from noun_analysis.wrapped.speaker_export.signature_scoring import MIN_Z_SCORE, log_odds_score

FOREIGN_TOPICS = frozenset({"europa"})
DEFENCE_WORDS = frozenset({
    "bundeswehr", "soldat", "soldaten", "soldatin", "streitkräfte", "verteidigung",
    "verteidigungsetat", "militär", "armee", "rüstung", "waffen", "waffenlieferung",
    "panzer", "kampfjet", "nato", "bündnisfall", "abschreckung", "verteidigungsfähigkeit",
})
TRADE_WORDS = frozenset({
    "export", "exporte", "import", "importe", "außenhandel", "handelsabkommen",
    "freihandel", "zoll", "zölle", "handelspartner", "handelsbeziehungen",
})
FOREIGN_AREAS = FOREIGN_TOPICS | {"verteidigung", "aussenhandel"}

# Hot words: capitalised words (German nouns and names) not at a sentence start.
NOUN_PATTERN = re.compile(r"[A-ZÄÖÜ][a-zäöüß]{4,}\b")
# Capitalised adjectives inside names ("Europäischen Union", "Amerikanischen …") are not nouns.
NAME_ADJECTIVE = re.compile(r"isch(?:e|en|er|es|em)$")
MIN_HOT_WORD_COUNT = 8
MIN_HOT_WORD_CONTRIBUTIONS = 3  # A recurring word, not one speech's subject.
HOT_WORD_LIMIT = 8
TOP_WORD_LIMIT = 5


def _area_by_word() -> dict[str, str]:
    """Word → area. Same precedence as the topic analysis (a later lexicon wins)."""
    areas: dict[str, str] = {}
    for topic, words in TOPIC_LEXICONS.items():
        for word in words:
            areas[word] = topic.value
    for word, area in list(areas.items()):
        if area == "sicherheit" and word in DEFENCE_WORDS:
            areas[word] = "verteidigung"
        elif area == "wirtschaft" and word in TRADE_WORDS:
            areas[word] = "aussenhandel"
    return areas


AREA_BY_WORD = _area_by_word()


def side_of(area: str) -> str:
    return "aussen" if area in FOREIGN_AREAS else "innen"


def _topic_counts(speeches: list[dict[str, Any]]) -> tuple[Counter[str], Counter[str], int]:
    """Hits per area, hits per lexicon word, and all counted tokens."""
    areas: Counter[str] = Counter()
    words: Counter[str] = Counter()
    tokens = 0
    for speech in speeches:
        found = WORD_PATTERN.findall(str(speech.get("text", "")).lower())
        tokens += len(found)
        for word in found:
            area = AREA_BY_WORD.get(word)
            if area:
                areas[area] += 1
                words[word] += 1
    return areas, words, tokens


def _foreign_share(areas: Counter[str]) -> float:
    total = sum(areas.values())
    return round(100 * sum(c for a, c in areas.items() if a in FOREIGN_AREAS) / total, 1) if total else 0.0


def _nouns(text: str) -> list[str]:
    nouns = []
    for match in NOUN_PATTERN.finditer(text):
        start = match.start()
        if start and (text[start - 1].isalnum() or text[start - 1] == "-"):
            continue
        before = text[:start].rstrip(" „“\"'(")
        if not before or before[-1] in ".!?:":
            continue  # Sentence starts are capitalised whatever the word is.
        word = match.group().lower()
        if NAME_ADJECTIVE.search(word):
            continue
        nouns.append(word)
    return nouns


def _hot_words(own: list[dict[str, Any]], others: list[dict[str, Any]], stopwords: set[str]) -> list[dict[str, Any]]:
    """Nouns the chancellor uses distinctly more often than the rest of the chamber."""
    names = {str(s.get("last_name") or "").lower() for s in own + others}
    excluded = stopwords | names

    def count(speeches: list[dict[str, Any]]) -> tuple[Counter[str], dict[str, int]]:
        counts: Counter[str] = Counter()
        spread: Counter[str] = Counter()
        for speech in speeches:
            # Same filters as the signature words: shared stopwords plus the configured exclusions.
            nouns = [w for w in _nouns(str(speech.get("text", ""))) if w not in excluded and is_content_word(w)]
            counts.update(nouns)
            spread.update(set(nouns))
        return counts, spread

    own_counts, spread = count(own)
    other_counts, _ = count(others)
    own_total, other_total = sum(own_counts.values()), sum(other_counts.values())
    corpus = own_counts + other_counts
    corpus_total = own_total + other_total
    hot = []
    for word, value in own_counts.items():
        if value < MIN_HOT_WORD_COUNT or spread[word] < MIN_HOT_WORD_CONTRIBUTIONS:
            continue
        score = log_odds_score(value, own_total, other_counts[word], other_total, corpus[word], corpus_total)
        if score.z_score >= MIN_Z_SCORE and score.ratio_low >= 1.5:
            hot.append({"word": word, "count": value, "ratio": round(score.ratio_low, 1), "zScore": round(score.z_score, 2)})
    hot.sort(key=lambda item: (-item["zScore"], item["word"]))
    return hot[:HOT_WORD_LIMIT]


def _own_speeches(speeches: list[dict[str, Any]], name: str) -> list[dict[str, Any]]:
    return [s for s in speeches if s.get("speaker") == name and s.get("is_government")]


def _top_words(words: Counter[str], side: str) -> list[dict[str, Any]]:
    ranked = sorted(((w, c) for w, c in words.items() if side_of(AREA_BY_WORD[w]) == side), key=lambda i: (-i[1], i[0]))
    return [{"word": w, "count": c} for w, c in ranked[:TOP_WORD_LIMIT]]


def build_chancellor(
    speeches: list[dict[str, Any]],
    name: str,
    stopwords: set[str],
    previous: tuple[int, list[dict[str, Any]]] | None = None,
) -> dict[str, Any] | None:
    """Chancellor section for wrapped.json, or None when he did not speak in that role.

    ``previous`` is (year, speeches) of the prior edition; only his contributions
    as chancellor there are compared.
    """
    unique = _deduplicate_protocols(speeches)
    own = _own_speeches(unique, name)
    if not own:
        return None
    others = [s for s in unique if s.get("speaker") != name]
    areas, words, tokens = _topic_counts(own)
    other_areas, _, other_tokens = _topic_counts(others)
    if not tokens or not sum(areas.values()) or not other_tokens:
        return None
    party = Counter(str(s.get("party") or "") for s in own).most_common(1)[0][0]
    result: dict[str, Any] = {
        "name": name,
        "party": party,
        "contributions": len(own),
        "speeches": sum(1 for s in own if s.get("category") == "rede"),
        "answers": sum(1 for s in own if s.get("type") == "befragung"),
        "words": sum(int(s.get("words") or 0) for s in own),
        "topicWords": sum(areas.values()),
        "foreignShare": _foreign_share(areas),
        "chamberForeignShare": _foreign_share(other_areas),
        "areas": [
            {
                "id": area,
                "side": side_of(area),
                "count": count,
                "perThousand": round(count / tokens * 1000, 2),
                "chamberPerThousand": round(other_areas[area] / other_tokens * 1000, 2),
            }
            for area, count in sorted(areas.items(), key=lambda i: (-i[1], i[0]))
        ],
        "foreignWords": _top_words(words, "aussen"),
        "domesticWords": _top_words(words, "innen"),
        "hotWords": _hot_words(own, others, stopwords),
    }
    if previous:
        year, prior = previous
        prior_own = _own_speeches(_deduplicate_protocols(prior), name)
        prior_areas, _, _ = _topic_counts(prior_own)
        if sum(prior_areas.values()):
            result["previous"] = {
                "year": year,
                "contributions": len(prior_own),
                "words": sum(int(s.get("words") or 0) for s in prior_own),
                "foreignShare": _foreign_share(prior_areas),
            }
    return result
