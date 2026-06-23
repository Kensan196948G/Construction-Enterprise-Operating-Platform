"""Federation Policy Propagation tests (Issue #6 / Sprint 5).

Cross-tenant governance enforcement: verify that policy decisions
are correctly propagated from PolicyEngine to FederationEvent outcomes.

Coverage:
    - risk_score flows into policy evaluate() call
    - policy_result_ref stores the PolicyDecision ID from response
    - reasoning_summary contains decision + reasons from policy response
    - approval_required outcome maps to REVIEW_REQUIRED (same as federation_review_required)
    - mask_required and quarantine outcomes map to REVIEW_REQUIRED
    - policy_binding field is forwarded in policy evaluate() payload
    - three-company scenario: A->B allow, A->C deny, B->C review_required
    - stub default (no scripted entry) returns federation_review_required
"""

from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient

from federation_app.clients.audit_client import StubAuditClient
from federation_app.clients.policy_client import StubPolicyClient


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

TENANT_A = "ten_tena_20260101_0001"
TENANT_B = "ten_tenb_20260101_0001"
TENANT_C = "ten_tenc_20260101_0001"
ACTOR_A = "idn_tena_20260101_0001"
ACTOR_B = "idn_tenb_20260101_0001"


def _payload(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "source_tenant": TENANT_A,
        "target_tenant": TENANT_B,
        "owner_id": ACTOR_A,
        "actor_id": ACTOR_A,
        "actor_type": "human",
        "shared_object_id": "doc_tena_20260502_0001",
        "shared_object_type": "document",
        "classification": "internal",
        "trust_level": "l3_joint",
        "policy_binding": "default-federation",
        "risk_score": 10.0,
        "requested_action": "federation.share",
    }
    base.update(overrides)
    return base


def _scripted_decision(
    *,
    decision_id: str = "pde_tena_20260519_0001",
    final_decision: str = "allow",
    reasons: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "policy_decision_id": decision_id,
        "decided_at": "2026-05-19T00:00:00+00:00",
        "final_decision": final_decision,
        "requires_audit": True,
        "reasons": reasons or [f"stub {final_decision}"],
        "applied_rules": [],
        "input_snapshot": {},
    }


# ---------------------------------------------------------------------------
# risk_score propagation
# ---------------------------------------------------------------------------


def test_risk_score_forwarded_to_policy_client(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """risk_score in FederationEventCreateRequest is forwarded to PolicyClient.evaluate()."""
    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    client.post("/federation-events", json=_payload(risk_score=75.0))
    sent = policy_stub.calls[0]
    assert sent["risk_score"] == 75.0


def test_risk_score_zero_forwarded(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """risk_score=0 (lowest risk) is also forwarded correctly."""
    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    client.post("/federation-events", json=_payload(risk_score=0.0))
    assert policy_stub.calls[0]["risk_score"] == 0.0


# ---------------------------------------------------------------------------
# policy_result_ref
# ---------------------------------------------------------------------------


def test_policy_result_ref_stored_on_allow(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """policy_result_ref stores PolicyDecision ID when outcome is allow."""
    decision_id = "pde_tena_20260519_0001"
    policy_stub.scripted.append(_scripted_decision(decision_id=decision_id, final_decision="allow"))
    res = client.post("/federation-events", json=_payload())
    assert res.json()["policy_result_ref"] == decision_id


def test_policy_result_ref_stored_on_deny(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """policy_result_ref is stored even when outcome is deny (audit trail)."""
    decision_id = "pde_tena_20260519_0002"
    policy_stub.scripted.append(_scripted_decision(decision_id=decision_id, final_decision="deny"))
    res = client.post("/federation-events", json=_payload())
    assert res.json()["policy_result_ref"] == decision_id


def test_policy_result_ref_stored_on_review_required(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """policy_result_ref is stored for federation_review_required outcome."""
    decision_id = "pde_tena_20260519_0003"
    policy_stub.scripted.append(
        _scripted_decision(decision_id=decision_id, final_decision="federation_review_required")
    )
    res = client.post("/federation-events", json=_payload())
    assert res.json()["policy_result_ref"] == decision_id


# ---------------------------------------------------------------------------
# reasoning_summary
# ---------------------------------------------------------------------------


def test_reasoning_summary_includes_decision_and_reasons(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """reasoning_summary contains final_decision and reason text from policy response."""
    reasons = ["Trust L3 joint cross-tenant share allowed", "classification=internal OK"]
    policy_stub.scripted.append(
        _scripted_decision(final_decision="allow", reasons=reasons)
    )
    res = client.post("/federation-events", json=_payload())
    summary = res.json()["reasoning_summary"]
    assert "allow" in summary
    assert "Trust L3 joint" in summary


def test_reasoning_summary_includes_deny_reason(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """reasoning_summary for deny outcome includes the blocking reason."""
    policy_stub.scripted.append(
        _scripted_decision(
            final_decision="deny",
            reasons=["Trust L1 cannot share confidential cross-tenant"],
        )
    )
    res = client.post("/federation-events", json=_payload())
    summary = res.json()["reasoning_summary"]
    assert "deny" in summary
    assert "Trust L1" in summary


# ---------------------------------------------------------------------------
# approval_required / other outcomes map to REVIEW_REQUIRED
# ---------------------------------------------------------------------------


def test_approval_required_maps_to_review_required_status(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """approval_required policy outcome -> FederationEvent status=review_required."""
    policy_stub.scripted.append(_scripted_decision(final_decision="approval_required"))
    res = client.post("/federation-events", json=_payload())
    body = res.json()
    assert body["status"] == "review_required"
    assert body["audit_boundary"] == "shared"


def test_mask_required_maps_to_review_required(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """mask_required policy outcome -> FederationEvent status=review_required."""
    policy_stub.scripted.append(_scripted_decision(final_decision="mask_required"))
    res = client.post("/federation-events", json=_payload())
    assert res.json()["status"] == "review_required"


def test_quarantine_maps_to_review_required(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """quarantine policy outcome -> FederationEvent status=review_required."""
    policy_stub.scripted.append(_scripted_decision(final_decision="quarantine"))
    res = client.post("/federation-events", json=_payload())
    assert res.json()["status"] == "review_required"


# ---------------------------------------------------------------------------
# policy_binding propagation
# ---------------------------------------------------------------------------


def test_policy_binding_forwarded_to_policy_client(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """policy_binding field flows into PolicyClient.evaluate() payload."""
    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    client.post("/federation-events", json=_payload(policy_binding="strict-federation-v2"))
    assert policy_stub.calls[0]["policy_binding"] == "strict-federation-v2"


# ---------------------------------------------------------------------------
# three-company scenario: A->B, A->C, B->C with different outcomes
# ---------------------------------------------------------------------------


def test_three_company_scenario_mixed_outcomes(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """A->B allow, A->C deny, B->C review_required: each event gets correct status."""
    policy_stub.scripted.extend([
        _scripted_decision(final_decision="allow"),
        _scripted_decision(final_decision="deny"),
        _scripted_decision(final_decision="federation_review_required"),
    ])

    # A -> B (allow)
    res_ab = client.post("/federation-events", json=_payload(
        source_tenant=TENANT_A, target_tenant=TENANT_B,
        owner_id=ACTOR_A, actor_id=ACTOR_A,
    ))
    assert res_ab.json()["status"] == "approved"

    # A -> C (deny)
    res_ac = client.post("/federation-events", json=_payload(
        source_tenant=TENANT_A, target_tenant=TENANT_C,
        owner_id=ACTOR_A, actor_id=ACTOR_A,
    ))
    assert res_ac.json()["status"] == "blocked"

    # B -> C (review_required)
    res_bc = client.post("/federation-events", json=_payload(
        source_tenant=TENANT_B, target_tenant=TENANT_C,
        owner_id=ACTOR_B, actor_id=ACTOR_B,
    ))
    assert res_bc.json()["status"] == "review_required"

    # Audit: A->B SHARED=2, A->C SOURCE_ONLY=1, B->C SHARED=2 => total=5
    assert len(audit_stub.events) == 5


# ---------------------------------------------------------------------------
# stub default fallback (no scripted entry)
# ---------------------------------------------------------------------------


def test_stub_default_returns_federation_review_required(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """StubPolicyClient default (no scripted entry) returns federation_review_required -> REVIEW_REQUIRED."""
    # No scripted entries -> stub default fires
    res = client.post("/federation-events", json=_payload())
    assert res.json()["status"] == "review_required"
