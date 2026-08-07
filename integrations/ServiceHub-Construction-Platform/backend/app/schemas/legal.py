"""Legal Tech スキーマ（Pydantic v2）.

Phase 1: Contract + AI 解析
Phase 2: Evidence + Compliance
Phase 3: 既存モジュール統合
Phase 3b: Dashboard / Notifications / Knowledge / Photos Legal 強化
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

# ---------- Contract ----------


class ContractCreate(BaseModel):
    project_id: uuid.UUID
    contract_type: str = Field("PRIME", pattern="^(PRIME|SUB|SECONDARY_SUB)$")
    contract_number: str = Field(..., max_length=100)
    title: str = Field(..., max_length=300)
    parties: dict | None = None
    period_start: date | None = None
    period_end: date | None = None
    amount: Decimal | None = None
    description: str | None = None
    document_url: str | None = None


class ContractUpdate(BaseModel):
    title: str | None = Field(None, max_length=300)
    parties: dict | None = None
    period_start: date | None = None
    period_end: date | None = None
    amount: Decimal | None = None
    description: str | None = None
    document_url: str | None = None
    status: str | None = Field(
        None, pattern="^(DRAFT|ACTIVE|EXPIRED|TERMINATED|DISPUTED)$"
    )


class ContractResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    project_id: uuid.UUID
    contract_type: str
    contract_number: str
    title: str
    parties: dict | None = None
    period_start: date | None = None
    period_end: date | None = None
    amount: Decimal | None = None
    description: str | None = None
    document_url: str | None = None
    status: str
    ai_risk_score: str
    ai_analysis_json: dict | None = None
    ai_analyzed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None = None


# ---------- AI 解析 ----------


class ContractAnalysisRequest(BaseModel):
    """契約書テキストを送り Claude に解析させる"""

    contract_text: str = Field(..., min_length=10)
    contract_type: str = Field("PRIME", pattern="^(PRIME|SUB|SECONDARY_SUB)$")


class LegalIssue(BaseModel):
    law: str  # construction_law / subcontract_law / labor_safety_law
    article: str  # 根拠条文 (例: "建設業法第19条")
    description: str
    severity: str  # CRITICAL / HIGH / MEDIUM / LOW
    recommendation: str


class ContractAnalysisResult(BaseModel):
    risk_score: str  # CRITICAL / HIGH / MEDIUM / LOW
    summary: str
    legal_issues: list[LegalIssue]
    payment_term_days: int | None = None  # 下請法 60日チェック用
    has_required_items: bool  # 建設業法 書面要件充足
    checked_at: datetime


# ---------- Project Legal Risk ----------


class ProjectLegalRisk(BaseModel):
    project_id: uuid.UUID
    risk_level: str  # CRITICAL / HIGH / MEDIUM / LOW / NONE
    open_contracts: int
    critical_contracts: list[uuid.UUID]
    high_contracts: list[uuid.UUID]
    delay_risk: bool  # 工期遅延リスク
    delay_days: int | None = None
    legal_recommendations: list[str]
    evaluated_at: datetime


# ---------- ITSM Escalation ----------


class IncidentEscalateRequest(BaseModel):
    reason: str = Field(..., min_length=5)
    escalate_to: uuid.UUID | None = None  # 法務担当 user_id
    law: str | None = None  # 関連法令 (construction_law / subcontract_law 等)
    urgency: str = Field("HIGH", pattern="^(CRITICAL|HIGH|MEDIUM)$")


class IncidentEscalateResponse(BaseModel):
    incident_id: uuid.UUID
    escalated_at: datetime
    escalated_to: uuid.UUID | None = None
    urgency: str
    message: str


# ---------- Phase 2: Legal Evidence (法的証跡タイムライン) ----------


class LegalEvidenceCreate(BaseModel):
    """法的証跡エントリの新規追加"""

    project_id: uuid.UUID
    source_type: str = Field(
        ..., pattern="^(daily_report|safety|photo|contract|manual)$"
    )
    source_id: uuid.UUID | None = None
    title: str = Field(..., max_length=300)
    description: str | None = None
    event_date: date
    content_hash: str | None = Field(None, max_length=64)
    metadata_json: dict | None = None


class LegalEvidenceResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    project_id: uuid.UUID
    source_type: str
    source_id: uuid.UUID | None = None
    title: str
    description: str | None = None
    event_date: date
    content_hash: str | None = None
    metadata_json: dict | None = None
    created_at: datetime
    created_by: uuid.UUID | None = None


class LegalEvidenceTimeline(BaseModel):
    """証跡タイムライン集約レスポンス"""

    project_id: uuid.UUID
    total_entries: int
    entries: list[LegalEvidenceResponse]
    integrity_ok: bool  # hash 検証結果（全エントリ整合）
    evaluated_at: datetime


class EvidenceVerifyResult(BaseModel):
    """証跡整合性検証結果"""

    project_id: uuid.UUID
    total_checked: int
    hash_mismatches: int  # ハッシュ不一致件数
    tampered_ids: list[uuid.UUID]  # 改ざん疑いのある証跡 ID
    integrity_ok: bool
    verified_at: datetime


# ---------- Phase 2: Compliance Check (コンプライアンスチェック) ----------


class ComplianceViolation(BaseModel):
    """法令違反エントリ"""

    law: str  # construction_law / subcontract_law / labor_safety / other
    article: str  # 根拠条文 (例: "建設業法第19条")
    description: str
    severity: str  # CRITICAL / HIGH / MEDIUM / LOW
    recommendation: str


class ComplianceCheckRequest(BaseModel):
    """コンプライアンスチェック実行リクエスト"""

    check_type: str = Field(
        "all", pattern="^(construction_law|subcontract_law|labor_safety|all)$"
    )
    # プロジェクト概要（AI に渡す文脈情報）
    project_summary: str | None = Field(None, max_length=2000)
    # 下請法チェック用: 未払い期間（日数）
    payment_overdue_days: int | None = Field(None, ge=0)
    # 安全衛生法チェック用: 直近のヒヤリハット件数
    near_miss_count: int | None = Field(None, ge=0)


class ComplianceCheckResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    project_id: uuid.UUID
    check_type: str
    status: str  # PASS / FAIL / WARNING / PENDING
    score: int | None = None  # 0-100
    violations: list[ComplianceViolation] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    ai_used: bool
    checked_at: datetime
    created_by: uuid.UUID | None = None


class ComplianceStatusSummary(BaseModel):
    """プロジェクト最新コンプライアンス状態サマリー"""

    project_id: uuid.UUID
    latest_check_id: uuid.UUID | None = None
    overall_status: str  # PASS / FAIL / WARNING / NOT_CHECKED
    overall_score: int | None = None
    critical_violations: int
    high_violations: int
    last_checked_at: datetime | None = None


# ---------- Phase 3: Cost Payment Legal Check (下請法) ----------


class PaymentOverdueRecord(BaseModel):
    """支払期限超過レコード (下請法 第2条の2 — 60日以内支払義務)"""

    record_id: uuid.UUID
    record_date: date
    description: str
    vendor_name: str | None = None
    actual_amount: Decimal
    days_elapsed: int
    severity: str  # CRITICAL(>90d) / HIGH(61-90d) / MEDIUM(45-60d)


class CostPaymentLegalCheckResult(BaseModel):
    """下請法60日支払期限チェック結果"""

    project_id: uuid.UUID
    check_type: str = "subcontract_law_payment"
    status: str  # PASS / FAIL / WARNING
    overdue_count: int
    warning_count: int
    overdue_records: list[PaymentOverdueRecord]
    law_reference: str = (  # noqa: E501 — 法律名は省略不可
        "下請代金支払遅延等防止法 第2条の2（支払期日の制限 — 60日以内）"
    )
    checked_at: datetime


# ---------- Phase 3b: Dashboard Legal Risk Summary ----------


class LegalRiskProjectEntry(BaseModel):
    """プロジェクト別法的リスクサマリー"""

    project_id: uuid.UUID
    project_name: str
    risk_level: str  # CRITICAL / HIGH / MEDIUM / LOW / NONE
    contracts_total: int
    contracts_critical: int
    contracts_high: int
    compliance_status: str  # PASS / FAIL / WARNING / NOT_CHECKED
    expiring_in_30d: int


class LegalRiskDashboard(BaseModel):
    """法的リスク全体サマリー（ダッシュボード用）"""

    total_contracts: int
    critical_count: int  # ai_risk_score = CRITICAL
    high_count: int
    medium_count: int
    low_count: int
    compliance_failures: int  # status = FAIL
    compliance_warnings: int  # status = WARNING
    expiring_30d: int  # 30日以内に期限切れ
    expiring_60d: int  # 60日以内
    projects: list[LegalRiskProjectEntry]
    evaluated_at: datetime


# ---------- Phase 3b: Notifications — Legal Deadlines ----------


class ContractDeadlineAlert(BaseModel):
    """契約期限アラート"""

    contract_id: uuid.UUID
    project_id: uuid.UUID
    project_name: str | None = None
    contract_number: str
    title: str
    period_end: date
    days_until_expiry: int
    urgency: str  # CRITICAL(<=7d) / HIGH(<=30d) / MEDIUM(<=60d) / LOW(<=90d)
    contract_type: str
    amount: Decimal | None = None


class LegalDeadlineNotification(BaseModel):
    """法令期限通知サマリー"""

    total_alerts: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int
    contract_deadlines: list[ContractDeadlineAlert]
    generated_at: datetime


# ---------- Phase 3b: Photos — Legal Evidence Registration ----------


class PhotoEvidenceCreate(BaseModel):
    """写真を法的証跡として登録"""

    title: str = Field(..., max_length=300)
    description: str | None = None
    event_date: date
    metadata_json: dict | None = None


class PhotoEvidenceResponse(BaseModel):
    """写真証跡登録結果"""

    evidence_id: uuid.UUID
    photo_id: uuid.UUID
    project_id: uuid.UUID
    title: str
    content_hash: str
    registered_at: datetime


# ---------- Phase 3b: Knowledge — Legal Article Tagging ----------


class LegalArticleTagRequest(BaseModel):
    """ナレッジ記事への法令タグ付けリクエスト"""

    law_tags: list[str] = Field(
        ...,
        description="法令タグ (例: 建設業法, 下請法, 労働安全衛生法)",
        min_length=1,
    )


class LegalArticleTagResponse(BaseModel):
    """法令タグ付け結果"""

    article_id: uuid.UUID
    tags: str  # カンマ区切り（更新後）
    legal_laws: list[str]  # 適用された法令タグ
    updated_at: datetime
