"""Tests for GET /api/v1/iso-builds/{id}/download (Issue 0025 Phase F).

Extended in Issue 0035 to cover the full status matrix:
- 503 when storage backend is InMemoryStorage
- 404 when job does not exist
- 409 when job has not yet succeeded
- 503 when MinIO module is unavailable / not configured
- 503 when presigned URL generation fails
- 307 redirect on the success path
"""

from __future__ import annotations

import sys
import types
from typing import Any

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.rate_limit import NullRateLimiter
from cdx_server.storage import InMemoryStorage
from cdx_server.storage_pg import PostgresStorage


@pytest.fixture()
def in_memory_client() -> TestClient:
    return TestClient(create_app(storage=InMemoryStorage()), follow_redirects=False)


@pytest.fixture
async def pg_iso_storage(tmp_path):
    storage = PostgresStorage(f"sqlite+aiosqlite:///{tmp_path / 'iso_dl.db'}")
    await storage._ensure_ready()
    return storage


@pytest.fixture
async def iso_client(pg_iso_storage) -> TestClient:
    app = create_app(storage=pg_iso_storage, rate_limiter=NullRateLimiter())
    return TestClient(app, follow_redirects=False)


# ---------------------------------------------------------------------------
# 503 — storage protocol gate
# ---------------------------------------------------------------------------


def test_download_returns_503_without_postgres(in_memory_client: TestClient) -> None:
    """InMemoryStorage does not implement IsoBuildStorage → 503."""
    resp = in_memory_client.get(
        "/api/v1/iso-builds/any-id/download",
        headers={"Authorization": "Basic YWRtaW46ZGV2dG9rZW4="},
    )
    assert resp.status_code == 503


# ---------------------------------------------------------------------------
# 404 — unknown job
# ---------------------------------------------------------------------------


def test_download_returns_404_for_unknown_job(iso_client: TestClient) -> None:
    resp = iso_client.get("/api/v1/iso-builds/no-such-id/download")
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# 409 — non-terminal / failed job (download only valid for succeeded jobs)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_download_returns_409_when_job_not_succeeded(
    iso_client: TestClient, pg_iso_storage: PostgresStorage
) -> None:
    create = iso_client.post(
        "/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"}
    ).json()
    # Job is freshly created → status="queued", which is not "succeeded"
    resp = iso_client.get(f"/api/v1/iso-builds/{create['id']}/download")
    assert resp.status_code == 409
    assert "queued" in resp.json()["detail"]

    # Also verify the failed-state path
    await pg_iso_storage.update_iso_build_job(create["id"], status="failed")
    resp = iso_client.get(f"/api/v1/iso-builds/{create['id']}/download")
    assert resp.status_code == 409
    assert "failed" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# 503 — MinIO not configured / presigned URL generation failure
# ---------------------------------------------------------------------------


def _install_fake_minio_module(monkeypatch, *, configured: bool, url: str | None) -> None:
    """Install a fake ``cdx_build_worker.minio_client`` module for testing."""
    pkg = types.ModuleType("cdx_build_worker")
    mod = types.ModuleType("cdx_build_worker.minio_client")

    def is_configured() -> bool:
        return configured

    def generate_presigned_url(job_id: str) -> str | None:
        return url

    mod.is_configured = is_configured  # type: ignore[attr-defined]
    mod.generate_presigned_url = generate_presigned_url  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "cdx_build_worker", pkg)
    monkeypatch.setitem(sys.modules, "cdx_build_worker.minio_client", mod)


@pytest.mark.asyncio
async def test_download_returns_503_when_minio_not_configured(
    iso_client: TestClient,
    pg_iso_storage: PostgresStorage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    create = iso_client.post(
        "/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"}
    ).json()
    await pg_iso_storage.update_iso_build_job(create["id"], status="succeeded")

    _install_fake_minio_module(monkeypatch, configured=False, url=None)

    resp = iso_client.get(f"/api/v1/iso-builds/{create['id']}/download")
    assert resp.status_code == 503
    assert "MinIO not configured" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_download_returns_503_when_presigned_url_returns_none(
    iso_client: TestClient,
    pg_iso_storage: PostgresStorage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    create = iso_client.post(
        "/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"}
    ).json()
    await pg_iso_storage.update_iso_build_job(create["id"], status="succeeded")

    _install_fake_minio_module(monkeypatch, configured=True, url=None)

    resp = iso_client.get(f"/api/v1/iso-builds/{create['id']}/download")
    assert resp.status_code == 503
    assert "presigned URL" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_download_returns_503_when_minio_module_missing(
    iso_client: TestClient,
    pg_iso_storage: PostgresStorage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """ImportError path — cdx_build_worker.minio_client unavailable."""
    create = iso_client.post(
        "/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"}
    ).json()
    await pg_iso_storage.update_iso_build_job(create["id"], status="succeeded")

    # Force ImportError by inserting None into sys.modules — Python raises
    # ModuleNotFoundError on subsequent import, which is a subclass of ImportError.
    monkeypatch.setitem(sys.modules, "cdx_build_worker.minio_client", None)

    resp = iso_client.get(f"/api/v1/iso-builds/{create['id']}/download")
    assert resp.status_code == 503
    assert "MinIO client" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# 307 — happy path with valid presigned URL
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_download_returns_307_with_presigned_url(
    iso_client: TestClient,
    pg_iso_storage: PostgresStorage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    create = iso_client.post(
        "/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"}
    ).json()
    await pg_iso_storage.update_iso_build_job(create["id"], status="succeeded")

    expected_url = "https://minio.example.com/cdx/iso-builds/abc.iso?X-Amz-Signature=fake"
    _install_fake_minio_module(monkeypatch, configured=True, url=expected_url)

    resp = iso_client.get(f"/api/v1/iso-builds/{create['id']}/download")
    assert resp.status_code == 307
    assert resp.headers["location"] == expected_url


# ---------------------------------------------------------------------------
# Audit row is appended on successful download (Issue 0038)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_download_appends_audit_row_on_307(
    iso_client: TestClient,
    pg_iso_storage: PostgresStorage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Issue 0038: download must persist an audit row in iso_build_audit
    (not just bump the Prometheus counter). Verifies action="download",
    actor matches the request, and the row is queryable by job_id."""
    create = iso_client.post(
        "/api/v1/iso-builds",
        json={"profile": "standard", "git_ref": "main"},
        headers={"Authorization": "Basic YWRtaW46ZGV2dG9rZW4="},
    ).json()
    job_id = create["id"]
    await pg_iso_storage.update_iso_build_job(job_id, status="succeeded")

    # Pre-condition: enqueue created exactly one audit row (action="enqueue")
    pre = await pg_iso_storage.list_iso_build_audit(job_id=job_id)
    assert [r.action for r in pre] == ["enqueue"]

    _install_fake_minio_module(
        monkeypatch,
        configured=True,
        url="https://minio.example.com/cdx/iso-builds/abc.iso?X-Amz-Signature=fake",
    )

    resp = iso_client.get(
        f"/api/v1/iso-builds/{job_id}/download",
        headers={"Authorization": "Basic YWRtaW46ZGV2dG9rZW4="},
    )
    assert resp.status_code == 307

    rows = await pg_iso_storage.list_iso_build_audit(job_id=job_id)
    actions = sorted(r.action for r in rows)
    assert actions == ["download", "enqueue"]
    download_row = next(r for r in rows if r.action == "download")
    assert download_row.job_id == job_id
    assert download_row.actor == "admin@basic"


@pytest.mark.asyncio
async def test_download_failure_paths_do_not_append_audit(
    iso_client: TestClient,
    pg_iso_storage: PostgresStorage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Audit must only be written on the 307 success path — 503/409/404
    must not pollute the audit table with phantom downloads."""
    create = iso_client.post(
        "/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"}
    ).json()
    job_id = create["id"]
    await pg_iso_storage.update_iso_build_job(job_id, status="succeeded")

    # MinIO not configured → 503; no download audit row should be appended.
    _install_fake_minio_module(monkeypatch, configured=False, url=None)

    resp = iso_client.get(f"/api/v1/iso-builds/{job_id}/download")
    assert resp.status_code == 503

    rows = await pg_iso_storage.list_iso_build_audit(job_id=job_id)
    assert [r.action for r in rows] == ["enqueue"]


# ---------------------------------------------------------------------------
# _resolve_actor branches (also exercised by /detail and /cancel paths)
# ---------------------------------------------------------------------------


def test_resolve_actor_returns_basic_when_authorization_basic(
    iso_client: TestClient,
) -> None:
    """When CDX_ADMIN_TOKEN is unset (test default), Basic header still
    triggers the ``admin@basic`` branch in ``_resolve_actor``."""
    resp = iso_client.post(
        "/api/v1/iso-builds",
        json={"profile": "standard", "git_ref": "main"},
        headers={"Authorization": "Basic YWRtaW46ZGV2dG9rZW4="},
    )
    assert resp.status_code == 201
    assert resp.json()["requested_by"] == "admin@basic"


def test_resolve_actor_returns_oidc_when_authorization_bearer(
    iso_client: TestClient,
) -> None:
    """Bearer header (no admin_subject in request.state) resolves to ``admin@oidc``."""
    resp = iso_client.post(
        "/api/v1/iso-builds",
        json={"profile": "standard", "git_ref": "main"},
        headers={"Authorization": "Bearer some-fake-token"},
    )
    assert resp.status_code == 201
    assert resp.json()["requested_by"] == "admin@oidc"


def test_resolve_actor_returns_local_when_no_authorization(
    iso_client: TestClient,
) -> None:
    """No Authorization header → ``admin@local`` fallback."""
    resp = iso_client.post(
        "/api/v1/iso-builds",
        json={"profile": "standard", "git_ref": "main"},
    )
    assert resp.status_code == 201
    assert resp.json()["requested_by"] == "admin@local"


# ---------------------------------------------------------------------------
# _try_enqueue_rq — RQ enqueue helper (lines 75-86)
# ---------------------------------------------------------------------------


def test_try_enqueue_rq_returns_false_when_env_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("CDX_REDIS_WORKER_URL", raising=False)
    from cdx_server.routers.iso_builds import _try_enqueue_rq

    assert _try_enqueue_rq("job-1", "standard", "sqlite:///x") is False


def test_try_enqueue_rq_returns_true_when_redis_reachable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Mock redis + rq + cdx_build_worker.task → confirm enqueue path."""
    monkeypatch.setenv("CDX_REDIS_WORKER_URL", "redis://fake:6379/0")

    enqueue_calls: list[tuple[Any, ...]] = []

    class _FakeQueue:
        def __init__(self, name: str, connection: Any) -> None:
            self.name = name
            self.connection = connection

        def enqueue(self, func: Any, *args: Any, **kwargs: Any) -> None:
            enqueue_calls.append((func, args, kwargs))

    class _FakeRedis:
        @classmethod
        def from_url(cls, url: str, decode_responses: bool = False) -> _FakeRedis:
            return cls()

    fake_redis = types.ModuleType("redis")
    fake_redis.Redis = _FakeRedis  # type: ignore[attr-defined]

    fake_rq = types.ModuleType("rq")
    fake_rq.Queue = _FakeQueue  # type: ignore[attr-defined]

    fake_task = types.ModuleType("cdx_build_worker.task")

    def _build_iso(*args: Any, **kwargs: Any) -> None: ...

    fake_task.build_iso = _build_iso  # type: ignore[attr-defined]
    fake_pkg = sys.modules.get("cdx_build_worker") or types.ModuleType("cdx_build_worker")

    monkeypatch.setitem(sys.modules, "redis", fake_redis)
    monkeypatch.setitem(sys.modules, "rq", fake_rq)
    monkeypatch.setitem(sys.modules, "cdx_build_worker", fake_pkg)
    monkeypatch.setitem(sys.modules, "cdx_build_worker.task", fake_task)

    from cdx_server.routers.iso_builds import _try_enqueue_rq

    assert _try_enqueue_rq("job-1", "standard", "sqlite:///x") is True
    assert len(enqueue_calls) == 1
    _func, args, kwargs = enqueue_calls[0]
    assert args == ("job-1", "sqlite:///x", "standard")
    assert kwargs == {"job_timeout": 3600}


def test_try_enqueue_rq_returns_false_when_imports_fail(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """ImportError path — rq/redis/cdx_build_worker not installed."""
    monkeypatch.setenv("CDX_REDIS_WORKER_URL", "redis://fake:6379/0")
    # Force ImportError by setting modules to None
    monkeypatch.setitem(sys.modules, "redis", None)
    monkeypatch.setitem(sys.modules, "rq", None)

    from cdx_server.routers.iso_builds import _try_enqueue_rq

    assert _try_enqueue_rq("job-1", "standard", "sqlite:///x") is False
