"""Analytics dataset (output of dbt models / curated views)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from data_api.db.session import Base


class AnalyticsDataset(Base):
    __tablename__ = "t_analytics_dataset"

    dataset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    dbt_model: Mapped[str | None] = mapped_column(String(200))  # ref('fct_project_summary')
    purpose: Mapped[str | None] = mapped_column(String(500))  # 用途
    owner: Mapped[str | None] = mapped_column(String(120))
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    row_count: Mapped[int | None] = mapped_column(BigInteger)
    freshness_sla_min: Mapped[int | None] = mapped_column()
    last_refreshed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    extra: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
