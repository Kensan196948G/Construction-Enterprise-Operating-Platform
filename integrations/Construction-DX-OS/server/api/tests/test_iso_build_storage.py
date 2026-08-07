"""Tests for the IsoBuildStorage Protocol on PostgresStorage (Issue 0024).

Phase 9 (Issue #4): Rewritten to use the async PostgresStorage with aiosqlite.

Coverage targets:
- Protocol conformance (PostgresStorage is structurally an IsoBuildStorage)
- insert / get / list / count happy paths
- update partial-field semantics (None means "leave alone")
- audit append + filter by job_id and actor
"""

from __future__ import annotations

import os
from datetime import UTC, datetime

import pytest

from cdx_server.storage_pg import PostgresStorage
from cdx_server.storage_protocol import IsoBuildStorage

_TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")

_BACKENDS = ["sqlite"]
if _TEST_DATABASE_URL:
    _BACKENDS.append("postgres")


def _make_storage(backend: str, tmp_path) -> PostgresStorage:
    if backend == "sqlite":
        db_url = f"sqlite+aiosqlite:///{tmp_path / 'iso.db'}"
    else:
        # For postgres, normalise to asyncpg driver
        db_url = _TEST_DATABASE_URL
    return PostgresStorage(db_url)


@pytest.fixture(params=_BACKENDS)
async def iso_storage(request, tmp_path):
    storage = _make_storage(request.param, tmp_path)
    await storage._ensure_ready()
    if request.param == "postgres":
        # Truncate shared Postgres tables so fixed IDs (e.g. "job-001") don't
        # collide across tests that run sequentially in the same CI database.
        from sqlalchemy import text

        async with storage._engine.begin() as conn:
            await conn.execute(text("TRUNCATE iso_build_audit, iso_build_jobs CASCADE"))
    return storage


# ---------------------------------------------------------------------------
# Protocol conformance
# ---------------------------------------------------------------------------


def test_protocol_conformance(tmp_path):
    storage = PostgresStorage(f"sqlite+aiosqlite:///{tmp_path / 'proto.db'}")
    assert isinstance(storage, IsoBuildStorage)


# ---------------------------------------------------------------------------
# insert / get
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_insert_iso_build_job_returns_queued_record(iso_storage):
    record = await iso_storage.insert_iso_build_job(
        job_id="job-001",
        profile="standard",
        requested_by="alice@example.com",
        git_ref="main@abc1234",
        notes="initial smoke test",
    )
    assert record.id == "job-001"
    assert record.profile == "standard"
    assert record.status == "queued"
    assert record.requested_by == "alice@example.com"
    assert record.notes == "initial smoke test"
    assert record.started_at is None
    assert record.finished_at is None
    assert record.iso_path is None
    assert record.created_at is not None


@pytest.mark.asyncio
async def test_get_iso_build_job_returns_none_for_missing(iso_storage):
    assert await iso_storage.get_iso_build_job("nonexistent") is None


@pytest.mark.asyncio
async def test_get_iso_build_job_round_trip(iso_storage):
    await iso_storage.insert_iso_build_job(
        job_id="job-rt",
        profile="field",
        requested_by="bob",
        git_ref="release/1.0",
    )
    record = await iso_storage.get_iso_build_job("job-rt")
    assert record is not None
    assert record.profile == "field"
    assert record.git_ref == "release/1.0"


# ---------------------------------------------------------------------------
# list / count
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_iso_build_jobs_filters_and_orders(iso_storage):
    for i, profile in enumerate(["standard", "field", "kiosk", "standard"]):
        await iso_storage.insert_iso_build_job(
            job_id=f"job-{i:03d}",
            profile=profile,
            requested_by="alice",
            git_ref="main",
        )

    all_jobs = await iso_storage.list_iso_build_jobs(limit=10)
    assert len(all_jobs) == 4
    # Most-recently-created first.
    assert all_jobs[0].id == "job-003"

    standard_only = await iso_storage.list_iso_build_jobs(profile="standard")
    assert {j.id for j in standard_only} == {"job-000", "job-003"}

    queued_only = await iso_storage.list_iso_build_jobs(status="queued")
    assert len(queued_only) == 4

    none_running = await iso_storage.list_iso_build_jobs(status="running")
    assert none_running == []


@pytest.mark.asyncio
async def test_count_iso_build_jobs(iso_storage):
    for i in range(3):
        await iso_storage.insert_iso_build_job(
            job_id=f"cnt-{i}",
            profile="kiosk",
            requested_by="alice",
            git_ref="main",
        )
    assert await iso_storage.count_iso_build_jobs() == 3
    assert await iso_storage.count_iso_build_jobs(status="queued") == 3
    assert await iso_storage.count_iso_build_jobs(status="failed") == 0


# ---------------------------------------------------------------------------
# update — partial-field semantics
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_iso_build_job_partial_fields(iso_storage):
    await iso_storage.insert_iso_build_job(
        job_id="upd-1",
        profile="standard",
        requested_by="alice",
        git_ref="main",
        notes="original",
    )
    started = datetime.now(UTC)

    updated = await iso_storage.update_iso_build_job(
        "upd-1",
        status="running",
        started_at=started,
    )
    assert updated is not None
    assert updated.status == "running"
    assert updated.started_at is not None
    # Untouched fields remain.
    assert updated.notes == "original"
    assert updated.finished_at is None
    assert updated.iso_path is None


@pytest.mark.asyncio
async def test_update_iso_build_job_terminal_state(iso_storage):
    await iso_storage.insert_iso_build_job(
        job_id="upd-2",
        profile="standard",
        requested_by="alice",
        git_ref="main",
    )
    finished = datetime.now(UTC)
    updated = await iso_storage.update_iso_build_job(
        "upd-2",
        status="succeeded",
        finished_at=finished,
        iso_path="/var/iso/upd-2.iso",
        iso_sha256="0" * 64,
        iso_size_bytes=1234567890,
        log_path="/var/log/upd-2.log",
    )
    assert updated is not None
    assert updated.status == "succeeded"
    assert updated.iso_path == "/var/iso/upd-2.iso"
    assert updated.iso_sha256 == "0" * 64
    assert updated.iso_size_bytes == 1234567890
    assert updated.log_path == "/var/log/upd-2.log"


@pytest.mark.asyncio
async def test_update_iso_build_job_returns_none_for_missing(iso_storage):
    assert await iso_storage.update_iso_build_job("ghost", status="running") is None


# ---------------------------------------------------------------------------
# audit
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_append_and_list_audit(iso_storage):
    await iso_storage.insert_iso_build_job(
        job_id="aud-1",
        profile="standard",
        requested_by="alice",
        git_ref="main",
    )
    await iso_storage.append_iso_build_audit(
        job_id="aud-1", actor="alice", action="enqueue", request_id="req-1"
    )
    await iso_storage.append_iso_build_audit(
        job_id="aud-1", actor="bob", action="view", request_id="req-2"
    )

    rows_for_job = await iso_storage.list_iso_build_audit(job_id="aud-1")
    assert len(rows_for_job) == 2
    assert rows_for_job[0].request_id is not None

    rows_for_actor = await iso_storage.list_iso_build_audit(actor="alice")
    assert len(rows_for_actor) == 1
    assert rows_for_actor[0].action == "enqueue"

    no_match = await iso_storage.list_iso_build_audit(actor="charlie")
    assert no_match == []
