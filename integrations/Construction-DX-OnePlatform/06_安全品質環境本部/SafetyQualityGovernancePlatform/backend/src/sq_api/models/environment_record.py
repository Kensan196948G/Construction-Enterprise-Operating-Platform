"""Environmental record: CO2 Scope1/2/3 + waste manifest."""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, Date, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class EnvironmentRecord(Base):
    __tablename__ = "t_environmental_record"

    env_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True))
    record_type = Column(String(30))  # co2/waste/noise/water
    record_date = Column(Date)
    scope = Column(String(10))  # scope1/scope2/scope3
    quantity = Column(Numeric(15, 4), default=Decimal("0"))
    unit = Column(String(20))
    manifest_number = Column(String(30))  # 産廃マニフェスト番号
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
