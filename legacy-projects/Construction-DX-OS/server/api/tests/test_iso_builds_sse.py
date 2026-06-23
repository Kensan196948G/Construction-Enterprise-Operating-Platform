"""Tests for the SSE log-streaming endpoint (Issue 0023 Phase E).

GET /api/v1/iso-builds/{id}/log

The tests use InMemoryStorage (503) and a mock IsoBuildStorage to verify:
- 404 when job does not exist
- 503 when storage doesn't support ISO builds (InMemoryStorage)
- SSE stream produces status/ping/done events for a mock job
- stream terminates when job reaches terminal state
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app

# ---- 503 guard (InMemoryStorage) -------------------------------------------


@pytest.fixture()
def client() -> TestClient:
    return TestClient(create_app())


def test_sse_log_returns_503_without_postgres(client: TestClient) -> None:
    """InMemoryStorage returns 503 — same as other ISO Builder endpoints."""
    resp = client.get(
        "/api/v1/iso-builds/any-job-id/log",
        headers={"Authorization": "Basic YWRtaW46ZGV2dG9rZW4="},  # admin:devtoken
    )
    assert resp.status_code == 503


# ---- mock storage SSE tests ------------------------------------------------


@dataclass
class _MockJob:
    id: str
    profile: str = "field"
    status: str = "queued"
    log_path: str | None = None
    started_at: Any = None
    finished_at: Any = None
    iso_path: str | None = None
    iso_sha256: str | None = None
    iso_size_bytes: int | None = None
    error_message: str | None = None


class _MockIsoBuildStorage:
    """Minimal IsoBuildStorage stub for SSE unit tests."""

    def __init__(self, job: _MockJob | None = None) -> None:
        self._job = job

    async def get_iso_build_job(self, job_id: str) -> _MockJob | None:
        if self._job and self._job.id == job_id:
            return self._job
        return None

    # Unused by SSE but required to satisfy Protocol isinstance check
    async def insert_iso_build_job(self, **kwargs: Any) -> _MockJob:  # type: ignore[return]
        ...

    async def list_iso_build_jobs(self, **kwargs: Any) -> list:
        return []

    async def count_iso_build_jobs(self, **kwargs: Any) -> int:
        return 0

    async def update_iso_build_job(self, *args: Any, **kwargs: Any) -> None: ...

    async def append_iso_build_audit(self, **kwargs: Any) -> None: ...

    async def list_iso_build_audit(self, **kwargs: Any) -> list:
        return []


def test_sse_log_generator_404(monkeypatch: pytest.MonkeyPatch) -> None:
    """_log_event_generator yields error event when job not found."""
    monkeypatch.setenv("CDX_SSE_POLL_INTERVAL", "0")

    from cdx_server.routers.iso_builds import _log_event_generator

    storage = _MockIsoBuildStorage(job=None)

    async def _run() -> list[dict]:
        events = []
        async for ev in _log_event_generator("nonexistent-job", storage):  # type: ignore[arg-type]
            events.append(ev)
        return events

    events = asyncio.run(_run())
    assert any(e.get("event") == "error" for e in events)


def test_sse_log_generator_terminal_state(monkeypatch: pytest.MonkeyPatch) -> None:
    """Generator emits done event and terminates when job is already succeeded."""
    monkeypatch.setenv("CDX_SSE_POLL_INTERVAL", "0")

    from cdx_server.routers.iso_builds import _log_event_generator

    job = _MockJob(id="job-sse-001", status="succeeded")
    storage = _MockIsoBuildStorage(job=job)

    async def _run() -> list[dict]:
        events = []
        async for ev in _log_event_generator("job-sse-001", storage):  # type: ignore[arg-type]
            events.append(ev)
        return events

    events = asyncio.run(_run())
    event_names = [e.get("event") for e in events]
    assert "done" in event_names
    assert "status" in event_names


def test_sse_log_generator_ping_when_no_log(monkeypatch: pytest.MonkeyPatch) -> None:
    """Generator emits ping events when log_path is None (mock mode)."""
    monkeypatch.setenv("CDX_SSE_POLL_INTERVAL", "0")

    from cdx_server.routers.iso_builds import _log_event_generator

    job = _MockJob(id="job-sse-002", status="running", log_path=None)
    storage = _MockIsoBuildStorage(job=job)

    # Simulate job completing after 1 poll: mutate status after first check
    call_count = 0
    original_get = storage.get_iso_build_job

    async def _get(job_id: str) -> _MockJob | None:
        nonlocal call_count
        result = await original_get(job_id)
        call_count += 1
        if call_count >= 2 and result:
            result.status = "succeeded"
        return result

    storage.get_iso_build_job = _get  # type: ignore[method-assign]

    async def _run() -> list[dict]:
        events = []
        async for ev in _log_event_generator("job-sse-002", storage):  # type: ignore[arg-type]
            events.append(ev)
        return events

    events = asyncio.run(_run())
    event_names = [e.get("event") for e in events]
    assert "ping" in event_names
    assert "done" in event_names


def test_sse_log_generator_streams_log_file_lines(
    monkeypatch: pytest.MonkeyPatch, tmp_path
) -> None:
    """When log_path points at a real file, generator yields ``log`` events
    with each non-empty line (lines 377-385 of iso_builds.py)."""
    monkeypatch.setenv("CDX_SSE_POLL_INTERVAL", "0")

    log_file = tmp_path / "build.log"
    log_file.write_text("step 1: bootstrap\nstep 2: chroot\n\nstep 3: squashfs\n")

    from cdx_server.routers.iso_builds import _log_event_generator

    job = _MockJob(
        id="job-sse-003",
        status="running",
        log_path=str(log_file),
    )
    storage = _MockIsoBuildStorage(job=job)

    # Have the job finish after one poll so the generator terminates.
    call_count = 0
    original_get = storage.get_iso_build_job

    async def _get(job_id: str) -> _MockJob | None:
        nonlocal call_count
        result = await original_get(job_id)
        call_count += 1
        if call_count >= 2 and result:
            result.status = "succeeded"
        return result

    storage.get_iso_build_job = _get  # type: ignore[method-assign]

    async def _run() -> list[dict]:
        events = []
        async for ev in _log_event_generator("job-sse-003", storage):  # type: ignore[arg-type]
            events.append(ev)
        return events

    events = asyncio.run(_run())
    log_lines = [e["data"] for e in events if e.get("event") == "log"]
    assert "step 1: bootstrap" in log_lines
    assert "step 2: chroot" in log_lines
    assert "step 3: squashfs" in log_lines
    # Empty line should be filtered
    assert "" not in log_lines


def test_sse_log_generator_emits_timeout_when_exceeded(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """When CDX_SSE_TIMEOUT < CDX_SSE_POLL_INTERVAL the loop never iterates
    once and the generator yields a single ``timeout`` event (line 400)."""
    # Force the while-loop guard to fail on the very first check by setting
    # timeout=0 with a non-zero poll interval.
    monkeypatch.setenv("CDX_SSE_TIMEOUT", "0")
    monkeypatch.setenv("CDX_SSE_POLL_INTERVAL", "1")

    # Force module reload so the new env values are read at module import
    import importlib

    import cdx_server.routers.iso_builds as iso_builds_module

    importlib.reload(iso_builds_module)

    job = _MockJob(id="job-sse-004", status="running", log_path=None)
    storage = _MockIsoBuildStorage(job=job)

    async def _run() -> list[dict]:
        events = []
        async for ev in iso_builds_module._log_event_generator(
            "job-sse-004", storage
        ):  # type: ignore[arg-type]
            events.append(ev)
        return events

    events = asyncio.run(_run())
    event_names = [e.get("event") for e in events]
    assert event_names == ["timeout"]

    # Restore module state so subsequent tests see normal env values
    monkeypatch.delenv("CDX_SSE_TIMEOUT", raising=False)
    monkeypatch.delenv("CDX_SSE_POLL_INTERVAL", raising=False)
    importlib.reload(iso_builds_module)


def test_sse_log_endpoint_404_when_job_missing() -> None:
    """``stream_iso_build_log`` returns 404 before opening the SSE stream
    when the job_id is unknown (lines 423-428)."""
    import asyncio
    from dataclasses import dataclass

    from fastapi.testclient import TestClient

    from cdx_server.app import create_app
    from cdx_server.rate_limit import NullRateLimiter
    from cdx_server.storage_pg import PostgresStorage

    @dataclass
    class _Cfg:
        url: str

    async def _setup() -> PostgresStorage:
        import tempfile

        tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        tmp.close()
        storage = PostgresStorage(f"sqlite+aiosqlite:///{tmp.name}")
        await storage._ensure_ready()
        return storage

    storage = asyncio.run(_setup())
    app = create_app(storage=storage, rate_limiter=NullRateLimiter())
    client = TestClient(app)

    resp = client.get("/api/v1/iso-builds/no-such-id/log")
    assert resp.status_code == 404


def test_sse_log_endpoint_returns_event_source_response() -> None:
    """``stream_iso_build_log`` happy path returns an SSE response
    (covers the EventSourceResponse construction at lines 421-436)."""
    import asyncio

    from fastapi.testclient import TestClient

    from cdx_server.app import create_app
    from cdx_server.rate_limit import NullRateLimiter
    from cdx_server.storage_pg import PostgresStorage

    async def _setup() -> tuple[PostgresStorage, str]:
        import tempfile

        tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        tmp.close()
        storage = PostgresStorage(f"sqlite+aiosqlite:///{tmp.name}")
        await storage._ensure_ready()
        record = await storage.insert_iso_build_job(
            job_id="job-sse-endpoint-001",
            profile="standard",
            requested_by="admin@local",
            git_ref="main",
            notes=None,
        )
        # Move job to a terminal state so the generator finishes immediately
        await storage.update_iso_build_job(record.id, status="succeeded")
        return storage, record.id

    storage, job_id = asyncio.run(_setup())

    # Use very short poll/timeout so the generator finishes during streaming
    import os

    os.environ["CDX_SSE_POLL_INTERVAL"] = "0"
    try:
        import importlib

        import cdx_server.routers.iso_builds as iso_builds_module

        importlib.reload(iso_builds_module)

        app = create_app(storage=storage, rate_limiter=NullRateLimiter())
        client = TestClient(app)
        with client.stream("GET", f"/api/v1/iso-builds/{job_id}/log") as resp:
            assert resp.status_code == 200
            assert resp.headers["content-type"].startswith("text/event-stream")
            body = "".join(chunk for chunk in resp.iter_text())
        assert "event: status" in body
        assert "event: done" in body
    finally:
        os.environ.pop("CDX_SSE_POLL_INTERVAL", None)
        importlib.reload(iso_builds_module)
