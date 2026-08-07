"""作業日報モデル."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class DailySiteReport(CommonBase):
    """作業日報 (`t_daily_site_report`).

    承認ワークフロー:
      draft -> submitted -> approved / rejected
    """

    __tablename__ = "t_daily_site_report"
    __table_args__ = (
        UniqueConstraint("project_id", "report_date", "client_id", name="uq_daily_report_dedupe"),
    )

    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False
    )
    report_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    weather: Mapped[str | None] = mapped_column(String(20), nullable=True)
    temperature_max: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)
    temperature_min: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)
    work_content: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    safety_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ky_records: Mapped[list | None] = mapped_column(JSONB, nullable=True, doc="KY活動記録")
    reporter_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    approval_status: Mapped[str] = mapped_column(
        String(20), default="draft", nullable=False, doc="draft/submitted/approved/rejected"
    )
    approved_by: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sync_version: Mapped[int] = mapped_column(BigInteger, default=1, nullable=False)
    client_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
