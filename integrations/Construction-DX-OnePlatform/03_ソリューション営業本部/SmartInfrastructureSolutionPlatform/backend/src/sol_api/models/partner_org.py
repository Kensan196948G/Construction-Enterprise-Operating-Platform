"""パートナー組織 (技術提携先 / 大学 / 自治体 / ベンチャー)."""

from __future__ import annotations

from cdx_db.base import CommonBase
from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class PartnerOrg(CommonBase):
    """パートナー (`t_sol_partner_org`)."""

    __tablename__ = "t_sol_partner_org"

    partner_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # 'tech_partner' | 'university' | 'municipality' | 'startup' | 'consultant'
    partner_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    contact_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    website: Mapped[str | None] = mapped_column(String(300), nullable=True)

    # 専門分野 / 過去の連携実績
    specialties: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    collaboration_history: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
