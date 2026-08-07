"""工事原価サマリ (集計ビュー想定).

実体は VIEW でも実テーブルでもよいが、骨格段階では物理テーブルとして保持し、
サービス層で `CostRecord` から再集計する。

提供する情報:
  - 工事別コスト累計
  - 月次推移
  - 予算実績差異
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class CostSummary(Base):
    __tablename__ = "t_cost_summary"

    summary_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False)
    period_month = Column(Date, nullable=False)  # その月の 1 日
    cost_type = Column(String(20), nullable=False)
    planned_amount = Column(Numeric(18, 2), default=0)  # 予算
    actual_amount = Column(Numeric(18, 2), default=0)  # 実績
    variance = Column(Numeric(18, 2), default=0)  # 差異 = actual - planned
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
