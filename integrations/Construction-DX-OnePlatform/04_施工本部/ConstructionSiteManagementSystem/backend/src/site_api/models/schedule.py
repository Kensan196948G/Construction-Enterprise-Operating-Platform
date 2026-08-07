"""工程モデル (Gantt 用)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class ScheduleTask(CommonBase):
    """工程タスク (`t_schedule`)."""

    __tablename__ = "t_schedule"

    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False
    )
    task_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, doc="Gantt用ID")
    task_name: Mapped[str] = mapped_column(String(200), nullable=False)
    parent_task_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    predecessor_task_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    planned_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    planned_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    progress_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"), nullable=False)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sync_version: Mapped[int] = mapped_column(BigInteger, default=1, nullable=False)
