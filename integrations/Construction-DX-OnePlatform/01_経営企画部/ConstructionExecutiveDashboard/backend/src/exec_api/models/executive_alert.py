"""経営アラート."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class ExecutiveAlert(CommonBase):
    """経営アラート (`t_exec_alert`).

    KPI 閾値超過 / 重大事象を発火する。
    - level: critical / warning / info
    - status: open / acknowledged / resolved
    """

    __tablename__ = "t_exec_alert"

    alert_code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    level: Mapped[str] = mapped_column(
        String(10), nullable=False, default="warning", index=True, doc="critical|warning|info"
    )
    category: Mapped[str] = mapped_column(
        String(30), nullable=False, doc="profit|safety|labor|cost|esg|bcp|other"
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    kpi_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    threshold_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 4), nullable=True)
    actual_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 4), nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="open", index=True
    )
    notify_targets: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    notification_log: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    acknowledged_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
