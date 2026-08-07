"""Verify InMemoryStorage satisfies the Storage Protocol.

This is a ``runtime_checkable`` Protocol so isinstance() works for documentation
and to catch "forgot to implement" bugs early. The check imports both modules,
which also acts as a lightweight smoke test that there's no circular import.

Phase 9 (Issue #4): All Protocol methods are now ``async def``.
"""

from __future__ import annotations

from cdx_server.storage import InMemoryStorage
from cdx_server.storage_protocol import Storage


def test_in_memory_storage_satisfies_protocol():
    storage = InMemoryStorage()
    assert isinstance(storage, Storage)


def test_storage_protocol_advertises_required_methods():
    """Defensive: if someone removes a method from the Protocol, this test
    flags it before downstream backends silently drift."""
    expected = {
        "register_device",
        "get_device",
        "record_heartbeat",
        "count_heartbeats",
        "record_inventory",
        "count_inventories",
    }
    actual = {name for name in dir(Storage) if not name.startswith("_")}
    assert expected <= actual
