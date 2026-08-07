"""技術問合せ Q&A + AI 回答 (RAG)."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import KnowledgeArticle, TechInquiry
from ..services.inquiry_rag import generate_rag_answer
from ..services.knowledge_embedder import cosine_similarity, embed_text

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


class InquiryIn(BaseModel):
    subject: str
    question: str
    questioner_id: str | None = None


class CitationOut(BaseModel):
    article_id: int
    title: str
    score: float


class InquiryOut(BaseModel):
    id: int
    subject: str
    question: str
    answer: str | None
    ai_draft_answer: str | None
    status: str
    related_article_ids: list[int] | None

    model_config = {"from_attributes": True}


class AutoAnswerOut(BaseModel):
    inquiry: InquiryOut
    citations: list[CitationOut]
    source: str


@router.get("", response_model=list[InquiryOut])
async def list_inquiries(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[InquiryOut]:
    rows = (await session.execute(select(TechInquiry))).scalars().all()
    return [InquiryOut.model_validate(r) for r in rows]


@router.post("", response_model=InquiryOut, status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    body: InquiryIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> InquiryOut:
    """問合せを登録し、関連記事と AI ドラフト回答を同時生成."""
    inquiry = TechInquiry(
        subject=body.subject,
        question=body.question,
        questioner_id=body.questioner_id,
        status="open",
    )

    q_emb = await embed_text(body.question)
    arts = (await session.execute(select(KnowledgeArticle).limit(500))).scalars().all()
    scored: list[tuple[float, KnowledgeArticle]] = []
    for art in arts:
        emb = (art.embedding or {}).get("vector") if isinstance(art.embedding, dict) else None
        if not emb:
            continue
        scored.append((cosine_similarity(q_emb.vector, emb), art))
    scored.sort(key=lambda x: x[0], reverse=True)
    top_ids = [art.id for _, art in scored[:5] if art.id is not None]
    inquiry.related_article_ids = top_ids

    if top_ids:
        joined = ", ".join(f"#{i}" for i in top_ids)
        inquiry.ai_draft_answer = (
            f"参考になりそうな記事 ({joined}) を確認してください。"
            "詳細な RAG 回答は /auto-answer エンドポイントで生成できます。"
        )
    else:
        inquiry.ai_draft_answer = (
            "関連記事が見つかりませんでした。担当者の回答をお待ちください。"
        )

    session.add(inquiry)
    await session.flush()
    return InquiryOut.model_validate(inquiry)


@router.get("/{inquiry_id}", response_model=InquiryOut)
async def get_inquiry(
    inquiry_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> InquiryOut:
    inq = await session.get(TechInquiry, inquiry_id)
    if inq is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "inquiry not found")
    return InquiryOut.model_validate(inq)


class InquiryAnswer(BaseModel):
    answer: str
    resolved: bool = True


@router.post("/{inquiry_id}/answer", response_model=InquiryOut)
async def answer_inquiry(
    inquiry_id: int,
    body: InquiryAnswer,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> InquiryOut:
    inq = await session.get(TechInquiry, inquiry_id)
    if inq is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "inquiry not found")
    inq.answer = body.answer
    inq.responder_id = user.employee_code if hasattr(user, "employee_code") else None
    inq.status = "resolved" if body.resolved else "in_review"
    await session.flush()
    return InquiryOut.model_validate(inq)


@router.post("/{inquiry_id}/auto-answer", response_model=AutoAnswerOut)
async def auto_answer_inquiry(
    inquiry_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AutoAnswerOut:
    """RAG (ナレッジ検索 + Azure OpenAI) で AI 回答ドラフトを生成して保存する."""
    inq = await session.get(TechInquiry, inquiry_id)
    if inq is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "inquiry not found")

    arts = list((await session.execute(select(KnowledgeArticle).limit(500))).scalars().all())
    rag = await generate_rag_answer(inq.question, arts, top_k=5)

    inq.ai_draft_answer = rag.answer
    inq.related_article_ids = [c.article_id for c in rag.citations]
    if inq.status == "open":
        inq.status = "in_review"
    await session.flush()

    return AutoAnswerOut(
        inquiry=InquiryOut.model_validate(inq),
        citations=[
            CitationOut(article_id=c.article_id, title=c.title, score=c.score)
            for c in rag.citations
        ],
        source=rag.source,
    )
