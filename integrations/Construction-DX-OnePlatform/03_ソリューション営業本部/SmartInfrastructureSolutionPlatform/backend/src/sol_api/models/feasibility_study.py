"""実現可能性スタディ (F/S).

4軸 (技術 / 法務 / 環境 / 事業性) × 0-100 + 重み合算 + GO/HOLD/NO_GO 判定.
"""

from __future__ import annotations

from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class FeasibilityStudy(CommonBase):
    """F/S レコード (`t_sol_feasibility_study`)."""

    __tablename__ = "t_sol_feasibility_study"

    proposal_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_sol_proposal.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    # 4軸スコア (0-100)
    technical_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("0")
    )
    legal_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("0")
    )
    environment_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("0")
    )
    business_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("0")
    )

    # 合算スコア + 判定
    total_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("0"), index=True
    )
    decision: Mapped[str] = mapped_column(
        String(8), nullable=False, default="HOLD", index=True
    )  # GO | HOLD | NO_GO

    risks: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    conclusion: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
