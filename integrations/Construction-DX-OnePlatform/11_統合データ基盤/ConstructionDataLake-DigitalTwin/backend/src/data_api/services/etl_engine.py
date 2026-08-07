"""ETL execution engine.

Lightweight async ETL skeleton that:
  1. fetches data from a department REST API using httpx (or a provided fetcher),
  2. applies an ordered list of transform steps (rename / drop / cast / filter),
  3. persists curated rows back to the Data Lake (PostgreSQL via SQLAlchemy in
     production; an in-memory sink is used for tests / dev).

In production a real Airflow DAG (cdx_etl_*) calls into the same primitive
functions defined here, keeping unit-test parity with the deployed pipeline.
"""
from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable, Iterable, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import httpx

logger = logging.getLogger(__name__)

Row = dict[str, Any]
Fetcher = Callable[[], Awaitable[Sequence[Row]]]
Sink = Callable[[str, Sequence[Row]], Awaitable[int]]


@dataclass
class TransformStep:
    """A single declarative transform step."""

    op: str  # rename | drop | cast | filter
    config: dict[str, Any] = field(default_factory=dict)


@dataclass
class ExtractResult:
    rows: list[Row]
    fetched_at: datetime


@dataclass
class EtlOutcome:
    rows_in: int
    rows_out: int
    output_table: str
    started_at: datetime
    finished_at: datetime
    status: str
    error_message: str | None = None


async def fetch_via_http(
    url: str,
    *,
    headers: dict[str, str] | None = None,
    params: dict[str, Any] | None = None,
    timeout: float = 30.0,
    client: httpx.AsyncClient | None = None,
) -> list[Row]:
    """Fetch JSON list of rows from an HTTP endpoint."""
    own_client = client is None
    cli = client or httpx.AsyncClient(timeout=timeout)
    try:
        resp = await cli.get(url, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict) and "items" in data:
            data = data["items"]
        if not isinstance(data, list):
            raise ValueError(f"unexpected payload shape from {url}: {type(data).__name__}")
        return [dict(r) for r in data]
    finally:
        if own_client:
            await cli.aclose()


def apply_transforms(rows: Sequence[Row], steps: Iterable[TransformStep | dict]) -> list[Row]:
    """Apply an ordered set of transforms. Returns a new list, never mutates input."""
    out: list[Row] = [dict(r) for r in rows]
    for raw in steps:
        step = raw if isinstance(raw, TransformStep) else TransformStep(op=raw.get("op", ""), config=raw.get("config", {}))
        if step.op == "rename":
            mapping = step.config.get("mapping", {})
            out = [{mapping.get(k, k): v for k, v in r.items()} for r in out]
        elif step.op == "drop":
            cols = set(step.config.get("columns", []))
            out = [{k: v for k, v in r.items() if k not in cols} for r in out]
        elif step.op == "cast":
            casts = step.config.get("columns", {})  # {"price": "int", "active": "bool"}
            out = [_cast_row(r, casts) for r in out]
        elif step.op == "filter":
            where = step.config.get("where", {})
            out = [r for r in out if all(r.get(k) == v for k, v in where.items())]
        else:
            logger.warning("unknown transform op: %s", step.op)
    return out


def _cast_row(row: Row, casts: dict[str, str]) -> Row:
    new = dict(row)
    for col, target in casts.items():
        if col not in new or new[col] is None:
            continue
        try:
            if target == "int":
                new[col] = int(new[col])
            elif target == "float":
                new[col] = float(new[col])
            elif target == "str":
                new[col] = str(new[col])
            elif target == "bool":
                new[col] = bool(new[col])
        except (TypeError, ValueError):
            logger.debug("cast failed col=%s target=%s value=%r", col, target, new[col])
    return new


class InMemorySink:
    """Simple in-memory sink used for tests / local dev."""

    def __init__(self) -> None:
        self.tables: dict[str, list[Row]] = {}

    async def __call__(self, table: str, rows: Sequence[Row]) -> int:
        self.tables.setdefault(table, []).extend(dict(r) for r in rows)
        return len(rows)


async def run_etl(
    *,
    fetcher: Fetcher,
    transforms: Iterable[TransformStep | dict],
    sink: Sink,
    output_table: str,
) -> EtlOutcome:
    """Execute fetch -> transform -> save and return a structured outcome."""
    started_at = datetime.now(UTC)
    try:
        raw = list(await fetcher())
        curated = apply_transforms(raw, transforms)
        rows_out = await sink(output_table, curated)
        finished_at = datetime.now(UTC)
        return EtlOutcome(
            rows_in=len(raw),
            rows_out=rows_out,
            output_table=output_table,
            started_at=started_at,
            finished_at=finished_at,
            status="success",
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("ETL failed for %s", output_table)
        return EtlOutcome(
            rows_in=0,
            rows_out=0,
            output_table=output_table,
            started_at=started_at,
            finished_at=datetime.now(UTC),
            status="failed",
            error_message=str(exc),
        )
