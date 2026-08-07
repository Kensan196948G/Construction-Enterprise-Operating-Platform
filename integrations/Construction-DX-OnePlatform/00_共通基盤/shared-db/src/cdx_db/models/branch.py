"""支店マスタ ``t_branch``."""

from __future__ import annotations

from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from ..base import CommonBase


class Branch(CommonBase):
    """支店マスタ。位置情報は PostGIS の POINT(SRID=4326)。"""

    __tablename__ = "t_branch"

    branch_code: Mapped[str] = mapped_column(
        String(32), nullable=False, unique=True, index=True, doc="支店コード"
    )
    branch_name: Mapped[str] = mapped_column(String(128), nullable=False, doc="支店名")
    address: Mapped[str | None] = mapped_column(String(255), nullable=True, doc="住所")
    geom: Mapped[object | None] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True,
        doc="位置情報 (POINT, WGS84)",
    )
    dept_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_department.id", ondelete="RESTRICT"),
        nullable=True,
        doc="管轄部門 ID",
    )
