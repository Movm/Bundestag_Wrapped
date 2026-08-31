"""Fail-closed checks used by the edition preview/freeze/publish workflow."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from .export import EditionValidationError, validate_edition
from .validate import validate_contract_document


def validate_release_input(edition_id: str, period_start: str, period_end: str, data_version: str) -> None:
    if not edition_id.isdigit() or len(edition_id) != 4:
        raise EditionValidationError("editionId must be a four digit year")
    if not data_version.strip() or any(not (char.isalnum() or char in ".-_") for char in data_version):
        raise EditionValidationError("dataVersion must contain only letters, numbers, dots, dashes, and underscores")
    start, end = date.fromisoformat(period_start), date.fromisoformat(period_end)
    if start > end or start.year != int(edition_id) or end.year != int(edition_id):
        raise EditionValidationError("release period must be within its edition year")


def require_frozen_artifact(root: Path) -> dict:
    validate_edition(root)
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    if manifest["status"] != "frozen" or not manifest["coverage"]["complete"]:
        raise EditionValidationError("publish requires a frozen artifact with complete coverage")
    return manifest


def prevent_regression(previous: dict | None, candidate: dict) -> None:
    if previous is None:
        return
    old, new = previous["coverage"], candidate["coverage"]
    if new["protocolCount"] < old["protocolCount"] or new["lastProtocolDate"] < old["lastProtocolDate"]:
        raise EditionValidationError("refusing edition coverage regression")


def validate_freeze(candidate_root: Path, previous_root: Path | None = None) -> dict:
    """Validate a complete freeze candidate and prevent coverage regression."""
    manifest = require_frozen_artifact(candidate_root)
    previous = None
    if previous_root and previous_root.is_dir():
        previous = require_frozen_artifact(previous_root)
    prevent_regression(previous, manifest)
    return manifest


def validate_freeze_against_index(candidate_root: Path, index_path: Path) -> dict:
    """Compare a replacement for the active edition with its published predecessor."""
    candidate = require_frozen_artifact(candidate_root)
    if not index_path.is_file():
        return candidate
    index = json.loads(index_path.read_text(encoding="utf-8"))
    validate_contract_document(index, "EditionsIndex", str(index_path))
    previous = next((edition for edition in index["editions"] if edition["id"] == candidate["editionId"]), None)
    if previous is not None:
        previous_root = index_path.parent.parent / previous["manifestUrl"].lstrip("/")
        validate_freeze(candidate_root, previous_root.parent)
    return candidate


def publish_in_index(index_path: Path, artifact_root: Path) -> dict:
    """Publish a frozen artifact through the small, reversible editions index."""
    manifest = require_frozen_artifact(artifact_root)
    data_root = index_path.parent
    relative_manifest = f"/{data_root.name}/" + artifact_root.relative_to(data_root).joinpath("manifest.json").as_posix()
    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
        validate_contract_document(index, "EditionsIndex", str(index_path))
    else:
        index = {"schemaVersion": 1, "currentEdition": manifest["editionId"], "editions": []}

    summary = {
        "id": manifest["editionId"],
        "year": manifest["year"],
        "status": "published",
        "manifestUrl": relative_manifest,
    }
    index["editions"] = [edition for edition in index["editions"] if edition["id"] != summary["id"]]
    index["editions"].append(summary)
    index["editions"].sort(key=lambda edition: edition["year"], reverse=True)
    index["currentEdition"] = summary["id"]
    validate_contract_document(index, "EditionsIndex", str(index_path))
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return index
