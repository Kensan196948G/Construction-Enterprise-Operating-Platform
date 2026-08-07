"""提案-カタログ紐付け (カスタム見積)."""

from __future__ import annotations

from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class ProposalSolution(CommonBase):
    """提案案件で採用するカタログ + カスタム見積 (`t_sol_proposal_solution`)."""

    __tablename__ = "t_sol_proposal_solution"

    proposal_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_sol_proposal.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    catalog_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_sol_catalog.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric(18, 3), nullable=False, default=Decimal("1")
    )
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    custom_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    custom_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
