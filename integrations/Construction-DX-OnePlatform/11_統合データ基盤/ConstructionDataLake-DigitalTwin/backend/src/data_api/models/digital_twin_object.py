"""Digital twin object (building / vessel / heavy-equipment / structure)."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from data_api.db.session import Base

try:
    from geoalchemy2 import Geometry  # type: ignore

    _GEOM_TYPE = Geometry(geometry_type="GEOMETRY", srid=4326)
except Exception:  # pragma: no cover - dev fallback without PostGIS
    from sqlalchemy import Text as _Text

    _GEOM_TYPE = _Text  # type: ignore[assignment]


class TwinObjectKind(str, enum.Enum):
    BUILDING = "building"          # 建物 (BIM)
    STRUCTURE = "structure"        # 橋梁/トンネル/ダム (CIM)
    HEAVY_EQUIPMENT = "heavy_equipment"  # 重機 / ICT 建機
    VESSEL = "vessel"              # 船舶
    SITE = "site"                  # 現場全体


class DigitalTwinObject(Base):
    __tablename__ = "t_digital_twin_object"

    object_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    kind: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    project_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    asset_3d_uri: Mapped[str | None] = mapped_column(String(500))  # 3D Tiles / glTF / IFC URI
    geom = mapped_column(_GEOM_TYPE)  # type: ignore[arg-type]
    latitude: Mapped[float | None] = mapped_column(Float)  # 検索容易化のための非正規化キャッシュ
    longitude: Mapped[float | None] = mapped_column(Float)
    altitude_m: Mapped[float | None] = mapped_column(Float)
    heading_deg: Mapped[float | None] = mapped_column(Float)  # 重機/船舶の向き
    attributes: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
