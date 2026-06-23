"""Governance Metrics API tests (Sprint 4 / Governance Observability).

カバレッジ:
    - GET /dashboard/governance-metrics の正常系
    - stub クライアントを使ってデータが集計されることを確認
    - policy_deny_count / ai_action_blocked_count / federation_blocked_count の集計確認
    - tenant_id フィルタリングが正しく機能することを確認
    - tenant_id が無いと 422 を返すことの確認
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from dashboard_app.api import dashboard as dashboard_api
from dashboard_app.clients.ai_gateway_client import StubAIGatewayReadClient
from dashboard_app.clients.audit_client import StubAuditReadClient
from dashboard_app.clients.federation_client import StubFederationReadClient
from dashboard_app.clients.policy_client import StubPolicyReadClient
from dashboard_app.main import app

TENANT_ID = "ten_tena_20260101_0001"
TENANT_B_ID = "ten_tenb_20260101_0001"


def _policy_decision(
    *,
    final_decision: str = "allow",
    tenant_id: str = TENANT_ID,
) -> dict[str, Any]:
    return {
        "policy_decision_id": "pde_tena_20260501_0001",
        "tenant_id": tenant_id,
        "final_decision": final_decision,
        "decided_at": "2026-05-01T00:00:00+00:00",
    }


def _audit_event(
    *,
    event_type: str = "AIInvoked",
    tenant_id: str = TENANT_ID,
) -> dict[str, Any]:
    return {
        "event_type": event_type,
        "tenant_id": tenant_id,
        "policy_result": "allow",
    }


def _ai_action(
    *,
    status: str = "completed",
    tenant_id: str = TENANT_ID,
) -> dict[str, Any]:
    return {
        "object_id": "aia_tena_20260501_0001",
        "tenant_id": tenant_id,
        "status": status,
    }


def _federation_event(
    *,
    status: str = "approved",
    source_tenant: str = TENANT_ID,
    target_tenant: str = TENANT_B_ID,
) -> dict[str, Any]:
    return {
        "object_id": "fev_tena_20260501_0001",
        "source_tenant": source_tenant,
        "target_tenant": target_tenant,
        "tenant_id": source_tenant,
        "status": status,
    }


@pytest.fixture
def policy_stub() -> StubPolicyReadClient:
    return StubPolicyReadClient()


@pytest.fixture
def ai_gateway_stub() -> StubAIGatewayReadClient:
    return StubAIGatewayReadClient()


@pytest.fixture
def federation_stub() -> StubFederationReadClient:
    return StubFederationReadClient()


@pytest.fixture
def governance_audit_stub() -> StubAuditReadClient:
    return StubAuditReadClient()


@pytest.fixture
def governance_client(
    policy_stub: StubPolicyReadClient,
    ai_gateway_stub: StubAIGatewayReadClient,
    federation_stub: StubFederationReadClient,
    governance_audit_stub: StubAuditReadClient,
) -> Iterator[TestClient]:
    app.dependency_overrides[dashboard_api.get_policy_read_client] = lambda: policy_stub
    app.dependency_overrides[dashboard_api.get_ai_gateway_client] = lambda: ai_gateway_stub
    app.dependency_overrides[dashboard_api.get_federation_client] = lambda: federation_stub
    app.dependency_overrides[dashboard_api.get_audit_client] = lambda: governance_audit_stub
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_governance_metrics_empty_state(governance_client: TestClient) -> None:
    """データが 0 件でも全フィールドが 0 で返る."""
    res = governance_client.get(f"/dashboard/governance-metrics?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    body = res.json()
    assert body["policy_allow_count"] == 0
    assert body["policy_deny_count"] == 0
    assert body["policy_review_required_count"] == 0
    assert body["audit_event_count"] == 0
    assert body["ai_action_count"] == 0
    assert body["ai_action_blocked_count"] == 0
    assert body["federation_event_count"] == 0
    assert body["federation_blocked_count"] == 0
    assert body["last_updated"] is not None


def test_governance_metrics_policy_counts(
    governance_client: TestClient,
    policy_stub: StubPolicyReadClient,
) -> None:
    """policy_allow_count / policy_deny_count / policy_review_required_count が正しく集計される."""
    # 3 allow, 2 deny, 1 approval_required (= review_required 扱い)
    for _ in range(3):
        policy_stub.register(_policy_decision(final_decision="allow"))
    for _ in range(2):
        policy_stub.register(_policy_decision(final_decision="deny"))
    policy_stub.register(_policy_decision(final_decision="approval_required"))

    res = governance_client.get(f"/dashboard/governance-metrics?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    body = res.json()
    assert body["policy_allow_count"] == 3
    assert body["policy_deny_count"] == 2
    assert body["policy_review_required_count"] == 1


def test_governance_metrics_ai_action_blocked_count(
    governance_client: TestClient,
    ai_gateway_stub: StubAIGatewayReadClient,
) -> None:
    """ai_action_count / ai_action_blocked_count が正しく集計される."""
    ai_gateway_stub.register(_ai_action(status="completed"))
    ai_gateway_stub.register(_ai_action(status="completed"))
    ai_gateway_stub.register(_ai_action(status="blocked"))
    ai_gateway_stub.register(_ai_action(status="blocked"))
    ai_gateway_stub.register(_ai_action(status="masked"))

    res = governance_client.get(f"/dashboard/governance-metrics?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    body = res.json()
    assert body["ai_action_count"] == 5
    assert body["ai_action_blocked_count"] == 2


def test_governance_metrics_federation_blocked_count(
    governance_client: TestClient,
    federation_stub: StubFederationReadClient,
) -> None:
    """federation_event_count / federation_blocked_count が正しく集計される."""
    federation_stub.register(_federation_event(status="approved"))
    federation_stub.register(_federation_event(status="blocked"))
    federation_stub.register(_federation_event(status="blocked"))
    federation_stub.register(_federation_event(status="review_required"))

    res = governance_client.get(f"/dashboard/governance-metrics?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    body = res.json()
    assert body["federation_event_count"] == 4
    assert body["federation_blocked_count"] == 2


def test_governance_metrics_audit_event_count(
    governance_client: TestClient,
    governance_audit_stub: StubAuditReadClient,
) -> None:
    """audit_event_count が正しく集計される."""
    for _ in range(7):
        governance_audit_stub.register(_audit_event())

    res = governance_client.get(f"/dashboard/governance-metrics?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    body = res.json()
    assert body["audit_event_count"] == 7


def test_governance_metrics_combined(
    governance_client: TestClient,
    policy_stub: StubPolicyReadClient,
    ai_gateway_stub: StubAIGatewayReadClient,
    federation_stub: StubFederationReadClient,
    governance_audit_stub: StubAuditReadClient,
) -> None:
    """全フィールドが同時に正しく集計される複合テスト."""
    policy_stub.register(_policy_decision(final_decision="allow"))
    policy_stub.register(_policy_decision(final_decision="deny"))
    policy_stub.register(_policy_decision(final_decision="federation_review_required"))

    governance_audit_stub.register(_audit_event())
    governance_audit_stub.register(_audit_event())

    ai_gateway_stub.register(_ai_action(status="completed"))
    ai_gateway_stub.register(_ai_action(status="blocked"))

    federation_stub.register(_federation_event(status="approved"))
    federation_stub.register(_federation_event(status="blocked"))

    res = governance_client.get(f"/dashboard/governance-metrics?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    body = res.json()
    assert body["policy_allow_count"] == 1
    assert body["policy_deny_count"] == 1
    assert body["policy_review_required_count"] == 1
    assert body["audit_event_count"] == 2
    assert body["ai_action_count"] == 2
    assert body["ai_action_blocked_count"] == 1
    assert body["federation_event_count"] == 2
    assert body["federation_blocked_count"] == 1


def test_governance_metrics_tenant_id_required(governance_client: TestClient) -> None:
    """tenant_id が無いと 422 を返す."""
    res = governance_client.get("/dashboard/governance-metrics")
    assert res.status_code == 422
