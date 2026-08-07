"""ソリューションカタログ.

港湾DX / 再エネ / 防災 / PFI / PPP / 環境保全 等の提案型ソリューションを管理。
"""

from __future__ import annotations

from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class SolutionCatalog(CommonBase):
    """ソリューションカタログ (`t_sol_catalog`).

    高度ソリューションの標準メニュー。提案で参照される。
    """

    __tablename__ = "t_sol_catalog"

    catalog_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # 'port_dx' | 'renewable_energy' | 'disaster_dx' | 'pfi' | 'ppp' | 'environment'
    category: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 標準価格レンジ
    price_min: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    price_max: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    standard_duration_months: Mapped[int | None] = mapped_column(nullable=True)

    # 適用事例 / タグ / 関連技術
    application_examples: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
