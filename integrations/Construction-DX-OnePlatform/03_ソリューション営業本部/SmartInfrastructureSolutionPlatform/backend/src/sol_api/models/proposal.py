"""提案案件モデル.

ステータス: lead -> qualifying -> proposing -> in_negotiation -> won/lost
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import Date, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class Proposal(CommonBase):
    """提案案件 (`t_sol_proposal`)."""

    __tablename__ = "t_sol_proposal"

    proposal_code: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    theme: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ステータス: lead | qualifying | proposing | in_negotiation | won | lost
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="lead", index=True
    )

    expected_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    proposal_deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    expected_close_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    owner_employee_code: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    primary_category: Mapped[str | None] = mapped_column(String(32), nullable=True)
    lost_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
