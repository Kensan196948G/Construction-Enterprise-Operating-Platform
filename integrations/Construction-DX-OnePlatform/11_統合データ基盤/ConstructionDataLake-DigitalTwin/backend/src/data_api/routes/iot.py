"""IoT device management + telemetry ingestion / read endpoints."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from data_api.db.session import get_db
from data_api.deps import get_current_user
from data_api.models.iot_device import IotDevice, IotDeviceStatus
from data_api.models.iot_telemetry import IotTelemetry
from data_api.schemas import IotDeviceCreate, IotDeviceRead, TelemetryIngest

router = APIRouter(prefix="/api/v1/iot", tags=["iot"])


@router.get("/devices", response_model=list[IotDeviceRead])
def list_devices(
    kind: str | None = Query(default=None),
    project_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[IotDevice]:
    stmt = select(IotDevice)
    if kind:
        stmt = stmt.where(IotDevice.kind == kind)
    if project_id:
        stmt = stmt.where(IotDevice.project_id == project_id)
    return list(db.execute(stmt).scalars().all())


@router.post("/devices", response_model=IotDeviceRead, status_code=status.HTTP_201_CREATED)
def register_device(
    payload: IotDeviceCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> IotDevice:
    device = IotDevice(**payload.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.post("/telemetry", status_code=202)
def ingest_telemetry(
    payload: TelemetryIngest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict:
    device = db.get(IotDevice, payload.device_id)
    if not device:
        raise HTTPException(status_code=404, detail="device not found")
    ts = payload.time or datetime.now(UTC)
    row = IotTelemetry(
        time=ts,
        device_id=payload.device_id,
        metric_kind=payload.metric_kind,
        payload=payload.payload,
    )
    db.add(row)
    device.status = IotDeviceStatus.ONLINE.value
    device.last_seen_at = ts
    db.commit()
    return {"status": "accepted", "device_id": str(payload.device_id), "time": ts.isoformat()}


@router.get("/telemetry")
def list_telemetry(
    device_id: uuid.UUID | None = Query(default=None),
    metric_kind: str | None = None,
    limit: int = Query(default=100, ge=1, le=2000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict:
    stmt = select(IotTelemetry).order_by(desc(IotTelemetry.time)).limit(limit)
    if device_id:
        stmt = (
            select(IotTelemetry)
            .where(IotTelemetry.device_id == str(device_id))
            .order_by(desc(IotTelemetry.time))
            .limit(limit)
        )
    if metric_kind:
        stmt = stmt.where(IotTelemetry.metric_kind == metric_kind)
    rows = db.execute(stmt).scalars().all()
    return {
        "items": [
            {
                "time": r.time.isoformat(),
                "device_id": str(r.device_id),
                "metric_kind": r.metric_kind,
                "payload": r.payload,
            }
            for r in rows
        ]
    }
