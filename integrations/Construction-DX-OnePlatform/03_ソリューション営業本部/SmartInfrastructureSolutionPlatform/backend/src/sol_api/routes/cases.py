"""事例集 (検索付き)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import CaseStudy
from ..services.similarity_finder import CaseDoc, find_similar

router = APIRouter(prefix="/cases", tags=["cases"])


class CaseIn(BaseModel):
    case_code: str
    title: str
    client_name: str
    category: str
    completed_at: date | None = None
    duration_months: int | None = None
    contract_amount: Decimal | None = None
    roi_percent: Decimal | None = None
    customer_rating: Decimal | None = None
    summary: str | None = None
    achievements: str | None = None
    photo_urls: dict | None = None
    related_patents: dict | None = None
    tags: dict | None = None


class CaseOut(CaseIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SimilarHit(BaseModel):
    case_id: int
    title: str
    score: float  # 0.0 - 1.0
    similarity_percent: float  # score * 100, 小数2桁


@router.get("/similar", response_model=list[SimilarHit])
async def find_similar_cases(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    q: Annotated[str, Query(min_length=1, description="検索クエリ")],
    k: Annotated[int, Query(ge=1, le=20)] = 5,
) -> list[SimilarHit]:
    """AI類似事例検索. Azure OpenAI 未設定時はキーワード fallback."""
    cases = (await session.execute(select(CaseStudy))).scalars().all()
    docs = [
        CaseDoc(
            case_id=c.id,
            title=c.title,
            summary=c.summary or "",
            tags=list((c.tags or {}).keys()) if isinstance(c.tags, dict) else [],
            embedding=list(c.embedding) if c.embedding else None,
        )
        for c in cases
    ]
    hits = find_similar(q, docs, top_k=k)
    return [
        SimilarHit(
            case_id=h.case_id,
            title=h.title,
            score=round(h.score, 6),
            similarity_percent=round(h.score * 100, 2),
        )
        for h in hits
    ]


@router.get("", response_model=list[CaseOut])
async def list_cases(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    category: Annotated[str | None, Query()] = None,
    q: Annotated[str | None, Query(description="タイトル/サマリ検索")] = None,
) -> list[CaseOut]:
    stmt = select(CaseStudy)
    if category:
        stmt = stmt.where(CaseStudy.category == category)
    if q:
        pat = f"%{q}%"
        stmt = stmt.where(or_(CaseStudy.title.ilike(pat), CaseStudy.summary.ilike(pat)))
    result = await session.execute(stmt)
    return [CaseOut.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=CaseOut, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: CaseIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CaseOut:
    obj = CaseStudy(**body.model_dump(exclude_none=True))
    session.add(obj)
    await session.flush()
    return CaseOut.model_validate(obj)


@router.get("/{case_id}", response_model=CaseOut)
async def get_case(
    case_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CaseOut:
    obj = await session.get(CaseStudy, case_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "case not found")
    return CaseOut.model_validate(obj)
