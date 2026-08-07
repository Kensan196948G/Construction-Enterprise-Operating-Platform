"""Serial number scan API — GMSV0002 SMB mount + easyocr OCR pipeline.

Flow:
  iPhone → //GMSV0002/cdx-serial-scans/ (via iOS Files SMB)
  cdx-server mounts → SERIAL_SCAN_PATH (env)
  POST /api/v1/serial/scan → OCR → queue
  GET  /api/v1/serial/queue → pending items
  POST /api/v1/serial/confirm/{id} → confirm serial + hostname → 展開台帳登録

Authentication: require_admin_auth_v2 (Basic Auth or OIDC)
Only users who can log in to cdx-server admin can access these endpoints.

Environment variables:
  SERIAL_SCAN_PATH  path to the scan folder (pathlib.Path — cross-platform)
                    Linux:   /mnt/gmsv0002-serial   (SMB cifs mount, default)
                    Windows: //GMSV0002/cdx-serial-scans  (UNC, domain-joined)
                             Z:/cdx-serial-scans           (mapped drive)
  SERIAL_SCAN_MOCK  1 = mock mode (no real OCR, default); 0 = production

Cross-platform notes:
  Python pathlib.Path handles both POSIX (/mnt/...) and Windows UNC (//host/share)
  paths transparently.  On Windows domain-joined machines GMSV0002 is accessible
  via Kerberos without a credentials file; on Linux use /etc/cdx-smb.creds.

Supported image formats: JPEG, PNG, HEIC (iPhone default), BMP, TIFF
  HEIC requires: pip install ".[ocr]"  (pillow-heif, bundled libheif wheel)

Persistence (Issue 0052):
  When the active storage backend implements ``SerialScanStorage``
  (e.g. PostgresStorage), queue items are persisted across restarts.
  Otherwise (InMemoryStorage / no DATABASE_URL), a module-level dict
  preserves the Phase 1 behavior for dev and CI environments.
"""

from __future__ import annotations

import logging
import os
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from cdx_server.admin_auth import require_admin_auth_v2
from cdx_server.dependencies import get_storage
from cdx_server.obs.metrics import CDX_SERIAL_SCAN_TOTAL
from cdx_server.storage import SerialScanQueueRecord
from cdx_server.storage_protocol import SerialScanStorage, Storage

logger = logging.getLogger(__name__)

SCAN_PATH = Path(os.environ.get("SERIAL_SCAN_PATH", "/mnt/gmsv0002-serial"))
MOCK_MODE = os.environ.get("SERIAL_SCAN_MOCK", "1").strip() == "1"

# In-memory queue used when the storage backend does not implement
# ``SerialScanStorage`` (e.g. dev mode without DATABASE_URL).  See Issue 0052
# — this fallback keeps Phase 1 behavior available for CI and unit tests.
_ocr_queue: dict[str, dict[str, Any]] = {}

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".heic", ".bmp", ".tiff"}

router = APIRouter(prefix="/api/v1/serial", tags=["serial-scan"])


class ConfirmRequest(BaseModel):
    serial_number: str
    hostname: str
    profile: str = "standard"
    location: str = ""
    notes: str = ""


# ---- helpers ----------------------------------------------------------------


def _is_mounted() -> bool:
    """Return True when SERIAL_SCAN_PATH is a mounted directory."""
    return SCAN_PATH.is_dir()


def _list_pending_images() -> list[Path]:
    if not _is_mounted():
        return []
    return [p for p in SCAN_PATH.iterdir() if p.suffix.lower() in SUPPORTED_EXTS]


def _prepare_image_for_ocr(image_path: Path) -> tuple[Path, bool]:
    """Return (path_to_use, is_temp).

    HEIC images are converted to a temporary JPEG via pillow-heif so that
    easyocr (PIL/OpenCV backend) can read them.  Caller must delete the temp
    file when is_temp is True.
    """
    if image_path.suffix.lower() != ".heic":
        return image_path, False
    try:
        from pillow_heif import register_heif_opener  # type: ignore[import-untyped,unused-ignore]
        register_heif_opener()
        from PIL import Image  # type: ignore[import-untyped,unused-ignore]
        img = Image.open(image_path)
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        img.save(tmp.name, "JPEG")
        tmp.close()
        logger.debug("HEIC converted: %s → %s", image_path.name, tmp.name)
        return Path(tmp.name), True
    except Exception as exc:
        logger.warning("HEIC conversion failed for %s: %s — trying raw path", image_path, exc)
        return image_path, False


def _run_ocr(image_path: Path) -> str:
    """Run OCR on image_path.  Returns extracted serial number string."""
    if MOCK_MODE:
        # Simulate OCR: derive a plausible serial from filename
        stem = image_path.stem.upper()[:12].replace(" ", "-")
        return f"SN-{stem}" if stem else "SN-UNKNOWN"

    ocr_path, is_temp = _prepare_image_for_ocr(image_path)
    try:
        import easyocr  # type: ignore[import-untyped,unused-ignore]
        reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        results: list[str] = reader.readtext(str(ocr_path), detail=0)
        # Filter candidate tokens: typically alphanumeric + hyphen, 6-20 chars
        candidates = [
            t.strip() for t in results
            if 6 <= len(t.strip()) <= 20
            and all(c.isalnum() or c in "-_" for c in t.strip())
        ]
        return str(candidates[0]) if candidates else "OCR_UNREADABLE"
    except Exception as exc:
        logger.warning("easyocr failed for %s: %s", image_path, exc)
        return "OCR_ERROR"
    finally:
        if is_temp:
            Path(ocr_path).unlink(missing_ok=True)


def _record_to_dict(record: SerialScanQueueRecord) -> dict[str, Any]:
    """Convert a persisted record into the JSON shape returned by the API.

    The shape mirrors the legacy in-memory dict so existing clients
    (Admin SPA, tests, scripts) continue to work without changes.
    """
    item: dict[str, Any] = {
        "id": record.id,
        "filename": record.filename,
        "serial_extracted": record.serial_extracted,
        "serial_confirmed": record.serial_confirmed,
        "hostname": record.hostname,
        "profile": record.profile,
        "location": record.location,
        "notes": record.notes,
        "status": record.status,
        "scanned_at": record.scanned_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    if record.confirmed_at is not None:
        item["confirmed_at"] = record.confirmed_at.strftime("%Y-%m-%dT%H:%M:%SZ")
    return item


def _maybe_serial_storage(
    storage: Storage = Depends(get_storage),
) -> SerialScanStorage | None:
    """Return the persistent SerialScanStorage view, or None if unsupported.

    InMemoryStorage and other backends that don't implement the Protocol
    fall through to the in-memory dict path. This mirrors the dual-mode
    storage pattern used by iso_builder_admin.
    """
    return storage if isinstance(storage, SerialScanStorage) else None


# ---- routes -----------------------------------------------------------------


@router.get("/status")
async def serial_status(
    _auth: None = Depends(require_admin_auth_v2),
    serial_storage: SerialScanStorage | None = Depends(_maybe_serial_storage),
) -> dict[str, Any]:
    """Return file server mount status and pending image count."""
    images = _list_pending_images()
    if serial_storage is not None:
        queue_size = len(await serial_storage.list_serial_scan_items(limit=1000))
        backend = "postgres"
    else:
        queue_size = len(_ocr_queue)
        backend = "in-memory"
    return {
        "mounted": _is_mounted(),
        "scan_path": str(SCAN_PATH),
        "server": "GMSV0002",
        "pending_images": len(images),
        "queue_size": queue_size,
        "queue_backend": backend,
        "mock_mode": MOCK_MODE,
        "supported_formats": sorted(SUPPORTED_EXTS),
    }


@router.post("/scan")
async def trigger_scan(
    _auth: None = Depends(require_admin_auth_v2),
    serial_storage: SerialScanStorage | None = Depends(_maybe_serial_storage),
) -> dict[str, Any]:
    """Process all pending images in SERIAL_SCAN_PATH via easyocr."""
    if not _is_mounted() and not MOCK_MODE:
        raise HTTPException(
            status_code=503,
            detail=f"File server not mounted at {SCAN_PATH}. "
                   "Check SERIAL_SCAN_PATH and SMB mount.",
        )

    images = _list_pending_images()
    if not images and not MOCK_MODE:
        return {"processed": 0, "items": []}

    # Mock mode: generate sample images when path doesn't exist
    if MOCK_MODE and not images:
        images = [
            Path(f"SN-HQ-00{i:04d}.jpg") for i in range(5001, 5004)
        ]

    processed: list[dict[str, Any]] = []
    backend = "postgres" if serial_storage is not None else "in-memory"
    for img in images:
        item_id = str(uuid.uuid4())
        serial = _run_ocr(img)
        if serial_storage is not None:
            record = await serial_storage.insert_serial_scan_item(
                item_id=item_id,
                filename=img.name,
                serial_extracted=serial,
            )
            processed.append(_record_to_dict(record))
        else:
            item: dict[str, Any] = {
                "id": item_id,
                "filename": img.name,
                "serial_extracted": serial,
                "serial_confirmed": serial,
                "status": "pending",
                "scanned_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            _ocr_queue[item_id] = item
            processed.append(item)
        CDX_SERIAL_SCAN_TOTAL.labels(event="insert", backend=backend).inc()
        logger.info("serial_scan: %s → %s", img.name, serial)

    return {"processed": len(processed), "items": processed}


@router.get("/queue")
async def get_queue(
    _auth: None = Depends(require_admin_auth_v2),
    serial_storage: SerialScanStorage | None = Depends(_maybe_serial_storage),
) -> dict[str, Any]:
    """Return OCR queue (pending + recently confirmed items)."""
    if serial_storage is not None:
        records = await serial_storage.list_serial_scan_items(limit=1000)
        items = [_record_to_dict(r) for r in records]
    else:
        items = list(_ocr_queue.values())
    return {"total": len(items), "items": items}


@router.post("/confirm/{item_id}")
async def confirm_item(
    item_id: str,
    body: ConfirmRequest,
    _auth: None = Depends(require_admin_auth_v2),
    serial_storage: SerialScanStorage | None = Depends(_maybe_serial_storage),
) -> dict[str, Any]:
    """Confirm OCR result and register serial + hostname in the deploy register."""
    if serial_storage is not None:
        record = await serial_storage.confirm_serial_scan_item(
            item_id,
            serial_confirmed=body.serial_number,
            hostname=body.hostname,
            profile=body.profile,
            location=body.location,
            notes=body.notes,
        )
        if record is None:
            raise HTTPException(status_code=404, detail="Queue item not found")
        CDX_SERIAL_SCAN_TOTAL.labels(event="confirm", backend="postgres").inc()
        logger.info(
            "serial_confirm: %s → serial=%s hostname=%s",
            item_id, body.serial_number, body.hostname,
        )
        return _record_to_dict(record)

    if item_id not in _ocr_queue:
        raise HTTPException(status_code=404, detail="Queue item not found")
    item = _ocr_queue[item_id]
    item.update(
        serial_confirmed=body.serial_number,
        hostname=body.hostname,
        profile=body.profile,
        location=body.location,
        notes=body.notes,
        status="confirmed",
        confirmed_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )
    CDX_SERIAL_SCAN_TOTAL.labels(event="confirm", backend="in-memory").inc()
    logger.info(
        "serial_confirm: %s → serial=%s hostname=%s",
        item_id, body.serial_number, body.hostname,
    )
    return item


@router.delete("/queue/{item_id}")
async def discard_item(
    item_id: str,
    _auth: None = Depends(require_admin_auth_v2),
    serial_storage: SerialScanStorage | None = Depends(_maybe_serial_storage),
) -> dict[str, str]:
    """Remove an item from the queue (e.g. duplicate or unreadable scan)."""
    if serial_storage is not None:
        ok = await serial_storage.discard_serial_scan_item(item_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Queue item not found")
        CDX_SERIAL_SCAN_TOTAL.labels(event="discard", backend="postgres").inc()
        return {"status": "discarded", "id": item_id}

    if item_id not in _ocr_queue:
        raise HTTPException(status_code=404, detail="Queue item not found")
    del _ocr_queue[item_id]
    CDX_SERIAL_SCAN_TOTAL.labels(event="discard", backend="in-memory").inc()
    return {"status": "discarded", "id": item_id}
