"""Fail-closed checks used by the edition preview/freeze/publish workflow."""

from __future__ import annotations

import json
import hashlib
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from .export import EditionValidationError, validate_edition
from .validate import validate_contract_document


RELEASE_REPORT = "release-report.json"
BUILT_IN_QUIZ_GROUPS = (
    "quiz-topics", "quiz-signature", "quiz-speeches", "quiz-drama",
    "quiz-discriminatory", "quiz-common-words", "quiz-moin", "quiz-tone", "quiz-gender",
)


def _canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def build_release_report(manifest: dict, content: dict, source_state: dict) -> dict:
    """Capture the exact source selection and quiz plan used for one export."""
    quiz_groups = (content.get("quiz") or {}).get("groups") or []
    active = [group["id"] for group in quiz_groups]
    return {
        "schemaVersion": 1,
        "editionId": manifest["editionId"],
        "dataVersion": manifest["dataVersion"],
        "period": manifest["period"],
        "coverage": manifest["coverage"],
        "source": {
            "selection": source_state.get("selection"),
            "protocols": source_state.get("protocols", []),
            "protocolIds": source_state.get("protocol_ids", []),
            "downloaded": source_state.get("downloaded", []),
            "failed": source_state.get("failed", []),
            "coverageProblems": source_state.get("coverageProblems", []),
            "parsed": source_state.get("parsed", False),
        },
        "quiz": {
            "configurationVersion": (content.get("quiz") or {}).get("version"),
            "activeQuestionIds": active,
            "omittedGroups": [
                {"id": group, "reason": "not_configured"}
                for group in BUILT_IN_QUIZ_GROUPS if quiz_groups and group not in active
            ],
        },
        "inputFingerprint": _canonical_digest({"content": content, "source": source_state.get("selection"), "protocols": source_state.get("protocols", [])}),
    }


def validate_release_report(root: Path) -> dict:
    """Fail freeze/publish when source coverage or release provenance is incomplete."""
    report_path = root / RELEASE_REPORT
    if not report_path.is_file():
        raise EditionValidationError("frozen release requires release-report.json")
    report = json.loads(report_path.read_text(encoding="utf-8"))
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    content = json.loads((root / manifest["content"]).read_text(encoding="utf-8"))
    if report.get("editionId") != manifest["editionId"] or report.get("dataVersion") != manifest["dataVersion"]:
        raise EditionValidationError("release report does not match edition manifest")
    source = report.get("source")
    if not isinstance(source, dict):
        raise EditionValidationError("release report has no source coverage")
    selection = source.get("selection") or {}
    period = manifest["period"]
    if selection.get("from") != period["start"] or selection.get("to") != period["end"]:
        raise EditionValidationError("release report source selection does not match edition period")
    if sorted(selection.get("wahlperioden", [])) != sorted(period["wahlperioden"]) or selection.get("maxProtocols") != 0:
        raise EditionValidationError("release report source selection is not a complete edition selection")
    if source.get("coverageProblems"):
        raise EditionValidationError("release report contains unresolved source coverage problems")
    expected = set(source.get("protocolIds", []))
    if not expected or expected != set(source.get("downloaded", [])) or source.get("failed") or not source.get("parsed"):
        raise EditionValidationError("release report has incomplete downloads or parsing")
    protocols = source.get("protocols", [])
    if {item.get("id") for item in protocols} != expected:
        raise EditionValidationError("release report protocol metadata does not match selected protocols")
    if report.get("inputFingerprint") != _canonical_digest({"content": content, "source": selection, "protocols": protocols}):
        raise EditionValidationError("release report input fingerprint does not match export inputs")
    return report


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
    validate_release_report(root)
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
        # A first release replaces a registered preview. Its validated coverage
        # is still a useful baseline; only the candidate must already be frozen.
        validate_edition(previous_root)
        previous = json.loads((previous_root / "manifest.json").read_text(encoding="utf-8"))
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


PUBLICATION_NOT_BEFORE = {"2026": date(2026, 12, 1)}


def assert_publication_allowed(edition_id: str, now: datetime | None = None) -> None:
    """Reject a publication before its explicitly approved Berlin calendar day."""
    not_before = PUBLICATION_NOT_BEFORE.get(edition_id)
    if not not_before:
        return
    instant = now or datetime.now(ZoneInfo("Europe/Berlin"))
    berlin_day = instant.astimezone(ZoneInfo("Europe/Berlin")).date() if instant.tzinfo else instant.replace(tzinfo=ZoneInfo("Europe/Berlin")).date()
    if berlin_day < not_before:
        raise EditionValidationError(f"edition {edition_id} must not be published before {not_before.isoformat()} Europe/Berlin")


def publish_in_index(index_path: Path, artifact_root: Path, *, now: datetime | None = None) -> dict:
    """Publish a frozen artifact through the small, reversible editions index."""
    manifest = require_frozen_artifact(artifact_root)
    assert_publication_allowed(manifest["editionId"], now)
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
