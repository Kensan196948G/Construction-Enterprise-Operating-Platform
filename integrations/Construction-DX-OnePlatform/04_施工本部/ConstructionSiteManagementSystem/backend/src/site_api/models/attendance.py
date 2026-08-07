"""作業員入退場モデル."""
from __future__ import annotations

from datetime import datetime

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class WorkerAttendance(CommonBase):
    """作業員入退場 (`t_worker_attendance`)."""

    __tablename__ = "t_worker_attendance"

    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False
    )
    worker_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    worker_name: Mapped[str] = mapped_column(String(100), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    check_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    method: Mapped[str] = mapped_column(String(20), default="qr_code", nullable=False)
    qualifications: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    qr_token_jti: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="トークン重複防止")
