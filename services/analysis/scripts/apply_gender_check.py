"""Add the Männer-gegen-Frauen section to an already exported edition.

Runs the same ``build_gender_check`` as ``generate-edition --gender-check`` on the
edition's own speeches.json, so a shipped preview gets the section without a
new download. It also adds the groups ``quiz-gender-word`` and ``quiz-gender-topic`` to content.json (from the
edition's quiz config), refreshes the release report's quiz plan and input
fingerprint, rewrites checksums.json and validates the result.

    python scripts/apply_gender_check.py \\
      --edition ../../apps/wrapped/public/data/2026/preview-2026-11-10-match \\
      --config ../../apps/wrapped/config/2026/gender-check.json \\
      --quiz-config ../../apps/wrapped/config/2026/quiz.json \\
      --signature-config ../../apps/wrapped/config/signature-words.json \\
      --signature-config ../../apps/wrapped/config/2026/signature-words.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from noun_analysis.analyzer import WordAnalyzer
from noun_analysis.edition.gender_check import build_gender_check
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
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--quiz-config", type=Path, required=True)
    parser.add_argument("--signature-config", type=Path, action="append", default=[])
    args = parser.parse_args()

    root: Path = args.edition
    manifest = _read(root / "manifest.json")
    wrapped = _read(root / manifest["assets"]["wrapped"])
    section = build_gender_check(_speeches(root / manifest["assets"]["speeches"]), _read(args.config), _stopwords(args.signature_config))
    if section is None:
        raise SystemExit("gender check is not usable: a duel has fewer than 4 consistent parties (or no data); edition left untouched")
    # Sorted like the exporter writes it, but without re-sorting keys that an
    # earlier patch left out of order, so the diff shows only the new section.
    wrapped["genderCheck"] = json.loads(json.dumps(section, sort_keys=True))
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
    print(f"genderCheck written to {root / manifest['assets']['wrapped']}")


if __name__ == "__main__":
    main()
