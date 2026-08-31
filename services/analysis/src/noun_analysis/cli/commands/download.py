"""Download and parse commands for protocol data."""

import asyncio
import subprocess
import sys
from datetime import date
from re import search

import click
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.table import Table

from noun_analysis.parser import BundestagMCPClient, parse_speeches_from_protocol
from noun_analysis.storage import STATE_SCHEMA_VERSION, DataStore

from ..constants import console


def _parse_date(value: str | None, option_name: str) -> date | None:
    if value is None:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise click.BadParameter("must be an ISO date (YYYY-MM-DD)", param_hint=option_name) from error


def _selection(
    date_from: date | None,
    date_to: date | None,
    wahlperioden: tuple[int, ...],
    max_protocols: int,
) -> dict:
    if date_from and date_to and date_from > date_to:
        raise click.UsageError("--from must be before or equal to --to")
    return {
        "from": date_from.isoformat() if date_from else None,
        "to": date_to.isoformat() if date_to else None,
        "wahlperioden": sorted(set(wahlperioden)),
        "maxProtocols": max_protocols,
    }


def _protocol_date(value: object) -> date | None:
    if not isinstance(value, str):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _session_number(protocol_number: str) -> int:
    match = search(r"/(\d+)$", protocol_number)
    return int(match.group(1)) if match else 0


def _protocol_sort_key(protocol: dict) -> tuple[str, int, int, str, int]:
    return (
        protocol["protocolDate"],
        protocol["wahlperiode"],
        _session_number(protocol["protocolNumber"]),
        protocol["protocolNumber"],
        protocol["id"],
    )


async def _select_protocols(
    client: BundestagMCPClient,
    selection: dict,
) -> tuple[list[dict], list[dict]]:
    """Fetch, validate, de-duplicate, and deterministically sort protocol metadata."""
    selected_by_id: dict[int, dict] = {}
    coverage_problems: list[dict] = []
    from_date = _protocol_date(selection["from"]) if selection["from"] else None
    to_date = _protocol_date(selection["to"]) if selection["to"] else None

    for wahlperiode in selection["wahlperioden"]:
        protocols = await client.get_all_protocol_ids(
            wahlperiode=wahlperiode,
            herausgeber="BT",
            max_protocols=0,
            date_from=selection["from"],
            date_to=selection["to"],
        )
        for protocol in protocols:
            try:
                protocol_id = int(protocol["id"])
            except (KeyError, TypeError, ValueError):
                coverage_problems.append({"id": protocol.get("id"), "reason": "invalid_id"})
                continue

            protocol_date = _protocol_date(protocol.get("datum"))
            if protocol_date is None:
                coverage_problems.append({
                    "id": protocol_id,
                    "dokumentnummer": protocol.get("dokumentnummer"),
                    "wahlperiode": protocol.get("wahlperiode", wahlperiode),
                    "reason": "missing_or_invalid_date",
                })
                continue
            if (from_date and protocol_date < from_date) or (to_date and protocol_date > to_date):
                coverage_problems.append({
                    "id": protocol_id,
                    "dokumentnummer": protocol.get("dokumentnummer"),
                    "wahlperiode": protocol.get("wahlperiode", wahlperiode),
                    "reason": "outside_requested_period",
                })
                continue

            protocol_number = protocol.get("dokumentnummer")
            if not isinstance(protocol_number, str) or not protocol_number:
                coverage_problems.append({"id": protocol_id, "reason": "missing_protocol_number"})
                continue
            try:
                protocol_wahlperiode = int(protocol.get("wahlperiode") or wahlperiode)
            except (TypeError, ValueError):
                coverage_problems.append({"id": protocol_id, "reason": "invalid_wahlperiode"})
                continue
            metadata = {
                "id": protocol_id,
                "protocolNumber": protocol_number,
                "protocolDate": protocol_date.isoformat(),
                "wahlperiode": protocol_wahlperiode,
            }
            selected_by_id.setdefault(protocol_id, metadata)

    selected = sorted(selected_by_id.values(), key=_protocol_sort_key)
    if selection["maxProtocols"]:
        selected = selected[: selection["maxProtocols"]]
    return selected, coverage_problems


@click.command()
@click.option("--model", default="de_core_news_lg", help="spaCy model to download")
def download_model(model: str):
    """Download the required spaCy model."""
    console.print(f"Downloading spaCy model: {model}")
    subprocess.run([sys.executable, "-m", "spacy", "download", model], check=True)
    console.print(f"[green]Model {model} downloaded successfully![/]")


@click.command()
@click.argument("data_dir", type=click.Path())
@click.option("--from", "date_from", help="Inclusive ISO start date (YYYY-MM-DD)")
@click.option("--to", "date_to", help="Inclusive ISO end date (YYYY-MM-DD)")
@click.option("--wahlperiode", "wahlperioden", "-w", multiple=True, type=int, default=(20,), help="Legislative period (repeatable)")
@click.option("--max-protocols", "-m", default=0, help="Max protocols (0 = all)")
@click.pass_context
def download(
    ctx,
    data_dir: str,
    date_from: str | None,
    date_to: str | None,
    wahlperioden: tuple[int, ...],
    max_protocols: int,
):
    """Download Plenarprotokolle to disk for later analysis.

    Supports resume: if state.json exists, continues from where it left off.
    """
    server = ctx.obj["server"]
    store = DataStore(data_dir)
    selection = _selection(
        _parse_date(date_from, "--from"),
        _parse_date(date_to, "--to"),
        wahlperioden,
        max_protocols,
    )

    # Check for resume mode
    if store.has_state():
        state = store.load_state()
        try:
            store.assert_resume_compatible(state, selection)
        except ValueError as error:
            raise click.ClickException(str(error)) from error
        console.print(f"[yellow]Resuming download from {data_dir}[/]")
        console.print(f"  Server: {state['server']}")
        console.print(f"  Wahlperioden: {', '.join(map(str, selection['wahlperioden']))}")

        pending = store.get_pending_ids(state)
        console.print(f"  Already downloaded: {len(state['downloaded'])}")
        console.print(f"  Pending: {len(pending)}")

        if not pending:
            console.print("[green]Download already complete![/]")
            return

        # Use server from state
        server = state["server"]
    else:
        state = None
        pending = None
        console.print(f"[bold]Starting fresh download to {data_dir}[/]")
        console.print(f"  Server: {server}")
        console.print(f"  Wahlperioden: {', '.join(map(str, selection['wahlperioden']))}")
        if selection["from"] or selection["to"]:
            console.print(f"  Period: {selection['from'] or '…'} to {selection['to'] or '…'} (inclusive)")
        else:
            console.print("  Period: all available dates (legacy cumulative selection)")
        if max_protocols:
            console.print(f"  Max protocols: {max_protocols}")

    asyncio.run(_download_protocols(store, server, selection, state, pending))


async def _download_protocols(
    store: DataStore,
    server: str,
    selection: dict,
    state: dict | None,
    pending: list[int] | None,
):
    """Download protocols with progress tracking."""
    async with BundestagMCPClient(server) as client:
        # If no state, fetch protocol list first
        if state is None:
            console.print("\nFetching protocol list...")
            protocols, coverage_problems = await _select_protocols(client, selection)
            protocol_ids = [protocol["id"] for protocol in protocols]
            console.print(f"  Selected {len(protocol_ids)} protocols")
            if coverage_problems:
                console.print(f"  [yellow]Coverage problems: {len(coverage_problems)}[/]")

            state = store.init_state(server, selection, protocols, coverage_problems)
            pending = protocol_ids

        # Download each protocol
        total = len(pending)
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("{task.completed}/{task.total}"),
            console=console,
        ) as progress:
            task = progress.add_task("Downloading...", total=total)

            for i, protocol_id in enumerate(pending):
                progress.update(task, description=f"Protocol {protocol_id}")

                try:
                    result = await client.get_plenarprotokoll(protocol_id, include_full_text=True)
                    if result:
                        store.save_protocol(protocol_id, result)
                        store.mark_downloaded(state, protocol_id)
                    else:
                        store.mark_failed(state, protocol_id)
                except Exception as e:
                    console.print(f"\n[red]Failed {protocol_id}: {e}[/]")
                    store.mark_failed(state, protocol_id)

                progress.update(task, completed=i + 1)

    # Summary
    summary = store.get_progress_summary()
    console.print(f"\n[green]Download complete![/]")
    console.print(f"  Downloaded: {summary['downloaded']}")
    if summary["failed"]:
        console.print(f"  [red]Failed: {summary['failed']} (will retry on next run)[/]")
        raise click.ClickException(
            f"{summary['failed']} of {summary['total_protocols']} protocols could not be downloaded"
        )


@click.command()
@click.argument("data_dir", type=click.Path(exists=True))
def parse(data_dir: str):
    """Parse downloaded protocols into speeches.json."""
    store = DataStore(data_dir)

    if not store.has_state():
        console.print("[red]No state.json found. Run 'download' first.[/]")
        raise SystemExit(1)

    state = store.load_state()
    if state.get("stateSchemaVersion") != STATE_SCHEMA_VERSION:
        console.print("[red]Unsupported download state. Start a new download with the current CLI.[/]")
        raise SystemExit(1)
    downloaded = state.get("downloaded", [])

    if not downloaded:
        console.print("[yellow]No protocols downloaded yet.[/]")
        raise SystemExit(1)

    console.print(f"[bold]Parsing {len(downloaded)} protocols...[/]")

    speeches_by_party: dict[str, list[dict]] = {}

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        console=console,
    ) as progress:
        task = progress.add_task("Parsing...", total=len(downloaded))

        protocols = [
            protocol
            for protocol in state.get("protocols", [])
            if protocol.get("id") in downloaded
        ]
        for i, protocol_metadata in enumerate(sorted(protocols, key=_protocol_sort_key)):
            protocol_id = protocol_metadata["id"]
            progress.update(task, description=f"Protocol {protocol_id}")

            protocol = store.load_protocol(protocol_id)
            if not protocol:
                continue

            full_text = protocol.get("fullText", "")
            if not full_text or not isinstance(full_text, str):
                continue

            speeches = parse_speeches_from_protocol(full_text)
            for speech_position, speech in enumerate(speeches, start=1):
                speech = {
                    **speech,
                    "protocolId": protocol_id,
                    "protocolNumber": protocol_metadata["protocolNumber"],
                    "protocolDate": protocol_metadata["protocolDate"],
                    "wahlperiode": protocol_metadata["wahlperiode"],
                    "speechPosition": speech_position,
                }
                party = speech["party"]
                if party not in speeches_by_party:
                    speeches_by_party[party] = []
                speeches_by_party[party].append(speech)

            progress.update(task, completed=i + 1)

    # Preserve a deterministic ordering inside every party collection.
    for party_speeches in speeches_by_party.values():
        party_speeches.sort(
            key=lambda speech: (
                speech["protocolDate"],
                speech["wahlperiode"],
                _session_number(speech["protocolNumber"]),
                speech["speechPosition"],
            )
        )

    # Save speeches
    store.save_speeches(speeches_by_party)

    # Update state
    state["parsed"] = True
    store.save_state(state)

    # Summary
    total_speeches = sum(len(s) for s in speeches_by_party.values())
    console.print(f"\n[green]Parsing complete![/]")
    console.print(f"  Total speeches: {total_speeches}")
    console.print(f"  Parties: {', '.join(speeches_by_party.keys())}")
    console.print(f"  Saved to: {store.speeches_file}")


@click.command()
@click.argument("data_dir", type=click.Path(exists=True))
def status(data_dir: str):
    """Show download/parse progress for a data directory."""
    store = DataStore(data_dir)
    summary = store.get_progress_summary()

    if summary["status"] == "not_started":
        console.print("[yellow]No download started in this directory.[/]")
        return

    table = Table(title=f"Status: {data_dir}")
    table.add_column("Property", style="cyan")
    table.add_column("Value", justify="right")

    table.add_row("Wahlperioden", ", ".join(map(str, summary["wahlperioden"])))
    table.add_row("Server", summary["server"])
    table.add_row("Total protocols", str(summary["total_protocols"]))
    table.add_row("Downloaded", f"[green]{summary['downloaded']}[/]")
    table.add_row("Pending", str(summary["pending"]))
    if summary["failed"]:
        table.add_row("Failed", f"[red]{summary['failed']}[/]")
    if summary["coverage_problems"]:
        table.add_row("Coverage problems", f"[yellow]{summary['coverage_problems']}[/]")
    table.add_row("Parsed", "[green]Yes[/]" if summary["parsed"] else "[yellow]No[/]")
    table.add_row("Last updated", summary["last_updated"] or "-")

    console.print(table)
