"""ETL engine: fetch -> transform -> save (mock httpx)."""
from __future__ import annotations

import pytest
from data_api.services.etl_engine import (
    InMemorySink,
    TransformStep,
    apply_transforms,
    run_etl,
)


@pytest.mark.asyncio
async def test_run_etl_persists_two_rows_with_rename() -> None:
    """Mock fetcher yields 2 rows; verify rename + persist."""
    sink = InMemorySink()

    async def fetcher():
        return [
            {"id": 1, "amount": "100", "system_name": "construction"},
            {"id": 2, "amount": "250", "system_name": "construction"},
        ]

    outcome = await run_etl(
        fetcher=fetcher,
        transforms=[
            TransformStep(op="rename", config={"mapping": {"amount": "actual_amount"}}),
            TransformStep(op="cast", config={"columns": {"actual_amount": "int"}}),
        ],
        sink=sink,
        output_table="curated_cost_records",
    )

    assert outcome.status == "success"
    assert outcome.rows_in == 2
    assert outcome.rows_out == 2
    rows = sink.tables["curated_cost_records"]
    assert len(rows) == 2
    assert rows[0]["actual_amount"] == 100  # cast to int
    assert "amount" not in rows[0]  # original col renamed away


@pytest.mark.asyncio
async def test_run_etl_filter_drops_rows() -> None:
    """Filter transform should drop rows that don't match."""
    sink = InMemorySink()

    async def fetcher():
        return [
            {"id": 1, "status": "active"},
            {"id": 2, "status": "inactive"},
            {"id": 3, "status": "active"},
        ]

    outcome = await run_etl(
        fetcher=fetcher,
        transforms=[
            {"op": "filter", "config": {"where": {"status": "active"}}},
            {"op": "drop", "config": {"columns": ["status"]}},
        ],
        sink=sink,
        output_table="curated_active",
    )

    assert outcome.rows_in == 3
    assert outcome.rows_out == 2
    rows = sink.tables["curated_active"]
    assert {r["id"] for r in rows} == {1, 3}
    assert all("status" not in r for r in rows)


def test_apply_transforms_pure_function() -> None:
    rows = [{"a": "1"}, {"a": "x"}]
    out = apply_transforms(rows, [TransformStep(op="cast", config={"columns": {"a": "int"}})])
    assert out[0]["a"] == 1
    # original list untouched
    assert rows[0]["a"] == "1"
