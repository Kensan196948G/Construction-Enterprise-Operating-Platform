"""Data Lake table catalog + sample rows."""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from data_api.db.session import get_db
from data_api.deps import get_current_user
from data_api.models.data_lake_table import DataLakeTable
from data_api.schemas import LakeTableRead

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/lake", tags=["lake"])


@router.get("/tables", response_model=list[LakeTableRead])
def list_tables(
    zone: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[DataLakeTable]:
    stmt = select(DataLakeTable)
    if zone:
        stmt = stmt.where(DataLakeTable.zone == zone)
    return list(db.execute(stmt).scalars().all())


@router.get("/tables/{table_id}", response_model=LakeTableRead)
def get_table(table_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)) -> DataLakeTable:
    t = db.get(DataLakeTable, table_id)
    if not t:
        raise HTTPException(status_code=404, detail="table not found")
    return t


@router.get("/tables/{table_id}/sample")
def sample_rows(
    table_id: uuid.UUID,
    limit: int = Query(default=10, ge=1, le=200),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict:
    t = db.get(DataLakeTable, table_id)
    if not t:
        raise HTTPException(status_code=404, detail="table not found")
    # Best-effort sample. Fails safely if physical table is absent in dev.
    try:
        # SAFETY: table_name is restricted to [a-zA-Z0-9_.] by validation at register time.
        rows = db.execute(text(f"SELECT * FROM {t.table_name} LIMIT :n"), {"n": limit}).mappings().all()
        return {"table_name": t.table_name, "rows": [dict(r) for r in rows]}
    except Exception as exc:  # noqa: BLE001
        logger.debug("sample fallback for %s: %s", t.table_name, exc)
        return {"table_name": t.table_name, "rows": [], "note": "physical table not available in this env"}
