"""顧客マスタ拡張モデル (与信ランク・関係性スコア・取引履歴サマリ)."""

from __future__ import annotations

from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class Client(CommonBase):
    """顧客 (`t_crm_client`).

    cdx-shared-db の取引先マスタを営業 CRM 観点で拡張するテーブル。
    与信ランクは A/B/C/D/未評価 の 5 段階で運用する。
    """

    __tablename__ = "t_crm_client"

    client_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="private", doc="public|private|government|other"
    )
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # 与信ランク: A/B/C/D/未評価
    credit_rank: Mapped[str] = mapped_column(
        String(8), nullable=False, default="未評価", index=True
    )
    credit_limit: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    # 関係性スコア (0-100)
    relationship_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=0
    )

    # 取引履歴サマリ (年度別取引額/件数など)
    transaction_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
