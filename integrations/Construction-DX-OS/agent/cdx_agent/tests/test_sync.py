"""Tests for cdx_agent.sync.

We exercise the orchestrator against a fake ApiClient so the spool semantics
(order preservation, partial drain, offline fallback) are directly verified.
"""

from __future__ import annotations

from dataclasses import dataclass

from cdx_agent.api_client import SendResult
from cdx_agent.spool import Spool, SpoolEntry
from cdx_agent.sync import SyncOrchestrator


@dataclass
class _FakeClient:
    """Implements the minimal ApiClient surface SyncOrchestrator uses."""

    script: list  # list of either SendResult or Exception instances
    calls: list = None  # populated per call: list of (payload_type, body, path)

    def __post_init__(self):
        self.calls = []

    def send(self, payload_type, body, path):
        self.calls.append((payload_type, body, path))
        effect = self.script.pop(0)
        if isinstance(effect, Exception):
            raise effect
        return effect


def _spool(tmp_path):
    return Spool(tmp_path / "outbox.jsonl")


def test_enqueue_writes_entry_to_spool(tmp_path):
    spool = _spool(tmp_path)
    orch = SyncOrchestrator(_FakeClient(script=[]), spool)
    orch.enqueue("heartbeat", {"uptime": 1}, now=5.0)
    rows = spool.load_all()
    assert rows == [SpoolEntry(payload_type="heartbeat", body={"uptime": 1}, enqueued_at=5.0)]


def test_drain_flushes_all_when_every_send_succeeds(tmp_path):
    spool = _spool(tmp_path)
    for n in range(3):
        spool.append(SpoolEntry("heartbeat", {"n": n}, enqueued_at=float(n)))
    client = _FakeClient(
        script=[
            SendResult(ok=True, status_code=202, url="x", payload_type="heartbeat"),
            SendResult(ok=True, status_code=202, url="x", payload_type="heartbeat"),
            SendResult(ok=True, status_code=202, url="x", payload_type="heartbeat"),
        ]
    )
    orch = SyncOrchestrator(client, spool)

    result = orch.drain()
    assert result.total == 3
    assert result.sent == 3
    assert result.remaining == 0
    assert result.all_flushed
    assert spool.load_all() == []


def test_drain_stops_on_first_failure_and_preserves_remaining(tmp_path):
    spool = _spool(tmp_path)
    for n in range(3):
        spool.append(SpoolEntry("heartbeat", {"n": n}, enqueued_at=float(n)))
    client = _FakeClient(
        script=[
            SendResult(ok=True, status_code=202, url="x", payload_type="heartbeat"),
            SendResult(ok=False, status_code=500, url="x", payload_type="heartbeat"),
        ]
    )
    orch = SyncOrchestrator(client, spool)

    result = orch.drain()
    assert result.total == 3
    assert result.sent == 1
    assert result.remaining == 2
    assert result.failed_status == 500
    # The two un-sent entries survive, in order.
    surviving = spool.load_all()
    assert [e.body["n"] for e in surviving] == [1, 2]


def test_drain_preserves_entries_on_transport_exception(tmp_path):
    spool = _spool(tmp_path)
    spool.append(SpoolEntry("heartbeat", {"n": 0}, enqueued_at=0.0))
    spool.append(SpoolEntry("heartbeat", {"n": 1}, enqueued_at=1.0))
    client = _FakeClient(script=[ConnectionError("network down")])
    orch = SyncOrchestrator(client, spool)

    result = orch.drain()
    assert result.sent == 0
    assert result.remaining == 2
    assert result.failed_status is None
    assert [e.body["n"] for e in spool.load_all()] == [0, 1]


def test_drain_drops_unknown_payload_type(tmp_path):
    """Unknown payload types are a programmer error; don't clog the spool."""
    spool = _spool(tmp_path)
    spool.append(SpoolEntry("totally-new", {"x": 1}, enqueued_at=0.0))
    client = _FakeClient(script=[])  # should never be called

    orch = SyncOrchestrator(client, spool)
    result = orch.drain()
    assert result.total == 1
    assert result.sent == 1
    assert result.remaining == 0
    assert spool.load_all() == []
    assert client.calls == []


def test_drain_logs_warning_when_spool_truncation_fails(tmp_path, monkeypatch):
    """OSError from replace_all after all sends succeed: result is still all_flushed."""
    spool = _spool(tmp_path)
    spool.append(SpoolEntry("heartbeat", {"n": 0}, enqueued_at=0.0))
    client = _FakeClient(
        script=[SendResult(ok=True, status_code=202, url="x", payload_type="heartbeat")]
    )

    _original = spool.replace_all

    def _raise_on_truncate(entries):
        if not entries:
            raise OSError("disk full")
        return _original(entries)

    monkeypatch.setattr(spool, "replace_all", _raise_on_truncate)

    orch = SyncOrchestrator(client, spool)
    result = orch.drain()

    assert result.sent == 1
    assert result.total == 1
    assert result.remaining == 0
    assert result.all_flushed


def test_drain_routes_by_payload_type(tmp_path):
    spool = _spool(tmp_path)
    spool.append(SpoolEntry("heartbeat", {}, enqueued_at=0.0))
    spool.append(SpoolEntry("inventory", {}, enqueued_at=1.0))
    client = _FakeClient(
        script=[
            SendResult(ok=True, status_code=200, url="x", payload_type="heartbeat"),
            SendResult(ok=True, status_code=200, url="x", payload_type="inventory"),
        ]
    )
    orch = SyncOrchestrator(client, spool)
    orch.drain()

    paths = [call[2] for call in client.calls]
    assert paths == ["/api/v1/heartbeat", "/api/v1/inventory"]
