"""工事マスタ ``t_project``."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from ..base import CommonBase


class Project(CommonBase):
    """工事マスタ。施工エリアは PostGIS の POLYGON(SRID=4326)。"""

    __tablename__ = "t_project"

    project_code: Mapped[str] = mapped_column(
        String(32), nullable=False, unique=True, index=True, doc="工事コード"
    )
    project_name: Mapped[str] = mapped_column(
        String(255), nullable=False, doc="工事名"
    )
    client_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_client_org.id", ondelete="RESTRICT"),
        nullable=True,
        doc="発注者 ID",
    )
    dept_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_department.id", ondelete="RESTRICT"),
        nullable=True,
        doc="主管部門 ID",
    )
    branch_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_branch.id", ondelete="RESTRICT"),
        nullable=True,
        doc="主管支店 ID",
    )
    contract_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 2), nullable=True, doc="請負金額 (円)"
    )
    start_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, doc="着工日"
    )
    end_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, doc="竣工日"
    )
    status: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="planned",
        doc="planned / ongoing / completed / cancelled",
    )
    geom: Mapped[object | None] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
        nullable=True,
        doc="施工エリア (POLYGON, WGS84)",
    )
