"""Direct tests for the InMemoryStorage backend."""

from __future__ import annotations

import pytest

from cdx_server.storage import InMemoryStorage

SECRET = "test-secret-at-least-sixteen-chars"


@pytest.mark.asyncio
async def test_register_and_lookup():
    storage = InMemoryStorage()
    record, already = await storage.register_device(
        device_id="d1", profile="standard", hostname="h1", shared_secret=SECRET
    )
    assert already is False
    assert await storage.get_device("d1") == record


@pytest.mark.asyncio
async def test_register_is_idempotent():
    storage = InMemoryStorage()
    a, _ = await storage.register_device(
        device_id="d1", profile="standard", hostname="h1", shared_secret=SECRET
    )
    b, already = await storage.register_device(
        device_id="d1", profile="field", hostname="h1-new", shared_secret="different"
    )
    assert already is True
    assert b == a  # original record preserved; later calls do not overwrite


@pytest.mark.asyncio
async def test_record_heartbeat_dedupes_by_bucket():
    storage = InMemoryStorage()
    await storage.register_device(
        device_id="d1", profile="standard", hostname="h", shared_secret=SECRET
    )
    await storage.record_heartbeat(
        device_id="d1", timestamp_bucket=60, agent_version="v", uptime_seconds=0, sent_at="x"
    )
    _, dup = await storage.record_heartbeat(
        device_id="d1", timestamp_bucket=60, agent_version="v", uptime_seconds=0, sent_at="x"
    )
    assert dup is True
    assert await storage.count_heartbeats() == 1


@pytest.mark.asyncio
async def test_reset_clears_all():
    storage = InMemoryStorage()
    await storage.register_device(
        device_id="d1", profile="standard", hostname="h", shared_secret=SECRET
    )
    await storage.record_heartbeat(
        device_id="d1", timestamp_bucket=60, agent_version="v", uptime_seconds=0, sent_at="x"
    )
    storage.reset()
    assert await storage.count_heartbeats() == 0
    assert await storage.get_device("d1") is None
