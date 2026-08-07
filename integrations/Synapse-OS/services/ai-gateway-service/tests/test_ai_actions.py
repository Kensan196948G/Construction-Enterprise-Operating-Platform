"""AI Action API contract / policy / DLP / routing / audit tests (BL-006 / Sprint 2).

カバレッジ (BACKLOG_TEST_MAPPING.md "BL-006" 行 + Acceptance 2):
    - Contract:  POST /ai-actions が AIActionCreateRequest を受理し AI Action schema を返す
    - Schema  :  必須欠落 / extra field を 422 で弾く (ADR-001 を schema 段階で固定)
    - Acceptance 2 #1: AI 利用は AI Gateway 経由である
        -> POST /ai-actions が唯一の経路 / Audit "AIInvoked" が必ず積まれる
    - Acceptance 2 #2: Prompt Audit ID が生成される
        -> object_id (aia_*) が Prompt Audit ID として機能 / correlation_id にも乗る
    - Acceptance 2 #3: Model Provider と Model 名が記録される
        -> AI Action.model_provider / model_name + Audit after_state
    - Acceptance 2 #4: DLP 判定が AI Action に紐づく
        -> Policy=mask_required -> AI Action.dlp_result=MASKED + prompt が [REDACTED]
        -> Policy=deny          -> AI Action.dlp_result=BLOCKED + LLM 不発
    - Acceptance 2 #5: Reasoning Summary と参照 Knowledge
        -> AI Action.reasoning_summary が常に入る / context_refs が保持される
    - Routing :  Policy=local_llm_required -> route=LOCAL + provider が local-* に書き換わる
                 -> LLM stub にも書き換え後の provider が渡されている
    - Audit   :  AIBlocked / AIMasked / AIRoutedLocal / AIInvoked が status と一致する
    - CRUD    :  GET /ai-actions/{id} / GET /ai-actions?tenant_id=...
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from ai_gateway_app.clients.audit_client import StubAuditClient
from ai_gateway_app.clients.policy_client import StubPolicyClient
from ai_gateway_app.llm.llm_client import StubLLMClient

TENANT_ID = "ten_tena_20260101_0001"
TENANT_B_ID = "ten_tenb_20260101_0001"
ACTOR_ID = "idn_tena_20260101_0001"
OWNER_ID = "idn_tena_20260101_0002"


def _payload(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "tenant_id": TENANT_ID,
        "owner_id": OWNER_ID,
        "actor_id": ACTOR_ID,
        "actor_type": "human",
        "classification": "internal",
        "prompt": "顧客からの問い合わせを要約してください。",
        "model_provider": "openai",
        "model_name": "gpt-4o",
        "context_refs": ["doc_tena_20260502_0001"],
        "data_destination": "external_ai_cloud",
        "risk_score": 0.0,
        "requested_action": "ai.invoke",
    }
    base.update(overrides)
    return base


def _scripted_decision(
    *, decision_id: str, final_decision: str, reasons: list[str] | None = None
) -> dict[str, Any]:
    return {
        "policy_decision_id": decision_id,
        "decided_at": "2026-05-02T00:00:00+00:00",
        "final_decision": final_decision,
        "requires_audit": True,
        "reasons": reasons or [],
        "applied_rules": [],
        "input_snapshot": {},
    }


# ----------------------------------------------------------------------------
# Acceptance 2 #1 + #2 + #3 + #5: allow path で AI Gateway 必須経路を成立させる
# ----------------------------------------------------------------------------


def test_create_ai_action_allow_path_records_full_contract(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    llm_stub: StubLLMClient,
) -> None:
    """Acceptance 2 #1/#2/#3/#5 を一気に確認する allow path.

    - Prompt Audit ID (object_id) が aia_ で始まる
    - model_provider / model_name が AI Action と Audit after_state 両方に乗る
    - reasoning_summary が常に入る (LLM stub からの "Why")
    - context_refs が保持される
    - LLM stub に正しい provider/model/prompt が渡る
    """

    policy_stub.scripted.append(
        _scripted_decision(decision_id="pde_tena_20260502_a100", final_decision="allow")
    )
    res = client.post("/ai-actions", json=_payload())
    assert res.status_code == 201, res.text
    body = res.json()

    # Prompt Audit ID = aia_*
    assert body["object_id"].startswith("aia_tena_")
    assert body["object_type"] == "ai_action"

    # Model 情報 (Acceptance 2 #3)
    assert body["model_provider"] == "openai"
    assert body["model_name"] == "gpt-4o"
    assert body["route"] == "cloud"

    # DLP 判定 (Acceptance 2 #4 — allow path では PASS)
    assert body["dlp_result"] == "pass"
    assert body["dlp_findings"] == []

    # status / response / reasoning (Acceptance 2 #5)
    assert body["status"] == "completed"
    assert body["response_text"]
    assert body["reasoning_summary"]
    assert body["context_refs"] == ["doc_tena_20260502_0001"]

    # prompt は mask されない (=元のまま)
    assert body["prompt"] == "顧客からの問い合わせを要約してください。"
    assert body["prompt_original_hash"].startswith("sha256:")

    # Policy 入力契約
    assert len(policy_stub.calls) == 1
    p_in = policy_stub.calls[0]
    assert p_in["object_type"] == "ai_action"
    assert p_in["action"] == "ai.invoke"
    assert p_in["data_destination"] == "external_ai_cloud"
    assert p_in["is_state_change"] is True

    # LLM stub に正しい provider/model/prompt が渡る (Acceptance 2 #1: AI Gateway 経由)
    assert len(llm_stub.calls) == 1
    llm_call = llm_stub.calls[0]
    assert llm_call["provider"] == "openai"
    assert llm_call["model"] == "gpt-4o"
    assert llm_call["prompt"] == "顧客からの問い合わせを要約してください。"
    assert llm_call["context_refs"] == ["doc_tena_20260502_0001"]

    # Audit "AIInvoked" が積まれる (Acceptance 2 #1 / ADR-003)
    assert len(audit_stub.events) == 1
    evt = audit_stub.events[0]
    assert evt["event_type"] == "AIInvoked"
    assert evt["correlation_id"] == body["object_id"]
    assert evt["object_id"] == body["object_id"]
    assert evt["object_type"] == "ai_action"
    assert evt["policy_result"] == "allow"
    assert evt["after_state"]["status"] == "completed"
    assert evt["after_state"]["model_provider"] == "openai"
    assert evt["after_state"]["model_name"] == "gpt-4o"
    assert evt["after_state"]["route"] == "cloud"
    assert evt["after_state"]["dlp_result"] == "pass"
    assert evt["after_state"]["context_refs"] == ["doc_tena_20260502_0001"]


# ----------------------------------------------------------------------------
# Acceptance 2 #4: DLP 判定が AI Action に紐づく (mask_required path)
# ----------------------------------------------------------------------------


def test_create_ai_action_confidential_external_masks_prompt(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    llm_stub: StubLLMClient,
) -> None:
    """Confidential を外部 AI に送信. Policy=mask_required -> dlp_result=MASKED.

    - prompt が [REDACTED] に置換される
    - LLM stub には mask 後の prompt が渡る (= 元の機密情報は外部に出ない)
    - dlp_findings が Audit / AI Action 両方に残る
    - prompt_original_hash は元の prompt の hash のまま (改ざん検証用)
    """

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_a200",
            final_decision="mask_required",
            reasons=["DLP-003: confidential payload toward external_ai_cloud must be masked"],
        )
    )
    original_prompt = "社内給与情報: 田中 太郎 月額 850000 円。要約してください。"
    res = client.post(
        "/ai-actions",
        json=_payload(classification="confidential", prompt=original_prompt),
    )
    assert res.status_code == 201, res.text
    body = res.json()

    assert body["status"] == "masked"
    assert body["dlp_result"] == "masked"
    assert body["route"] == "cloud"
    assert body["prompt"] == "[REDACTED]"
    assert body["dlp_findings"]  # 非空
    # 元 prompt の hash が残る (改ざん検証用)
    import hashlib

    expected_hash = "sha256:" + hashlib.sha256(original_prompt.encode("utf-8")).hexdigest()
    assert body["prompt_original_hash"] == expected_hash

    # LLM には mask 後の prompt が渡る (= 機密が外部に出ない)
    assert len(llm_stub.calls) == 1
    assert llm_stub.calls[0]["prompt"] == "[REDACTED]"

    # Audit event_type = AIMasked
    assert len(audit_stub.events) == 1
    evt = audit_stub.events[0]
    assert evt["event_type"] == "AIMasked"
    assert evt["after_state"]["dlp_result"] == "masked"


# ----------------------------------------------------------------------------
# Acceptance 2 #4 + ADR-001: Restricted は外部 AI 送信されない (deny path)
# ----------------------------------------------------------------------------


def test_create_ai_action_restricted_external_blocked_with_audit(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    llm_stub: StubLLMClient,
) -> None:
    """Restricted + external_ai_cloud は DLP-004 deny.
    AI Action は blocked 状態で永続化され、LLM は呼ばれず Audit に "外部送信を試みた事実" が残る.
    """

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_a300",
            final_decision="deny",
            reasons=["DLP-004: restricted classification cannot leave the tenant boundary"],
        )
    )
    res = client.post(
        "/ai-actions",
        json=_payload(
            classification="restricted",
            prompt="社外秘 取引先 A 社の M&A 計画を要約してください。",
        ),
    )
    # 永続化は許す (Auditability) が status=blocked で実呼び出しは抑止される
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "blocked"
    assert body["dlp_result"] == "blocked"
    assert body["route"] == "none"
    assert body["response_text"] is None
    assert body["reasoning_summary"]
    assert "DLP-004" in body["reasoning_summary"]

    # LLM は呼ばれていない
    assert llm_stub.calls == []

    # Audit "AIBlocked" が必ず残る (ADR-003 / Acceptance 2 #1)
    assert len(audit_stub.events) == 1
    evt = audit_stub.events[0]
    assert evt["event_type"] == "AIBlocked"
    assert evt["policy_result"] == "deny"
    assert evt["after_state"]["status"] == "blocked"
    assert evt["after_state"]["dlp_result"] == "blocked"
    assert evt["after_state"]["data_destination"] == "external_ai_cloud"


# ----------------------------------------------------------------------------
# Routing: local_llm_required の時に provider が書き換えられる
# ----------------------------------------------------------------------------


def test_create_ai_action_local_llm_required_reroutes_to_local(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    llm_stub: StubLLMClient,
) -> None:
    """Confidential を扱うが local LLM 経路なら可: provider/model が local-* に書き換えられる.

    AI Action だけでなく LLM stub にも書き換え後の provider が渡ることを確認.
    """

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_a400",
            final_decision="local_llm_required",
            reasons=["DLP-002: confidential payload routed to internal local LLM"],
        )
    )
    res = client.post(
        "/ai-actions",
        json=_payload(
            classification="confidential",
            data_destination="internal_local_llm",
            model_provider="openai",
            model_name="gpt-4o",
        ),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "routed_local"
    assert body["route"] == "local"
    assert body["model_provider"] == "local-vllm"
    assert body["model_name"] == "local-llama-3.1-8b"
    assert body["dlp_result"] == "pass"

    # LLM stub にも書き換え後の provider が渡る
    assert len(llm_stub.calls) == 1
    assert llm_stub.calls[0]["provider"] == "local-vllm"
    assert llm_stub.calls[0]["model"] == "local-llama-3.1-8b"

    # Audit "AIRoutedLocal"
    assert audit_stub.events[0]["event_type"] == "AIRoutedLocal"
    assert audit_stub.events[0]["after_state"]["route"] == "local"


# ----------------------------------------------------------------------------
# Schema: 必須欠落 / extra field
# ----------------------------------------------------------------------------


@pytest.mark.parametrize(
    "missing_field",
    [
        "tenant_id",
        "owner_id",
        "actor_id",
        "classification",
        "prompt",
        "model_provider",
        "model_name",
    ],
)
def test_create_ai_action_missing_required_field(
    client: TestClient, missing_field: str
) -> None:
    payload = _payload()
    del payload[missing_field]
    res = client.post("/ai-actions", json=payload)
    assert res.status_code == 422


def test_create_ai_action_extra_field_rejected(client: TestClient) -> None:
    """extra='forbid' で未知フィールドは 422 (ADR-001 / 入口の厳格化)."""

    res = client.post("/ai-actions", json=_payload(extra_field="not allowed"))
    assert res.status_code == 422


def test_create_ai_action_invalid_classification(client: TestClient) -> None:
    res = client.post("/ai-actions", json=_payload(classification="top_secret"))
    assert res.status_code == 422


def test_create_ai_action_empty_prompt_rejected(client: TestClient) -> None:
    res = client.post("/ai-actions", json=_payload(prompt=""))
    assert res.status_code == 422


# ----------------------------------------------------------------------------
# CRUD
# ----------------------------------------------------------------------------


def test_get_ai_action_roundtrip(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    policy_stub.scripted.append(
        _scripted_decision(decision_id="pde_tena_20260502_a500", final_decision="allow")
    )
    create_res = client.post("/ai-actions", json=_payload())
    action_id = create_res.json()["object_id"]

    get_res = client.get(f"/ai-actions/{action_id}")
    assert get_res.status_code == 200
    body = get_res.json()
    assert body["object_id"] == action_id
    assert body["model_provider"] == "openai"


def test_get_ai_action_not_found(client: TestClient) -> None:
    res = client.get("/ai-actions/aia_tena_20260502_9999")
    assert res.status_code == 404


def test_get_ai_action_explanation_allow_path(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """BL-009 Acceptance 2 #5 / Acceptance 6: allow path で full explanation が取れる.

    - prompt 本文と response_text は含まれない (機密混入防止)
    - policy_decision_ref / audit_event_refs / context_refs / model 情報が揃う
    """

    policy_stub.scripted.append(
        _scripted_decision(decision_id="pde_tena_20260502_e100", final_decision="allow")
    )
    create_res = client.post("/ai-actions", json=_payload())
    assert create_res.status_code == 201
    action_id = create_res.json()["object_id"]

    res = client.get(f"/ai-actions/{action_id}/explanation")
    assert res.status_code == 200
    body = res.json()

    # 構造
    assert body["ai_action_id"] == action_id
    assert body["status"] == "completed"
    assert body["model_provider"] == "openai"
    assert body["model_name"] == "gpt-4o"
    assert body["route"] == "cloud"
    assert body["dlp_result"] == "pass"
    assert body["context_refs"] == ["doc_tena_20260502_0001"]
    assert body["reasoning_summary"]  # 非 None
    assert body["policy_decision_ref"] == "pde_tena_20260502_e100"
    assert body["audit_event_refs"]  # 非空 (Audit へ送出済み)

    # prompt 本文 / response_text は含めない (機密混入防止)
    assert "prompt" not in body
    assert "response_text" not in body
    assert "prompt_original_hash" not in body


def test_get_ai_action_explanation_blocked_includes_policy_reasons(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """blocked path: reasoning_summary に Policy reasons が出る (Acceptance 6).

    LLM が呼ばれていない状態でも explanation が取れて
    "なぜ拒絶されたか" が説明できることを確認する。
    """

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_e200",
            final_decision="deny",
            reasons=["DLP-004: restricted classification cannot leave the tenant boundary"],
        )
    )
    create_res = client.post(
        "/ai-actions",
        json=_payload(classification="restricted", prompt="社外秘 取引先 A 社の M&A 計画。"),
    )
    action_id = create_res.json()["object_id"]

    res = client.get(f"/ai-actions/{action_id}/explanation")
    assert res.status_code == 200
    body = res.json()

    assert body["status"] == "blocked"
    assert body["dlp_result"] == "blocked"
    assert body["route"] == "none"
    assert "DLP-004" in body["reasoning_summary"]
    assert body["policy_decision_ref"] == "pde_tena_20260502_e200"


def test_get_ai_action_explanation_masked_includes_dlp_findings(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """masked path: dlp_findings が explanation に乗る (Acceptance 2 #4)."""

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_e300",
            final_decision="mask_required",
            reasons=["DLP-003"],
        )
    )
    create_res = client.post(
        "/ai-actions",
        json=_payload(classification="confidential", prompt="社内給与 田中 太郎 850000 円"),
    )
    action_id = create_res.json()["object_id"]

    res = client.get(f"/ai-actions/{action_id}/explanation")
    assert res.status_code == 200
    body = res.json()
    assert body["dlp_result"] == "masked"
    assert body["dlp_findings"]  # 非空


def test_get_ai_action_explanation_not_found(client: TestClient) -> None:
    res = client.get("/ai-actions/aia_tena_20260502_9999/explanation")
    assert res.status_code == 404


def test_list_ai_actions_filters_by_tenant(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    for i in range(3):
        policy_stub.scripted.append(
            _scripted_decision(
                decision_id=f"pde_tena_20260502_a{600 + i:03d}", final_decision="allow"
            )
        )
    client.post("/ai-actions", json=_payload(prompt="A"))
    client.post("/ai-actions", json=_payload(prompt="B"))
    other = _payload(prompt="TenantB call")
    other["tenant_id"] = TENANT_B_ID
    other["actor_id"] = "idn_tenb_20260101_0001"
    other["owner_id"] = "idn_tenb_20260101_0002"
    client.post("/ai-actions", json=other)

    tena_res = client.get(f"/ai-actions?tenant_id={TENANT_ID}")
    assert tena_res.status_code == 200
    assert len(tena_res.json()) == 2

    tenb_res = client.get(f"/ai-actions?tenant_id={TENANT_B_ID}")
    assert len(tenb_res.json()) == 1
    assert tenb_res.json()[0]["prompt"] == "TenantB call"

    all_res = client.get("/ai-actions")
    assert len(all_res.json()) == 3
