"""取締役会報告書."""

from __future__ import annotations

from datetime import date

from cdx_db.base import CommonBase
from sqlalchemy import Date, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class BoardReport(CommonBase):
    """取締役会報告書 (`t_exec_board_report`).

    KPI 抜粋 + AI 分析サマリ + 推奨アクションを Markdown で保持。
    """

    __tablename__ = "t_exec_board_report"

    report_code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    fiscal_year: Mapped[int] = mapped_column(nullable=False, index=True)
    fiscal_period: Mapped[str] = mapped_column(
        String(10), nullable=False, doc="2026Q1 / 2026H1 / 2026FY など"
    )
    report_date: Mapped[date] = mapped_column(Date, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    kpi_excerpt: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_markdown: Mapped[str] = mapped_column(Text, nullable=False, default="")
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="draft",
        doc="draft|reviewed|published",
    )
    author_employee_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
