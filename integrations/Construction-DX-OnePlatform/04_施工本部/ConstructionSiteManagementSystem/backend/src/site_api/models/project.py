"""施工プロジェクト拡張モデル (出来高・原価)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class ConstructionProject(CommonBase):
    """施工プロジェクト (`t_construction_project`).

    cdx-shared-db の ``t_project`` を施工側で拡張する独自テーブル。
    """

    __tablename__ = "t_construction_project"

    project_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    site_address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    contract_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    manager_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    branch_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    # PostGIS の POINT は migration 側で USING-DOWN しても良いが骨格では JSONB で代替可
    site_location_wkt: Mapped[str | None] = mapped_column(String(255), nullable=True)


class ProgressRecord(CommonBase):
    """出来高記録."""

    __tablename__ = "t_progress_record"

    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False
    )
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    task_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    progress_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    earned_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    client_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    sync_version: Mapped[int] = mapped_column(BigInteger, default=1, nullable=False)


class CostRecord(CommonBase):
    """原価記録 (実コスト)."""

    __tablename__ = "t_cost_record"

    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False
    )
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    cost_category: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    vendor: Mapped[str | None] = mapped_column(String(200), nullable=True)
    invoice_no: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    client_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    sync_version: Mapped[int] = mapped_column(BigInteger, default=1, nullable=False)
