"""乗船割当モデル."""
from __future__ import annotations

from datetime import date

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column


class CrewAssignment(CommonBase):
    """乗船割当 (`t_marine_crew_assignment`).

    voyage に乗組員を期間付きで割り当てる中間テーブル。
    """

    __tablename__ = "t_marine_crew_assignment"

    voyage_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_marine_voyage.id", ondelete="CASCADE"), nullable=False
    )
    crew_member_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_marine_crew_member.id", ondelete="RESTRICT"), nullable=False
    )
    onboard_role: Mapped[str] = mapped_column(
        String(30), nullable=False, default="甲板員",
        comment="本航海上の役職",
    )
    boarded_at: Mapped[date] = mapped_column(Date, nullable=False)
    disembarked_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active",
        comment="active / completed / canceled",
    )
