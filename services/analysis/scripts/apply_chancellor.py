"""Add the Innen-/Außenkanzler section to an already exported edition.

Runs the same ``build_chancellor`` as ``generate-edition --chancellor`` on the
edition's own speeches.json, so a shipped preview gets the section without a
new download. It also adds ``quiz-chancellor`` to content.json (from the
edition's quiz config), refreshes the release report's quiz plan and input
fingerprint, rewrites checksums.json and validates the result.

The prior-year comparison reads a published edition's speeches.json and keeps
only protocols inside the current edition's year-over-year baseline period, so
it covers the same span as ``--compare-with`` would.

    python scripts/apply_chancellor.py \\
      --edition ../../apps/wrapped/public/data/2026/preview-2026-11-10-match \\
      --name "Friedrich Merz" \\
      --quiz-config ../../apps/wrapped/config/2026/quiz.json \\
      --previous ../../apps/wrapped/public/data/2025/final \\
      --signature-config ../../apps/wrapped/config/signature-words.json \\
      --signature-config ../../apps/wrapped/config/2026/signature-words.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from noun_analysis.analyzer import WordAnalyzer
from noun_analysis.edition.chancellor import build_chancellor
from noun_analysis.edition.export import COMPACT_ARTIFACTS, _all_files, _checksum, _write_json, validate_edition
from noun_analysis.edition.release import BUILT_IN_QUIZ_GROUPS, RELEASE_REPORT, _canonical_digest


def _read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _speeches(path: Path) -> list[dict]:
    payload = _read(path)
    return payload["speeches"] if isinstance(payload, dict) else payload


def _stopwords(paths: list[Path]) -> set[str]:
    words = set(WordAnalyzer.STOPWORD_GENERIC)
    for path in paths:
        words |= {word.strip().casefold() for word in _read(path)["excludedWords"]}
    return words


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--edition", type=Path, required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--quiz-config", type=Path, required=True)
    parser.add_argument("--previous", type=Path, help="Published prior edition directory")
    parser.add_argument("--signature-config", type=Path, action="append", default=[])
    args = parser.parse_args()

    root: Path = args.edition
    manifest = _read(root / "manifest.json")
    wrapped = _read(root / manifest["assets"]["wrapped"])
    previous = None
    if args.previous:
        baseline = (wrapped.get("yearOverYear") or {}).get("baseline")
        if not baseline:
            raise SystemExit("edition has no yearOverYear baseline to match the prior period")
        prior = [
            speech for speech in _speeches(args.previous / "speeches.json")
            if baseline["start"] <= str(speech.get("protocolDate", "")) <= baseline["end"]
        ]
        previous = (int(_read(args.previous / "manifest.json")["year"]), prior)
    section = build_chancellor(_speeches(root / manifest["assets"]["speeches"]), args.name, _stopwords(args.signature_config), previous)
    if section is None:
        raise SystemExit(f"{args.name} has no contributions as chancellor in this edition")
    # Sorted like the exporter writes it, but without re-sorting keys that an
    # earlier patch left out of order, so the diff shows only the new section.
    wrapped["chancellor"] = json.loads(json.dumps(section, sort_keys=True))
    wrapped = dict(sorted(wrapped.items()))
    (root / manifest["assets"]["wrapped"]).write_text(json.dumps(wrapped, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    content = _read(root / manifest["content"])
    content["quiz"] = _read(args.quiz_config)
    _write_json(root / manifest["content"], content)

    report = _read(root / RELEASE_REPORT)
    active = [group["id"] for group in content["quiz"]["groups"]]
    report["quiz"]["activeQuestionIds"] = active
    report["quiz"]["omittedGroups"] = [{"id": group, "reason": "not_configured"} for group in BUILT_IN_QUIZ_GROUPS if group not in active]
    source = report.get("source") or {}
    report["inputFingerprint"] = _canonical_digest({"content": content, "source": source.get("selection"), "protocols": source.get("protocols", [])})
    _write_json(root / RELEASE_REPORT, report, compact=RELEASE_REPORT in COMPACT_ARTIFACTS)

    checksums = {path.relative_to(root).as_posix(): _checksum(path) for path in _all_files(root)}
    _write_json(root / manifest["checksums"], checksums)
    validate_edition(root)
    print(json.dumps({key: section[key] for key in ("contributions", "foreignShare", "chamberForeignShare")} | {"previous": section.get("previous")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
