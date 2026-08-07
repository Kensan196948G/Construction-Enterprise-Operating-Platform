"""実績事例集 (完了プロジェクト, ROI, 顧客評価, 写真, 関連特許)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import Date, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, DOUBLE_PRECISION, JSONB
from sqlalchemy.orm import Mapped, mapped_column


class CaseStudy(CommonBase):
    """実績事例 (`t_sol_case_study`)."""

    __tablename__ = "t_sol_case_study"

    case_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    completed_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    duration_months: Mapped[int | None] = mapped_column(nullable=True)
    contract_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)

    # ROI / 顧客評価 (1.0-5.0)
    roi_percent: Mapped[Decimal | None] = mapped_column(Numeric(7, 2), nullable=True)
    customer_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)

    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    achievements: Mapped[str | None] = mapped_column(Text, nullable=True)
    # 写真URL配列 / 関連特許リスト
    photo_urls: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    related_patents: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Azure OpenAI text-embedding-3-small (1536次元) ベクトル。
    # pgvector が使えない環境でも DOUBLE PRECISION[] でフォールバック保持。
    embedding: Mapped[list[float] | None] = mapped_column(
        ARRAY(DOUBLE_PRECISION), nullable=True
    )
