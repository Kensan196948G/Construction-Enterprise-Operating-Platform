"""Quality record (品質記録) model."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from ..db.session import Base


class QualityRecord(Base):
    __tablename__ = "t_quality_record"

    quality_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True))
    record_type = Column(String(30))  # inspection/test/ncr/capa
    title = Column(String(200))
    description = Column(Text)
    measurement_value = Column(Float)
    spec_upper = Column(Float)
    spec_lower = Column(Float)
    result = Column(String(20))  # pass/fail/conditional
    evidence_files = Column(JSONB, default=list)
    inspector_id = Column(UUID(as_uuid=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
