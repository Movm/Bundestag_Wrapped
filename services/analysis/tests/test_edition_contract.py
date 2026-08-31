import json
from pathlib import Path

import pytest

from noun_analysis.edition import ContractValidationError, validate_contract_document


FIXTURES = Path(__file__).resolve().parents[3] / "contracts/wrapped/fixtures"
WRAPPED_JSON = Path(__file__).resolve().parents[3] / "apps/wrapped/public/wrapped.json"


def load(name: str):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_accepts_valid_manifest_fixture():
    validate_contract_document(load("valid-manifest.json"), "EditionManifest", "fixture.json")


@pytest.mark.parametrize("filename", ["invalid-manifest.json"])
def test_rejects_invalid_manifest(filename: str):
    with pytest.raises(ContractValidationError, match=r"invalid-manifest.json/"):
        validate_contract_document(load(filename), "EditionManifest", filename)


def test_accepts_current_wrapped_data():
    validate_contract_document(json.loads(WRAPPED_JSON.read_text(encoding="utf-8")), "WrappedData", "wrapped.json")
