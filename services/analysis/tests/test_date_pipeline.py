import asyncio
import json

import pytest
from click.testing import CliRunner

from bundestag_mcp.client import BundestagMCPClient
from noun_analysis.cli.commands import download as download_module
from noun_analysis.storage import DataStore, STATE_SCHEMA_VERSION


class FakeClient:
    def __init__(self, by_wahlperiode: dict[int, list[dict]]):
        self.by_wahlperiode = by_wahlperiode
        self.calls: list[dict] = []

    async def get_all_protocol_ids(self, **kwargs):
        self.calls.append(kwargs)
        return self.by_wahlperiode[kwargs["wahlperiode"]]


def selection(**overrides):
    return {
        "from": "2026-01-01",
        "to": "2026-12-31",
        "wahlperioden": [20, 21],
        "maxProtocols": 0,
        **overrides,
    }


def protocol(identifier, number, protocol_date, wahlperiode):
    return {
        "id": identifier,
        "dokumentnummer": number,
        "datum": protocol_date,
        "wahlperiode": wahlperiode,
        "herausgeber": "BT",
    }


def test_selection_is_inclusive_deduplicated_and_deterministic():
    client = FakeClient({
        20: [
            protocol("3", "20/3", "2026-12-31", 20),
            protocol("1", "20/1", "2026-01-01", 20),
            protocol("9", "20/9", "2025-12-31", 20),
        ],
        21: [
            protocol("2", "21/2", "2026-06-01", 21),
            protocol("1", "20/1", "2026-01-01", 20),
            protocol("4", "21/4", "2027-01-01", 21),
        ],
    })

    selected, coverage_problems = asyncio.run(download_module._select_protocols(client, selection()))

    assert [item["id"] for item in selected] == [1, 2, 3]
    assert [item["wahlperiode"] for item in selected] == [20, 21, 20]
    assert {item["reason"] for item in coverage_problems} == {"outside_requested_period"}
    assert all(call["date_from"] == "2026-01-01" for call in client.calls)
    assert all(call["date_to"] == "2026-12-31" for call in client.calls)


def test_selection_records_missing_or_invalid_dates_without_downloading_them():
    client = FakeClient({
        21: [
            protocol("1", "21/1", "2026-01-01", 21),
            protocol("2", "21/2", None, 21),
            protocol("3", "21/3", "not-a-date", 21),
        ],
    })

    selected, coverage_problems = asyncio.run(
        download_module._select_protocols(client, selection(wahlperioden=[21]))
    )

    assert [item["id"] for item in selected] == [1]
    assert [item["id"] for item in coverage_problems] == [2, 3]
    assert all(item["reason"] == "missing_or_invalid_date" for item in coverage_problems)


def test_mcp_client_forwards_date_range_to_protocol_search(monkeypatch):
    captured = {}

    async def fake_call_tool(name, args):
        captured["name"] = name
        captured["args"] = args
        return {"results": [], "hasMore": False}

    client = BundestagMCPClient("https://example.test")
    monkeypatch.setattr(client, "call_tool", fake_call_tool)
    asyncio.run(client.search_plenarprotokolle(21, date_from="2026-01-01", date_to="2026-12-31"))

    assert captured == {
        "name": "bundestag_search_plenarprotokolle",
        "args": {"wahlperiode": 21, "limit": 100, "datum_start": "2026-01-01", "datum_end": "2026-12-31"},
    }


def test_mcp_client_accepts_a_server_root_or_the_documented_mcp_endpoint():
    assert BundestagMCPClient("https://example.test").mcp_url == "https://example.test/mcp"
    assert BundestagMCPClient("https://example.test/mcp").mcp_url == "https://example.test/mcp"


def test_resume_requires_the_same_versioned_selection(tmp_path):
    store = DataStore(tmp_path)
    original = selection(wahlperioden=[21])
    state = store.init_state(
        "https://example.test",
        original,
        [{"id": 1, "protocolNumber": "21/1", "protocolDate": "2026-01-01", "wahlperiode": 21}],
        [],
    )

    assert state["stateSchemaVersion"] == STATE_SCHEMA_VERSION
    store.assert_resume_compatible(store.load_state(), original)
    with pytest.raises(ValueError, match="different selection parameters"):
        store.assert_resume_compatible(store.load_state(), selection(wahlperioden=[20]))


def test_download_cli_accepts_date_range_and_repeated_wahlperiode(tmp_path, monkeypatch):
    captured = {}

    async def fake_download(_store, _server, selected, _state, _pending):
        captured["selection"] = selected

    monkeypatch.setattr(download_module, "_download_protocols", fake_download)
    result = CliRunner().invoke(
        download_module.download,
        [str(tmp_path), "--from", "2026-01-01", "--to", "2026-12-31", "-w", "20", "-w", "21"],
        obj={"server": "https://example.test"},
    )

    assert result.exit_code == 0, result.output
    assert captured["selection"] == selection()


def test_download_cli_rejects_resume_with_changed_filters(tmp_path):
    store = DataStore(tmp_path)
    store.init_state("https://example.test", selection(wahlperioden=[21]), [], [])

    result = CliRunner().invoke(
        download_module.download,
        [str(tmp_path), "--from", "2026-01-01", "--to", "2026-12-31", "-w", "20"],
        obj={"server": "https://example.test"},
    )

    assert result.exit_code != 0
    assert "different selection parameters" in result.output


def test_parse_inherits_protocol_metadata_and_sorts_speeches(tmp_path, monkeypatch):
    store = DataStore(tmp_path)
    selected = [
        {"id": 2, "protocolNumber": "21/2", "protocolDate": "2026-01-02", "wahlperiode": 21},
        {"id": 1, "protocolNumber": "21/1", "protocolDate": "2026-01-01", "wahlperiode": 21},
    ]
    state = store.init_state("https://example.test", selection(wahlperioden=[21]), selected, [])
    for item in selected:
        store.save_protocol(item["id"], {"fullText": "fixture"})
        store.mark_downloaded(state, item["id"])

    monkeypatch.setattr(
        download_module,
        "parse_speeches_from_protocol",
        lambda _text: [{"party": "SPD", "speaker": "One"}, {"party": "SPD", "speaker": "Two"}],
    )
    download_module.parse.callback(str(tmp_path))

    speeches = json.loads((tmp_path / "speeches.json").read_text())
    assert [(speech["protocolId"], speech["speechPosition"]) for speech in speeches["SPD"]] == [
        (1, 1),
        (1, 2),
        (2, 1),
        (2, 2),
    ]
    assert speeches["SPD"][0]["protocolDate"] == "2026-01-01"
    assert speeches["SPD"][0]["protocolNumber"] == "21/1"
    assert speeches["SPD"][0]["wahlperiode"] == 21
