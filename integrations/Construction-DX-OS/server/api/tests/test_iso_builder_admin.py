"""Tests for the ISO Builder UI admin views (Issue 0022 Phase C-β).

Phase 9 (Issue #4): Updated to use async PostgresStorage with aiosqlite.

The /admin/iso-builder family of routes uses Jinja2 SSR and the same
IsoBuildStorage Protocol as the JSON API. Tests assert response codes,
template selection, and the form-submission redirect contract.

Auth is left disabled (no CDX_ADMIN_TOKEN) so the suite focuses on the
storage / template integration; the admin auth gate itself is exercised
in test_admin_auth.py.
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
    storage = PostgresStorage(f"sqlite+aiosqlite:///{tmp_path / 'iso_admin.db'}")
    await storage._ensure_ready()
    return storage


@pytest.fixture
async def admin_client(pg_iso_storage) -> TestClient:
    app = create_app(storage=pg_iso_storage, rate_limiter=NullRateLimiter())
    # Disable redirect-following so we can assert redirect status codes directly.
    return TestClient(app, follow_redirects=False)


# ---------------------------------------------------------------------------
# list view
# ---------------------------------------------------------------------------


def test_list_view_empty(admin_client):
    resp = admin_client.get("/admin/iso-builder")
    assert resp.status_code == 200
    assert "ISO Builder" in resp.text
    assert "まだビルドジョブはありません" in resp.text


@pytest.mark.asyncio
async def test_list_view_renders_jobs(admin_client, pg_iso_storage):
    await pg_iso_storage.insert_iso_build_job(
        job_id="00000000-0000-0000-0000-aaaaaaaaaaaa",
        profile="standard",
        requested_by="alice",
        git_ref="main",
    )
    resp = admin_client.get("/admin/iso-builder")
    assert resp.status_code == 200
    assert "main" in resp.text
    assert "standard" in resp.text
    # The truncated id (first 8 chars) should appear.
    assert "00000000" in resp.text


@pytest.mark.asyncio
async def test_list_view_filter_by_profile(admin_client, pg_iso_storage):
    for prof in ["standard", "field", "kiosk"]:
        await pg_iso_storage.insert_iso_build_job(
            job_id=f"id-{prof}", profile=prof, requested_by="alice", git_ref="main"
        )
    resp = admin_client.get("/admin/iso-builder?profile=field")
    assert resp.status_code == 200
    assert "id-field"[:8] in resp.text
    assert "id-stand"[:8] not in resp.text


# ---------------------------------------------------------------------------
# new + submit
# ---------------------------------------------------------------------------


def test_new_form_view(admin_client):
    resp = admin_client.get("/admin/iso-builder/new")
    assert resp.status_code == 200
    assert "新規 ISO ビルドジョブ" in resp.text
    assert 'name="profile"' in resp.text


@pytest.mark.asyncio
async def test_submit_form_redirects_to_detail(admin_client, pg_iso_storage):
    resp = admin_client.post(
        "/admin/iso-builder",
        data={"profile": "standard", "git_ref": "main", "notes": "test"},
    )
    assert resp.status_code == 303
    assert resp.headers["location"].startswith("/admin/iso-builder/")
    # Storage should now have one job.
    assert await pg_iso_storage.count_iso_build_jobs() == 1


def test_submit_rejects_unknown_profile(admin_client):
    resp = admin_client.post("/admin/iso-builder", data={"profile": "evil", "git_ref": "main"})
    assert resp.status_code == 400


def test_submit_rejects_blank_git_ref(admin_client):
    resp = admin_client.post("/admin/iso-builder", data={"profile": "standard", "git_ref": "   "})
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# detail
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_detail_view_renders(admin_client, pg_iso_storage):
    await pg_iso_storage.insert_iso_build_job(
        job_id="DETAIL-1",
        profile="kiosk",
        requested_by="alice",
        git_ref="release/1.0",
        notes="release prep",
    )
    await pg_iso_storage.append_iso_build_audit(
        job_id="DETAIL-1", actor="alice", action="enqueue", request_id="req-x"
    )
    resp = admin_client.get("/admin/iso-builder/DETAIL-1")
    assert resp.status_code == 200
    assert "DETAIL-1" in resp.text
    assert "release/1.0" in resp.text
    assert "release prep" in resp.text
    # Audit row visible on detail page.
    assert "enqueue" in resp.text
    assert "req-x" in resp.text


def test_detail_view_404(admin_client):
    resp = admin_client.get("/admin/iso-builder/no-such-id")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# cancel
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cancel_redirects_and_flips_status(admin_client, pg_iso_storage):
    await pg_iso_storage.insert_iso_build_job(
        job_id="CANCEL-1", profile="standard", requested_by="alice", git_ref="main"
    )
    resp = admin_client.post("/admin/iso-builder/CANCEL-1/cancel")
    assert resp.status_code == 303
    assert resp.headers["location"] == "/admin/iso-builder/CANCEL-1"
    job = await pg_iso_storage.get_iso_build_job("CANCEL-1")
    assert job is not None
    assert job.status == "cancelled"


@pytest.mark.asyncio
async def test_cancel_terminal_state_redirects_no_change(admin_client, pg_iso_storage):
    await pg_iso_storage.insert_iso_build_job(
        job_id="CANCEL-2", profile="standard", requested_by="alice", git_ref="main"
    )
    await pg_iso_storage.update_iso_build_job("CANCEL-2", status="succeeded")
    resp = admin_client.post("/admin/iso-builder/CANCEL-2/cancel")
    assert resp.status_code == 303
    job = await pg_iso_storage.get_iso_build_job("CANCEL-2")
    assert job.status == "succeeded"  # unchanged


def test_cancel_404_when_missing(admin_client):
    resp = admin_client.post("/admin/iso-builder/ghost/cancel")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# storage gate (InMemoryStorage doesn't implement IsoBuildStorage)
# ---------------------------------------------------------------------------


def test_unsupported_backend_returns_503_friendly_page():
    app = create_app(storage=InMemoryStorage(), rate_limiter=NullRateLimiter())
    client = TestClient(app, follow_redirects=False)
    resp = client.get("/admin/iso-builder")
    assert resp.status_code == 503
    assert "DATABASE_URL" in resp.text
