"""Policy Engine ユニットテスト (G1 最小ルールセット).

カバー対象:
    AUTH-001 / AUTH-004
    DLP-003 / DLP-004
    AI-003  / AI-004 / AI-005 / AI-006
    FED-005
    APP-002
    AUD-001 系の audit_required シグナル
    Default Deny
    決定優先順 (deny > approval_required > local_llm_required > allow)
"""

from __future__ import annotations

from policy_app.policy_rules.engine import _select_final_decision, evaluate
from policy_app.schemas.decision import PolicyDecisionInput


def _input(**overrides: object) -> PolicyDecisionInput:
    base: dict[str, object] = {
        "actor_id": "idn_tena_20260502_0001",
        "actor_type": "human",
        "tenant_id": "ten_tena_20260502_0001",
        "object_type": "issue",
        "action": "issue.create",
        "classification": "internal",
        "data_destination": "internal",
        "model_provider": "n/a",
        "risk_score": 10.0,
    }
    base.update(overrides)
    return PolicyDecisionInput(**base)


def _rule_ids(result) -> list[str]:
    return [r.rule_id for r in result.applied_rules]


def test_authority_human_same_tenant_allows() -> None:
    result = evaluate(_input(classification="public"), decision_id="pde_tena_20260502_0001")
    assert "AUTH-001" in _rule_ids(result)
    assert result.final_decision.value == "allow"


def test_auth_004_cross_tenant_without_federation_event_denies() -> None:
    result = evaluate(
        _input(target_tenant_id="ten_tenb_20260502_0002", classification="public"),
        decision_id="pde_tena_20260502_0002",
    )
    assert "AUTH-004" in _rule_ids(result)
    assert result.final_decision.value == "deny"


def test_dlp_003_confidential_external_requires_mask() -> None:
    result = evaluate(
        _input(
            classification="confidential",
            data_destination="external_partner",
            has_prompt_audit_ref=True,
            has_dlp_result_ref=True,
        ),
        decision_id="pde_tena_20260502_0003",
    )
    rule_ids = _rule_ids(result)
    assert "DLP-003" in rule_ids
    # APP-002 が混じるので最終は approval_required (priority: approval_required > mask_required)
    assert result.final_decision.value == "approval_required"


def test_dlp_004_restricted_external_denies() -> None:
    result = evaluate(
        _input(
            classification="restricted",
            data_destination="external_ai_cloud",
            has_prompt_audit_ref=True,
            has_dlp_result_ref=True,
        ),
        decision_id="pde_tena_20260502_0004",
    )
    assert "DLP-004" in _rule_ids(result)
    assert result.final_decision.value == "deny"


def test_ai_003_confidential_external_requires_local_llm() -> None:
    """G1 の代表ケース: Confidential を External Cloud に渡すなら Local LLM 必須."""
    result = evaluate(
        _input(
            actor_type="ai_agent",
            classification="confidential",
            data_destination="external_ai_cloud",
            model_provider="external_cloud",
            is_ai_execution=True,
            has_prompt_audit_ref=True,
            has_dlp_result_ref=True,
        ),
        decision_id="pde_tena_20260502_0005",
    )
    rule_ids = _rule_ids(result)
    assert "AI-003" in rule_ids
    # APP-002 (confidential -> approval_required) が同時に発火
    # 優先順: approval_required(4) > local_llm_required(3) なので最終は approval_required
    assert result.final_decision.value == "approval_required"
    # ただし AI-003 が applied_rules に残ることが Explainability の要件
    assert any(r.decision.value == "local_llm_required" for r in result.applied_rules)


def test_ai_004_restricted_blocks_external_ai() -> None:
    result = evaluate(
        _input(
            actor_type="ai_agent",
            classification="restricted",
            data_destination="external_ai_cloud",
            model_provider="external_cloud",
            is_ai_execution=True,
            has_prompt_audit_ref=True,
            has_dlp_result_ref=True,
        ),
        decision_id="pde_tena_20260502_0006",
    )
    assert "AI-004" in _rule_ids(result)
    assert result.final_decision.value == "deny"


def test_ai_005_missing_prompt_audit_ref_denies() -> None:
    result = evaluate(
        _input(
            actor_type="ai_agent",
            is_ai_execution=True,
            has_prompt_audit_ref=False,
            has_dlp_result_ref=True,
        ),
        decision_id="pde_tena_20260502_0007",
    )
    assert "AI-005" in _rule_ids(result)
    assert result.final_decision.value == "deny"


def test_ai_006_missing_dlp_result_ref_denies() -> None:
    result = evaluate(
        _input(
            actor_type="ai_agent",
            is_ai_execution=True,
            has_prompt_audit_ref=True,
            has_dlp_result_ref=False,
        ),
        decision_id="pde_tena_20260502_0008",
    )
    assert "AI-006" in _rule_ids(result)
    assert result.final_decision.value == "deny"


def test_fed_005_cross_tenant_restricted_denies() -> None:
    result = evaluate(
        _input(
            object_type="federation_event",
            target_tenant_id="ten_tenb_20260502_0002",
            classification="restricted",
            has_prompt_audit_ref=True,
            has_dlp_result_ref=True,
        ),
        decision_id="pde_tena_20260502_0009",
    )
    assert "FED-005" in _rule_ids(result)
    assert result.final_decision.value == "deny"


def test_app_002_confidential_requires_approval() -> None:
    result = evaluate(
        _input(classification="confidential"),
        decision_id="pde_tena_20260502_0010",
    )
    assert "APP-002" in _rule_ids(result)
    assert result.final_decision.value == "approval_required"


def test_high_risk_score_requires_approval() -> None:
    result = evaluate(
        _input(classification="public", risk_score=85.0),
        decision_id="pde_tena_20260502_0011",
    )
    assert "APP-003" in _rule_ids(result)
    assert result.final_decision.value == "approval_required"


def test_audit_triggers_set_requires_audit_flag() -> None:
    result = evaluate(
        _input(
            classification="public",
            is_state_change=True,
            is_approval_decision=True,
        ),
        decision_id="pde_tena_20260502_0012",
    )
    rule_ids = _rule_ids(result)
    assert "AUD-001" in rule_ids
    assert "AUD-003" in rule_ids
    assert result.requires_audit is True
    # audit_required は最終決定には影響しない
    assert result.final_decision.value == "allow"


def test_default_deny_when_no_enforceable_rule() -> None:
    """G1 Default Deny: enforceable rule が一つも無い場合は deny.

    エンジン経路では FED-001 が同一 tenant で常に allow を返すため
    通常入力で空にはならないが、_select_final_decision 自体は
    Rule Loader 障害等で空が来た場合の最後の砦として deny を返さねばならない。
    """
    from synapse_shared.enums import PolicyDecisionType

    assert _select_final_decision([]) == PolicyDecisionType.DENY


def test_audit_only_rules_fall_through_to_default_deny() -> None:
    """audit_required は最終決定の根拠にならない（filter される）.

    audit_required しか積まれていない applied_rules を渡すと、
    enforceable が空となり Default Deny が返ることを確認する。
    """
    from synapse_shared.enums import PolicyDecisionType

    from policy_app.schemas.decision import AppliedRule

    only_audit = [
        AppliedRule(
            rule_id="AUD-001",
            domain="AUDIT",
            decision="audit_required",
            reason="状態変更",
        )
    ]
    assert _select_final_decision(only_audit) == PolicyDecisionType.DENY


def test_explanation_fields_are_populated() -> None:
    """Explainability 原則: reasons / applied_rules / policy_decision_id 必須."""
    result = evaluate(
        _input(classification="confidential"),
        decision_id="pde_tena_20260502_0099",
    )
    assert result.policy_decision_id == "pde_tena_20260502_0099"
    assert len(result.applied_rules) >= 1
    assert len(result.reasons) == len(result.applied_rules)
    assert all(": " in r for r in result.reasons)
    assert result.input_snapshot.classification.value == "confidential"
