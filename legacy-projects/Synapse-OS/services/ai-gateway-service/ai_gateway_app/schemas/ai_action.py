"""AI Action Object Schema (BL-006 / Sprint 2).

ADR-006 "AI Action は補助ログではなく独立 Object" を schema 側で固定する。
Acceptance 2 (AI Audit) のうち本 schema が固定するもの:

1. AI 利用は AI Gateway 経由である       -> POST /ai-actions が唯一の生成経路
2. Prompt Audit ID が生成される          -> ``object_id`` (aia_*) が Prompt Audit ID として機能
3. Model Provider と Model 名が記録される -> ``model_provider`` + ``model_name`` 必須
4. DLP 判定が AI Action に紐づく          -> ``dlp_result`` を Object 属性として保持
5. Reasoning Summary と参照 Knowledge     -> ``reasoning_summary`` + ``context_refs``

AIActionStatus は Policy Decision からの派生:
    deny                -> BLOCKED          (DLP-004 等で外部送信を断ったケース)
    allow               -> COMPLETED        (LLM 呼び出し成功)
    mask_required       -> MASKED           (DLP-003 で機密箇所を伏せて呼び出し)
    local_llm_required  -> ROUTED_LOCAL     (Confidential を local LLM へ振り直し)
    その他              -> REVIEW_REQUIRED  (approval_required / federation_review_required 等)
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field
from synapse_shared.enums import Classification, ObjectType
from synapse_shared.object_base import CommonObject


class AIActionStatus(str, Enum):
    """AI Action の終端 status.

    AI Gateway は同期 API なので、1 回の POST /ai-actions が必ず終端 status まで進む。
    Sprint 2 では非同期 (PENDING / RUNNING) は持たない。
    """

    COMPLETED = "completed"
    MASKED = "masked"
    ROUTED_LOCAL = "routed_local"
    BLOCKED = "blocked"
    REVIEW_REQUIRED = "review_required"


class DLPResult(str, Enum):
    """DLP 判定結果 (Acceptance 2 #4).

    Policy Decision とは独立に保持する -- Policy が "allow" でも DLP がマスクを
    要求した場合の組み合わせ (mask_required) を AI Action 側で説明可能にするため。
    """

    PASS = "pass"
    MASKED = "masked"
    BLOCKED = "blocked"


class ModelRoute(str, Enum):
    """Model Routing 結果 (どの Model 系統に流したか).

    cloud  : 外部 LLM (OpenAI / Anthropic 等)
    local  : Tenant 内 Local LLM (Confidential を外に出さない経路)
    none   : Policy が deny -> 実呼び出し不発 (Audit のためだけに残る)
    """

    CLOUD = "cloud"
    LOCAL = "local"
    NONE = "none"


class AIAction(CommonObject):
    """AI Action Enterprise Object (ADR-006)."""

    model_config = ConfigDict(
        frozen=False,
        str_strip_whitespace=True,
        extra="forbid",
        protected_namespaces=(),
    )

    object_type: ObjectType = Field(default=ObjectType.AI_ACTION, frozen=True)

    prompt: str = Field(
        ...,
        min_length=1,
        max_length=20000,
        description="AI に送信した (または送信を試みた) prompt 本文. mask 適用後の値が入る.",
    )
    prompt_original_hash: str = Field(
        ...,
        description=(
            "mask 前の prompt の hash. 復元 key ではなく "
            "'mask 前後で内容が変わっていない' を audit 確認するための fingerprint."
        ),
    )
    model_provider: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="例: 'openai', 'anthropic', 'local-vllm'. 'n/a' は許さない.",
    )
    model_name: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="例: 'gpt-4o', 'claude-sonnet-4-6', 'local-llama-3.1-8b'.",
    )
    context_refs: list[str] = Field(
        default_factory=list,
        description="参照した Knowledge / Document の object_id 列. Acceptance 2 #5.",
    )
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)

    dlp_result: DLPResult = Field(
        default=DLPResult.PASS,
        description="DLP 判定結果. Acceptance 2 #4 が AI Action へ紐づくことを要求する.",
    )
    dlp_findings: list[str] = Field(
        default_factory=list,
        description="DLP 検出箇所の人間可読サマリ (例: 'PII: email at offset 42').",
    )

    route: ModelRoute = Field(
        default=ModelRoute.CLOUD,
        description="Policy の local_llm_required で local に振り直されたかを記録する.",
    )

    status: AIActionStatus = Field(default=AIActionStatus.COMPLETED)

    response_text: str | None = Field(
        default=None,
        max_length=40000,
        description="LLM 応答本文. blocked のとき None.",
    )
    reasoning_summary: str | None = Field(
        default=None,
        max_length=4000,
        description=(
            "ADR-006 + AI_EXPLAINABILITY_MODEL: chain-of-thought ではなく "
            "'Why this answer' の人間可読サマリ. blocked のときは deny 理由が入る."
        ),
    )

    requested_action: str = Field(default="ai.invoke")


class AIActionCreateRequest(BaseModel):
    """POST /ai-actions 入力.

    object-service 等の caller は本 request のみで AI を呼ぶことができる
    (= Direct AI Access 経路を作る理由がない / ADR-001 が成立する)。
    """

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        protected_namespaces=(),
    )

    tenant_id: str = Field(..., description="ten_* ID")
    owner_id: str = Field(..., description="責任 Identity ID")
    actor_id: str = Field(..., description="呼び出し Identity ID (Policy 入力 actor)")
    actor_type: str = Field(default="human")

    classification: Classification = Field(
        ...,
        description=(
            "送信内容の分類. Confidential 以上は DLP 対象、Restricted は外部 deny "
            "(Acceptance 2 + Acceptance 3 #2/#3 と同じ DLP rule を共有)."
        ),
    )
    prompt: str = Field(..., min_length=1, max_length=20000)
    model_provider: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="caller が希望する provider. Policy が local_llm_required を返したら local に書き換えられる.",
    )
    model_name: str = Field(..., min_length=1, max_length=128)

    context_refs: list[str] = Field(
        default_factory=list,
        description="参照する Knowledge / Document の object_id 列.",
    )

    data_destination: str = Field(
        default="external_ai_cloud",
        description=(
            "送信先 destination. 通常 'external_ai_cloud'. "
            "'internal' / 'internal_local_llm' を指定すると DLP / Routing も内部経路で評価される."
        ),
    )
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    requested_action: str = Field(default="ai.invoke")


class AIActionExplanation(BaseModel):
    """AI Explainability View (BL-009 / Sprint 2).

    Acceptance 2 #5 と Acceptance 6 "AI Black Box になっていない" を API として満たす。
    AIAction full object とは意図的に分離してある:

    - prompt 本文や response_text は載せない (機密のまま広く配布される事故を避ける)
    - "Why" を成立させる情報だけを集約する
        - reasoning_summary  : LLM 応答 / Policy reasons の人間可読 Why
        - context_refs       : 参照 Knowledge / Document
        - dlp_result + finds : DLP 判断
        - policy_decision_ref: Policy 判断トレース
        - audit_event_refs   : Audit Timeline 逆引き
        - model_provider/name/route: どの Model 系で答えが出たか

    Workflow Service が Approval 画面から本 view を引くことで Acceptance 1
    "AI Risk 分析を承認前に参照できる" を満たす。
    """

    model_config = ConfigDict(extra="forbid", protected_namespaces=())

    ai_action_id: str = Field(..., description="aia_* ID. = Prompt Audit ID.")
    tenant_id: str
    status: AIActionStatus
    classification: Classification

    model_provider: str
    model_name: str
    route: ModelRoute

    dlp_result: DLPResult
    dlp_findings: list[str] = Field(default_factory=list)

    risk_score: float

    reasoning_summary: str | None = Field(
        default=None,
        description="ADR-006 'Why this answer'. blocked のときは Policy reasons.",
    )
    context_refs: list[str] = Field(
        default_factory=list,
        description="参照した Knowledge / Document の object_id 列.",
    )

    policy_decision_ref: str | None = Field(
        default=None,
        description="Policy Decision の id. Policy Service の trail へ繋ぐ.",
    )
    audit_event_refs: list[str] = Field(
        default_factory=list,
        description="Audit Service へ送出した event id 列. Timeline 逆引き用.",
    )
