"""Who talked about a named moment of the year (e.g. "Timmy der Wal")."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

from noun_analysis.edition.comparison import _deduplicate_protocols, _term_pattern

_QUOTE_MAX_CHARS = 240
_SENTENCE_END = re.compile(r"[.!?](?=\s|$)")


def _config(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    mentions = payload.get("mentions") if isinstance(payload, dict) else None
    if not isinstance(payload.get("version"), str) or not isinstance(mentions, list) or not mentions:
        raise ValueError("mentions config requires a version and a non-empty mentions array")
    seen: set[str] = set()
    normalized: list[dict[str, Any]] = []
    for item in mentions:
        mention_id, label, aliases = item.get("id"), item.get("label"), item.get("aliases")
        if not isinstance(mention_id, str) or not re.fullmatch(r"[a-z0-9-]+", mention_id):
            raise ValueError(f"mention id must be lowercase kebab-case: {mention_id!r}")
        if mention_id in seen:
            raise ValueError(f"duplicate mention id: {mention_id}")
        if not isinstance(label, str) or not label.strip():
            raise ValueError(f"mention {mention_id!r} requires a label")
        if not isinstance(aliases, list) or not aliases or not all(isinstance(a, str) and a.strip() for a in aliases):
            raise ValueError(f"mention {mention_id!r} requires non-empty aliases")
        background = item.get("background", [])
        if not isinstance(background, list) or not all(isinstance(line, str) and line.strip() for line in background):
            raise ValueError(f"mention {mention_id!r} has an invalid background")
        source = item.get("source")
        if source is not None and (not isinstance(source, str) or not source.strip()):
            raise ValueError(f"mention {mention_id!r} has an invalid source")
        seen.add(mention_id)
        normalized.append({
            "source": source.strip() if source else None,
            "id": mention_id,
            "label": label.strip(),
            "background": [line.strip() for line in background],
            "patterns": [_term_pattern(alias.strip().casefold()) for alias in aliases],
        })
    return normalized


def _sentence(text: str, start: int, end: int) -> str:
    """The sentence around one match, shortened around the match if it is long."""
    before = [m.end() for m in _SENTENCE_END.finditer(text, 0, start)]
    left = before[-1] if before else 0
    after = _SENTENCE_END.search(text, end)
    right = after.end() if after else len(text)
    sentence = " ".join(text[left:right].split()).lstrip("-–— ")
    if len(sentence) <= _QUOTE_MAX_CHARS:
        return sentence
    offset = len(" ".join(text[left:start].split()).lstrip("-–— "))
    begin = max(0, min(offset - _QUOTE_MAX_CHARS // 2, len(sentence) - _QUOTE_MAX_CHARS))
    excerpt = sentence[begin:begin + _QUOTE_MAX_CHARS].strip()
    return ("… " if begin else "") + excerpt + (" …" if begin + _QUOTE_MAX_CHARS < len(sentence) else "")


def build_mentions(speeches: list[dict[str, Any]], config_path: Path) -> list[dict[str, Any]]:
    """Count each configured mention per speaker, with the first quote of each."""
    results: list[dict[str, Any]] = []
    ordered = sorted(
        _deduplicate_protocols(speeches),
        key=lambda speech: (str(speech.get("protocolDate", "")), str(speech.get("speechPosition", ""))),
    )
    for mention in _config(config_path):
        counts: Counter[tuple[str, str]] = Counter()
        first: dict[tuple[str, str], dict[str, str]] = {}
        for speech in ordered:
            text, speaker, party = speech.get("text"), speech.get("speaker"), speech.get("party")
            if not (isinstance(text, str) and isinstance(speaker, str) and speaker and isinstance(party, str) and party):
                continue
            matches = sorted(
                (match for pattern in mention["patterns"] for match in pattern.finditer(text)),
                key=lambda match: match.start(),
            )
            if not matches:
                continue
            key = (speaker, party)
            counts[key] += len(matches)
            if key not in first:
                first[key] = {
                    "date": str(speech.get("protocolDate", "")),
                    "quote": _sentence(text, matches[0].start(), matches[0].end()),
                }
        if not counts:
            continue
        speakers = [
            {"name": name, "party": party, "count": count, **first[(name, party)]}
            for (name, party), count in sorted(counts.items(), key=lambda item: (-item[1], item[0][0], item[0][1]))
        ]
        results.append({
            "id": mention["id"],
            "label": mention["label"],
            "count": sum(counts.values()),
            "speakers": speakers,
            **({"background": mention["background"]} if mention["background"] else {}),
            **({"source": mention["source"]} if mention["source"] else {}),
        })
    return results
