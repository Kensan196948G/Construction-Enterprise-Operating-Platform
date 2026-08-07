"""Cross-department KPI (Timescale hypertable)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Float, PrimaryKeyConstraint, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from data_api.db.session import Base


class KpiMetric(Base):
    __tablename__ = "t_kpi_metric"
    __table_args__ = (
        PrimaryKeyConstraint("id", "observed_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, autoincrement=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(60), nullable=False, index=True)  # 部門/システム
    metric_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    dimensions: Mapped[dict | None] = mapped_column(JSONB)
