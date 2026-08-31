"""Validate Wrapped edition JSON against the shared v1 contract."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from jsonschema import Draft202012Validator, FormatChecker

DocumentName = Literal["EditionsIndex", "EditionManifest", "WrappedData"]


class ContractValidationError(ValueError):
    """Raised when an edition artifact does not satisfy the shared contract."""


@lru_cache(maxsize=1)
def _schema() -> dict[str, Any]:
    schema_path = Path(__file__).resolve().parents[5] / "contracts/wrapped/v1.schema.json"
    return json.loads(schema_path.read_text(encoding="utf-8"))


def validate_contract_document(
    payload: Any, document: DocumentName, filename: str = "<memory>"
) -> None:
    """Raise a filename- and JSON-path-specific error for invalid contract data."""

    schema = _schema()
    document_schema = {
        "$schema": schema["$schema"],
        "$defs": schema["$defs"],
        "$ref": f"#/$defs/{document}",
    }
    validator = Draft202012Validator(document_schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(payload), key=lambda error: list(error.absolute_path))
    if errors:
        error = errors[0]
        path = "/" + "/".join(str(part) for part in error.absolute_path)
        raise ContractValidationError(f"{filename}{path}: {error.message}")
