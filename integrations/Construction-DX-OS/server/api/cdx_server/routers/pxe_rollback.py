"""PXE Rollback intent API (Issue 0042 Phase 4.5).

Records operator-initiated rollback intents in the structured audit log and
returns the exact shell command to execute on the PXE server.

Design decision: this endpoint intentionally does NOT execute scripts remotely.
The PXE server requires root privileges (dnsmasq restart, nginx reload) that
the cdx-server process does not hold. Execution stays with the human operator.

Auth: Admin Basic Auth (same as /admin WebUI).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Request

from cdx_server.admin_auth import require_admin_auth_v2 as require_admin
from cdx_server.obs.metrics import CDX_PXE_BOOT_TOTAL
from cdx_server.schemas import (
    PXERollbackPattern,
    PXERollbackRequest,
    PXERollbackResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["pxe"])

# Map pattern → (script filename, required params)
_SCRIPT_MAP: dict[PXERollbackPattern, str] = {
    PXERollbackPattern.FULL:    "01-full-rollback.sh",
    PXERollbackPattern.PROFILE: "02-profile-rollback.sh",
    PXERollbackPattern.RING:    "03-ring-rollback.sh",
    PXERollbackPattern.SITE:    "04-site-rollback.sh",
    PXERollbackPattern.SINGLE:  "05-single-rollback.sh",
    PXERollbackPattern.ABORT:   "06-abort.sh",
}

_SCRIPTS_PATH = "/opt/cdx/pxe/rollback"


def _build_command(payload: PXERollbackRequest, script: str) -> str:
    """Build the sudo command string for the operator to copy-paste."""
    parts = [f"sudo {_SCRIPTS_PATH}/{script}"]
    p = payload
    if p.pattern == PXERollbackPattern.PROFILE and p.profile:
        parts.append(f"--profile {p.profile}")
    if p.pattern == PXERollbackPattern.RING and p.ring:
        parts.append(f"--ring {p.ring}")
    if p.pattern == PXERollbackPattern.SITE:
        if p.site:
            parts.append(f"--site {p.site}")
        if p.backup_pxe_ip:
            parts.append(f"--backup-pxe {p.backup_pxe_ip}")
    if p.pattern == PXERollbackPattern.SINGLE and p.device_mac:
        parts.append(f"--mac {p.device_mac}")
    if p.target_version:
        parts.append(f"--version {p.target_version}")
    return " ".join(parts)


@router.post(
    "/api/v1/pxe/rollback",
    response_model=PXERollbackResponse,
    status_code=202,
    dependencies=[Depends(require_admin)],
)
async def request_pxe_rollback(
    request: Request,
    payload: PXERollbackRequest,
) -> PXERollbackResponse:
    """Record a PXE rollback intent and return the script command to execute.

    The operator must SSH to the PXE server and run the returned command.
    Dry-run preview: append --dry-run to the returned command.
    """
    audit_id = getattr(request.state, "request_id", "unknown")
    script = _SCRIPT_MAP[payload.pattern]
    command = _build_command(payload, script)

    log_extra = {
        "pxe_rollback_pattern": payload.pattern.value,
        "reason": payload.reason,
        "target_version": payload.target_version,
        "profile": payload.profile,
        "ring": payload.ring,
        "site": payload.site,
        "device_mac": payload.device_mac,
        "audit_id": audit_id,
    }
    logger.warning("pxe.rollback_requested", extra=log_extra)

    # Record rollback request as a special PXE metric event
    CDX_PXE_BOOT_TOTAL.labels(profile="all", event=f"rollback_{payload.pattern.value}").inc()

    return PXERollbackResponse(
        pattern=payload.pattern,
        audit_id=audit_id,
        script_name=script,
        command=command,
    )
