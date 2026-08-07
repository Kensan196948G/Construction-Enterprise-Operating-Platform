"""Admin UI router — FastAPI + Jinja2 SSR (Phase 4a/5b: Basic Auth + OIDC).

Provides a read-only management panel at ``/admin`` gated by HTTP Basic Auth
(Phase 4a) or OIDC Bearer auth (Phase 5b, ``AUTH_BACKEND=oidc``).
Auth is bypassed in dev mode when ``CDX_ADMIN_ENABLED=false``.

See :mod:`cdx_server.admin_auth` for the full auth policy matrix.

Endpoints
---------
GET /admin                      — device list
GET /admin/devices/{device_id}  — per-device heartbeat + inventory detail
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from cdx_server.admin_auth import require_admin_auth_v2
from cdx_server.routers.health import _redis_ping
from cdx_server.storage_protocol import Storage

_ONLINE_THRESHOLD = timedelta(minutes=5)

logger = logging.getLogger(__name__)

_TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"

router = APIRouter(prefix="/admin", tags=["admin"])
templates = Jinja2Templates(directory=str(_TEMPLATES_DIR))

# Register tojson filter so templates can pretty-print inventory dicts.
templates.env.filters["tojson"] = lambda v, indent=None: json.dumps(
    v, ensure_ascii=False, indent=indent
)


# ---- dependency -------------------------------------------------------------


def _get_storage(request: Request) -> Storage:  # pragma: no cover
    return request.app.state.storage  # type: ignore[return-value]


async def _storage_status(storage: Storage = Depends(_get_storage)) -> str:
    try:
        await storage.ping()
        return "ok"
    except Exception:
        return "error"


# ---- routes -----------------------------------------------------------------


def _heartbeat_freshness(heartbeats: list, now: datetime) -> tuple[bool, int | None]:
    """Compute (is_online, minutes_since_last_heartbeat) from a heartbeat list.

    Returns (False, None) when the list is empty (device has never reported).
    Online means the most recent heartbeat is within `_ONLINE_THRESHOLD`.
    """
    if not heartbeats:
        return (False, None)
    elapsed = now - heartbeats[0].received_at.replace(tzinfo=UTC)
    is_online = elapsed < _ONLINE_THRESHOLD
    minutes = int(elapsed.total_seconds() // 60)
    return (is_online, minutes)


@router.get("", response_class=HTMLResponse)
async def device_list(
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    storage: Storage = Depends(_get_storage),
    s_status: str = Depends(_storage_status),
) -> HTMLResponse:
    """Render the device list page with online/offline status badges."""
    devices = await storage.list_devices()
    now = datetime.now(UTC)

    # Fetch latest heartbeat per device for online/offline calculation.
    device_status = []
    for device in devices:
        hbs = await storage.list_heartbeats(device.device_id, limit=1)
        online, _ = _heartbeat_freshness(hbs, now)
        device_status.append({"device": device, "online": online, "has_hb": bool(hbs)})

    online_count = sum(1 for d in device_status if d["online"])
    offline_count = sum(1 for d in device_status if not d["online"] and d["has_hb"])
    unknown_count = sum(1 for d in device_status if not d["has_hb"])

    redis_status = await _redis_ping()
    return templates.TemplateResponse(
        request,
        "admin/devices.html",
        {
            "device_status": device_status,
            "online_count": online_count,
            "offline_count": offline_count,
            "unknown_count": unknown_count,
            "storage_status": s_status,
            "redis_status": redis_status,
        },
    )


@router.get("/devices/{device_id}", response_class=HTMLResponse)
async def device_detail(
    device_id: str,
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    storage: Storage = Depends(_get_storage),
    s_status: str = Depends(_storage_status),
) -> HTMLResponse:
    """Render the per-device detail page (heartbeats + inventory + policy)."""
    device = await storage.get_device(device_id)
    if device is None:
        raise HTTPException(status_code=404, detail=f"Device {device_id!r} not found")
    heartbeats = await storage.list_heartbeats(device_id, limit=20)
    inventories = await storage.list_inventories(device_id, limit=5)
    policy = await storage.get_policy(device.profile)

    is_online, last_seen_minutes = _heartbeat_freshness(heartbeats, datetime.now(UTC))

    return templates.TemplateResponse(
        request,
        "admin/device_detail.html",
        {
            "device": device,
            "heartbeats": heartbeats,
            "inventories": inventories,
            "policy": policy,
            "is_online": is_online,
            "last_seen_minutes": last_seen_minutes,
            "storage_status": s_status,
        },
    )


@router.get("/pxe-rollback", response_class=HTMLResponse)
async def pxe_rollback_page(
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    s_status: str = Depends(_storage_status),
) -> HTMLResponse:
    """Render the PXE rollback console (Issue 0042 Phase 4.5)."""
    return templates.TemplateResponse(
        request,
        "admin/pxe_rollback.html",
        {"storage_status": s_status},
    )
