"""Aggregated dashboard for the Data Lake / Twin platform."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from data_api.db.session import get_db
from data_api.deps import get_current_user
from data_api.models.ai_model import AiModel
from data_api.models.data_lake_table import DataLakeTable
from data_api.models.data_source import DataSource
from data_api.models.digital_twin_object import DigitalTwinObject
from data_api.models.etl_job import EtlJob
from data_api.models.etl_run import EtlRun
from data_api.models.iot_device import IotDevice
from data_api.models.kpi_metric import KpiMetric

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db), user=Depends(get_current_user)) -> dict:
    since = datetime.now(UTC) - timedelta(hours=24)
    return {
        "sources": {
            "total": db.execute(select(func.count()).select_from(DataSource)).scalar() or 0,
            "active": db.execute(
                select(func.count()).select_from(DataSource).where(DataSource.is_active.is_(True))
            ).scalar()
            or 0,
        },
        "etl": {
            "jobs": db.execute(select(func.count()).select_from(EtlJob)).scalar() or 0,
            "runs_24h": db.execute(
                select(func.count()).select_from(EtlRun).where(EtlRun.started_at >= since)
            ).scalar()
            or 0,
        },
        "lake": {
            "tables": db.execute(select(func.count()).select_from(DataLakeTable)).scalar() or 0,
        },
        "ai": {
            "models": db.execute(select(func.count()).select_from(AiModel)).scalar() or 0,
        },
        "iot": {
            "devices": db.execute(select(func.count()).select_from(IotDevice)).scalar() or 0,
        },
        "twin": {
            "objects": db.execute(select(func.count()).select_from(DigitalTwinObject)).scalar() or 0,
        },
    }


@router.get("/pipeline-status")
def pipeline_status(db: Session = Depends(get_db), user=Depends(get_current_user)) -> dict:
    runs = db.execute(select(EtlRun).order_by(desc(EtlRun.started_at)).limit(20)).scalars().all()
    by_status: dict[str, int] = {}
    for r in runs:
        by_status[r.status] = by_status.get(r.status, 0) + 1
    return {"recent_runs": len(runs), "by_status": by_status}


@router.get("/kpi")
def cross_kpi(db: Session = Depends(get_db), user=Depends(get_current_user)) -> dict:
    rows = db.execute(select(KpiMetric).order_by(desc(KpiMetric.observed_at)).limit(50)).scalars().all()
    return {
        "items": [
            {
                "observed_at": r.observed_at.isoformat(),
                "source": r.source,
                "metric_name": r.metric_name,
                "value": r.value,
                "dimensions": r.dimensions,
            }
            for r in rows
        ]
    }
