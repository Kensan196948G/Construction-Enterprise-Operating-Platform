"""対象インフラ資産モデル.

港湾 / 橋梁 / ダム / 道路 / 再エネ施設 等。PostGIS POINT で地理情報を保持。
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from geoalchemy2 import Geometry
from sqlalchemy import Date, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class InfrastructureAsset(CommonBase):
    """インフラ資産 (`t_sol_infrastructure_asset`)."""

    __tablename__ = "t_sol_infrastructure_asset"

    asset_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # 'port' | 'bridge' | 'dam' | 'road' | 'renewable_facility' | 'tunnel' | 'other'
    asset_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    # 地理座標 (PostGIS POINT, SRID 4326)
    location: Mapped[object | None] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326), nullable=True
    )
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # 規模・老朽度
    scale_metric: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    scale_unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    built_year: Mapped[int | None] = mapped_column(nullable=True)
    last_inspection_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # 0(健全) - 100(劣化甚)
    deterioration_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    importance_level: Mapped[str | None] = mapped_column(String(8), nullable=True)  # A/B/C

    # 関連法規 (JSONB 配列)
    applicable_laws: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
