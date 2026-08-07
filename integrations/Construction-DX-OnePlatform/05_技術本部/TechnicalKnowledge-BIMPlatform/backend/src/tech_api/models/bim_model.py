"""BIM モデル (IFC) メタデータモデル."""
from __future__ import annotations

from datetime import datetime

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class BimModel(CommonBase):
    """BIM モデル (`t_bim_model`).

    IFC ファイル参照, project_id, version, LOD (LOD100-500), 座標系, アップロード日。
    """

    __tablename__ = "t_bim_model"

    model_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    project_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True, index=True)
    file_format: Mapped[str] = mapped_column(
        String(20), nullable=False, default="IFC", doc="IFC/LandXML/CityGML/RVT/glTF"
    )
    ifc_schema: Mapped[str | None] = mapped_column(
        String(20), nullable=True, doc="IFC2X3/IFC4/IFC4X3"
    )
    storage_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    lod: Mapped[str] = mapped_column(
        String(10), nullable=False, default="LOD200", doc="LOD100/200/300/400/500"
    )
    crs: Mapped[str | None] = mapped_column(
        String(50), nullable=True, doc="EPSG:6677 等の座標参照系"
    )
    uploaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    attributes: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True, doc="部材数, バウンディングボックス等"
    )
