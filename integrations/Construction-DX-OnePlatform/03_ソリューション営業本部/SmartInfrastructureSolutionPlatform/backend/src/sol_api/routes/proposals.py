"""提案案件 CRUD + 進捗管理 + AI類似事例検索 (stub)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from decimal import Decimal as _Decimal

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import (
    CaseStudy,
    FeasibilityStudy,
    Proposal,
    ProposalSolution,
    SolutionCatalog,
)
from ..services.proposal_pdf import (
    FsSection,
    ProposalPdfInput,
    SolutionLine,
    render_proposal_pdf,
)
from ..services.similarity_finder import CaseDoc, find_similar

router = APIRouter(prefix="/proposals", tags=["proposals"])

ProposalStatus = Literal[
    "lead", "qualifying", "proposing", "in_negotiation", "won", "lost"
]


class ProposalIn(BaseModel):
    proposal_code: str
    client_name: str
    theme: str
    description: str | None = None
    status: ProposalStatus = "lead"
    expected_amount: Decimal | None = None
    proposal_deadline: date | None = None
    expected_close_date: date | None = None
    owner_employee_code: str | None = None
    primary_category: str | None = None
    lost_reason: str | None = None


class ProposalOut(ProposalIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class StatusUpdate(BaseModel):
    status: ProposalStatus
    lost_reason: str | None = None


class SimilarCaseOut(BaseModel):
    case_id: int
    title: str
    score: float


@router.get("", response_model=list[ProposalOut])
async def list_proposals(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ProposalOut]:
    result = await session.execute(select(Proposal))
    return [ProposalOut.model_validate(p) for p in result.scalars().all()]


@router.post("", response_model=ProposalOut, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    body: ProposalIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProposalOut:
    obj = Proposal(**body.model_dump(exclude_none=True))
    session.add(obj)
    await session.flush()
    return ProposalOut.model_validate(obj)


@router.get("/{proposal_id}", response_model=ProposalOut)
async def get_proposal(
    proposal_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProposalOut:
    obj = await session.get(Proposal, proposal_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "proposal not found")
    return ProposalOut.model_validate(obj)


@router.post("/{proposal_id}/status", response_model=ProposalOut)
async def update_status(
    proposal_id: int,
    body: StatusUpdate,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProposalOut:
    obj = await session.get(Proposal, proposal_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "proposal not found")
    obj.status = body.status
    if body.lost_reason is not None:
        obj.lost_reason = body.lost_reason
    await session.flush()
    return ProposalOut.model_validate(obj)


@router.get("/{proposal_id}/pdf")
async def download_pdf(
    proposal_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    """提案案件 → 提案書 PDF を生成して返す."""
    proposal = await session.get(Proposal, proposal_id)
    if proposal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "proposal not found")

    # 採用ソリューション + カタログ
    ps_rows = (
        await session.execute(
            select(ProposalSolution, SolutionCatalog)
            .join(SolutionCatalog, ProposalSolution.catalog_id == SolutionCatalog.id)
            .where(ProposalSolution.proposal_id == proposal_id)
        )
    ).all()
    solutions: list[SolutionLine] = []
    for ps, cat in ps_rows:
        qty = ps.quantity or _Decimal("1")
        unit = ps.unit_price if ps.unit_price is not None else cat.price_min
        if ps.custom_amount is not None:
            amount = ps.custom_amount
        elif unit is not None:
            amount = unit * qty
        else:
            amount = _Decimal("0")
        solutions.append(
            SolutionLine(
                name=ps.custom_label or cat.name,
                category=cat.category,
                quantity=qty,
                unit_price=unit,
                amount=amount,
            )
        )

    # 最新の F/S
    fs_obj = (
        await session.execute(
            select(FeasibilityStudy)
            .where(FeasibilityStudy.proposal_id == proposal_id)
            .order_by(FeasibilityStudy.id.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    fs_section: FsSection | None = None
    if fs_obj is not None:
        fs_section = FsSection(
            technical=fs_obj.technical_score,
            legal=fs_obj.legal_score,
            environment=fs_obj.environment_score,
            business=fs_obj.business_score,
            total=fs_obj.total_score,
            decision=fs_obj.decision,
        )

    inp = ProposalPdfInput(
        proposal_code=proposal.proposal_code,
        client_name=proposal.client_name,
        theme=proposal.theme,
        description=proposal.description,
        expected_amount=proposal.expected_amount,
        proposal_deadline=(
            proposal.proposal_deadline.isoformat() if proposal.proposal_deadline else None
        ),
        primary_category=proposal.primary_category,
        owner_name=proposal.owner_employee_code,
        solutions=solutions,
        fs=fs_section,
        pfi=None,  # PFI は POST 計算なので保存値なし。将来 PfiScenario テーブル化想定
        expected_benefits=[],
        appendix=None,
    )
    pdf_bytes = render_proposal_pdf(inp)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="proposal_{proposal.proposal_code}.pdf"'
            )
        },
    )


@router.get("/{proposal_id}/similar-cases", response_model=list[SimilarCaseOut])
async def similar_cases(
    proposal_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    top_k: int = 5,
) -> list[SimilarCaseOut]:
    """AI類似事例検索 (stub). Azure OpenAI 埋め込みは未接続でキーワード一致で代替."""
    proposal = await session.get(Proposal, proposal_id)
    if proposal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "proposal not found")

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
    query = f"{proposal.theme} {proposal.description or ''} {proposal.primary_category or ''}"
    hits = find_similar(query, docs, top_k=top_k)
    return [SimilarCaseOut(case_id=h.case_id, title=h.title, score=h.score) for h in hits]
