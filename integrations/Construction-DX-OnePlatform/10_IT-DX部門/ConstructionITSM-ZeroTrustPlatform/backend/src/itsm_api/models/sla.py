"""SLA Contracts."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from itsm_api.db.session import Base
from itsm_api.models.ticket import Priority


class SlaContract(Base):
    __tablename__ = "t_sla_contract"

    sla_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[Priority] = mapped_column(SAEnum(Priority, native_enum=False), nullable=False)
    # Target response/resolution in business minutes
    response_target_min: Mapped[int] = mapped_column(Integer, nullable=False)
    resolution_target_min: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
