"""Analytics dataset listing + query playground endpoint."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from data_api.db.session import get_db
from data_api.deps import get_current_user
from data_api.models.analytics_dataset import AnalyticsDataset
from data_api.schemas import AnalyticsDatasetRead, AnalyticsQueryRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

# Identifier whitelist: 英数字/アンダースコア/ピリオドのみ許可
_SAFE_IDENT = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.")


def _safe_ident(value: str) -> bool:
    return bool(value) and set(value) <= _SAFE_IDENT


@router.get("/datasets", response_model=list[AnalyticsDatasetRead])
def list_datasets(db: Session = Depends(get_db), user=Depends(get_current_user)) -> list[AnalyticsDataset]:
    return list(db.execute(select(AnalyticsDataset)).scalars().all())


@router.post("/query")
def query_dataset(
    payload: AnalyticsQueryRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict:
    if not _safe_ident(payload.dataset):
        raise HTTPException(status_code=400, detail="dataset name contains invalid characters")
    cols = "*"
    if payload.select:
        if not all(_safe_ident(c) for c in payload.select):
            raise HTTPException(status_code=400, detail="invalid select column name")
        cols = ", ".join(payload.select)
    where_clause = ""
    params: dict = {"_limit": payload.limit}
    if payload.where:
        terms = []
        for i, (k, v) in enumerate(payload.where.items()):
            if not _safe_ident(k):
                raise HTTPException(status_code=400, detail="invalid where column name")
            key = f"p{i}"
            terms.append(f"{k} = :{key}")
            params[key] = v
        if terms:
            where_clause = " WHERE " + " AND ".join(terms)
    sql = f"SELECT {cols} FROM {payload.dataset}{where_clause} LIMIT :_limit"
    try:
        rows = db.execute(text(sql), params).mappings().all()
        return {"dataset": payload.dataset, "rows": [dict(r) for r in rows], "rendered_sql": sql}
    except Exception as exc:  # noqa: BLE001
        logger.debug("analytics query fallback: %s", exc)
        return {"dataset": payload.dataset, "rows": [], "rendered_sql": sql, "note": str(exc)}
