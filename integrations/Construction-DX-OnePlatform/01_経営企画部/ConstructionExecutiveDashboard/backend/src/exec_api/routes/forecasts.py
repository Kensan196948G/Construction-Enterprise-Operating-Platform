"""AI 予測 (Prophet / scikit-learn)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db.session import get_db_session
from ..models import Forecast
from ..services.forecaster import (
    ProjectFeatureRow,
    TimeseriesPoint,
    forecast_timeseries,
    predict_deficit_projects,
    predict_schedule_delay,
    predict_workforce_shortage,
)

router = APIRouter(prefix="/forecasts", tags=["forecasts"])


class TimeseriesPointIn(BaseModel):
    ds: date
    y: float


class TimeseriesForecastRequest(BaseModel):
    target_metric: str
    horizon_days: int = 90
    confidence_interval: float = 0.8
    history: list[TimeseriesPointIn] = Field(default_factory=list)


@router.post("/timeseries")
async def run_timeseries(
    body: TimeseriesForecastRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    """利益率/受注高など連続値の時系列予測."""
    out = forecast_timeseries(
        [TimeseriesPoint(ds=p.ds, y=p.y) for p in body.history],
        target_metric=body.target_metric,
        horizon_days=body.horizon_days,
        confidence_interval=body.confidence_interval,
    )
    return {
        "target_metric": out.target_metric,
        "model_name": out.model_name,
        "horizon_days": out.horizon_days,
        "confidence_interval": out.confidence_interval,
        "summary": out.summary,
        "predictions": [
            {"ds": p.ds.isoformat(), "yhat": p.yhat,
             "yhat_lower": p.yhat_lower, "yhat_upper": p.yhat_upper}
            for p in out.predictions
        ],
    }


class ProjectFeatureIn(BaseModel):
    project_id: int
    contract_amount: float
    cost_progress_ratio: float
    schedule_progress_ratio: float
    labor_shortage_ratio: float
    weather_risk_score: float
    label: int | None = None


class ClassifyRequest(BaseModel):
    train: list[ProjectFeatureIn] = Field(default_factory=list)
    predict: list[ProjectFeatureIn]


@router.post("/deficit")
async def deficit(
    body: ClassifyRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    res = predict_deficit_projects(
        [ProjectFeatureRow(**r.model_dump()) for r in body.train],
        [ProjectFeatureRow(**r.model_dump()) for r in body.predict],
    )
    return {"predictions": [{"project_id": pid, "risk_score": score} for pid, score in res]}


@router.post("/delay")
async def delay(
    body: ClassifyRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    res = predict_schedule_delay(
        [ProjectFeatureRow(**r.model_dump()) for r in body.train],
        [ProjectFeatureRow(**r.model_dump()) for r in body.predict],
    )
    return {"predictions": [{"project_id": pid, "risk_score": score} for pid, score in res]}


class WorkforcePoint(BaseModel):
    date: date
    headcount: int


class WorkforceRequest(BaseModel):
    demand: list[WorkforcePoint]
    supply: list[WorkforcePoint]


@router.post("/workforce")
async def workforce(
    body: WorkforceRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    res = predict_workforce_shortage(
        [(p.date, p.headcount) for p in body.demand],
        [(p.date, p.headcount) for p in body.supply],
    )
    return {"projection": res}


@router.get("")
async def list_forecasts(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    target_metric: str | None = None,
) -> list[dict[str, Any]]:
    stmt = select(Forecast).order_by(Forecast.predicted_at.desc()).limit(50)
    if target_metric:
        stmt = stmt.where(Forecast.target_metric == target_metric)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        {
            "id": r.id,
            "target_metric": r.target_metric,
            "model_name": r.model_name,
            "horizon_days": r.horizon_days,
            "confidence_interval": float(r.confidence_interval),
            "predicted_at": r.predicted_at.isoformat() if r.predicted_at else None,
            "summary": r.summary,
            "risk_score": float(r.risk_score) if r.risk_score is not None else None,
        }
        for r in rows
    ]


@router.get("/config")
async def forecast_config(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    s = get_settings()
    return {
        "default_horizon_days": s.forecast_default_horizon_days,
        "default_confidence_interval": s.forecast_confidence_interval,
        "now": datetime.utcnow().isoformat(),
    }
