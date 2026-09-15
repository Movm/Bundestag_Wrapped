import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

from noun_analysis.edition.export import EditionValidationError, build_manifest, publish_edition
from noun_analysis.edition.release import assert_publication_allowed, prevent_regression, publish_in_index, validate_freeze_against_index, validate_release_input


AFTER_2026_LAUNCH = datetime(2026, 12, 1, 0, 0, tzinfo=timezone.utc)


def fixture_artifacts():
    wrapped = json.loads((Path(__file__).resolve().parents[3] / "apps/wrapped/public/wrapped.json").read_text(encoding="utf-8"))
    speeches = [
        {"protocolId": 1, "protocolDate": "2026-01-01", "protocolNumber": "21/1", "wahlperiode": 21, "speechPosition": 1},
        {"protocolId": 2, "protocolDate": "2026-12-31", "protocolNumber": "21/2", "wahlperiode": 21, "speechPosition": 1},
    ]
    return speeches, {
        "wrapped.json": wrapped,
        "speakers/index.json": {"speakers": [{"slug": "ada"}]},
        "speakers/ada.json": {"slug": "ada"},
        "speeches.json": {"speeches": speeches},
        "words.json": {"parties": []},
        "word_rankings.json": {"parties": []},
        "topic_rankings.json": {"topics": []},
        "content.json": {"editionId": "2026"},
    }


def test_release_input_rejects_invalid_periods():
    with pytest.raises(EditionValidationError):
        validate_release_input("2026", "2025-12-31", "2026-01-01", "preview")


def test_2026_publication_gate_uses_berlin_calendar_day():
    with pytest.raises(EditionValidationError, match="must not be published"):
        assert_publication_allowed("2026", datetime(2026, 11, 30, 22, 59, tzinfo=timezone.utc))
    assert_publication_allowed("2026", datetime(2026, 11, 30, 23, 0, tzinfo=timezone.utc))


def test_regression_is_blocked():
    old = {"coverage": {"protocolCount": 2, "lastProtocolDate": "2026-12-31"}}
    new = {"coverage": {"protocolCount": 1, "lastProtocolDate": "2026-11-30"}}
    with pytest.raises(EditionValidationError, match="regression"):
        prevent_regression(old, new)


def test_publish_index_points_at_a_valid_frozen_artifact(tmp_path):
    speeches, artifacts = fixture_artifacts()
    manifest = build_manifest("2026", 2026, "final", "2027-01-02T08:00:00Z", "2026-01-01", "2026-12-31", [21], speeches, True)
    artifact_root = publish_edition(tmp_path / "data", "2026", "final", manifest, artifacts)

    index_path = tmp_path / "data" / "editions.json"
    index = publish_in_index(index_path, artifact_root, now=AFTER_2026_LAUNCH)

    assert index["currentEdition"] == "2026"
    assert index["editions"] == [{"id": "2026", "year": 2026, "status": "published", "manifestUrl": "/data/2026/final/manifest.json"}]
    assert json.loads(index_path.read_text()) == index


def test_freeze_rejects_regression_against_published_edition(tmp_path):
    speeches, artifacts = fixture_artifacts()
    old = build_manifest("2026", 2026, "old", "2027-01-02T08:00:00Z", "2026-01-01", "2026-12-31", [21], speeches, True)
    old_root = publish_edition(tmp_path / "data", "2026", "old", old, artifacts)
    index_path = tmp_path / "data" / "editions.json"
    publish_in_index(index_path, old_root, now=AFTER_2026_LAUNCH)
    reduced_speeches = speeches[:1]
    reduced_artifacts = {**artifacts, "speeches.json": {"speeches": reduced_speeches}}
    reduced = build_manifest("2026", 2026, "new", "2027-01-02T08:00:00Z", "2026-01-01", "2026-12-31", [21], reduced_speeches, True)
    candidate = publish_edition(tmp_path / "candidate", "2026", "new", reduced, reduced_artifacts)

    with pytest.raises(EditionValidationError, match="regression"):
        validate_freeze_against_index(candidate, index_path)


def test_november_cutoff_can_freeze_over_preview_without_publishing(tmp_path):
    speeches, artifacts = fixture_artifacts()
    speeches[-1]["protocolDate"] = "2026-11-27"
    data_root = tmp_path / "data"
    preview = build_manifest("2026", 2026, "preview", "2026-11-30T08:00:00Z", "2026-01-01", "2026-11-30", [21], speeches, False)
    preview_root = publish_edition(data_root, "2026", "preview", preview, artifacts)
    frozen = build_manifest("2026", 2026, "launch", "2026-12-01T08:00:00Z", "2026-01-01", "2026-11-30", [21], speeches, True)
    candidate = publish_edition(data_root, "2026", "launch", frozen, artifacts)
    index_path = data_root / "editions.json"
    index_path.write_text(json.dumps({
        "schemaVersion": 1, "currentEdition": "2025", "editions": [
            {"id": "2025", "year": 2025, "status": "published", "manifestUrl": "/data/2025/final/manifest.json"},
            {"id": "2026", "year": 2026, "status": "preview", "manifestUrl": "/data/2026/preview/manifest.json"},
        ],
    }))
    index_before = index_path.read_bytes()
    preview_before = {path.relative_to(preview_root): path.read_bytes() for path in preview_root.rglob("*") if path.is_file()}

    assert validate_freeze_against_index(candidate, index_path) == frozen
    assert index_path.read_bytes() == index_before
    assert {path.relative_to(preview_root): path.read_bytes() for path in preview_root.rglob("*") if path.is_file()} == preview_before

    reduced_speeches = speeches[:1]
    reduced = build_manifest("2026", 2026, "reduced", "2026-12-01T08:00:00Z", "2026-01-01", "2026-11-30", [21], reduced_speeches, True)
    reduced_root = publish_edition(data_root, "2026", "reduced", reduced, {**artifacts, "speeches.json": {"speeches": reduced_speeches}})
    with pytest.raises(EditionValidationError, match="regression"):
        validate_freeze_against_index(reduced_root, index_path)
