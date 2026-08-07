"""Health check router (Issue 0053).

Three probe variants are exposed:

- ``GET /health/live`` — liveness probe. Returns 200 whenever the process is
  responding, regardless of downstream dependencies. Suitable for Kubernetes
  ``livenessProbe`` so a transient storage/Redis outage will not trigger pod
  restart.

- ``GET /health/ready`` — readiness probe. Deep-checks storage + Redis and
  returns 503 with ``status: "degraded"`` when any dependency is unreachable.
  Suitable for Kubernetes ``readinessProbe`` so traffic is steered away while
  the dependency recovers.

- ``GET /health`` — legacy / backward-compatible endpoint. Identical behaviour
  to ``/health/ready``. Kept stable for monitors and Docker healthchecks that
  already target this path.
"""

from __future__ import annotations

import logging
import os
import time

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, Response

from cdx_server import __version__
from cdx_server.dependencies import get_storage
from cdx_server.schemas import HealthResponse, LivenessResponse
from cdx_server.storage_protocol import Storage

logger = logging.getLogger(__name__)

router = APIRouter()


async def _redis_ping() -> str:
    """Return 'ok', 'error', or 'disabled' based on REDIS_URL."""
    redis_url = os.environ.get("REDIS_URL", "").strip()
    if not redis_url:
        return "disabled"
    try:
        import redis.asyncio as aioredis  # type: ignore[import-not-found]

        client = aioredis.from_url(redis_url, socket_connect_timeout=2)
        await client.ping()
        await client.aclose()
        return "ok"
    except Exception:
        logger.warning("health: Redis ping failed (REDIS_URL=%s)", redis_url[:30])
        return "error"


@router.get("/", include_in_schema=False)
async def root_redirect() -> RedirectResponse:
    # Issue 0039 (Loop 73): root now serves the Admin SPA design bundle.
    # Trailing slash is required so StaticFiles(html=True) auto-resolves index.html.
    return RedirectResponse(url="/admin-spa/", status_code=302)


@router.get("/favicon.ico", include_in_schema=False)
async def favicon() -> Response:
    return Response(status_code=204)


def _uptime_seconds(request: Request) -> float:
    started_at: float = getattr(request.app.state, "started_at", time.monotonic())
    return round(time.monotonic() - started_at, 1)


async def _deep_health(request: Request, storage: Storage) -> HealthResponse:
    """Probe storage + Redis. Used by /health and /health/ready."""
    storage_backend = type(storage).__name__
    try:
        await storage.ping()
        storage_status: str = "ok"
    except Exception:
        logger.exception("health: storage ping failed (backend=%s)", storage_backend)
        storage_status = "error"

    redis_status = await _redis_ping()
    overall = "ok" if storage_status == "ok" else "degraded"

    return HealthResponse(
        status=overall,  # type: ignore[arg-type]
        version=__version__,
        storage=storage_status,  # type: ignore[arg-type]
        storage_backend=storage_backend,
        redis=redis_status,  # type: ignore[arg-type]
        uptime_seconds=_uptime_seconds(request),
    )


@router.get("/health/live", response_model=LivenessResponse, tags=["health"])
async def health_live(request: Request) -> LivenessResponse:
    """Kubernetes-style liveness probe — process-level vitals only."""
    return LivenessResponse(
        version=__version__,
        uptime_seconds=_uptime_seconds(request),
    )


@router.get("/health/ready", response_model=HealthResponse, tags=["health"])
async def health_ready(
    request: Request, storage: Storage = Depends(get_storage)
) -> HealthResponse:
    """Kubernetes-style readiness probe — fails 503 on dependency outage."""
    resp = await _deep_health(request, storage)
    if resp.status == "degraded":
        raise HTTPException(status_code=503, detail=resp.model_dump())
    return resp


@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health(
    request: Request, storage: Storage = Depends(get_storage)
) -> HealthResponse:
    """Legacy combined health endpoint (kept stable; identical to /health/ready)."""
    resp = await _deep_health(request, storage)
    if resp.status == "degraded":
        raise HTTPException(status_code=503, detail=resp.model_dump())
    return resp
