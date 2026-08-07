"""仕様書管理 + AI 要約."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Specification
from ..services.spec_summarizer import summarize_specification

router = APIRouter(prefix="/specs", tags=["specs"])


class SpecIn(BaseModel):
    spec_code: str
    spec_name: str
    work_type: str | None = None
    body_markdown: str | None = None
    related_laws: list[str] | None = None
    revision_note: str | None = None
    storage_url: str | None = None


class SpecOut(SpecIn):
    id: int
    version: int
    ai_summary: str | None = None

    model_config = {"from_attributes": True}


class SpecSummaryOut(BaseModel):
    spec_id: int
    summary: str
    line_count: int
    source: str


def _spec_to_out(spec: Specification) -> SpecOut:
    data = SpecOut.model_validate(spec).model_dump()
    # ai_summary は revision_note 内に [AI_SUMMARY] マーカーで埋め込まれる場合がある
    summary: str | None = None
    note = spec.revision_note or ""
    marker = "[AI_SUMMARY]"
    if marker in note:
        summary = note.split(marker, 1)[1].strip()
    data["ai_summary"] = summary
    return SpecOut(**data)


@router.get("", response_model=list[SpecOut])
async def list_specs(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[SpecOut]:
    rows = (await session.execute(select(Specification))).scalars().all()
    return [_spec_to_out(r) for r in rows]


@router.post("", response_model=SpecOut, status_code=status.HTTP_201_CREATED)
async def create_spec(
    body: SpecIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SpecOut:
    spec = Specification(**body.model_dump(exclude_none=True))
    session.add(spec)
    await session.flush()
    # 自動要約 (本文が一定長以上の時)
    if spec.body_markdown and len(spec.body_markdown) > 80:
        try:
            summary = await summarize_specification(
                spec.body_markdown, spec_name=spec.spec_name
            )
            spec.revision_note = (
                f"{spec.revision_note or ''}\n[AI_SUMMARY]\n{summary.summary}"
            ).strip()
        except Exception:
            pass
    await session.flush()
    return _spec_to_out(spec)


@router.get("/{spec_id}", response_model=SpecOut)
async def get_spec(
    spec_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SpecOut:
    spec = await session.get(Specification, spec_id)
    if spec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "specification not found")
    return _spec_to_out(spec)


@router.post("/{spec_id}/summarize", response_model=SpecSummaryOut)
async def summarize_spec(
    spec_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SpecSummaryOut:
    """仕様書本文を AI で要約し、結果を revision_note の [AI_SUMMARY] に格納する."""
    spec = await session.get(Specification, spec_id)
    if spec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "specification not found")

    result = await summarize_specification(
        spec.body_markdown or "", spec_name=spec.spec_name
    )

    # 既存 revision_note から [AI_SUMMARY] 以降を除去 (再要約)
    base = spec.revision_note or ""
    marker = "[AI_SUMMARY]"
    if marker in base:
        base = base.split(marker, 1)[0].rstrip()
    spec.revision_note = f"{base}\n{marker}\n{result.summary}".strip()
    await session.flush()

    return SpecSummaryOut(
        spec_id=spec_id,
        summary=result.summary,
        line_count=result.line_count,
        source=result.source,
    )
