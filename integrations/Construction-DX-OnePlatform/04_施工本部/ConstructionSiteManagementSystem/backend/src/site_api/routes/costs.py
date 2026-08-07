"""原価記録 + EAC (Estimate At Completion) 予測."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import ConstructionProject, CostRecord, ProgressRecord

router = APIRouter(prefix="/cost-records", tags=["costs"])


class CostIn(BaseModel):
    project_id: int
    record_date: date
    cost_category: str
    amount: Decimal
    vendor: str | None = None
    invoice_no: str | None = None
    description: str | None = None
    client_id: str | None = None


class CostOut(CostIn):
    id: int


@router.get("", response_model=list[CostOut])
async def list_costs(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    project_id: int | None = None,
) -> list[CostOut]:
    stmt = select(CostRecord)
    if project_id is not None:
        stmt = stmt.where(CostRecord.project_id == project_id)
    rows = (await session.execute(stmt)).scalars().all()
    return [CostOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=CostOut, status_code=201)
async def create_cost(
    body: CostIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CostOut:
    rec = CostRecord(**body.model_dump())
    session.add(rec)
    await session.flush()
    return CostOut.model_validate(rec, from_attributes=True)


@router.get("/{project_id}/eac")
async def estimate_at_completion(
    project_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, Any]:
    """EAC = BAC / CPI (CPI = EV / AC).

    BAC: 契約金額, AC: 累計実コスト, EV: 直近 progress_rate × BAC
    出来高/原価レコードが乏しい場合は安全値を返す。
    """
    project = await session.get(ConstructionProject, project_id)
    bac = float(project.contract_amount or 0) if project else 0.0
    ac = float(
        (
            await session.execute(
                select(func.coalesce(func.sum(CostRecord.amount), 0)).where(
                    CostRecord.project_id == project_id
                )
            )
        ).scalar_one()
    )
    latest_rate = (
        await session.execute(
            select(ProgressRecord.progress_rate)
            .where(ProgressRecord.project_id == project_id)
            .order_by(ProgressRecord.record_date.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    progress = float(latest_rate or 0) / 100.0
    ev = bac * progress
    cpi = (ev / ac) if ac > 0 else 0.0
    eac = (bac / cpi) if cpi > 0 else bac + ac
    return {
        "project_id": project_id,
        "bac": bac,
        "ac": ac,
        "ev": ev,
        "cpi": cpi,
        "eac": eac,
        "progress_rate": progress,
    }
