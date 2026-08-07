"""CIM データセット (点群 / オルソ / DEM)."""
from __future__ import annotations

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class CimDataset(CommonBase):
    """CIM データセット (`t_cim_dataset`).

    点群 (LAS/LAZ), オルソ写真, DEM 等の地理空間データを管理。
    """

    __tablename__ = "t_cim_dataset"

    dataset_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    project_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True, index=True)
    data_type: Mapped[str] = mapped_column(
        String(20), nullable=False, doc="point_cloud/ortho/dem/dsm"
    )
    file_format: Mapped[str] = mapped_column(
        String(20), nullable=False, doc="LAS/LAZ/GeoTIFF/PLY"
    )
    storage_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    crs: Mapped[str | None] = mapped_column(String(50), nullable=True)
    point_count: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    bbox_min_x: Mapped[float | None] = mapped_column(Numeric(20, 6), nullable=True)
    bbox_min_y: Mapped[float | None] = mapped_column(Numeric(20, 6), nullable=True)
    bbox_min_z: Mapped[float | None] = mapped_column(Numeric(20, 6), nullable=True)
    bbox_max_x: Mapped[float | None] = mapped_column(Numeric(20, 6), nullable=True)
    bbox_max_y: Mapped[float | None] = mapped_column(Numeric(20, 6), nullable=True)
    bbox_max_z: Mapped[float | None] = mapped_column(Numeric(20, 6), nullable=True)
    tile_url_template: Mapped[str | None] = mapped_column(
        String(500), nullable=True, doc="Potree / 3D Tiles のタイル URL テンプレート"
    )
    attributes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
