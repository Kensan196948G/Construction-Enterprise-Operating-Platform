"""ISO Builder UI API — Phase 2 (Issue 0022).

Exposes the management endpoints for the asynchronous ``live-build`` runner.
Storage is provided by ``IsoBuildStorage`` (currently only ``PostgresStorage``
implements it — calls fail with 503 when running on InMemoryStorage).

Endpoints
---------
POST /api/v1/iso-builds              — enqueue a new build job (admin)
GET  /api/v1/iso-builds              — list jobs (admin)
GET  /api/v1/iso-builds/{id}         — job detail (admin)
POST /api/v1/iso-builds/{id}/cancel  — request cancellation (admin)

The actual SSE log endpoint (``GET /{id}/log``) lands with the build-worker
in Issue 0023; without a running worker there is no log to stream.

Authentication
--------------
All endpoints require admin authentication (``CDX_ADMIN_TOKEN`` Basic Auth or
``AUTH_BACKEND=oidc``) — there is no agent-facing surface here.

Cancellation semantics
----------------------
Only ``queued`` and ``running`` jobs can be cancelled. Calling cancel on a
terminal-state job (succeeded/failed/cancelled) returns 409 Conflict with
the current state — operators should refresh and reconsider rather than
silently no-op.

Audit
-----
Every mutating operation records a row in ``iso_build_audit`` with the
operator identity (``request_id`` from the middleware, actor from the
admin auth dependency) so build provenance is traceable.
"""

from __future__ import annotations

import asyncio
import logging
import os
import uuid
from collections.abc import AsyncGenerator
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from cdx_server.admin_auth import require_admin_auth_v2
from cdx_server.dependencies import get_storage
from cdx_server.obs.metrics import CDX_ISO_BUILD_AUDIT_TOTAL, CDX_ISO_BUILD_TOTAL
from cdx_server.schemas import (
    IsoBuildJobCreateRequest,
    IsoBuildJobListResponse,
    IsoBuildJobResponse,
    IsoBuildProfile,
    IsoBuildStatus,
)
from cdx_server.storage import IsoBuildJobRecord
from cdx_server.storage_protocol import IsoBuildStorage, Storage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/iso-builds", tags=["iso-builds"])


def _try_enqueue_rq(job_id: str, profile: str, db_url: str) -> bool:
    """Enqueue ``build_iso`` to Redis Queue if CDX_REDIS_WORKER_URL is set.

    Returns True if successfully enqueued, False if RQ/redis is unavailable
    (operator did not configure a worker — jobs remain in 'queued' state and
    can be picked up manually or by a future worker restart).
    """
    redis_url = os.environ.get("CDX_REDIS_WORKER_URL", "").strip()
    if not redis_url:
        return False
    try:
        import redis as redis_lib
        from cdx_build_worker.task import build_iso
        from rq import Queue
    except ImportError:
        logger.warning("iso_build.rq_unavailable: rq/redis/cdx_build_worker not installed")
        return False
    conn = redis_lib.Redis.from_url(redis_url, decode_responses=False)
    q = Queue("iso-builds", connection=conn)
    q.enqueue(build_iso, job_id, db_url, profile, job_timeout=3600)
    logger.info("iso_build.enqueued_rq", extra={"job_id": job_id, "profile": profile})
    return True


# Status values that are still cancellable.
_CANCELLABLE_STATUSES = ("queued", "running")


def _require_iso_build_storage(storage: Storage = Depends(get_storage)) -> IsoBuildStorage:
    """Return the storage backend cast to IsoBuildStorage, or 503 if unsupported.

    Phase 2 ISO builds require the PostgreSQL backend; InMemoryStorage does
    not implement this Protocol because Phase 1 deployments have no live-build
    host. Returning 503 (not 500) signals "this server isn't configured for
    ISO builds" rather than a programming error.
    """
    if not isinstance(storage, IsoBuildStorage):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "ISO Builder UI requires a Postgres-backed storage. Set DATABASE_URL to enable."
            ),
        )
    return cast(IsoBuildStorage, storage)


def _resolve_actor(request: Request) -> str:
    """Best-effort identification of the calling operator for audit rows.

    Falls back to "admin@local" when no upstream identity is attached
    (e.g. dev mode with auth disabled).
    """
    actor = getattr(request.state, "admin_subject", None)
    if actor:
        return str(actor)
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("basic "):
        return "admin@basic"
    if auth.lower().startswith("bearer "):
        return "admin@oidc"
    return "admin@local"


def _record_to_response(record: IsoBuildJobRecord) -> IsoBuildJobResponse:
    return IsoBuildJobResponse(
        id=record.id,
        profile=cast(IsoBuildProfile, record.profile),
        requested_by=record.requested_by,
        status=cast(IsoBuildStatus, record.status),
        git_ref=record.git_ref,
        started_at=record.started_at,
        finished_at=record.finished_at,
        iso_path=record.iso_path,
        iso_sha256=record.iso_sha256,
        iso_size_bytes=record.iso_size_bytes,
        log_path=record.log_path,
        error_message=record.error_message,
        notes=record.notes,
        created_at=record.created_at,
    )


# ---- routes -----------------------------------------------------------------


@router.post(
    "",
    response_model=IsoBuildJobResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_iso_build_job(
    body: IsoBuildJobCreateRequest,
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage = Depends(_require_iso_build_storage),
) -> IsoBuildJobResponse:
    actor = _resolve_actor(request)
    job_id = str(uuid.uuid4())
    record = await iso_storage.insert_iso_build_job(
        job_id=job_id,
        profile=body.profile,
        requested_by=actor,
        git_ref=body.git_ref,
        notes=body.notes,
    )
    await iso_storage.append_iso_build_audit(
        job_id=job_id,
        actor=actor,
        action="enqueue",
        request_id=getattr(request.state, "request_id", None),
    )
    CDX_ISO_BUILD_TOTAL.labels(profile=body.profile, status="queued").inc()
    CDX_ISO_BUILD_AUDIT_TOTAL.labels(action="enqueue").inc()
    logger.info("iso_build.enqueued", extra={"job_id": job_id, "profile": body.profile})

    db_url = os.environ.get("DATABASE_URL", "")
    rq_ok = _try_enqueue_rq(job_id, body.profile, db_url)
    if not rq_ok:
        logger.info(
            "iso_build.rq_skip: no CDX_REDIS_WORKER_URL configured; "
            "job will remain queued until a worker picks it up",
            extra={"job_id": job_id},
        )

    return _record_to_response(record)


@router.get("", response_model=IsoBuildJobListResponse)
async def list_iso_build_jobs(
    profile: IsoBuildProfile | None = None,
    status_filter: IsoBuildStatus | None = None,
    limit: int = 20,
    offset: int = 0,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage = Depends(_require_iso_build_storage),
) -> IsoBuildJobListResponse:
    if limit < 1 or limit > 200:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="limit must be between 1 and 200",
        )
    if offset < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="offset must be >= 0",
        )
    jobs = await iso_storage.list_iso_build_jobs(
        profile=profile,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    total = await iso_storage.count_iso_build_jobs(status=status_filter)
    return IsoBuildJobListResponse(
        items=[_record_to_response(j) for j in jobs],
        total=total,
    )


@router.get("/{job_id}", response_model=IsoBuildJobResponse)
async def get_iso_build_job(
    job_id: str,
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage = Depends(_require_iso_build_storage),
) -> IsoBuildJobResponse:
    record = await iso_storage.get_iso_build_job(job_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"iso_build_job {job_id!r} not found",
        )
    await iso_storage.append_iso_build_audit(
        job_id=job_id,
        actor=_resolve_actor(request),
        action="view",
        request_id=getattr(request.state, "request_id", None),
    )
    CDX_ISO_BUILD_AUDIT_TOTAL.labels(action="view").inc()
    return _record_to_response(record)


@router.post(
    "/{job_id}/cancel",
    response_model=IsoBuildJobResponse,
)
async def cancel_iso_build_job(
    job_id: str,
    request: Request,
    response: Response,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage = Depends(_require_iso_build_storage),
) -> IsoBuildJobResponse:
    record = await iso_storage.get_iso_build_job(job_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"iso_build_job {job_id!r} not found",
        )
    if record.status not in _CANCELLABLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"job is in terminal state {record.status!r}; cannot cancel",
        )

    updated = await iso_storage.update_iso_build_job(job_id, status="cancelled")
    if updated is None:  # pragma: no cover — race-condition theoretical only
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"iso_build_job {job_id!r} disappeared mid-cancel",
        )
    await iso_storage.append_iso_build_audit(
        job_id=job_id,
        actor=_resolve_actor(request),
        action="cancel",
        request_id=getattr(request.state, "request_id", None),
    )
    CDX_ISO_BUILD_TOTAL.labels(profile=updated.profile, status="cancelled").inc()
    CDX_ISO_BUILD_AUDIT_TOTAL.labels(action="cancel").inc()
    logger.info("iso_build.cancelled", extra={"job_id": job_id})
    response.status_code = status.HTTP_202_ACCEPTED
    return _record_to_response(updated)


@router.get("/{job_id}/download")
async def download_iso_redirect(
    job_id: str,
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage = Depends(_require_iso_build_storage),
):
    """Redirect to a presigned MinIO URL for downloading the ISO.

    Returns 307 Temporary Redirect when MinIO is configured and the job
    has succeeded. Returns 409 Conflict for non-terminal jobs, 404 if the
    job is unknown, and 503 if MinIO is not configured.
    """
    from fastapi.responses import RedirectResponse

    record = await iso_storage.get_iso_build_job(job_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"iso_build_job {job_id!r} not found",
        )

    if record.status != "succeeded":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"job status is {record.status!r}; download only available for succeeded jobs",
        )

    try:
        from cdx_build_worker.minio_client import (
            generate_presigned_url,
            is_configured,
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MinIO client (cdx-build-worker) not installed",
        ) from exc

    if not is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MinIO not configured. Set CDX_MINIO_URL/ACCESS_KEY/SECRET_KEY.",
        )

    url = generate_presigned_url(job_id)
    if url is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not generate presigned URL",
        )

    await iso_storage.append_iso_build_audit(
        job_id=job_id,
        actor=_resolve_actor(request),
        action="download",
        request_id=getattr(request.state, "request_id", None),
    )
    CDX_ISO_BUILD_AUDIT_TOTAL.labels(action="download").inc()
    logger.info("iso_build.download", extra={"job_id": job_id})
    return RedirectResponse(url=url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


# ---- SSE log streaming (Phase E — Issue 0023) --------------------------------

_SSE_POLL_INTERVAL = float(os.environ.get("CDX_SSE_POLL_INTERVAL", "2"))
_SSE_TIMEOUT = float(os.environ.get("CDX_SSE_TIMEOUT", "3600"))


async def _log_event_generator(
    job_id: str,
    iso_storage: IsoBuildStorage,
) -> AsyncGenerator[dict, None]:
    """Yield SSE events with build log lines and status updates.

    Polls ``log_path`` for new content every ``CDX_SSE_POLL_INTERVAL`` seconds
    (default 2s).  Terminates when:
    - the job reaches a terminal state (succeeded / failed / cancelled), OR
    - ``CDX_SSE_TIMEOUT`` seconds have elapsed (default 3600 = 1h)

    In mock mode the log_path is ``None``; the generator yields heartbeat
    ``ping`` events until the job finishes.
    """
    elapsed = 0.0
    last_pos = 0

    while elapsed < _SSE_TIMEOUT:
        record = await iso_storage.get_iso_build_job(job_id)
        if record is None:
            yield {"event": "error", "data": f"job {job_id!r} not found"}
            return

        log_path = record.log_path or ""
        # Emit any new log lines from the file
        if log_path and log_path.startswith("/") and os.path.isfile(log_path):
            with open(log_path) as fh:
                fh.seek(last_pos)
                chunk = fh.read(32_768)
                if chunk:
                    last_pos += len(chunk.encode())
                    for line in chunk.splitlines():
                        if line:
                            yield {"event": "log", "data": line}
        else:
            # No real log yet — emit a heartbeat ping so the connection stays alive
            yield {"event": "ping", "data": record.status}

        # Emit a status event on every poll cycle
        yield {"event": "status", "data": record.status}

        if record.status in ("succeeded", "failed", "cancelled"):
            yield {"event": "done", "data": record.status}
            return

        await asyncio.sleep(_SSE_POLL_INTERVAL)
        elapsed += _SSE_POLL_INTERVAL

    yield {"event": "timeout", "data": "stream timed out"}


@router.get("/{job_id}/log", include_in_schema=True)
async def stream_iso_build_log(
    job_id: str,
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage = Depends(_require_iso_build_storage),
):
    """Stream build log lines as Server-Sent Events.

    Connect with ``EventSource('/api/v1/iso-builds/{id}/log')`` from the browser.
    Events emitted:
    - ``log``    — a single build log line
    - ``status`` — current job status (queued/running/succeeded/failed/cancelled)
    - ``ping``   — heartbeat when no new log lines are available
    - ``done``   — terminal state reached; client should close the EventSource
    - ``error``  — job not found or other error
    - ``timeout``— stream exceeded CDX_SSE_TIMEOUT without completion
    """
    from sse_starlette.sse import EventSourceResponse

    record = await iso_storage.get_iso_build_job(job_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"iso_build_job {job_id!r} not found",
        )

    CDX_ISO_BUILD_AUDIT_TOTAL.labels(action="stream_log").inc()
    logger.info("iso_build.sse.start", extra={"job_id": job_id})

    return EventSourceResponse(
        _log_event_generator(job_id, iso_storage),
        media_type="text/event-stream",
    )
