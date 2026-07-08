"""Regression tests for speaker profile export."""

from collections import Counter
from types import SimpleNamespace

import orjson

from noun_analysis.wrapped.speaker_export import SpeakerExporter


def _speech(speaker: str, words: int, acad_title: str | None = None) -> dict:
    text = " ".join(["politik"] * words)
    return {
        "speaker": speaker,
        "party": "CDU/CSU",
        "text": text,
        "type": "rede",
        "category": "rede",
        "words": words,
        "acad_title": acad_title,
    }


def test_speaker_export_merges_academic_title_variants(tmp_path):
    """Title and no-title variants should not split or overwrite profiles."""
    data = SimpleNamespace(
        all_speeches=[
            _speech("Dr. Wolfram Weimer", 100, "Dr"),
            _speech("Wolfram Weimer", 50, None),
        ],
        drama_stats={
            "interrupters": Counter({
                ("Dr. Wolfram Weimer", "CDU/CSU"): 2,
                ("Wolfram Weimer", "CDU/CSU"): 3,
            }),
            "interrupted": Counter({
                ("Wolfram Weimer", "CDU/CSU"): 4,
            }),
        },
        speaker_profiles={},
    )

    exporter = SpeakerExporter(data)
    result = exporter.export_all(tmp_path)

    index = orjson.loads((tmp_path / "index.json").read_bytes())
    assert result["speakers_exported"] == 1
    assert index["totalSpeakers"] == 1
    assert index["speakers"][0]["slug"] == "wolfram-weimer"
    assert index["speakers"][0]["speeches"] == 2
    assert index["speakers"][0]["words"] == 150

    profile = orjson.loads((tmp_path / "wolfram-weimer.json").read_bytes())
    assert profile["name"] == "Dr. Wolfram Weimer"
    assert profile["academicTitle"] == "Dr"
    assert profile["speeches"] == 2
    assert profile["totalWords"] == 150
    assert profile["drama"]["interruptionsGiven"] == 5
    assert profile["drama"]["interruptionsReceived"] == 4
    assert "signatureWords" in profile["words"]
    assert "signatureWordsParty" in profile["words"]
    assert "signatureWordsBundestag" in profile["words"]
    assert "signatureAdjectives" in profile["words"]
    assert "signatureAdjectivesParty" in profile["words"]
    assert "signatureAdjectivesBundestag" in profile["words"]
