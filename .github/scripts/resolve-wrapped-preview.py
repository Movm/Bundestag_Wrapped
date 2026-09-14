"""Resolve a preview cutoff before installing the analysis dependencies."""

import os
from datetime import date, datetime, timezone
from pathlib import Path


def preview_end(edition: str, start: str, requested_end: str, today: date) -> str:
    if len(edition) != 4 or not edition.isascii() or not edition.isdigit():
        raise ValueError("edition must be a four-digit year")
    year = int(edition)
    # Scheduled runs have no workflow_dispatch inputs. Keep retries after New
    # Year inside the requested edition instead of spilling into the next year.
    end = date.fromisoformat(requested_end) if requested_end else min(today, date(year, 12, 31))
    begin = date.fromisoformat(start)
    if begin.year != year or end.year != year or begin > end:
        raise ValueError("preview period must be within its edition year")
    if end > today:
        raise ValueError("preview end date must not be in the future")
    return end.isoformat()


if __name__ == "__main__":
    end = preview_end(
        os.environ["EDITION"], os.environ["FROM"], os.environ.get("TO", ""),
        datetime.now(timezone.utc).date(),
    )
    with Path(os.environ["GITHUB_ENV"]).open("a", encoding="utf-8") as output:
        output.write(f"TO={end}\n")
    print(f"Preview period: {os.environ['FROM']} through {end} (UTC)")
