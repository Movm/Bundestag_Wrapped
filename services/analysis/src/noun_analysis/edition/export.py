"""Atomic, validated export of a versioned Wrapped edition."""

from __future__ import annotations

import hashlib
import json
import shutil
from datetime import date
from pathlib import Path
from tempfile import mkdtemp
from typing import Any

from .validate import ContractValidationError, validate_contract_document


class EditionValidationError(ValueError):
    """Raised when an edition is incomplete or internally inconsistent."""


def _json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _checksum(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _all_files(root: Path) -> list[Path]:
    return sorted(path for path in root.rglob("*") if path.is_file() and path.name != "checksums.json")


def _validate_checksums(root: Path, checksums: dict[str, str]) -> None:
    expected_paths = {path.relative_to(root).as_posix() for path in _all_files(root)}
    normalized_paths: set[str] = set()
    for relative, expected in checksums.items():
        candidate = Path(relative)
        if candidate.is_absolute() or ".." in candidate.parts or candidate.as_posix() != relative:
            raise EditionValidationError(f"invalid checksum path: {relative}")
        if relative in normalized_paths:
            raise EditionValidationError(f"duplicate checksum target: {relative}")
        normalized_paths.add(relative)
        if not isinstance(expected, str) or len(expected) != 64 or any(char not in "0123456789abcdefABCDEF" for char in expected):
            raise EditionValidationError(f"invalid checksum: {relative}")
    missing = expected_paths - set(checksums)
    extra = set(checksums) - expected_paths
    if missing:
        raise EditionValidationError(f"checksums.json missing file: {sorted(missing)[0]}")
    if extra:
        raise EditionValidationError(f"checksums.json references unexpected file: {sorted(extra)[0]}")
    for relative, expected in checksums.items():
        path = root / relative
        if not path.is_file():
            raise EditionValidationError(f"checksums.json references missing file: {relative}")
        if _checksum(path) != expected:
            raise EditionValidationError(f"checksum mismatch: {relative}")


def _validate_invariants(root: Path, manifest: dict[str, Any]) -> None:
    assets = manifest["assets"]
    required_assets = [*assets.values(), manifest["content"], manifest["checksums"]]
    for relative in required_assets:
        if not (root / relative).exists():
            raise EditionValidationError(f"manifest references missing asset: {relative}")

    index = _json(root / assets["speakerIndex"])
    for speaker in index.get("speakers", []):
        profile = root / assets["speakersBase"] / f"{speaker['slug']}.json"
        if not profile.is_file():
            raise EditionValidationError(f"speaker index references missing profile: {speaker['slug']}")

    speeches_payload = _json(root / assets["speeches"])
    speeches = speeches_payload.get("speeches", speeches_payload if isinstance(speeches_payload, list) else [])
    dates = sorted({speech.get("protocolDate") for speech in speeches if speech.get("protocolDate")})
    coverage = manifest["coverage"]
    if len({speech.get("protocolId") for speech in speeches if speech.get("protocolId") is not None}) != coverage["protocolCount"]:
        raise EditionValidationError("coverage protocolCount does not match exported speeches")
    if dates and (dates[0] != coverage["firstProtocolDate"] or dates[-1] != coverage["lastProtocolDate"]):
        raise EditionValidationError("coverage dates do not match exported speeches")
    period = manifest["period"]
    if any(protocol_date < period["start"] or protocol_date > period["end"] for protocol_date in dates):
        raise EditionValidationError("a speech is outside the edition period")


def validate_edition(root: Path) -> None:
    """Validate contract documents, checksums, and cross-file invariants."""
    manifest_path = root / "manifest.json"
    wrapped_path = root / "wrapped.json"
    if not manifest_path.is_file() or not wrapped_path.is_file():
        raise EditionValidationError("edition must contain manifest.json and wrapped.json")
    manifest = _json(manifest_path)
    try:
        validate_contract_document(manifest, "EditionManifest", str(manifest_path))
        validate_contract_document(_json(wrapped_path), "WrappedData", str(wrapped_path))
    except ContractValidationError as error:
        raise EditionValidationError(str(error)) from error
    checksums = _json(root / manifest["checksums"])
    if not isinstance(checksums, dict):
        raise EditionValidationError("checksums.json must be an object")
    _validate_checksums(root, checksums)
    _validate_invariants(root, manifest)


def publish_edition(
    output_root: Path,
    edition_id: str,
    data_version: str,
    manifest: dict[str, Any],
    artifacts: dict[str, Any],
) -> Path:
    """Write, validate, and atomically publish one immutable edition directory."""
    target = output_root / edition_id / data_version
    if target.exists():
        raise EditionValidationError(f"edition output already exists: {target}")
    output_root.mkdir(parents=True, exist_ok=True)
    stage = Path(mkdtemp(prefix=f".{edition_id}-{data_version}-", dir=output_root))
    try:
        for relative, payload in artifacts.items():
            _write_json(stage / relative, payload)
        _write_json(stage / "manifest.json", manifest)
        checksums = {path.relative_to(stage).as_posix(): _checksum(path) for path in _all_files(stage)}
        _write_json(stage / manifest["checksums"], checksums)
        validate_edition(stage)
        target.parent.mkdir(parents=True, exist_ok=True)
        stage.replace(target)
        return target
    except Exception:
        shutil.rmtree(stage, ignore_errors=True)
        raise


def build_manifest(
    edition_id: str,
    year: int,
    data_version: str,
    generated_at: str,
    period_start: str,
    period_end: str,
    wahlperioden: list[int],
    speeches: list[dict[str, Any]],
    frozen: bool,
) -> dict[str, Any]:
    """Build a manifest from already date-filtered speech metadata."""
    protocol_dates = sorted({speech["protocolDate"] for speech in speeches})
    if not protocol_dates:
        raise EditionValidationError("cannot export an edition without dated speeches")
    if any(date.fromisoformat(value) < date.fromisoformat(period_start) or date.fromisoformat(value) > date.fromisoformat(period_end) for value in protocol_dates):
        raise EditionValidationError("input contains speeches outside the requested period")
    return {
        "schemaVersion": 1,
        "editionId": edition_id,
        "year": year,
        "title": f"Bundestag Wrapped {year}",
        "status": "frozen" if frozen else "preview",
        "period": {"start": period_start, "end": period_end, "timezone": "Europe/Berlin", "wahlperioden": sorted(set(wahlperioden))},
        "dataVersion": data_version,
        "generatedAt": generated_at,
        "coverage": {"protocolCount": len({speech["protocolId"] for speech in speeches}), "firstProtocolDate": protocol_dates[0], "lastProtocolDate": protocol_dates[-1], "complete": frozen},
        "assets": {"wrapped": "wrapped.json", "speakerIndex": "speakers/index.json", "speakersBase": "speakers", "speeches": "speeches.json", "words": "words.json", "wordRankings": "word_rankings.json", "topicRankings": "topic_rankings.json"},
        "content": "content.json",
        "checksums": "checksums.json",
    }
