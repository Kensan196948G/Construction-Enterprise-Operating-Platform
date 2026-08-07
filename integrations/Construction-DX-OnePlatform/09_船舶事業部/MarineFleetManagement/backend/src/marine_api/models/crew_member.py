"""乗組員モデル."""
from __future__ import annotations

from datetime import date

from cdx_db.base import CommonBase
from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class CrewMember(CommonBase):
    """乗組員 (`t_marine_crew_member`).

    海技免状 (船長・機関長・航海士・甲板員) と海上勤務日数集計を保持。
    """

    __tablename__ = "t_marine_crew_member"

    crew_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    rank: Mapped[str] = mapped_column(
        String(30), nullable=False, default="甲板員",
        comment="船長 / 機関長 / 一等航海士 / 二等航海士 / 三等航海士 / 機関士 / 甲板員",
    )
    license_grade: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="海技士(航海) 1〜6 級 / 海技士(機関) 1〜6 級"
    )
    license_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    license_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    sea_service_days_total: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="通算海上勤務日数"
    )
    current_consecutive_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="連続乗船日数 (船員労働法判定用)"
    )
    last_rest_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
