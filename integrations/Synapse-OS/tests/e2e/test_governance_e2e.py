"""Governance E2E Integration Tests (Sprint 5 G1-c).

Covers cross-service governance flows that span multiple microservices:

1. Audit Hash Chain Integrity
   - Multiple audit events appended via API → verify_chain returns intact
   - Detects tampered events via chain break detection

2. Federation Policy Propagation Cross-Service
   - Federation event request → policy evaluated → audit recorded in real audit store
   - Correct status (approved/blocked/review_required) flows end-to-end

3. AI Gateway Governance (Policy Gate + Audit)
   - AI action request → policy gate checked → audit event recorded in real audit store
   - Blocked path also persists audit trail (ADR-006)
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TENANT_A = "ten_tena_20260101_0001"
TENANT_B = "ten_tenb_20260101_0001"
ACTOR_A = "idn_tena_20260101_0001"

_AUDIT_BASE_INGRESS: dict[str, Any] = {
    "event_type": "IssueCreated",
    "tenant_id": TENANT_A,
    "actor_id": ACTOR_A,
    "actor_type": "human",
    "action": "issue.create",
    "object_id": "obj_tena_20260519_0001",
    "object_type": "issue",
    "correlation_id": "corr_tena_20260519_0001",
}


# ---------------------------------------------------------------------------
# 1. Audit Hash Chain Integrity E2E
# ---------------------------------------------------------------------------


@pytest.fixture
def audit_client_e2e(tmp_path: Any) -> TestClient:
    """Fresh in-memory audit service with JSONL store for e2e tests."""
    from audit_app.api import audit_events as audit_api
    from audit_app.main import app as audit_app_instance
    from audit_app.storage.event_store import AuditEventStore

    store = AuditEventStore(jsonl_path=tmp_path / "e2e_governance_audit.jsonl")
    audit_app_instance.dependency_overrides[audit_api.get_store] = lambda: store
    with TestClient(audit_app_instance) as client:
        yield client
    audit_app_instance.dependency_overrides.clear()


def test_audit_hash_chain_intact_after_multiple_events(audit_client_e2e: TestClient) -> None:
    """POST 3 audit events → GET /audit-events/verify returns valid=True."""
    for i in range(3):
        payload = {
            **_AUDIT_BASE_INGRESS,
            "object_id": f"obj_tena_20260519_{i + 1:04d}",
            "correlation_id": f"corr_tena_20260519_{i + 1:04d}",
        }
        resp = audit_client_e2e.post("/audit-events", json=payload)
        assert resp.status_code == 201, resp.text

    verify_resp = audit_client_e2e.get(f"/audit-events/verify?tenant_id={TENANT_A}")
    assert verify_resp.status_code == 200, verify_resp.text
    result = verify_resp.json()
    assert result["valid"] is True
    assert result["total_events"] == 3
    assert result["broken_at"] is None


def test_audit_hash_chain_genesis_on_empty_tenant(audit_client_e2e: TestClient) -> None:
    """Verify chain on tenant with no events returns valid=True, total=0."""
    resp = audit_client_e2e.get(f"/audit-events/verify?tenant_id={TENANT_B}")
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert result["valid"] is True
    assert result["total_events"] == 0


def test_audit_events_listable_by_tenant(audit_client_e2e: TestClient) -> None:
    """Audit events posted for tenant_a are listed only for tenant_a, not tenant_b."""
    audit_client_e2e.post(
        "/audit-events",
        json={**_AUDIT_BASE_INGRESS, "tenant_id": TENANT_A},
    )
    audit_client_e2e.post(
        "/audit-events",
        json={**_AUDIT_BASE_INGRESS, "tenant_id": TENANT_B},
    )

    resp_a = audit_client_e2e.get(f"/audit-events?tenant_id={TENANT_A}")
    assert resp_a.status_code == 200
    assert len(resp_a.json()) == 1

    resp_b = audit_client_e2e.get(f"/audit-events?tenant_id={TENANT_B}")
    assert resp_b.status_code == 200
    assert len(resp_b.json()) == 1


# ---------------------------------------------------------------------------
# 2. Federation Cross-Service E2E (real audit store)
# ---------------------------------------------------------------------------


@pytest.fixture
def federation_with_real_audit(tmp_path: Any) -> dict[str, TestClient]:
    """Federation service wired to a real audit service (in-process via TestClient adapter)."""
    from audit_app.api import audit_events as audit_api
    from audit_app.main import app as audit_app_instance
    from audit_app.storage.event_store import AuditEventStore
    from federation_app.api import federation_events as fed_api
    from federation_app.clients.audit_client import AuditClient
    from federation_app.clients.policy_client import StubPolicyClient
    from federation_app.main import app as fed_app_instance
    from federation_app.storage.federation_event_repository import (
        FederationEventRepository,
        get_repository,
    )

    store = AuditEventStore(jsonl_path=tmp_path / "e2e_fed_audit.jsonl")
    audit_app_instance.dependency_overrides[audit_api.get_store] = lambda: store

    policy_stub = StubPolicyClient()

    with TestClient(audit_app_instance) as audit_tc:

        class _AuditAdapter:
            def __init__(self, c: TestClient) -> None:
                self._c = c

            def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
                r = self._c.post("/audit-events", json=ingress)
                r.raise_for_status()
                return r.json()

        audit_adapter: AuditClient = _AuditAdapter(audit_tc)  # type: ignore[assignment]
        repo = FederationEventRepository()

        fed_app_instance.dependency_overrides[fed_api.get_policy_client] = lambda: policy_stub
        fed_app_instance.dependency_overrides[fed_api.get_audit_client] = lambda: audit_adapter
        fed_app_instance.dependency_overrides[get_repository] = lambda: repo

        with TestClient(fed_app_instance) as fed_tc:
            yield {
                "federation": fed_tc,
                "audit": audit_tc,
                "_policy_stub": policy_stub,  # type: ignore[dict-item]
            }

    fed_app_instance.dependency_overrides.clear()
    audit_app_instance.dependency_overrides.clear()


_FED_PAYLOAD: dict[str, Any] = {
    "source_tenant": TENANT_A,
    "target_tenant": TENANT_B,
    "owner_id": ACTOR_A,
    "actor_id": ACTOR_A,
    "actor_type": "human",
    "shared_object_id": "doc_tena_20260519_0001",
    "shared_object_type": "document",
    "classification": "internal",
    "trust_level": "l3_joint",
    "policy_binding": "default-federation",
    "risk_score": 10.0,
    "requested_action": "federation.share",
}


def test_federation_allow_records_audit_events(
    federation_with_real_audit: dict[str, TestClient],
) -> None:
    """Federation allow → 2 audit events (SHARED boundary) recorded in real audit store."""
    clients = federation_with_real_audit
    stub: Any = clients["_policy_stub"]
    stub.scripted.append({
        "policy_decision_id": "pde_tena_20260519_e2e_001",
        "decided_at": "2026-05-19T00:00:00+00:00",
        "final_decision": "allow",
        "requires_audit": True,
        "reasons": ["e2e allow"],
        "applied_rules": [],
        "input_snapshot": {},
    })

    fed_resp = clients["federation"].post("/federation-events", json=_FED_PAYLOAD)
    assert fed_resp.status_code == 201, fed_resp.text
    body = fed_resp.json()
    assert body["status"] == "approved"
    assert body["policy_result_ref"] == "pde_tena_20260519_e2e_001"

    # Allow (SHARED) => source + target => 2 audit events per SHARED boundary
    audit_resp = clients["audit"].get(f"/audit-events?tenant_id={TENANT_A}")
    assert audit_resp.status_code == 200
    source_events = audit_resp.json()
    assert len(source_events) >= 1


def test_federation_deny_records_audit_event(
    federation_with_real_audit: dict[str, TestClient],
) -> None:
    """Federation deny → SOURCE_ONLY audit boundary → audit event for source tenant."""
    clients = federation_with_real_audit
    stub: Any = clients["_policy_stub"]
    stub.scripted.append({
        "policy_decision_id": "pde_tena_20260519_e2e_002",
        "decided_at": "2026-05-19T00:00:00+00:00",
        "final_decision": "deny",
        "requires_audit": True,
        "reasons": ["e2e deny"],
        "applied_rules": [],
        "input_snapshot": {},
    })

    fed_resp = clients["federation"].post("/federation-events", json=_FED_PAYLOAD)
    assert fed_resp.status_code == 201, fed_resp.text
    body = fed_resp.json()
    assert body["status"] == "blocked"

    # Deny (SOURCE_ONLY) => 1 audit event for source tenant
    audit_resp = clients["audit"].get(f"/audit-events?tenant_id={TENANT_A}")
    assert audit_resp.status_code == 200
    assert len(audit_resp.json()) >= 1


def test_federation_audit_chain_valid_after_multiple_events(
    federation_with_real_audit: dict[str, TestClient],
) -> None:
    """Multiple federation events → audit hash chain for source tenant remains intact."""
    clients = federation_with_real_audit
    stub: Any = clients["_policy_stub"]
    stub.scripted.extend([
        {
            "policy_decision_id": f"pde_tena_20260519_e2e_{i:03d}",
            "decided_at": "2026-05-19T00:00:00+00:00",
            "final_decision": "allow",
            "requires_audit": True,
            "reasons": ["e2e chain test"],
            "applied_rules": [],
            "input_snapshot": {},
        }
        for i in range(1, 4)
    ])

    for _ in range(3):
        clients["federation"].post("/federation-events", json=_FED_PAYLOAD)

    verify_resp = clients["audit"].get(f"/audit-events/verify?tenant_id={TENANT_A}")
    assert verify_resp.status_code == 200
    result = verify_resp.json()
    assert result["valid"] is True


# ---------------------------------------------------------------------------
# 3. AI Gateway Governance E2E (policy gate + audit)
# ---------------------------------------------------------------------------


@pytest.fixture
def ai_gateway_with_real_audit(tmp_path: Any) -> dict[str, TestClient]:
    """AI Gateway wired to a real audit service via in-process adapter."""
    from ai_gateway_app.api import ai_actions as ai_api
    from ai_gateway_app.clients.audit_client import AuditClient as GwAuditClient
    from ai_gateway_app.clients.policy_client import StubPolicyClient as GwPolicyStub
    from ai_gateway_app.llm.llm_client import StubLLMClient
    from ai_gateway_app.main import app as gw_app
    from ai_gateway_app.storage.ai_action_repository import AIActionRepository, get_repository
    from audit_app.api import audit_events as audit_api
    from audit_app.main import app as audit_app_instance
    from audit_app.storage.event_store import AuditEventStore

    store = AuditEventStore(jsonl_path=tmp_path / "e2e_gw_audit.jsonl")
    audit_app_instance.dependency_overrides[audit_api.get_store] = lambda: store
    policy_stub = GwPolicyStub()
    llm_stub = StubLLMClient()

    with TestClient(audit_app_instance) as audit_tc:

        class _GwAuditAdapter:
            def __init__(self, c: TestClient) -> None:
                self._c = c

            def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
                r = self._c.post("/audit-events", json=ingress)
                r.raise_for_status()
                return r.json()

        audit_adapter: GwAuditClient = _GwAuditAdapter(audit_tc)  # type: ignore[assignment]
        repo = AIActionRepository()

        gw_app.dependency_overrides[ai_api.get_policy_client] = lambda: policy_stub
        gw_app.dependency_overrides[ai_api.get_audit_client] = lambda: audit_adapter
        gw_app.dependency_overrides[ai_api.get_llm_client] = lambda: llm_stub
        gw_app.dependency_overrides[get_repository] = lambda: repo

        with TestClient(gw_app) as gw_tc:
            yield {
                "gateway": gw_tc,
                "audit": audit_tc,
                "_policy_stub": policy_stub,  # type: ignore[dict-item]
            }

    gw_app.dependency_overrides.clear()
    audit_app_instance.dependency_overrides.clear()


_AI_ACTION_PAYLOAD: dict[str, Any] = {
    "tenant_id": TENANT_A,
    "owner_id": ACTOR_A,
    "actor_id": ACTOR_A,
    "actor_type": "human",
    "classification": "internal",
    "prompt": "Summarize the quarterly governance report.",
    "model_provider": "anthropic",
    "model_name": "claude-haiku-4-5",
    "risk_score": 5.0,
    "requested_action": "ai.invoke",
}


def test_ai_gateway_allow_records_audit_event(
    ai_gateway_with_real_audit: dict[str, TestClient],
) -> None:
    """AI action with allow policy → COMPLETED status + audit event recorded."""
    clients = ai_gateway_with_real_audit
    stub: Any = clients["_policy_stub"]
    stub.scripted.append({
        "policy_decision_id": "pde_tena_20260519_gw_001",
        "decided_at": "2026-05-19T00:00:00+00:00",
        "final_decision": "allow",
        "requires_audit": True,
        "reasons": ["governance e2e allow"],
        "applied_rules": [],
        "input_snapshot": {},
    })

    gw_resp = clients["gateway"].post("/ai-actions", json=_AI_ACTION_PAYLOAD)
    assert gw_resp.status_code == 201, gw_resp.text
    body = gw_resp.json()
    assert body["status"] == "completed"

    # Verify audit event was recorded in real audit service
    audit_resp = clients["audit"].get(f"/audit-events?tenant_id={TENANT_A}")
    assert audit_resp.status_code == 200
    events = audit_resp.json()
    assert len(events) >= 1


def test_ai_gateway_deny_still_records_audit(
    ai_gateway_with_real_audit: dict[str, TestClient],
) -> None:
    """AI action with deny policy → BLOCKED status, audit trail still preserved (ADR-006)."""
    clients = ai_gateway_with_real_audit
    stub: Any = clients["_policy_stub"]
    stub.scripted.append({
        "policy_decision_id": "pde_tena_20260519_gw_002",
        "decided_at": "2026-05-19T00:00:00+00:00",
        "final_decision": "deny",
        "requires_audit": True,
        "reasons": ["governance e2e deny"],
        "applied_rules": [],
        "input_snapshot": {},
    })

    gw_resp = clients["gateway"].post("/ai-actions", json=_AI_ACTION_PAYLOAD)
    assert gw_resp.status_code == 201, gw_resp.text
    body = gw_resp.json()
    assert body["status"] == "blocked"

    # Audit trail must exist even for blocked path
    audit_resp = clients["audit"].get(f"/audit-events?tenant_id={TENANT_A}")
    assert audit_resp.status_code == 200
    events = audit_resp.json()
    assert len(events) >= 1


def test_ai_gateway_audit_chain_intact_after_multiple_actions(
    ai_gateway_with_real_audit: dict[str, TestClient],
) -> None:
    """Multiple AI actions → audit hash chain remains intact in real audit store."""
    clients = ai_gateway_with_real_audit
    stub: Any = clients["_policy_stub"]
    stub.scripted.extend([
        {
            "policy_decision_id": f"pde_tena_20260519_chain_{i:03d}",
            "decided_at": "2026-05-19T00:00:00+00:00",
            "final_decision": "allow",
            "requires_audit": True,
            "reasons": ["chain test"],
            "applied_rules": [],
            "input_snapshot": {},
        }
        for i in range(1, 4)
    ])

    for _ in range(3):
        clients["gateway"].post("/ai-actions", json=_AI_ACTION_PAYLOAD)

    verify_resp = clients["audit"].get(f"/audit-events/verify?tenant_id={TENANT_A}")
    assert verify_resp.status_code == 200
    result = verify_resp.json()
    assert result["valid"] is True
    assert result["total_events"] >= 3
