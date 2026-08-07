"""KY (Kiken Yochi) activity model."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB, UUID

from ..db.session import Base


class KyActivity(Base):
    __tablename__ = "t_ky_activity"

    ky_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=True)
    activity_date = Column(Date, nullable=False)
    work_content = Column(String(200))
    # [{hazard, risk_rank, measure}]
    hazards = Column(JSONB, default=list)
    participants = Column(JSONB, default=list)
    leader_id = Column(UUID(as_uuid=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
