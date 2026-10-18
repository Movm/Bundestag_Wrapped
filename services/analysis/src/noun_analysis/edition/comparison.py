"""Build evidence-backed year-over-year metrics for Wrapped editions."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any


def _json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _rank_movements(current: list[str], previous: list[str]) -> list[dict[str, Any]]:
    previous_ranks = {label.casefold(): index for index, label in enumerate(previous, start=1)}
    missing_rank = len(previous) + 1
    movements = []
    for current_rank, label in enumerate(current, start=1):
        previous_rank = previous_ranks.get(label.casefold())
        movements.append({
            "label": label,
            "currentRank": current_rank,
            "previousRank": previous_rank,
            # Positive values always mean that the item moved up.
            "rankChange": (previous_rank or missing_rank) - current_rank,
        })
    return sorted(movements, key=lambda item: (-item["rankChange"], item["currentRank"], item["label"]))


def _signature_word_movements(
    current_parties: list[dict[str, Any]],
    previous_parties: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Compare party signature-word Top 5 lists, including entries and exits."""
    previous_by_party = {item.get("party"): item for item in previous_parties}
    comparisons = []
    for party in current_parties:
        party_name = party.get("party")
        if not isinstance(party_name, str) or not party_name or party_name == "fraktionslos":
            continue
        current_words = [item.get("word") for item in party.get("signatureWords", []) if isinstance(item.get("word"), str)]
        previous_words = [
            item.get("word")
            for item in previous_by_party.get(party_name, {}).get("signatureWords", [])
            if isinstance(item.get("word"), str)
        ]
        current_ranks = {word.casefold(): rank for rank, word in enumerate(current_words, start=1)}
        previous_ranks = {word.casefold(): rank for rank, word in enumerate(previous_words, start=1)}

        risers = []
        for word in current_words:
            current_rank = current_ranks[word.casefold()]
            previous_rank = previous_ranks.get(word.casefold())
            if previous_rank is None or previous_rank > current_rank:
                risers.append({"word": word, "currentRank": current_rank, "previousRank": previous_rank})

        fallers = []
        for word in previous_words:
            previous_rank = previous_ranks[word.casefold()]
            current_rank = current_ranks.get(word.casefold())
            if current_rank is None or current_rank > previous_rank:
                fallers.append({"word": word, "currentRank": current_rank, "previousRank": previous_rank})

        comparisons.append({"party": party_name, "risers": risers, "fallers": fallers})
    return comparisons


def _speeches(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get("speeches"), list):
        return payload["speeches"]
    raise ValueError("comparison speeches.json must contain a speeches array")


def _lexicon(path: Path) -> tuple[str, list[dict[str, Any]]]:
    payload = _json(path)
    version = payload.get("version")
    terms = payload.get("terms")
    if not isinstance(version, str) or not version.strip():
        raise ValueError("youth-word lexicon requires a non-empty version")
    if not isinstance(terms, list):
        raise ValueError("youth-word lexicon requires a terms array")
    normalized: list[dict[str, Any]] = []
    seen: set[str] = set()
    for value in terms:
        if isinstance(value, str) and value.strip():
            value = {"word": value, "aliases": [value]}
        if not isinstance(value, dict):
            raise ValueError("youth-word lexicon terms must be strings or objects")
        word = value.get("word")
        aliases = value.get("aliases", [word])
        include_contexts = value.get("includeContexts", [])
        exclude_contexts = value.get("excludeContexts", [])
        if not isinstance(word, str) or not word.strip():
            raise ValueError("each youth-word term requires a non-empty word")
        if not isinstance(aliases, list) or not aliases or not all(isinstance(alias, str) and alias.strip() for alias in aliases):
            raise ValueError(f"youth-word term {word!r} requires non-empty aliases")
        if not all(isinstance(pattern, str) and pattern for pattern in include_contexts + exclude_contexts):
            raise ValueError(f"youth-word term {word!r} has invalid context patterns")
        key = word.strip().casefold()
        if key in seen:
            raise ValueError(f"duplicate youth-word term: {word}")
        seen.add(key)
        normalized.append({
            "word": key,
            "aliases": list(dict.fromkeys(alias.strip().casefold() for alias in aliases)),
            "includeContexts": include_contexts,
            "excludeContexts": exclude_contexts,
        })
    if len(normalized) < 4:
        raise ValueError("youth-word lexicon requires at least four distinct terms")
    return version, normalized


def _term_pattern(term: str) -> re.Pattern[str]:
    pieces = [re.escape(piece) for piece in term.split()]
    return re.compile(r"(?<![\w-])" + r"\s+".join(pieces) + r"(?![\w-])", re.IGNORECASE)


def _deduplicate_protocols(speeches: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Drop a protocol only when its complete ordered speech payload is duplicated."""
    by_protocol: dict[Any, list[dict[str, Any]]] = {}
    ungrouped: list[dict[str, Any]] = []
    for speech in speeches:
        protocol_id = speech.get("protocolId")
        if protocol_id is None:
            ungrouped.append(speech)
        else:
            by_protocol.setdefault(protocol_id, []).append(speech)

    unique = list(ungrouped)
    seen_payloads: set[tuple[tuple[Any, ...], ...]] = set()
    for protocol_speeches in by_protocol.values():
        signature = tuple(
            (
                speech.get("speechPosition"),
                speech.get("speaker"),
                speech.get("party"),
                speech.get("text"),
            )
            for speech in sorted(protocol_speeches, key=lambda item: str(item.get("speechPosition", "")))
        )
        if signature in seen_payloads:
            continue
        seen_payloads.add(signature)
        unique.extend(protocol_speeches)
    return unique


def _contextual_count(text: str, term: dict[str, Any]) -> int:
    include = [re.compile(pattern, re.IGNORECASE) for pattern in term["includeContexts"]]
    exclude = [re.compile(pattern, re.IGNORECASE) for pattern in term["excludeContexts"]]
    count = 0
    for alias in term["aliases"]:
        for match in _term_pattern(alias).finditer(text):
            window = text[max(0, match.start() - 90):min(len(text), match.end() + 130)]
            if include and not any(pattern.search(window) for pattern in include):
                continue
            if any(pattern.search(window) for pattern in exclude):
                continue
            count += 1
    return count


def _youth_counts(
    speeches: list[dict[str, Any]],
    terms: list[dict[str, Any]],
) -> tuple[Counter[str], Counter[str], Counter[tuple[str, str]]]:
    words: Counter[str] = Counter()
    parties: Counter[str] = Counter()
    speakers: Counter[tuple[str, str]] = Counter()
    for speech in _deduplicate_protocols(speeches):
        text = speech.get("text")
        party = speech.get("party")
        speaker = speech.get("speaker")
        if not isinstance(text, str):
            continue
        for term in terms:
            count = _contextual_count(text, term)
            if not count:
                continue
            word = term["word"]
            words[word] += count
            if isinstance(party, str) and party:
                parties[party] += count
            if isinstance(speaker, str) and speaker and isinstance(party, str) and party:
                speakers[(speaker, party)] += count
    return words, parties, speakers


def build_year_over_year(
    current_wrapped: dict[str, Any],
    current_speeches: list[dict[str, Any]],
    baseline_root: Path,
    youth_words_path: Path,
) -> dict[str, Any]:
    """Compare one edition with a validated prior edition on stable metrics."""
    baseline_manifest = _json(baseline_root / "manifest.json")
    baseline_wrapped = _json(baseline_root / "wrapped.json")
    baseline_speeches = _speeches(_json(baseline_root / "speeches.json"))
    lexicon_version, terms = _lexicon(youth_words_path)

    current_topics = [item["topic"] for item in (current_wrapped.get("topicAnalysis") or {}).get("topTopics", [])]
    baseline_topics = [item["topic"] for item in (baseline_wrapped.get("topicAnalysis") or {}).get("topTopics", [])]
    current_words = current_wrapped.get("hotTopics", [])
    baseline_words = baseline_wrapped.get("hotTopics", [])

    youth_current, party_current, speaker_current = _youth_counts(current_speeches, terms)
    youth_previous, _, _ = _youth_counts(baseline_speeches, terms)
    youth_words = [{
        "word": term["word"],
        "count": youth_current[term["word"]],
        "previousCount": youth_previous[term["word"]],
        "change": youth_current[term["word"]] - youth_previous[term["word"]],
    } for term in terms]
    youth_words.sort(key=lambda item: (-item["count"], -item["change"], item["word"]))

    return {
        "baseline": {
            "editionId": baseline_manifest["editionId"],
            "start": baseline_manifest["period"]["start"],
            "end": baseline_manifest["period"]["end"],
        },
        "topics": _rank_movements(current_topics, baseline_topics),
        "words": _rank_movements(current_words, baseline_words),
        "signatureWords": _signature_word_movements(
            current_wrapped.get("parties", []),
            baseline_wrapped.get("parties", []),
        ),
        "youthLanguage": {
            "lexiconVersion": lexicon_version,
            "words": youth_words,
            "byParty": [
                {"party": party, "count": count}
                for party, count in sorted(party_current.items(), key=lambda item: (-item[1], item[0]))
            ],
            "bySpeaker": [
                {"name": name, "party": party, "count": count}
                for (name, party), count in sorted(
                    speaker_current.items(),
                    key=lambda item: (-item[1], item[0][0], item[0][1]),
                )
            ],
        },
    }
