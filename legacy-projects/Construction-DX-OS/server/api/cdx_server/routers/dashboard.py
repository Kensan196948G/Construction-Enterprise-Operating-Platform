"""Dashboard summary router (Issue 0048).

GET /api/v1/dashboard returns aggregated counts for devices, ISO builds, and
server health — in a single request for SPA initial-load optimization.
"""

from __future__ import annotations

import time

from fastapi import APIRouter, Depends, Request

from cdx_server.dependencies import get_storage
from cdx_server.routers.health import _redis_ping
from cdx_server.schemas import (
    DashboardResponse,
    DeviceSummary,
    IsoBuildSummary,
    ServerSummary,
)
from cdx_server.storage_protocol import IsoBuildStorage, Storage

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


def _maybe_iso_storage(storage: Storage = Depends(get_storage)) -> IsoBuildStorage | None:
    return storage if isinstance(storage, IsoBuildStorage) else None


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(
    request: Request,
    storage: Storage = Depends(get_storage),
    iso_storage: IsoBuildStorage | None = Depends(_maybe_iso_storage),
) -> DashboardResponse:
    """Aggregate dashboard summary — devices + ISO builds + server health."""
    devices_all = await storage.list_devices()
    online = sum(1 for d in devices_all if getattr(d, "status", None) == "online")
    warning = sum(1 for d in devices_all if getattr(d, "status", None) == "warning")
    offline = len(devices_all) - online - warning

    if iso_storage is not None:
        iso_all = await iso_storage.list_iso_build_jobs(limit=10_000)
        iso_summary = IsoBuildSummary(
            total=await iso_storage.count_iso_build_jobs(),
            running=sum(1 for j in iso_all if j.status == "running"),
            succeeded=sum(1 for j in iso_all if j.status == "succeeded"),
            failed=sum(1 for j in iso_all if j.status == "failed"),
            cancelled=sum(1 for j in iso_all if j.status == "cancelled"),
        )
    else:
        iso_summary = IsoBuildSummary()

    started_at: float = getattr(request.app.state, "started_at", time.monotonic())
    redis_status = await _redis_ping()

    storage_status = "ok"
    try:
        await storage.ping()
    except Exception:
        storage_status = "error"

    return DashboardResponse(
        devices=DeviceSummary(
            total=len(devices_all),
            online=online,
            offline=offline,
            warning=warning,
        ),
        iso_builds=iso_summary,
        server=ServerSummary(
            storage=storage_status,
            redis=redis_status,
            uptime_seconds=round(time.monotonic() - started_at, 1),
        ),
    )
