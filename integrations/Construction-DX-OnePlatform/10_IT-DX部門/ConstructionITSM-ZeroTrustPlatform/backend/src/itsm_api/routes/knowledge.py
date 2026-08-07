"""Knowledge article CRUD with automatic embedding generation."""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from itsm_api.db.session import get_db
from itsm_api.deps import get_current_user
from itsm_api.models.knowledge_article import KnowledgeArticle
from itsm_api.schemas import KnowledgeCreate, KnowledgeRead
from itsm_api.services.rag_engine import embed_one

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/knowledge", tags=["knowledge"])


def _embedding_for(article: KnowledgeArticle) -> list[float] | None:
    text = "\n".join(filter(None, [article.title, article.summary, article.content]))
    try:
        return embed_one(text)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Embedding generation failed for article %s: %s", article.article_id, exc)
        return None


@router.get("", response_model=list[KnowledgeRead])
def list_articles(
    category: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    stmt = select(KnowledgeArticle).order_by(KnowledgeArticle.updated_at.desc())
    if category:
        stmt = stmt.where(KnowledgeArticle.category == category)
    return list(db.execute(stmt).scalars().all())


@router.post("", response_model=KnowledgeRead, status_code=status.HTTP_201_CREATED)
def create_article(
    payload: KnowledgeCreate, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    a = KnowledgeArticle(**payload.model_dump())
    a.embedding = _embedding_for(a)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.put("/{article_id}", response_model=KnowledgeRead)
def update_article(
    article_id: uuid.UUID,
    payload: KnowledgeCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    a = db.get(KnowledgeArticle, article_id)
    if not a:
        raise HTTPException(status_code=404, detail="article not found")
    for k, v in payload.model_dump().items():
        setattr(a, k, v)
    a.embedding = _embedding_for(a)
    db.commit()
    db.refresh(a)
    return a


@router.get("/{article_id}", response_model=KnowledgeRead)
def get_article(
    article_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    a = db.get(KnowledgeArticle, article_id)
    if not a:
        raise HTTPException(status_code=404, detail="article not found")
    return a


@router.delete("/{article_id}", status_code=204)
def delete_article(
    article_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    a = db.get(KnowledgeArticle, article_id)
    if not a:
        raise HTTPException(status_code=404, detail="article not found")
    db.delete(a)
    db.commit()
