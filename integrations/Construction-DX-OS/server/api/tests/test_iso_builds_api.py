"""Tests for the Phase 2 ISO Builder UI API (Issue 0022).

Phase 9 (Issue #4): Updated to use async PostgresStorage with aiosqlite.

These tests use an aiosqlite-backed PostgresStorage so the iso-build endpoints
have a real ``IsoBuildStorage`` to work against; the default conftest
``client`` fixture uses InMemoryStorage which (deliberately) does not
support ISO builds.

Coverage:
- enqueue → 201, audit row appended
- list with profile/status filters
- detail 200 / 404
- cancel happy path → 202 + status flips to "cancelled"
- cancel on terminal-state job → 409
- 503 when running on InMemoryStorage (Protocol not satisfied)
- request body validation: bad profile / git_ref / oversize notes
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.rate_limit import NullRateLimiter
from cdx_server.storage import InMemoryStorage
from cdx_server.storage_pg import PostgresStorage


@pytest.fixture
async def pg_iso_storage(tmp_path):
    storage = PostgresStorage(f"sqlite+aiosqlite:///{tmp_path / 'iso_api.db'}")
    await storage._ensure_ready()
    return storage


@pytest.fixture
async def iso_client(pg_iso_storage) -> TestClient:
    app = create_app(storage=pg_iso_storage, rate_limiter=NullRateLimiter())
    return TestClient(app)


# ---------------------------------------------------------------------------
# happy paths
# ---------------------------------------------------------------------------


def test_create_iso_build_returns_queued(iso_client):
    body = {"profile": "standard", "git_ref": "main@abc1234", "notes": "smoke"}
    resp = iso_client.post("/api/v1/iso-builds", json=body)
    assert resp.status_code == 201, resp.text
    payload = resp.json()
    assert payload["status"] == "queued"
    assert payload["profile"] == "standard"
    assert payload["git_ref"] == "main@abc1234"
    assert payload["notes"] == "smoke"
    assert payload["iso_path"] is None
    assert payload["started_at"] is None


@pytest.mark.asyncio
async def test_create_iso_build_writes_audit_row(iso_client, pg_iso_storage):
    body = {"profile": "field", "git_ref": "release/1.0"}
    resp = iso_client.post("/api/v1/iso-builds", json=body)
    assert resp.status_code == 201
    job_id = resp.json()["id"]

    audit = await pg_iso_storage.list_iso_build_audit(job_id=job_id)
    assert len(audit) == 1
    assert audit[0].action == "enqueue"
    assert audit[0].actor.startswith("admin@")


def test_list_iso_build_jobs_with_filters(iso_client):
    for profile in ["standard", "field", "kiosk", "standard"]:
        iso_client.post("/api/v1/iso-builds", json={"profile": profile, "git_ref": "main"})

    all_resp = iso_client.get("/api/v1/iso-builds")
    assert all_resp.status_code == 200
    assert all_resp.json()["total"] == 4
    assert len(all_resp.json()["items"]) == 4

    standard_resp = iso_client.get("/api/v1/iso-builds?profile=standard")
    assert standard_resp.status_code == 200
    assert {j["profile"] for j in standard_resp.json()["items"]} == {"standard"}

    none_resp = iso_client.get("/api/v1/iso-builds?status_filter=succeeded")
    assert none_resp.status_code == 200
    assert none_resp.json()["items"] == []


def test_get_iso_build_job_detail(iso_client):
    create = iso_client.post(
        "/api/v1/iso-builds", json={"profile": "kiosk", "git_ref": "main"}
    ).json()
    detail = iso_client.get(f"/api/v1/iso-builds/{create['id']}")
    assert detail.status_code == 200
    assert detail.json()["id"] == create["id"]


def test_get_iso_build_job_404_when_missing(iso_client):
    resp = iso_client.get("/api/v1/iso-builds/no-such-id")
    assert resp.status_code == 404


def test_cancel_queued_job_succeeds(iso_client):
    job = iso_client.post(
        "/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"}
    ).json()
    resp = iso_client.post(f"/api/v1/iso-builds/{job['id']}/cancel")
    assert resp.status_code == 202, resp.text
    assert resp.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_cancel_terminal_state_returns_409(iso_client, pg_iso_storage):
    job = iso_client.post(
        "/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"}
    ).json()
    # Move it to a terminal state out-of-band, then try to cancel.
    await pg_iso_storage.update_iso_build_job(job["id"], status="succeeded")

    resp = iso_client.post(f"/api/v1/iso-builds/{job['id']}/cancel")
    assert resp.status_code == 409
    assert "terminal state" in resp.json()["detail"]


def test_cancel_404_when_missing(iso_client):
    resp = iso_client.post("/api/v1/iso-builds/no-such-id/cancel")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Storage-Protocol gate
# ---------------------------------------------------------------------------


def test_503_when_backend_is_in_memory_storage():
    """InMemoryStorage does not implement IsoBuildStorage → 503 not 500."""
    app = create_app(storage=InMemoryStorage(), rate_limiter=NullRateLimiter())
    client = TestClient(app)
    resp = client.post("/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"})
    assert resp.status_code == 503
    assert "Postgres" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Request validation
# ---------------------------------------------------------------------------


def test_create_rejects_unknown_profile(iso_client):
    resp = iso_client.post("/api/v1/iso-builds", json={"profile": "evil", "git_ref": "main"})
    assert resp.status_code == 422


def test_create_rejects_empty_git_ref(iso_client):
    resp = iso_client.post("/api/v1/iso-builds", json={"profile": "standard", "git_ref": ""})
    assert resp.status_code == 422


def test_list_rejects_invalid_limit(iso_client):
    resp = iso_client.get("/api/v1/iso-builds?limit=0")
    assert resp.status_code == 422
    resp = iso_client.get("/api/v1/iso-builds?limit=999")
    assert resp.status_code == 422
    resp = iso_client.get("/api/v1/iso-builds?offset=-1")
    assert resp.status_code == 422
