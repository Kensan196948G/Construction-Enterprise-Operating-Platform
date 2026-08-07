"""船舶 ↔ 工事案件 紐付モデル."""
from __future__ import annotations

from datetime import date

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class MarineConstructionLink(CommonBase):
    """船舶と工事案件の紐付 (`t_marine_construction_link`).

    海上工事案件に船舶を投入した期間 / 利用日数を計上し、原価配賦に使う。
    """

    __tablename__ = "t_marine_construction_link"

    vessel_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_marine_vessel.id", ondelete="RESTRICT"), nullable=False
    )
    project_code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    project_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False, comment="起工日 / 投入開始")
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="竣工日 / 投入終了")
    used_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="in_progress",
        comment="in_progress / completed",
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
