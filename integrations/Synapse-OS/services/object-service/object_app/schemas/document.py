"""Document Object Schema (BL-007 / Sprint 2).

OBJECT_MODEL.md "Document" の Sprint 2 MVP。
Acceptance 3 (Document Governance) のうち下記 4 条件を schema 側で固定する:

1. Document に Classification が付く          -> ``classification`` 必須
2. Confidential 以上は DLP 判定対象になる      -> action 経路で Policy に渡す
3. Restricted 文書は外部 AI 送信されない        -> Policy 入力 (data_destination) を持つ
4. Retention Policy が Document に紐づく       -> ``retention_class`` 必須

5 (Lineage) は BL-011 で取り扱うため Sprint 2 の Document MVP では schema 化しない。
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field
from synapse_shared.enums import Classification, ObjectType
from synapse_shared.object_base import CommonObject


class DocumentStatus(str, Enum):
    """Document の運用状態.

    Sprint 2 では DRAFT (Policy ALLOW) / QUARANTINED (Policy が deny / quarantine) /
    REVIEW_REQUIRED (mask_required / approval_required 系) のみ扱う。
    """

    DRAFT = "draft"
    REVIEW_REQUIRED = "review_required"
    QUARANTINED = "quarantined"


class RetentionClass(str, Enum):
    """Retention Policy 紐づけ用の保持クラス (Acceptance 3 #4).

    具体的な保持年数や WORM の有無は Audit Service の Retention Policy が引く想定。
    Document Object 側は「どのクラスに従うか」だけを保持する。
    """

    SHORT = "short_1y"
    STANDARD = "standard_5y"
    LONG = "long_10y"
    PERMANENT = "permanent"


class Document(CommonObject):
    """Document Enterprise Object."""

    object_type: ObjectType = Field(default=ObjectType.DOCUMENT, frozen=True)
    title: str = Field(..., min_length=1, max_length=200)
    content_uri: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Document 実体への参照 URI (Sprint 2 では string として保持するのみ; 取得は別 service)",
    )
    retention_class: RetentionClass = Field(
        ...,
        description="Acceptance 3 #4: Document に紐づく Retention Policy 区分",
    )
    status: DocumentStatus = Field(default=DocumentStatus.DRAFT)
    requested_action: str = Field(default="document.create")


class DocumentCreateRequest(BaseModel):
    """POST /documents 入力."""

    model_config = ConfigDict(
        extra="forbid", str_strip_whitespace=True, protected_namespaces=()
    )

    tenant_id: str = Field(..., description="ten_* ID")
    owner_id: str = Field(..., description="責任 Identity ID")
    title: str = Field(..., min_length=1, max_length=200)
    content_uri: str = Field(..., min_length=1, max_length=2000)
    classification: Classification
    retention_class: RetentionClass
    actor_id: str = Field(..., description="作成者 Identity ID (Policy 入力 actor)")
    actor_type: str = Field(default="human")
    data_destination: str = Field(
        default="internal",
        description=(
            "Document 作成時の到達先. internal が原則。restricted を external_ai_cloud "
            "宛に作ろうとしたら DLP-004 で deny されることを Acceptance 3 #3 が要求する。"
        ),
    )
    model_provider: str = Field(default="n/a")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    requested_action: str = Field(default="document.create")
