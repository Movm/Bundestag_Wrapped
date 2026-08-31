"""Fail-closed checks used by the edition preview/freeze/publish workflow."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from .export import EditionValidationError, validate_edition


def validate_release_input(edition_id: str, period_start: str, period_end: str, data_version: str) -> None:
    if not edition_id.isdigit() or len(edition_id) != 4:
        raise EditionValidationError("editionId must be a four digit year")
    if not data_version.strip():
        raise EditionValidationError("dataVersion is required")
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
