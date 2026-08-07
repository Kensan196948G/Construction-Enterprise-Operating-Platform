"""取締役会報告書."""

from __future__ import annotations

import base64
from datetime import date
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user, require_roles
from cdx_auth.models import AuthenticatedUser, Role
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import BoardReport
from ..services.aggregator import aggregate_all, consolidate_kpi
from ..services.board_report_generator import generate
from ..services.pdf_renderer import render_markdown_to_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


class BoardReportOut(BaseModel):
    id: int
    report_code: str
    fiscal_year: int
    fiscal_period: str
    report_date: date
    title: str
    ai_summary: str | None
    status: str

    class Config:
        from_attributes = True


class GenerateRequest(BaseModel):
    fiscal_year: int
    fiscal_period: str
    report_date: date
    forecasts: list[dict[str, Any]] = []
    alerts: list[dict[str, Any]] = []
    esg: dict[str, Any] = {}


@router.post("/save", response_model=BoardReportOut, status_code=status.HTTP_201_CREATED)
async def generate_report(
    body: GenerateRequest,
    user: Annotated[AuthenticatedUser, Depends(require_roles(Role.EXECUTIVE, Role.SYSTEM_ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BoardReport:
    metrics = await aggregate_all()
    kpis = consolidate_kpi(metrics)
    draft = generate(
        fiscal_period=body.fiscal_period,
        report_date=body.report_date,
        kpis=kpis,
        forecasts=body.forecasts,
        alerts=body.alerts,
        esg=body.esg,
    )
    code = f"BR-{body.fiscal_year}-{body.fiscal_period}"
    row = BoardReport(
        report_code=code,
        fiscal_year=body.fiscal_year,
        fiscal_period=body.fiscal_period,
        report_date=body.report_date,
        title=draft.title,
        kpi_excerpt=draft.kpi_excerpt,
        ai_summary=draft.ai_summary,
        body_markdown=draft.body_markdown,
        status="draft",
        author_employee_code=user.upn,
    )
    session.add(row)
    await session.flush()
    return row


@router.get("", response_model=list[BoardReportOut])
async def list_reports(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[BoardReport]:
    rows = (await session.execute(
        select(BoardReport).order_by(BoardReport.report_date.desc()).limit(50)
    )).scalars().all()
    return list(rows)


@router.get("/{report_id}/markdown", response_class=PlainTextResponse)
async def get_markdown(
    report_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> str:
    row = await session.get(BoardReport, report_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "report_not_found")
    return row.body_markdown


@router.get("/{report_id}/pdf")
async def get_pdf(
    report_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    """既存報告書を PDF にレンダリングして返却 (application/pdf)."""
    row = await session.get(BoardReport, report_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "report_not_found")
    pdf_bytes = render_markdown_to_pdf(row.body_markdown or "")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="board_report_{report_id}.pdf"',
        },
    )


def _period_to_fy_q(period: str) -> tuple[int, str]:
    """``2026Q2`` → (2026, "Q2"), ``2026-Q1`` も許容."""
    p = period.replace("-", "").upper()
    if "Q" in p:
        y, q = p.split("Q", 1)
        return int(y), f"Q{q}"
    return int(p[:4]), p[4:] or "Q1"


@router.post("/generate")
async def generate_report_inline(
    user: Annotated[AuthenticatedUser, Depends(require_roles(Role.EXECUTIVE, Role.SYSTEM_ADMIN))],
    period: str = Query(..., description="例: 2026Q2"),
    include_pdf: bool = Query(default=True),
) -> dict[str, Any]:
    """指定期の取締役会報告書を **その場で** 生成し Markdown / PDF 両方を返却.

    DB へは保存しない (永続化が必要なら ``POST /reports`` を別途用意)。
    PDF は base64 エンコードして JSON で返す。
    """
    fiscal_year, fiscal_period = _period_to_fy_q(period)
    metrics = await aggregate_all()
    kpis = consolidate_kpi(metrics)
    draft = generate(
        fiscal_period=fiscal_period,
        report_date=date.today(),
        kpis=kpis,
        forecasts=[],
        alerts=[],
        esg={},
    )
    out: dict[str, Any] = {
        "fiscal_year": fiscal_year,
        "fiscal_period": fiscal_period,
        "title": draft.title,
        "markdown": draft.body_markdown,
        "ai_summary": draft.ai_summary,
        "kpi_excerpt": draft.kpi_excerpt,
        "aggregator_errors": metrics.errors,
    }
    if include_pdf:
        pdf_bytes = render_markdown_to_pdf(draft.body_markdown)
        out["pdf_base64"] = base64.b64encode(pdf_bytes).decode("ascii")
        out["pdf_bytes_len"] = len(pdf_bytes)
    return out
