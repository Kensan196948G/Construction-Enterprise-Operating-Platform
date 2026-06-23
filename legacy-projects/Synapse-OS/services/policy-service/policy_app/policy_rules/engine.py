"""Synapse-OS Sprint 0 Policy Engine.

評価順 (G1):
    AUTHORITY -> DLP -> AI -> FEDERATION -> APPROVAL -> AUDIT

優先順 (G1):
    deny > quarantine > approval_required > local_llm_required
        > federation_review_required > mask_required > allow

Sprint 0 では Rule を表通り直書きする。Sprint 1 以降は Rule Loader を分離する。
"""

from __future__ import annotations

from collections.abc import Iterable

from synapse_shared.enums import ActorType, Classification, PolicyDecisionType

from ..schemas.decision import (
    AppliedRule,
    PolicyDecisionInput,
    PolicyDecisionResult,
)

# 強い decision ほど数値が大きいほうを優先
_DECISION_PRIORITY: dict[PolicyDecisionType, int] = {
    PolicyDecisionType.ALLOW: 0,
    PolicyDecisionType.MASK_REQUIRED: 1,
    PolicyDecisionType.FEDERATION_REVIEW_REQUIRED: 2,
    PolicyDecisionType.LOCAL_LLM_REQUIRED: 3,
    PolicyDecisionType.APPROVAL_REQUIRED: 4,
    PolicyDecisionType.QUARANTINE: 5,
    PolicyDecisionType.DENY: 6,
}


def _stronger(a: PolicyDecisionType, b: PolicyDecisionType) -> PolicyDecisionType:
    return a if _DECISION_PRIORITY[a] >= _DECISION_PRIORITY[b] else b


def _eval_authority(inp: PolicyDecisionInput) -> list[AppliedRule]:
    rules: list[AppliedRule] = []
    if inp.actor_type == ActorType.HUMAN and (
        inp.target_tenant_id is None or inp.target_tenant_id == inp.tenant_id
    ):
        rules.append(
            AppliedRule(
                rule_id="AUTH-001",
                domain="AUTHORITY",
                decision=PolicyDecisionType.ALLOW,
                reason="actor_type=human かつ tenant_id 一致",
            )
        )
    if inp.actor_type == ActorType.AI_AGENT and inp.is_production_change:
        rules.append(
            AppliedRule(
                rule_id="AUTH-003",
                domain="AUTHORITY",
                decision=PolicyDecisionType.APPROVAL_REQUIRED,
                reason="actor_type=ai_agent かつ production_change",
            )
        )
    if (
        inp.target_tenant_id is not None
        and inp.target_tenant_id != inp.tenant_id
        and inp.object_type.value != "federation_event"
    ):
        rules.append(
            AppliedRule(
                rule_id="AUTH-004",
                domain="AUTHORITY",
                decision=PolicyDecisionType.DENY,
                reason="tenant_id 不一致 かつ federation_event 経由でない",
            )
        )
    return rules


def _eval_dlp(inp: PolicyDecisionInput) -> list[AppliedRule]:
    rules: list[AppliedRule] = []
    if inp.classification == Classification.PUBLIC:
        rules.append(
            AppliedRule(
                rule_id="DLP-001",
                domain="DLP",
                decision=PolicyDecisionType.ALLOW,
                reason="classification=public",
            )
        )
    if inp.classification == Classification.CONFIDENTIAL and inp.data_destination in (
        "external_ai_cloud",
        "external_partner",
    ):
        rules.append(
            AppliedRule(
                rule_id="DLP-003",
                domain="DLP",
                decision=PolicyDecisionType.MASK_REQUIRED,
                reason="confidential かつ外部送信",
            )
        )
    if inp.classification == Classification.RESTRICTED and inp.data_destination in (
        "external_ai_cloud",
        "external_partner",
    ):
        rules.append(
            AppliedRule(
                rule_id="DLP-004",
                domain="DLP",
                decision=PolicyDecisionType.DENY,
                reason="restricted かつ外部送信",
            )
        )
    return rules


def _eval_ai(inp: PolicyDecisionInput) -> list[AppliedRule]:
    if not inp.is_ai_execution:
        return []
    rules: list[AppliedRule] = []
    if inp.classification == Classification.RESTRICTED:
        rules.append(
            AppliedRule(
                rule_id="AI-004",
                domain="AI",
                decision=PolicyDecisionType.DENY,
                reason="classification=restricted は外部 AI 禁止",
            )
        )
    if inp.classification == Classification.CONFIDENTIAL and inp.model_provider == "external_cloud":
        rules.append(
            AppliedRule(
                rule_id="AI-003",
                domain="AI",
                decision=PolicyDecisionType.LOCAL_LLM_REQUIRED,
                reason="confidential を外部 AI に出すため Local LLM 必須",
            )
        )
    if not inp.has_prompt_audit_ref:
        rules.append(
            AppliedRule(
                rule_id="AI-005",
                domain="AI",
                decision=PolicyDecisionType.DENY,
                reason="prompt_audit_ref なし",
            )
        )
    if not inp.has_dlp_result_ref:
        rules.append(
            AppliedRule(
                rule_id="AI-006",
                domain="AI",
                decision=PolicyDecisionType.DENY,
                reason="dlp_result_ref なし (DLP Before AI)",
            )
        )
    return rules


def _eval_federation(inp: PolicyDecisionInput) -> list[AppliedRule]:
    if inp.target_tenant_id is None or inp.target_tenant_id == inp.tenant_id:
        return [
            AppliedRule(
                rule_id="FED-001",
                domain="FEDERATION",
                decision=PolicyDecisionType.ALLOW,
                reason="source_tenant=target_tenant",
            )
        ]
    rules: list[AppliedRule] = []
    if inp.classification == Classification.PUBLIC:
        rules.append(
            AppliedRule(
                rule_id="FED-002",
                domain="FEDERATION",
                decision=PolicyDecisionType.ALLOW,
                reason="Cross Tenant かつ public",
            )
        )
    if inp.classification == Classification.INTERNAL:
        rules.append(
            AppliedRule(
                rule_id="FED-003",
                domain="FEDERATION",
                decision=PolicyDecisionType.FEDERATION_REVIEW_REQUIRED,
                reason="Cross Tenant かつ internal",
            )
        )
    if inp.classification == Classification.CONFIDENTIAL:
        rules.append(
            AppliedRule(
                rule_id="FED-004",
                domain="FEDERATION",
                decision=PolicyDecisionType.APPROVAL_REQUIRED,
                reason="Cross Tenant かつ confidential",
            )
        )
    if inp.classification == Classification.RESTRICTED:
        rules.append(
            AppliedRule(
                rule_id="FED-005",
                domain="FEDERATION",
                decision=PolicyDecisionType.DENY,
                reason="Cross Tenant かつ restricted",
            )
        )
    if inp.trust_level is None:
        rules.append(
            AppliedRule(
                rule_id="FED-006",
                domain="FEDERATION",
                decision=PolicyDecisionType.FEDERATION_REVIEW_REQUIRED,
                reason="trust_level 未評価",
            )
        )
    return rules


def _eval_approval(inp: PolicyDecisionInput) -> list[AppliedRule]:
    rules: list[AppliedRule] = []
    if inp.issue_type == "approval":
        rules.append(
            AppliedRule(
                rule_id="APP-001",
                domain="APPROVAL",
                decision=PolicyDecisionType.APPROVAL_REQUIRED,
                reason="issue_type=approval",
            )
        )
    if inp.classification in (Classification.CONFIDENTIAL, Classification.RESTRICTED):
        rules.append(
            AppliedRule(
                rule_id="APP-002",
                domain="APPROVAL",
                decision=PolicyDecisionType.APPROVAL_REQUIRED,
                reason="classification confidential/restricted",
            )
        )
    if inp.risk_score >= 70:
        rules.append(
            AppliedRule(
                rule_id="APP-003",
                domain="APPROVAL",
                decision=PolicyDecisionType.APPROVAL_REQUIRED,
                reason=f"risk_score={inp.risk_score} >= 70",
            )
        )
    if inp.approval_state == "approved":
        rules.append(
            AppliedRule(
                rule_id="APP-005",
                domain="APPROVAL",
                decision=PolicyDecisionType.ALLOW,
                reason="approval_state=approved",
            )
        )
    return rules


def _eval_audit(inp: PolicyDecisionInput) -> list[AppliedRule]:
    rules: list[AppliedRule] = []
    triggers: list[tuple[str, str]] = []
    if inp.is_state_change:
        triggers.append(("AUD-001", "状態変更"))
    if inp.is_ai_execution:
        triggers.append(("AUD-002", "AI 実行"))
    if inp.is_approval_decision:
        triggers.append(("AUD-003", "承認判断"))
    if inp.target_tenant_id is not None and inp.target_tenant_id != inp.tenant_id:
        triggers.append(("AUD-004", "Cross Tenant 操作"))
    for rid, reason in triggers:
        rules.append(
            AppliedRule(rule_id=rid, domain="AUDIT", decision="audit_required", reason=reason)
        )
    return rules


_EVAL_PIPELINE = [
    _eval_authority,
    _eval_dlp,
    _eval_ai,
    _eval_federation,
    _eval_approval,
    _eval_audit,
]


def _select_final_decision(rules: Iterable[AppliedRule]) -> PolicyDecisionType:
    """audit_required は最終 decision には影響しない。

    Default Deny: Policy Decision を返せる根拠が一つもない場合は deny。
    """
    enforceable: list[PolicyDecisionType] = [
        r.decision for r in rules if isinstance(r.decision, PolicyDecisionType)
    ]
    if not enforceable:
        return PolicyDecisionType.DENY
    final = enforceable[0]
    for d in enforceable[1:]:
        final = _stronger(final, d)
    return final


def evaluate(inp: PolicyDecisionInput, *, decision_id: str) -> PolicyDecisionResult:
    applied: list[AppliedRule] = []
    for fn in _EVAL_PIPELINE:
        applied.extend(fn(inp))

    final = _select_final_decision(applied)
    requires_audit = (
        any(r.domain == "AUDIT" for r in applied)
        or final
        in (
            PolicyDecisionType.DENY,
            PolicyDecisionType.APPROVAL_REQUIRED,
            PolicyDecisionType.LOCAL_LLM_REQUIRED,
            PolicyDecisionType.FEDERATION_REVIEW_REQUIRED,
            PolicyDecisionType.QUARANTINE,
        )
    )
    return PolicyDecisionResult(
        policy_decision_id=decision_id,
        final_decision=final,
        requires_audit=requires_audit,
        reasons=[f"{r.rule_id}: {r.reason}" for r in applied],
        applied_rules=applied,
        input_snapshot=inp,
    )
