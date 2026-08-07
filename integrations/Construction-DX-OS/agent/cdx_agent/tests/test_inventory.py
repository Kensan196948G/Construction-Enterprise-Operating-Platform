"""Tests for cdx_agent.inventory."""

from __future__ import annotations

from cdx_agent.inventory import InventorySnapshot, collect


def test_collect_returns_snapshot_with_device_id():
    snapshot = collect("unit-test-device")
    assert isinstance(snapshot, InventorySnapshot)
    assert snapshot.device_id == "unit-test-device"


def test_collect_returns_non_empty_hostname_and_kernel():
    snapshot = collect("d1")
    assert snapshot.hostname
    assert snapshot.kernel_version


def test_collect_memory_is_non_negative_int():
    snapshot = collect("d1")
    assert isinstance(snapshot.memory_bytes, int)
    assert snapshot.memory_bytes >= 0


def test_snapshot_is_json_serialisable():
    import json

    snapshot = collect("d1")
    payload = json.dumps(snapshot.to_dict())
    assert '"device_id": "d1"' in payload


def test_snapshot_contains_expected_fields():
    snapshot = collect("d1")
    expected = {
        "device_id",
        "hostname",
        "cpu",
        "cpu_count",
        "memory_bytes",
        "os_version",
        "kernel_version",
        "timezone",
        "collected_at",
    }
    assert expected <= set(snapshot.to_dict().keys())
