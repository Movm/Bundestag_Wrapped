import asyncio

import click
import httpx
import pytest

from bundestag_mcp.client import MAX_RETRIES, BundestagMCPClient
from noun_analysis.cli.commands import download as download_module
from noun_analysis.storage import DataStore


@pytest.mark.asyncio
async def test_call_tool_retries_transient_http_errors(monkeypatch):
    attempts = 0

    async def no_sleep(_delay):
        return None

    async def handler(request):
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            return httpx.Response(502, request=request)
        return httpx.Response(
            200,
            request=request,
            json={"result": {"content": [{"type": "text", "text": '{"ok": true}'}]}},
        )

    monkeypatch.setattr(asyncio, "sleep", no_sleep)
    client = BundestagMCPClient("https://example.test")
    client._client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

    try:
        assert await client.call_tool("test") == {"ok": True}
    finally:
        await client._client.aclose()

    assert attempts == 3


@pytest.mark.asyncio
async def test_call_tool_stops_after_max_transient_retries(monkeypatch):
    attempts = 0

    async def no_sleep(_delay):
        return None

    async def handler(request):
        nonlocal attempts
        attempts += 1
        return httpx.Response(504, request=request)

    monkeypatch.setattr(asyncio, "sleep", no_sleep)
    client = BundestagMCPClient("https://example.test")
    client._client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

    try:
        with pytest.raises(httpx.HTTPStatusError):
            await client.call_tool("test")
    finally:
        await client._client.aclose()

    assert attempts == MAX_RETRIES


@pytest.mark.asyncio
async def test_call_tool_does_not_retry_non_transient_http_errors(monkeypatch):
    attempts = 0

    async def no_sleep(_delay):
        return None

    async def handler(request):
        nonlocal attempts
        attempts += 1
        return httpx.Response(400, request=request)

    monkeypatch.setattr(asyncio, "sleep", no_sleep)
    client = BundestagMCPClient("https://example.test")
    client._client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

    try:
        with pytest.raises(httpx.HTTPStatusError):
            await client.call_tool("test")
    finally:
        await client._client.aclose()

    assert attempts == 1


@pytest.mark.asyncio
async def test_download_fails_closed_when_a_protocol_is_missing(tmp_path, monkeypatch):
    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, _exc_type, _exc_val, _exc_tb):
            return None

        async def get_all_protocol_ids(self, **_kwargs):
            return [{"id": "5795"}]

        async def get_plenarprotokoll(self, _protocol_id, include_full_text=True):
            assert include_full_text
            return None

    monkeypatch.setattr(download_module, "BundestagMCPClient", lambda _server: FakeClient())
    store = DataStore(tmp_path)

    with pytest.raises(click.ClickException, match="1 of 1 protocols could not be downloaded"):
        await download_module._download_protocols(
            store=store,
            server="https://example.test",
            wahlperiode=21,
            max_protocols=0,
            state=None,
            pending=None,
        )

    assert store.get_progress_summary()["failed"] == 1
