"""IoT telemetry time-series (Timescale hypertable)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, PrimaryKeyConstraint, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from data_api.db.session import Base


class IotTelemetry(Base):
    __tablename__ = "t_iot_telemetry"
    __table_args__ = (
        PrimaryKeyConstraint("id", "time"),
    )

    id: Mapped[int] = mapped_column(BigInteger, autoincrement=True)
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    device_id: Mapped[str] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    metric_kind: Mapped[str] = mapped_column(String(40), nullable=False, index=True)  # temperature/vibration/position/...
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
