"""技術ナレッジ記事 CRUD + 全文検索 + ベクトル検索."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import KnowledgeArticle
from ..services.knowledge_embedder import (
    cosine_similarity,
    embed_text,
    search_articles,
)

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


class ArticleIn(BaseModel):
    title: str = Field(..., max_length=300)
    body_markdown: str | None = None
    doc_type: str | None = None
    work_type: str | None = None
    tags: list[str] | None = None
    status: str = "draft"
    author_id: str | None = None
    author_name: str | None = None


class ArticleOut(BaseModel):
    id: int
    title: str
    body_markdown: str | None
    doc_type: str | None
    work_type: str | None
    tags: list[str] | None
    status: str
    version: int
    view_count: int
    like_count: int
    author_id: str | None
    author_name: str | None

    model_config = {"from_attributes": True}


class SearchResult(BaseModel):
    article: ArticleOut
    score: float
    score_percent: float


@router.get("", response_model=list[ArticleOut])
async def list_articles(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, le=200),
) -> list[ArticleOut]:
    stmt = select(KnowledgeArticle).limit(limit)
    if status_filter:
        stmt = stmt.where(KnowledgeArticle.status == status_filter)
    result = await session.execute(stmt)
    return [ArticleOut.model_validate(a) for a in result.scalars().all()]


@router.post("", response_model=ArticleOut, status_code=status.HTTP_201_CREATED)
async def create_article(
    body: ArticleIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ArticleOut:
    article = KnowledgeArticle(**body.model_dump(exclude_none=True))
    # 作成時に embedding を自動生成して JSONB に保存
    embed_input = f"{body.title}\n{body.body_markdown or ''}"
    embedding = await embed_text(embed_input)
    article.embedding = {
        "model": embedding.model,
        "dim": embedding.dim,
        "vector": embedding.vector,
        "source": embedding.source,
    }
    session.add(article)
    await session.flush()
    return ArticleOut.model_validate(article)


@router.get("/search", response_model=list[SearchResult])
async def knowledge_search(
    q: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    k: int = Query(10, ge=1, le=50),
) -> list[SearchResult]:
    """近傍検索: クエリを embed し cosine 類似度で top-k を返す.

    pgvector が導入されている本番環境では SQL 側 (`<-> 演算子`) で実行する想定。
    現状はインメモリで類似度計算する (記事数 << 1万件で十分高速)。
    """
    rows = (await session.execute(select(KnowledgeArticle).limit(2000))).scalars().all()
    q_emb = await embed_text(q)
    ranked = search_articles(q_emb.vector, list(rows), k=k)
    out: list[SearchResult] = []
    for score, art in ranked:
        out.append(
            SearchResult(
                article=ArticleOut.model_validate(art),
                score=score,
                score_percent=round(max(0.0, min(1.0, score)) * 100.0, 2),
            )
        )
    return out


@router.get("/fulltext", response_model=list[ArticleOut])
async def fulltext_search(
    q: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = Query(20, le=100),
) -> list[ArticleOut]:
    """LIKE ベースの全文検索 (本番は PostgreSQL FTS or Elasticsearch に置き換え)."""
    like = f"%{q}%"
    stmt = (
        select(KnowledgeArticle)
        .where(
            or_(
                KnowledgeArticle.title.ilike(like),
                func.coalesce(KnowledgeArticle.body_markdown, "").ilike(like),
            )
        )
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [ArticleOut.model_validate(a) for a in result.scalars().all()]


@router.get("/semantic-search", response_model=list[SearchResult])
async def semantic_search(
    q: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = Query(10, le=50),
) -> list[SearchResult]:
    """semantic-search は ``/search`` のエイリアス (後方互換)."""
    return await knowledge_search(q=q, user=user, session=session, k=limit)


@router.get("/{article_id}", response_model=ArticleOut)
async def get_article(
    article_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ArticleOut:
    article = await session.get(KnowledgeArticle, article_id)
    if article is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "article not found")
    article.view_count = (article.view_count or 0) + 1
    return ArticleOut.model_validate(article)


# 後方互換用: 旧モジュール参照
__all__ = ["router", "cosine_similarity"]
