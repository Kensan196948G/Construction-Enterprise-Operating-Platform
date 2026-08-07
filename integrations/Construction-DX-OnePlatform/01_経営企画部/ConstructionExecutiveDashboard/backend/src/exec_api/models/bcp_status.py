"""BCP (事業継続) 状況."""

from __future__ import annotations

from datetime import date, datetime

from cdx_db.base import CommonBase
from sqlalchemy import Date, DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class BcpStatus(CommonBase):
    """BCP 状況 (`t_exec_bcp_status`).

    拠点ごとに 稼働状況 / 災害影響 / 復旧計画を保持する。
    """

    __tablename__ = "t_exec_bcp_status"

    branch_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    branch_name: Mapped[str] = mapped_column(String(100), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    operation_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="normal",
        doc="normal|partial|stopped|recovering",
    )
    disaster_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    disaster_severity: Mapped[str | None] = mapped_column(
        String(10), nullable=True, doc="low|medium|high|critical"
    )
    impact_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    affected_projects: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    recovery_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    recovery_target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
