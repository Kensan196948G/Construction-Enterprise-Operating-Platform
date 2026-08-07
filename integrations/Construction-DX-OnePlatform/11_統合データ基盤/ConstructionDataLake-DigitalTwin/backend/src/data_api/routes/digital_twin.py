"""Digital twin objects + GeoJSON scene endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from data_api.db.session import get_db
from data_api.deps import get_current_user
from data_api.models.digital_twin_object import DigitalTwinObject
from data_api.models.iot_device import IotDevice
from data_api.schemas import DigitalTwinObjectCreate, DigitalTwinObjectRead
from data_api.services.digital_twin_builder import build_scene

router = APIRouter(prefix="/api/v1/digital-twin", tags=["digital-twin"])


@router.get("/objects", response_model=list[DigitalTwinObjectRead])
def list_objects(
    kind: str | None = Query(default=None),
    project_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[DigitalTwinObject]:
    stmt = select(DigitalTwinObject)
    if kind:
        stmt = stmt.where(DigitalTwinObject.kind == kind)
    if project_id:
        stmt = stmt.where(DigitalTwinObject.project_id == project_id)
    return list(db.execute(stmt).scalars().all())


@router.post("/objects", response_model=DigitalTwinObjectRead, status_code=status.HTTP_201_CREATED)
def create_object(
    payload: DigitalTwinObjectCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> DigitalTwinObject:
    obj = DigitalTwinObject(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/objects/{object_id}", response_model=DigitalTwinObjectRead)
def get_object(object_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)) -> DigitalTwinObject:
    o = db.get(DigitalTwinObject, object_id)
    if not o:
        raise HTTPException(status_code=404, detail="object not found")
    return o


@router.get("/scene")
def get_scene(
    project_id: uuid.UUID | None = Query(default=None),
    include_iot: bool = Query(default=True),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict:
    obj_stmt = select(DigitalTwinObject)
    if project_id:
        obj_stmt = obj_stmt.where(DigitalTwinObject.project_id == project_id)
    objs = [
        {
            "object_id": o.object_id,
            "name": o.name,
            "kind": o.kind,
            "project_id": o.project_id,
            "asset_3d_uri": o.asset_3d_uri,
            "latitude": o.latitude,
            "longitude": o.longitude,
            "altitude_m": o.altitude_m,
            "heading_deg": o.heading_deg,
            "attributes": o.attributes,
        }
        for o in db.execute(obj_stmt).scalars().all()
    ]
    devices: list[dict] = []
    if include_iot:
        dev_stmt = select(IotDevice)
        if project_id:
            dev_stmt = dev_stmt.where(IotDevice.project_id == project_id)
        devices = [
            {
                "device_id": d.device_id,
                "name": d.name,
                "kind": d.kind,
                "latitude": d.latitude,
                "longitude": d.longitude,
                "altitude_m": d.altitude_m,
                "status": d.status,
            }
            for d in db.execute(dev_stmt).scalars().all()
        ]
    return build_scene(objs, devices=devices)
