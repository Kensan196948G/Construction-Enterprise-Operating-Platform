"""Data source management endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from data_api.db.session import get_db
from data_api.deps import get_current_user
from data_api.models.data_source import DataSource
from data_api.schemas import DataSourceCreate, DataSourceRead

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])


@router.get("", response_model=list[DataSourceRead])
def list_sources(
    department_id: str | None = Query(default=None),
    source_type: str | None = None,
    active: bool | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[DataSource]:
    stmt = select(DataSource)
    if department_id:
        stmt = stmt.where(DataSource.department_id == department_id)
    if source_type:
        stmt = stmt.where(DataSource.source_type == source_type)
    if active is not None:
        stmt = stmt.where(DataSource.is_active == active)
    return list(db.execute(stmt).scalars().all())


@router.post("", response_model=DataSourceRead, status_code=status.HTTP_201_CREATED)
def create_source(
    payload: DataSourceCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> DataSource:
    src = DataSource(**payload.model_dump())
    db.add(src)
    db.commit()
    db.refresh(src)
    return src


@router.get("/{source_id}", response_model=DataSourceRead)
def get_source(source_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)) -> DataSource:
    src = db.get(DataSource, source_id)
    if not src:
        raise HTTPException(status_code=404, detail="source not found")
    return src


@router.delete("/{source_id}", status_code=204)
def delete_source(source_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)) -> None:
    src = db.get(DataSource, source_id)
    if not src:
        raise HTTPException(status_code=404, detail="source not found")
    db.delete(src)
    db.commit()
