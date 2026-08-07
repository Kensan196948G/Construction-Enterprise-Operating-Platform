"""F/S CRUD + 自動スコア計算."""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import FeasibilityStudy
from ..services.feasibility_scorer import FeasibilityInput, calculate

router = APIRouter(prefix="/feasibility", tags=["feasibility"])


class FeasibilityIn(BaseModel):
    proposal_id: int
    title: str
    technical_score: Decimal
    legal_score: Decimal
    environment_score: Decimal
    business_score: Decimal
    risks: dict | None = None
    conclusion: str | None = None
    notes: str | None = None


class FeasibilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    proposal_id: int
    title: str
    technical_score: Decimal
    legal_score: Decimal
    environment_score: Decimal
    business_score: Decimal
    total_score: Decimal
    decision: str
    risks: dict | None = None
    conclusion: str | None = None
    notes: str | None = None


class ScoreCalcIn(BaseModel):
    technical_score: Decimal
    legal_score: Decimal
    environment_score: Decimal
    business_score: Decimal


class ScoreCalcOut(BaseModel):
    total_score: Decimal
    decision: str


def _apply_score(obj: FeasibilityStudy) -> None:
    res = calculate(
        FeasibilityInput(
            technical_score=obj.technical_score,
            legal_score=obj.legal_score,
            environment_score=obj.environment_score,
            business_score=obj.business_score,
        )
    )
    obj.total_score = res.total_score
    obj.decision = res.decision


@router.post("/score", response_model=ScoreCalcOut)
async def calc_score(
    body: ScoreCalcIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> ScoreCalcOut:
    """スコア計算プレビュー (保存しない)."""
    res = calculate(
        FeasibilityInput(
            technical_score=body.technical_score,
            legal_score=body.legal_score,
            environment_score=body.environment_score,
            business_score=body.business_score,
        )
    )
    return ScoreCalcOut(total_score=res.total_score, decision=res.decision)


@router.get("", response_model=list[FeasibilityOut])
async def list_fs(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    proposal_id: int | None = None,
) -> list[FeasibilityOut]:
    stmt = select(FeasibilityStudy)
    if proposal_id is not None:
        stmt = stmt.where(FeasibilityStudy.proposal_id == proposal_id)
    result = await session.execute(stmt)
    return [FeasibilityOut.model_validate(f) for f in result.scalars().all()]


@router.post("", response_model=FeasibilityOut, status_code=status.HTTP_201_CREATED)
async def create_fs(
    body: FeasibilityIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> FeasibilityOut:
    obj = FeasibilityStudy(**body.model_dump(exclude_none=True))
    _apply_score(obj)
    session.add(obj)
    await session.flush()
    return FeasibilityOut.model_validate(obj)


@router.get("/{fs_id}", response_model=FeasibilityOut)
async def get_fs(
    fs_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> FeasibilityOut:
    obj = await session.get(FeasibilityStudy, fs_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "feasibility study not found")
    return FeasibilityOut.model_validate(obj)
