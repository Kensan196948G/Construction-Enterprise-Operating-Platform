"""乗組員管理 + コンプライアンス判定."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import date

from ..config import get_settings
from ..db.session import get_db_session
from ..models import CrewMember, Voyage
from ..services import check_crew_compliance
from ..services.crew_scheduler import (
    CrewSnapshot,
    VoyagePlan,
    optimize_shifts,
)

router = APIRouter(prefix="/crew", tags=["crew"])


class CrewIn(BaseModel):
    crew_code: str = Field(..., max_length=20)
    full_name: str
    rank: str = "甲板員"
    license_grade: str | None = None
    license_no: str | None = None


class CrewOut(CrewIn):
    id: int
    sea_service_days_total: int = 0
    current_consecutive_days: int = 0


class ComplianceIn(BaseModel):
    consecutive_days: int = Field(..., ge=0)
    rest_hours_last_week: float = Field(..., ge=0)
    is_minor: bool = False


@router.get("", response_model=list[CrewOut])
async def list_crew(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[CrewOut]:
    rows = (await session.execute(select(CrewMember))).scalars().all()
    return [CrewOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=CrewOut, status_code=status.HTTP_201_CREATED)
async def create_crew(
    body: CrewIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CrewOut:
    c = CrewMember(**body.model_dump(exclude_none=True))
    session.add(c)
    await session.flush()
    return CrewOut.model_validate(c, from_attributes=True)


class VoyagePlanIn(BaseModel):
    voyage_id: int
    voyage_no: str
    start_date: date
    end_date: date
    required: dict[str, int] | None = None


class ScheduleOptimizeIn(BaseModel):
    voyages: list[VoyagePlanIn] | None = None
    """指定がなければ DB の status=planned の voyage を対象とする."""


@router.post("/schedule-optimize")
async def schedule_optimize(
    body: ScheduleOptimizeIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """乗組員シフトを最適化する."""
    s = get_settings()

    # voyages の決定: 入力 or DB から取得
    if body.voyages:
        plans = [
            VoyagePlan(
                voyage_id=v.voyage_id,
                voyage_no=v.voyage_no,
                start_date=v.start_date,
                end_date=v.end_date,
                required=v.required or {},
            )
            for v in body.voyages
        ]
        # required が空なら schedule 側のデフォルトを使う
        plans = [
            VoyagePlan(
                voyage_id=p.voyage_id,
                voyage_no=p.voyage_no,
                start_date=p.start_date,
                end_date=p.end_date,
            )
            if not p.required
            else p
            for p in plans
        ]
    else:
        rows = (
            await session.execute(
                select(Voyage).where(Voyage.status == "planned").order_by(
                    Voyage.planned_departure_at
                )
            )
        ).scalars().all()
        plans = [
            VoyagePlan(
                voyage_id=v.id,
                voyage_no=v.voyage_no,
                start_date=v.planned_departure_at.date(),
                end_date=v.planned_arrival_at.date(),
            )
            for v in rows
        ]

    # 乗組員一覧
    crew_rows = (await session.execute(select(CrewMember))).scalars().all()
    snapshots = [
        CrewSnapshot(
            crew_id=c.id,
            crew_code=c.crew_code,
            rank=c.rank,
            license_grade=c.license_grade,
            current_consecutive_days=c.current_consecutive_days,
            last_rest_at=c.last_rest_at,
        )
        for c in crew_rows
    ]

    result = optimize_shifts(
        plans,
        snapshots,
        max_consecutive_days=s.max_consecutive_sea_days,
        weekly_rest_hours=s.min_weekly_rest_hours,
    )
    return {
        "assignments": [
            {
                "voyage_id": a.voyage_id,
                "voyage_no": a.voyage_no,
                "crew_id": a.crew_id,
                "crew_code": a.crew_code,
                "rank": a.rank,
                "start_date": a.start_date.isoformat(),
                "end_date": a.end_date.isoformat(),
            }
            for a in result.assignments
        ],
        "violations": list(result.violations),
        "warnings": list(result.warnings),
        "unfilled": [
            {"voyage_id": v, "rank": r, "missing": m} for v, r, m in result.unfilled
        ],
    }


@router.post("/{crew_id}/compliance")
async def evaluate_compliance(
    crew_id: int,
    body: ComplianceIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """対象乗組員の現状から船員労働法準拠をチェックする."""
    c = await session.get(CrewMember, crew_id)
    if c is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "crew member not found")
    s = get_settings()
    result = check_crew_compliance(
        c.crew_code,
        body.consecutive_days,
        body.rest_hours_last_week,
        is_minor=body.is_minor,
        max_consecutive_days=s.max_consecutive_sea_days,
        min_weekly_rest_hours=s.min_weekly_rest_hours,
    )
    return {
        "crew_code": result.crew_code,
        "is_compliant": result.is_compliant,
        "violations": list(result.violations),
        "warnings": list(result.warnings),
    }
