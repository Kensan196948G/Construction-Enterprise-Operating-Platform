"""
Legal Tech モデル（建設業法・下請法対応）
Phase 1: Contract — 契約管理 + AI リスク解析
Phase 2: LegalEvidence — 法的証跡タイムライン
         + ComplianceCheck — コンプライアンスチェック
"""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Contract(Base):
    """建設業法・下請法対応 契約台帳"""

    __tablename__ = "legal_contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # PRIME=元請契約, SUB=下請契約, SECONDARY_SUB=二次下請
    contract_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PRIME"
    )
    contract_number: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    # 当事者情報 (JSON): {"contractor": "...", "client": "..."}
    parties: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    period_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    period_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 0), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # AI 解析結果
    # CRITICAL / HIGH / MEDIUM / LOW / PENDING (未解析)
    ai_risk_score: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )
    ai_analysis_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_analyzed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ステータス管理
    # DRAFT / ACTIVE / EXPIRED / TERMINATED / DISPUTED
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="DRAFT")

    # 監査カラム
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Contract no={self.contract_number} type={self.contract_type}>"


class LegalEvidence(Base):
    """建設業法 帳簿備付け義務対応 — 法的証跡タイムライン (Phase 2)

    日報・安全確認・写真・契約などの記録を証跡として集約し、
    SHA-256 ハッシュによる改ざん検知を提供する。
    """

    __tablename__ = "legal_evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # 証跡ソース種別: daily_report / safety / photo / contract / manual
    source_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    # 元データ ID（日報ID・安全確認ID など）
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    # SHA-256 改ざん検知ハッシュ（証跡内容のハッシュ値）
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # 追加メタデータ (JSON): 位置・担当者・法令根拠など
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # 監査カラム
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )

    def __repr__(self) -> str:
        return (
            f"<LegalEvidence project={self.project_id}"
            f" type={self.source_type} date={self.event_date}>"
        )


class ComplianceCheck(Base):
    """建設業法・下請法・労働安全衛生法 コンプライアンスチェック (Phase 2)

    Claude AI またはルールベースエンジンで法令違反を検知し、
    チェック履歴と改善提案を保管する。
    """

    __tablename__ = "legal_compliance_checks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # チェック種別: construction_law / subcontract_law / labor_safety / all
    check_type: Mapped[str] = mapped_column(String(30), nullable=False, default="all")
    # 結果ステータス: PASS / FAIL / WARNING / PENDING
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    # 0-100 コンプライアンススコア (100=完全準拠)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # 違反内容リスト (JSON): [{law, article, description, severity, recommendation}]
    violations_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # 改善提案リスト (JSON): [str]
    recommendations_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # AI 解析を使ったか（False=ルールベース）
    ai_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )

    def __repr__(self) -> str:
        return (
            f"<ComplianceCheck project={self.project_id}"
            f" type={self.check_type} status={self.status}>"
        )
