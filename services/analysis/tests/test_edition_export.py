import hashlib
import json
from pathlib import Path

import pytest

from noun_analysis.edition.export import EditionValidationError, build_manifest, publish_edition, validate_edition


ROOT = Path(__file__).resolve().parents[3]
WRAPPED = json.loads((ROOT / "apps/wrapped/public/wrapped.json").read_text(encoding="utf-8"))


def fixture_artifacts():
    speeches = [
        {"protocolId": 1, "protocolDate": "2026-01-01", "protocolNumber": "21/1", "wahlperiode": 21, "speechPosition": 1},
        {"protocolId": 2, "protocolDate": "2026-12-31", "protocolNumber": "21/2", "wahlperiode": 21, "speechPosition": 1},
    ]
    return speeches, {
        "wrapped.json": WRAPPED,
        "speakers/index.json": {"speakers": [{"slug": "ada"}]},
        "speakers/ada.json": {"slug": "ada"},
        "speeches.json": {"speeches": speeches},
        "words.json": {"parties": []},
        "word_rankings.json": {"parties": []},
        "topic_rankings.json": {"topics": []},
        "content.json": {"editionId": "2026"},
    }


def publish(tmp_path, *, frozen=False, artifacts=None, speeches=None):
    default_speeches, default_artifacts = fixture_artifacts()
    speeches = speeches if speeches is not None else default_speeches
    manifest = build_manifest("2026", 2026, "test", "2027-01-02T08:00:00Z", "2026-01-01", "2026-12-31", [21], speeches, frozen)
    return publish_edition(tmp_path, "2026", "test", manifest, artifacts or default_artifacts)


def test_golden_export_is_validated_and_published_atomically(tmp_path):
    target = publish(tmp_path, frozen=True)

    assert target == tmp_path / "2026" / "test"
    assert (target / "manifest.json").is_file()
    assert json.loads((target / "manifest.json").read_text())["coverage"] == {
        "protocolCount": 2,
        "firstProtocolDate": "2026-01-01",
        "lastProtocolDate": "2026-12-31",
        "complete": True,
    }
    validate_edition(target)


def test_equal_inputs_produce_equal_artifacts_when_generated_at_is_injected(tmp_path):
    first = publish(tmp_path / "first")
    second = publish(tmp_path / "second")
    first_files = {path.relative_to(first): path.read_bytes() for path in first.rglob("*") if path.is_file()}
    second_files = {path.relative_to(second): path.read_bytes() for path in second.rglob("*") if path.is_file()}
    assert first_files == second_files


def test_tampered_artifact_fails_checksum_validation(tmp_path):
    target = publish(tmp_path)
    (target / "content.json").write_text("{}", encoding="utf-8")
    with pytest.raises(EditionValidationError, match="checksum mismatch"):
        validate_edition(target)


def test_missing_or_extra_checksum_entries_fail_validation(tmp_path):
    target = publish(tmp_path)
    checksums_path = target / "checksums.json"
    checksums = json.loads(checksums_path.read_text())
    del checksums["content.json"]
    checksums_path.write_text(json.dumps(checksums), encoding="utf-8")
    with pytest.raises(EditionValidationError, match="missing file: content.json"):
        validate_edition(target)

    checksums["content.json"] = hashlib.sha256((target / "content.json").read_bytes()).hexdigest()
    checksums["unknown.json"] = "0" * 64
    checksums_path.write_text(json.dumps(checksums), encoding="utf-8")
    with pytest.raises(EditionValidationError, match="unexpected file: unknown.json"):
        validate_edition(target)


def test_missing_speaker_profile_never_publishes_a_partial_release(tmp_path):
    _, artifacts = fixture_artifacts()
    del artifacts["speakers/ada.json"]
    with pytest.raises(EditionValidationError, match="missing profile"):
        publish(tmp_path, artifacts=artifacts)
    assert not (tmp_path / "2026" / "test").exists()


def test_out_of_period_speech_is_rejected(tmp_path):
    speeches, artifacts = fixture_artifacts()
    speeches[0]["protocolDate"] = "2025-12-31"
    artifacts["speeches.json"] = {"speeches": speeches}
    with pytest.raises(EditionValidationError, match="outside the requested period"):
        publish(tmp_path, speeches=speeches, artifacts=artifacts)


def test_coverage_regression_fails_validation(tmp_path):
    target = publish(tmp_path)
    manifest_path = target / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest["coverage"]["protocolCount"] = 1
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    checksums_path = target / "checksums.json"
    checksums = json.loads(checksums_path.read_text())
    checksums["manifest.json"] = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
    checksums_path.write_text(json.dumps(checksums), encoding="utf-8")
    with pytest.raises(EditionValidationError, match="coverage protocolCount"):
        validate_edition(target)
