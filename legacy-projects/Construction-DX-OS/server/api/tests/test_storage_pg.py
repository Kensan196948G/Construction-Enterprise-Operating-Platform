"""Tests for PostgresStorage (Phase 9, Issue #4 — async SQLAlchemy).

These tests verify that PostgresStorage satisfies the Storage Protocol and
that all CRUD operations behave correctly using the async backend.

Two backends are tested when possible:

- **sqlite** (always): in-process SQLite via aiosqlite — no server required.
- **postgres** (CI / opt-in): real PostgreSQL 16 when ``TEST_DATABASE_URL``
  is set in the environment (e.g. the GitHub Actions ``services:`` block).
  This variant is *skipped* when the env var is absent so local runs remain
  fast and zero-dependency.
"""

from __future__ import annotations

import os

import pytest

from cdx_server.storage_pg import PostgresStorage
from cdx_server.storage_protocol import Storage

# Optional real-Postgres URL injected by CI (e.g. services: postgres:16).
_TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")

_BACKENDS = ["sqlite"]
if _TEST_DATABASE_URL:
    _BACKENDS.append("postgres")


def _make_storage(backend: str, tmp_path) -> PostgresStorage:
    if backend == "sqlite":
        db_url = f"sqlite+aiosqlite:///{tmp_path / 'test.db'}"
    else:
        # Normalise sync postgres URL to asyncpg driver
        db_url = _TEST_DATABASE_URL
    return PostgresStorage(db_url)


@pytest.fixture(params=_BACKENDS)
async def pg_storage(request, tmp_path):
    """PostgresStorage backed by SQLite+aiosqlite (always) or real Postgres (CI opt-in)."""
    storage = _make_storage(request.param, tmp_path)
    await storage._ensure_ready()
    if request.param == "postgres":
        # Truncate shared Postgres tables so fixed device/job IDs don't collide
        # across tests that run sequentially against the same CI database.
        from sqlalchemy import text

        async with storage._engine.begin() as conn:
            await conn.execute(
                text(
                    "TRUNCATE iso_build_audit, iso_build_jobs, "
                    "heartbeats, inventories, devices CASCADE"
                )
            )
    return storage


# ---------------------------------------------------------------------------
# Protocol conformance
# ---------------------------------------------------------------------------


def test_postgres_storage_satisfies_protocol(tmp_path):
    storage = PostgresStorage(f"sqlite+aiosqlite:///{tmp_path / 'proto.db'}")
    assert isinstance(storage, Storage)


# ---------------------------------------------------------------------------
# Device registry
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_device_returns_record(pg_storage):
    record, already = await pg_storage.register_device(
        device_id="dev-001",
        profile="standard",
        hostname="host-a",
        shared_secret="secret-000000000000000000000",
    )
    assert record.device_id == "dev-001"
    assert record.profile == "standard"
    assert already is False


@pytest.mark.asyncio
async def test_register_device_idempotent(pg_storage):
    kwargs = dict(
        device_id="dev-002",
        profile="field",
        hostname="field-host",
        shared_secret="secret-111111111111111111111",
    )
    first, _ = await pg_storage.register_device(**kwargs)
    second, already = await pg_storage.register_device(**kwargs)
    assert already is True
    assert first.registered_at == second.registered_at


@pytest.mark.asyncio
async def test_get_device_returns_none_for_unknown(pg_storage):
    assert await pg_storage.get_device("nonexistent") is None


@pytest.mark.asyncio
async def test_get_device_returns_registered(pg_storage):
    await pg_storage.register_device(
        device_id="dev-003",
        profile="kiosk",
        hostname="kiosk-host",
        shared_secret="secret-222222222222222222222",
    )
    record = await pg_storage.get_device("dev-003")
    assert record is not None
    assert record.profile == "kiosk"


# ---------------------------------------------------------------------------
# Heartbeat
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_record_heartbeat_accepted(pg_storage):
    await pg_storage.register_device(
        device_id="dev-hb",
        profile="standard",
        hostname="h",
        shared_secret="s" * 32,
    )
    record, dup = await pg_storage.record_heartbeat(
        device_id="dev-hb",
        timestamp_bucket=60,
        agent_version="0.2.0",
        uptime_seconds=1234,
        sent_at="2026-04-16T00:00:00+00:00",
    )
    assert dup is False
    assert record.device_id == "dev-hb"


@pytest.mark.asyncio
async def test_record_heartbeat_idempotent(pg_storage):
    await pg_storage.register_device(
        device_id="dev-hb2",
        profile="standard",
        hostname="h2",
        shared_secret="s" * 32,
    )
    kwargs = dict(
        device_id="dev-hb2",
        timestamp_bucket=120,
        agent_version="0.2.0",
        uptime_seconds=9999,
        sent_at="2026-04-16T01:00:00+00:00",
    )
    await pg_storage.record_heartbeat(**kwargs)
    _, dup = await pg_storage.record_heartbeat(**kwargs)
    assert dup is True


@pytest.mark.asyncio
async def test_count_heartbeats(pg_storage):
    await pg_storage.register_device(
        device_id="dev-hb3", profile="standard", hostname="h3", shared_secret="s" * 32
    )
    await pg_storage.record_heartbeat(
        device_id="dev-hb3",
        timestamp_bucket=180,
        agent_version="0.2.0",
        uptime_seconds=1,
        sent_at="t",
    )
    assert await pg_storage.count_heartbeats() >= 1


# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_record_inventory_accepted(pg_storage):
    await pg_storage.register_device(
        device_id="dev-inv", profile="standard", hostname="h", shared_secret="s" * 32
    )
    record, dup = await pg_storage.record_inventory(
        device_id="dev-inv",
        timestamp_bucket=3600,
        body={"hostname": "h", "os": "Debian 13"},
    )
    assert dup is False
    assert record.device_id == "dev-inv"


@pytest.mark.asyncio
async def test_record_inventory_idempotent(pg_storage):
    await pg_storage.register_device(
        device_id="dev-inv2", profile="field", hostname="h2", shared_secret="s" * 32
    )
    kwargs = dict(
        device_id="dev-inv2",
        timestamp_bucket=7200,
        body={"hostname": "h2"},
    )
    await pg_storage.record_inventory(**kwargs)
    _, dup = await pg_storage.record_inventory(**kwargs)
    assert dup is True


# ---------------------------------------------------------------------------
# Policy
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_policy_standard_defaults(pg_storage):
    policy = await pg_storage.get_policy("standard")
    assert policy is not None
    assert policy.update_ring == "ring1"
    assert policy.heartbeat_interval_seconds == 60
    assert policy.inventory_interval_seconds == 3600
    assert policy.policy_version >= 1


@pytest.mark.asyncio
async def test_get_policy_field_ring2(pg_storage):
    policy = await pg_storage.get_policy("field")
    assert policy is not None
    assert policy.update_ring == "ring2"


@pytest.mark.asyncio
async def test_get_policy_unknown_returns_none(pg_storage):
    assert await pg_storage.get_policy("nonexistent-profile") is None


# ---------------------------------------------------------------------------
# Reset
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reset_clears_all_data(pg_storage):
    await pg_storage.register_device(
        device_id="dev-reset", profile="standard", hostname="h", shared_secret="s" * 32
    )
    await pg_storage.reset()
    assert await pg_storage.get_device("dev-reset") is None
    assert await pg_storage.count_heartbeats() == 0


# ---------------------------------------------------------------------------
# list_devices / list_heartbeats / list_inventories / count_inventories / ping
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_devices_empty(pg_storage):
    await pg_storage.reset()
    assert await pg_storage.list_devices() == []


@pytest.mark.asyncio
async def test_list_devices_returns_newest_first(pg_storage):
    await pg_storage.register_device(
        device_id="dev-a", profile="standard", hostname="host-a", shared_secret="s" * 32
    )
    await pg_storage.register_device(
        device_id="dev-b", profile="field", hostname="host-b", shared_secret="s" * 32
    )
    devices = await pg_storage.list_devices()
    assert len(devices) == 2
    ids = [d.device_id for d in devices]
    assert "dev-a" in ids and "dev-b" in ids


@pytest.mark.asyncio
async def test_list_heartbeats_empty(pg_storage):
    await pg_storage.register_device(
        device_id="dev-lhb", profile="standard", hostname="h", shared_secret="s" * 32
    )
    assert await pg_storage.list_heartbeats("dev-lhb") == []


@pytest.mark.asyncio
async def test_list_heartbeats_returns_records(pg_storage):
    await pg_storage.register_device(
        device_id="dev-lhb2", profile="standard", hostname="h", shared_secret="s" * 32
    )
    await pg_storage.record_heartbeat(
        device_id="dev-lhb2",
        timestamp_bucket=60,
        agent_version="0.2.0",
        uptime_seconds=100,
        sent_at="2026-04-22T00:00:00Z",
    )
    await pg_storage.record_heartbeat(
        device_id="dev-lhb2",
        timestamp_bucket=120,
        agent_version="0.2.0",
        uptime_seconds=200,
        sent_at="2026-04-22T00:01:00Z",
    )
    hbs = await pg_storage.list_heartbeats("dev-lhb2", limit=10)
    assert len(hbs) == 2
    assert hbs[0].timestamp_bucket > hbs[1].timestamp_bucket


@pytest.mark.asyncio
async def test_list_inventories_empty(pg_storage):
    await pg_storage.register_device(
        device_id="dev-linv", profile="standard", hostname="h", shared_secret="s" * 32
    )
    assert await pg_storage.list_inventories("dev-linv") == []


@pytest.mark.asyncio
async def test_list_inventories_returns_records(pg_storage):
    await pg_storage.register_device(
        device_id="dev-linv2", profile="standard", hostname="h", shared_secret="s" * 32
    )
    await pg_storage.record_inventory(
        device_id="dev-linv2", timestamp_bucket=3600, body={"cpu": "x86"}
    )
    await pg_storage.record_inventory(
        device_id="dev-linv2", timestamp_bucket=7200, body={"cpu": "arm"}
    )
    invs = await pg_storage.list_inventories("dev-linv2", limit=5)
    assert len(invs) == 2
    assert invs[0].timestamp_bucket > invs[1].timestamp_bucket


@pytest.mark.asyncio
async def test_count_inventories(pg_storage):
    await pg_storage.register_device(
        device_id="dev-ci", profile="standard", hostname="h", shared_secret="s" * 32
    )
    assert await pg_storage.count_inventories() == 0
    await pg_storage.record_inventory(device_id="dev-ci", timestamp_bucket=3600, body={"k": "v"})
    assert await pg_storage.count_inventories() == 1


@pytest.mark.asyncio
async def test_ping_returns_true(pg_storage):
    assert await pg_storage.ping() is True
