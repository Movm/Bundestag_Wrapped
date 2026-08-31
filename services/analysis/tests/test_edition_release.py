import pytest

from noun_analysis.edition.export import EditionValidationError
from noun_analysis.edition.release import prevent_regression, validate_release_input


def test_release_input_rejects_invalid_periods():
    with pytest.raises(EditionValidationError):
        validate_release_input("2026", "2025-12-31", "2026-01-01", "preview")


def test_regression_is_blocked():
    old = {"coverage": {"protocolCount": 2, "lastProtocolDate": "2026-12-31"}}
    new = {"coverage": {"protocolCount": 1, "lastProtocolDate": "2026-11-30"}}
    with pytest.raises(EditionValidationError, match="regression"):
        prevent_regression(old, new)
