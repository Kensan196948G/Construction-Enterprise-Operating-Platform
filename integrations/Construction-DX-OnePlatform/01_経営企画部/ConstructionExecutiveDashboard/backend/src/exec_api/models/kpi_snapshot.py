"""KPI スナップショット (日次/月次集計)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import Date, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class KpiSnapshot(CommonBase):
    """KPI スナップショット (`t_exec_kpi_snapshot`).

    全社/部門/支店の KPI を周期スナップショットとして保持。
    - period_type: daily / monthly / quarterly / yearly
    - kpi_type: orders_amount / profit_margin / cost_ratio / accident_count /
                labor_status / sdgs / esg_co2 など
    """

    __tablename__ = "t_exec_kpi_snapshot"

    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    period_type: Mapped[str] = mapped_column(
        String(10), nullable=False, default="daily", doc="daily|monthly|quarterly|yearly"
    )
    fiscal_year: Mapped[int | None] = mapped_column(nullable=True, index=True)
    fiscal_month: Mapped[int | None] = mapped_column(nullable=True)
    department_code: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    branch_code: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    kpi_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    target_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 4), nullable=True)
    actual_value: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=0)
    achievement_rate: Mapped[Decimal | None] = mapped_column(Numeric(7, 4), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    source: Mapped[str | None] = mapped_column(
        String(50), nullable=True, doc="aggregator が叩いた他部門API名"
    )
    extra: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
