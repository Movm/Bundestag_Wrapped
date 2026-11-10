#!/usr/bin/env python3
"""Build the official speaker-gender lookup from the Bundestag MdB master data.

Source: bundestag.de open data, "Stammdaten aller Abgeordneten seit 1949"
(MDB_STAMMDATEN.XML, field BIOGRAFISCHE_ANGABEN/GESCHLECHT). Page:
https://www.bundestag.de/services/opendata

Usage:
    python scripts/build_speaker_gender.py [--zip PATH | --url URL] [--min-wp 19]

Output: src/noun_analysis/wrapped/reference/speaker_gender.json, keyed by
"<last name>|<first name>" (see noun_analysis.wrapped.gender.name_key).
Keys that map to different genders (namesakes) are dropped, not guessed.

Government members without a seat (ministers, state ministers) are not in the
Stammdaten. With --speakers SPEECHES_JSON the script looks every speaker that
the Stammdaten do not cover up in the abgeordnetenwatch.de API (public, field
"sex") and stores hits in the "abgeordnetenwatch" section. Without the flag the
existing section is carried over unchanged.
Re-run after each Stammdaten release; commit the result.
"""

from __future__ import annotations

import argparse
import importlib.util
import io
import json
import sys
import urllib.parse
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

# Load gender.py by path: it is stdlib-only, so the script runs without the
# package's heavy dependencies (spaCy, MCP client).
_spec = importlib.util.spec_from_file_location(
    "speaker_gender_module", ROOT / "src/noun_analysis/wrapped/gender.py"
)
_gender = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = _gender
_spec.loader.exec_module(_gender)
name_key = _gender.name_key

DEFAULT_URL = "https://www.bundestag.de/resource/blob/472878/MdB-Stammdaten.zip"
OUT = ROOT / "src/noun_analysis/wrapped/reference/speaker_gender.json"
GENDER = {"männlich": "male", "weiblich": "female", "divers": "diverse"}


def load_xml(zip_path: str | None, url: str) -> bytes:
    if zip_path:
        data = Path(zip_path).read_bytes()
    else:
        with urllib.request.urlopen(url, timeout=60) as resp:
            data = resp.read()
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        return zf.read("MDB_STAMMDATEN.XML")


def build(xml_bytes: bytes, min_wp: int) -> dict:
    root = ET.fromstring(xml_bytes)
    version = (root.findtext("VERSION") or "").strip()
    candidates: dict[str, set[str]] = defaultdict(set)
    persons = 0
    for mdb in root.iter("MDB"):
        wps = [int(w.text) for w in mdb.iter("WP") if w.text and w.text.isdigit()]
        if not wps or max(wps) < min_wp:
            continue
        raw = (mdb.findtext("BIOGRAFISCHE_ANGABEN/GESCHLECHT") or "").strip()
        gender = GENDER.get(raw)
        if gender is None:
            continue
        persons += 1
        for name in mdb.iter("NAME"):
            last = (name.findtext("NACHNAME") or "").strip()
            first = (name.findtext("VORNAME") or "").strip()
            if not last or not first:
                continue
            for first_variant in {first, first.split()[0]}:
                candidates[name_key(first_variant, last)].add(gender)
    entries = {k: next(iter(v)) for k, v in candidates.items() if len(v) == 1}
    dropped = sorted(k for k, v in candidates.items() if len(v) > 1)
    return {
        "source": "bundestag.de MDB_STAMMDATEN (GESCHLECHT)",
        "stammdatenVersion": version,
        "minWahlperiode": min_wp,
        "persons": persons,
        "ambiguousKeysDropped": dropped,
        "entries": dict(sorted(entries.items())),
    }


def fetch_abgeordnetenwatch(speakers_path: str, known: dict[str, str]) -> dict[str, str]:
    """Look up speakers missing from the Stammdaten in the abgeordnetenwatch API."""
    speeches = json.loads(Path(speakers_path).read_text(encoding="utf-8"))["speeches"]
    people = {(x["first_name"], x["last_name"]) for x in speeches if x.get("first_name")}
    found: dict[str, str] = {}
    for first, last in sorted(people):
        key = name_key(first, last)
        if key in known:
            continue
        query = urllib.parse.urlencode({"last_name": last.split()[-1], "pager_limit": 50})
        with urllib.request.urlopen(
            f"https://www.abgeordnetenwatch.de/api/v2/politicians?{query}", timeout=60
        ) as resp:
            data = json.load(resp)["data"]
        hits = {
            {"m": "male", "f": "female"}.get(p.get("sex"), "diverse")
            for p in data
            if p.get("first_name") and name_key(p["first_name"], last) == name_key(first, last)
        }
        if len(hits) == 1:
            found[key] = hits.pop()
        else:
            print(f"no unique abgeordnetenwatch match: {first} {last}", file=sys.stderr)
    return found


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--zip", help="local MdB-Stammdaten.zip (skips download)")
    ap.add_argument("--url", default=DEFAULT_URL)
    ap.add_argument("--speakers", help="speeches.json; adds abgeordnetenwatch lookups")
    ap.add_argument("--min-wp", type=int, default=19)
    args = ap.parse_args()
    result = build(load_xml(args.zip, args.url), args.min_wp)
    if args.speakers:
        result["abgeordnetenwatch"] = fetch_abgeordnetenwatch(args.speakers, result["entries"])
    elif OUT.exists():
        result["abgeordnetenwatch"] = json.loads(OUT.read_text(encoding="utf-8")).get(
            "abgeordnetenwatch", {}
        )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{OUT}: {len(result['entries'])} keys, {result['persons']} persons, "
          f"{len(result['ambiguousKeysDropped'])} ambiguous dropped")


if __name__ == "__main__":
    main()
