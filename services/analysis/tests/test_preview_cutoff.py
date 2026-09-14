"""Exercise the same dependency-free cutoff resolver used by scheduled CI."""

import importlib.util
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[3] / ".github/scripts/resolve-wrapped-preview.py"
spec = importlib.util.spec_from_file_location("preview_cutoff", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PreviewCutoffTests(unittest.TestCase):
    def test_schedule_without_dispatch_inputs_uses_today(self):
        self.assertEqual(module.preview_end("2026", "2026-01-01", "", date(2026, 9, 14)), "2026-09-14")

    def test_explicit_cutoff_is_preserved(self):
        self.assertEqual(module.preview_end("2026", "2026-01-01", "2026-08-31", date(2026, 9, 14)), "2026-08-31")

    def test_next_year_retry_stays_in_edition(self):
        self.assertEqual(module.preview_end("2026", "2026-01-01", "", date(2027, 1, 4)), "2026-12-31")

    def test_invalid_or_future_periods_fail(self):
        for edition, start, end in [
            ("2026", "2026-01-01", "2026-12-31"),
            ("2026", "2026-01-01", "2025-12-31"),
            ("2026", "2025-01-01", "2026-08-31"),
            ("2026", "2026-09-01", "2026-08-31"),
            ("2026", "2026-01-01", "invalid"),
            ("2027", "2027-01-01", ""),
            ("../2026", "2026-01-01", ""),
        ]:
            with self.subTest(edition=edition, start=start, end=end):
                with self.assertRaises(ValueError):
                    module.preview_end(edition, start, end, date(2026, 9, 14))

    def test_script_writes_resolved_cutoff_to_github_environment(self):
        today = datetime.now(timezone.utc).date()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "github-env"
            output.write_text("EXISTING=value\n", encoding="utf-8")
            subprocess.run([sys.executable, str(SCRIPT)], check=True, capture_output=True, env={
                **os.environ, "EDITION": str(today.year), "FROM": f"{today.year}-01-01",
                "TO": "", "GITHUB_ENV": str(output),
            })
            self.assertEqual(output.read_text(), f"EXISTING=value\nTO={today.isoformat()}\n")

    def test_script_does_not_export_an_invalid_cutoff(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "github-env"
            output.write_text("EXISTING=value\n", encoding="utf-8")
            result = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, env={
                **os.environ, "EDITION": "2026", "FROM": "2026-01-01",
                "TO": "invalid", "GITHUB_ENV": str(output),
            })
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(output.read_text(), "EXISTING=value\n")


if __name__ == "__main__":
    unittest.main()
