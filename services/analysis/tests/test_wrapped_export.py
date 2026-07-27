from datetime import datetime

from noun_analysis.wrapped.export import _generated_at


def test_generated_at_is_parseable_utc_iso_timestamp():
    generated_at = _generated_at()

    assert generated_at.endswith("Z")
    parsed = datetime.fromisoformat(generated_at.replace("Z", "+00:00"))
    assert parsed.utcoffset().total_seconds() == 0
