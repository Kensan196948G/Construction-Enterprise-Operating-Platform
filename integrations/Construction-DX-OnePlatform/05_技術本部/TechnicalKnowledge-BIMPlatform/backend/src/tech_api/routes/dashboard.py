"""ダッシュボード: 利用統計 / 人気記事 / 寄与度."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import (
    BimModel,
    CimDataset,
    KnowledgeArticle,
    StandardDrawing,
    TechInquiry,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class StatsOut(BaseModel):
    article_count: int
    bim_count: int
    cim_count: int
    drawing_count: int
    open_inquiry_count: int


class PopularArticleOut(BaseModel):
    id: int
    title: str
    view_count: int
    like_count: int

    model_config = {"from_attributes": True}


class ContributorOut(BaseModel):
    author_id: str | None
    author_name: str | None
    article_count: int
    total_views: int


@router.get("/stats", response_model=StatsOut)
async def get_stats(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> StatsOut:
    async def _count(model) -> int:  # type: ignore[no-untyped-def]
        r = await session.execute(select(func.count()).select_from(model))
        return int(r.scalar() or 0)

    open_inq_r = await session.execute(
        select(func.count()).select_from(TechInquiry).where(TechInquiry.status == "open")
    )
    return StatsOut(
        article_count=await _count(KnowledgeArticle),
        bim_count=await _count(BimModel),
        cim_count=await _count(CimDataset),
        drawing_count=await _count(StandardDrawing),
        open_inquiry_count=int(open_inq_r.scalar() or 0),
    )


@router.get("/popular-articles", response_model=list[PopularArticleOut])
async def popular_articles(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = 10,
) -> list[PopularArticleOut]:
    stmt = (
        select(KnowledgeArticle)
        .order_by(KnowledgeArticle.view_count.desc())
        .limit(limit)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [PopularArticleOut.model_validate(r) for r in rows]


@router.get("/contributors", response_model=list[ContributorOut])
async def top_contributors(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = 10,
) -> list[ContributorOut]:
    stmt = (
        select(
            KnowledgeArticle.author_id,
            KnowledgeArticle.author_name,
            func.count().label("c"),
            func.coalesce(func.sum(KnowledgeArticle.view_count), 0).label("v"),
        )
        .group_by(KnowledgeArticle.author_id, KnowledgeArticle.author_name)
        .order_by(func.count().desc())
        .limit(limit)
    )
    rows = (await session.execute(stmt)).all()
    return [
        ContributorOut(
            author_id=r[0],
            author_name=r[1],
            article_count=int(r[2] or 0),
            total_views=int(r[3] or 0),
        )
        for r in rows
    ]
