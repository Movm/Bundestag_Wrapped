import json
from pathlib import Path

import pytest

from noun_analysis.edition.export import EditionValidationError, build_manifest, publish_edition
from noun_analysis.edition.release import prevent_regression, publish_in_index, validate_freeze_against_index, validate_release_input


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
    index = publish_in_index(index_path, artifact_root)

    assert index["currentEdition"] == "2026"
    assert index["editions"] == [{"id": "2026", "year": 2026, "status": "published", "manifestUrl": "/data/2026/final/manifest.json"}]
    assert json.loads(index_path.read_text()) == index


def test_freeze_rejects_regression_against_published_edition(tmp_path):
    speeches, artifacts = fixture_artifacts()
    old = build_manifest("2026", 2026, "old", "2027-01-02T08:00:00Z", "2026-01-01", "2026-12-31", [21], speeches, True)
    old_root = publish_edition(tmp_path / "data", "2026", "old", old, artifacts)
    index_path = tmp_path / "data" / "editions.json"
    publish_in_index(index_path, old_root)
    reduced_speeches = speeches[:1]
    reduced_artifacts = {**artifacts, "speeches.json": {"speeches": reduced_speeches}}
    reduced = build_manifest("2026", 2026, "new", "2027-01-02T08:00:00Z", "2026-01-01", "2026-12-31", [21], reduced_speeches, True)
    candidate = publish_edition(tmp_path / "candidate", "2026", "new", reduced, reduced_artifacts)

    with pytest.raises(EditionValidationError, match="regression"):
        validate_freeze_against_index(candidate, index_path)
