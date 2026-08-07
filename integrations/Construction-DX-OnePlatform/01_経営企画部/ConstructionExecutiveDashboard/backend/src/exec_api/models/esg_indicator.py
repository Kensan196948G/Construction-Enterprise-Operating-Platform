"""ESG / SDGs 指標."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import Date, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class EsgIndicator(CommonBase):
    """ESG / SDGs 指標 (`t_exec_esg_indicator`).

    - axis: environment / social / governance
    - indicator_code: co2_scope1, co2_scope2, co2_scope3, turnover_rate,
                      female_manager_ratio, partner_score, compliance_violation 等
    """

    __tablename__ = "t_exec_esg_indicator"

    fiscal_year: Mapped[int] = mapped_column(nullable=False, index=True)
    fiscal_month: Mapped[int | None] = mapped_column(nullable=True)
    report_date: Mapped[date] = mapped_column(Date, nullable=False)
    axis: Mapped[str] = mapped_column(
        String(15), nullable=False, index=True, doc="environment|social|governance"
    )
    indicator_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    indicator_name: Mapped[str] = mapped_column(String(200), nullable=False)
    value: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=0)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    target_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 4), nullable=True)
    sdgs_goal: Mapped[int | None] = mapped_column(nullable=True, doc="SDGs 1-17")
    breakdown: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
