"""Admin WebUI for the ISO Builder UI — Phase 2 (Issue 0022 Phase C-β).

Server-side rendered (Jinja2) management views that wrap the same
``IsoBuildStorage`` Protocol used by the JSON API in ``routers/iso_builds``.
Operators get a clickable list, a creation form, a detail page with audit
trail, and a one-click cancel.

Routes
------
GET  /admin/iso-builder              — job list with filter
GET  /admin/iso-builder/new          — new-job form
POST /admin/iso-builder              — submit form (redirect to detail)
GET  /admin/iso-builder/{job_id}     — detail + audit trail
POST /admin/iso-builder/{job_id}/cancel — cancel + redirect to detail

Authentication
--------------
Same admin auth gate as ``/admin/`` — ``CDX_ADMIN_TOKEN`` Basic Auth or
``AUTH_BACKEND=oidc``. No agent-facing surface.

Storage gate
------------
When the running storage backend does not implement ``IsoBuildStorage``
(e.g. dev mode without ``DATABASE_URL``), every view renders a small
"503-style" page rather than crashing. This gives operators an actionable
message instead of an opaque server error.
"""

from __future__ import annotations

import json
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from fastapi.templating import Jinja2Templates

from cdx_server.admin_auth import require_admin_auth_v2
from cdx_server.dependencies import get_storage
from cdx_server.obs.metrics import CDX_ISO_BUILD_AUDIT_TOTAL, CDX_ISO_BUILD_TOTAL
from cdx_server.storage_protocol import IsoBuildStorage, Storage

logger = logging.getLogger(__name__)

_TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"

router = APIRouter(prefix="/admin/iso-builder", tags=["admin", "iso-builds"])
templates = Jinja2Templates(directory=str(_TEMPLATES_DIR))
templates.env.filters["tojson"] = lambda v, indent=None: json.dumps(
    v, ensure_ascii=False, indent=indent, default=str
)

_PROFILES = ("admin", "standard", "field", "kiosk", "admin-support")
_STATUSES = ("queued", "running", "succeeded", "failed", "cancelled")
_CANCELLABLE_STATUSES = ("queued", "running")


def _maybe_iso_storage(storage: Storage = Depends(get_storage)) -> IsoBuildStorage | None:
    """Return the IsoBuildStorage view, or None if the backend doesn't support it."""
    return storage if isinstance(storage, IsoBuildStorage) else None


async def _storage_status(storage: Storage = Depends(get_storage)) -> str:
    try:
        await storage.ping()
        return "ok"
    except Exception:  # pragma: no cover — defensive
        return "error"


def _render_unsupported(request: Request, s_status: str) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "admin/iso_builder_unsupported.html",
        {"storage_status": s_status},
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


def _resolve_actor(request: Request) -> str:
    """Best-effort actor identification, mirroring the API router."""
    actor = getattr(request.state, "admin_subject", None)
    if actor:
        return str(actor)
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("basic "):
        return "admin@basic"
    if auth.lower().startswith("bearer "):
        return "admin@oidc"
    return "admin@local"


# ---- routes -----------------------------------------------------------------


@router.get("", response_class=HTMLResponse)
async def iso_builder_list(
    request: Request,
    profile: str | None = None,
    status_filter: str | None = None,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage | None = Depends(_maybe_iso_storage),
    s_status: str = Depends(_storage_status),
) -> HTMLResponse:
    if iso_storage is None:
        return _render_unsupported(request, s_status)

    if profile is not None and profile not in _PROFILES:
        profile = None
    if status_filter is not None and status_filter not in _STATUSES:
        status_filter = None

    jobs = await iso_storage.list_iso_build_jobs(
        profile=profile,
        status=status_filter,
        limit=100,
    )
    total = await iso_storage.count_iso_build_jobs(status=status_filter)

    return templates.TemplateResponse(
        request,
        "admin/iso_builds.html",
        {
            "jobs": jobs,
            "total": total,
            "profiles": _PROFILES,
            "statuses": _STATUSES,
            "selected_profile": profile,
            "selected_status": status_filter,
            "storage_status": s_status,
        },
    )


@router.get("/new", response_class=HTMLResponse)
async def iso_builder_new_form(
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage | None = Depends(_maybe_iso_storage),
    s_status: str = Depends(_storage_status),
) -> HTMLResponse:
    if iso_storage is None:
        return _render_unsupported(request, s_status)
    return templates.TemplateResponse(
        request,
        "admin/iso_build_new.html",
        {
            "profiles": _PROFILES,
            "storage_status": s_status,
        },
    )


@router.post("")
async def iso_builder_submit(
    request: Request,
    profile: str = Form(...),
    git_ref: str = Form(...),
    notes: str = Form(""),
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage | None = Depends(_maybe_iso_storage),
    s_status: str = Depends(_storage_status),
) -> Response:
    if iso_storage is None:
        return _render_unsupported(request, s_status)

    if profile not in _PROFILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"profile must be one of {_PROFILES}",
        )
    git_ref = git_ref.strip()
    if not git_ref:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="git_ref must not be empty",
        )

    job_id = str(uuid.uuid4())
    await iso_storage.insert_iso_build_job(
        job_id=job_id,
        profile=profile,
        requested_by=_resolve_actor(request),
        git_ref=git_ref,
        notes=notes.strip() or None,
    )
    await iso_storage.append_iso_build_audit(
        job_id=job_id,
        actor=_resolve_actor(request),
        action="enqueue",
        request_id=getattr(request.state, "request_id", None),
    )
    CDX_ISO_BUILD_TOTAL.labels(profile=profile, status="queued").inc()
    CDX_ISO_BUILD_AUDIT_TOTAL.labels(action="enqueue").inc()
    logger.info("iso_builder.webui.enqueued", extra={"job_id": job_id, "profile": profile})

    # Redirect to detail page (303 See Other = POST→GET, prevents resubmit on reload)
    return RedirectResponse(
        url=f"/admin/iso-builder/{job_id}",
        status_code=status.HTTP_303_SEE_OTHER,
    )


@router.get("/{job_id}", response_class=HTMLResponse)
async def iso_builder_detail(
    job_id: str,
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage | None = Depends(_maybe_iso_storage),
    s_status: str = Depends(_storage_status),
) -> HTMLResponse:
    if iso_storage is None:
        return _render_unsupported(request, s_status)

    job = await iso_storage.get_iso_build_job(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"iso_build_job {job_id!r} not found",
        )
    audit = await iso_storage.list_iso_build_audit(job_id=job_id, limit=100)

    await iso_storage.append_iso_build_audit(
        job_id=job_id,
        actor=_resolve_actor(request),
        action="view",
        request_id=getattr(request.state, "request_id", None),
    )
    CDX_ISO_BUILD_AUDIT_TOTAL.labels(action="view").inc()

    return templates.TemplateResponse(
        request,
        "admin/iso_build_detail.html",
        {
            "job": job,
            "audit": audit,
            "cancellable": job.status in _CANCELLABLE_STATUSES,
            "storage_status": s_status,
        },
    )


@router.post("/{job_id}/cancel")
async def iso_builder_cancel(
    job_id: str,
    request: Request,
    _auth: None = Depends(require_admin_auth_v2),
    iso_storage: IsoBuildStorage | None = Depends(_maybe_iso_storage),
    s_status: str = Depends(_storage_status),
) -> Response:
    if iso_storage is None:
        return _render_unsupported(request, s_status)

    job = await iso_storage.get_iso_build_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    if job.status not in _CANCELLABLE_STATUSES:
        # WebUI: bounce back to detail rather than 409 — the user can read the
        # current state from the redirected page.
        return RedirectResponse(
            url=f"/admin/iso-builder/{job_id}",
            status_code=status.HTTP_303_SEE_OTHER,
        )

    await iso_storage.update_iso_build_job(job_id, status="cancelled")
    await iso_storage.append_iso_build_audit(
        job_id=job_id,
        actor=_resolve_actor(request),
        action="cancel",
        request_id=getattr(request.state, "request_id", None),
    )
    CDX_ISO_BUILD_TOTAL.labels(profile=job.profile, status="cancelled").inc()
    CDX_ISO_BUILD_AUDIT_TOTAL.labels(action="cancel").inc()
    logger.info("iso_builder.webui.cancelled", extra={"job_id": job_id})

    return RedirectResponse(
        url=f"/admin/iso-builder/{job_id}",
        status_code=status.HTTP_303_SEE_OTHER,
    )
