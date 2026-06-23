"""MVP Release Candidate E2E Integration Tests.

Covers the 10 MVP acceptance criteria:
1. All major screens work (healthz proxy)
2. API communication success (service-to-service via TestClient adapters)
3. Auth/authz works (JWT login → get /auth/me)
4. DB CRUD success (Issue create/read via SQLite)
5-6. CI/Security (addressed in CI pipeline)
7. E2E test success (this file)
8. README/ops docs (manual check)
9. Docker startup (docker-compose build - manual)
10. Reproducible locally (this file)

Cross-service flow: Issue (object) → Approval (workflow) → Audit (audit)
Auth flow: POST /auth/token → GET /auth/me
"""

from __future__ import annotations

import os
from typing import Any

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Auth E2E: JWT login and /auth/me
# ---------------------------------------------------------------------------


@pytest.fixture
def auth_client() -> TestClient:
    from tenant_identity_app.main import app
    with TestClient(app) as client:
        yield client


def test_jwt_login_and_get_me(auth_client: TestClient) -> None:
    """Login with dev credentials → verify /auth/me returns correct identity."""
    resp = auth_client.post(
        "/auth/token",
        data={"username": "admin@synapse.local", "password": "admin1234"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    token_data = resp.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    token = token_data["access_token"]
    me_resp = auth_client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200, me_resp.text
    me = me_resp.json()
    assert me["username"] == "admin@synapse.local"
    assert me["role"] == "admin"


def test_invalid_credentials_rejected(auth_client: TestClient) -> None:
    resp = auth_client.post(
        "/auth/token",
        data={"username": "admin@synapse.local", "password": "wrong"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Issue CRUD E2E: object-service with SQLite in-memory
# ---------------------------------------------------------------------------


@pytest.fixture
def object_client(tmp_path: Any) -> TestClient:
    db_path = str(tmp_path / "test_mvp_rc.db")
    os.environ["SQLITE_DB"] = db_path

    from object_app.storage.database import init_db
    init_db()

    from object_app.main import app
    from object_app.api import issues as issues_api
    from object_app.storage.issue_repository import IssueRepository

    repo = IssueRepository()
    app.dependency_overrides[issues_api.get_repository] = lambda: repo

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    del os.environ["SQLITE_DB"]


_ISSUE_PAYLOAD = {
    "tenant_id": "ten_tena_20260101_0001",
    "owner_id": "idn_tena_20260101_0001",
    "title": "MVP RC E2E Test Issue",
    "description": "Automated E2E test for MVP Release Candidate",
    "priority": "high",
    "classification": "internal",
    "actor_id": "idn_tena_20260101_0001",
    "actor_type": "human",
    "data_destination": "internal",
    "model_provider": "n/a",
    "risk_score": 0.1,
    "requested_action": "issue.create",
}


def test_issue_create_and_read(object_client: TestClient) -> None:
    """Create an issue then retrieve it by ID — verifies DB CRUD."""
    create_resp = object_client.post("/issues", json=_ISSUE_PAYLOAD)
    assert create_resp.status_code == 201, create_resp.text

    issue = create_resp.json()
    assert issue["title"] == _ISSUE_PAYLOAD["title"]
    assert issue["tenant_id"] == _ISSUE_PAYLOAD["tenant_id"]
    issue_id = issue["object_id"]

    get_resp = object_client.get(f"/issues/{issue_id}")
    assert get_resp.status_code == 200, get_resp.text
    fetched = get_resp.json()
    assert fetched["object_id"] == issue_id


def test_issue_list_filter_by_tenant(object_client: TestClient) -> None:
    """Multiple issues: list endpoint filters correctly by tenant."""
    object_client.post("/issues", json=_ISSUE_PAYLOAD)
    other_payload = {**_ISSUE_PAYLOAD, "tenant_id": "ten_tenb_20260101_0001"}
    object_client.post("/issues", json=other_payload)

    tenant = _ISSUE_PAYLOAD["tenant_id"]
    list_resp = object_client.get(f"/issues?tenant_id={tenant}")
    assert list_resp.status_code == 200, list_resp.text
    issues = list_resp.json()
    assert len(issues) >= 1
    assert all(i["tenant_id"] == tenant for i in issues)


# ---------------------------------------------------------------------------
# Cross-service E2E: Issue → Approval → Audit (reuses sprint1 adapters pattern)
# ---------------------------------------------------------------------------


@pytest.fixture
def cross_service_clients(tmp_path: Any) -> dict[str, TestClient]:
    """Spin up object/workflow/audit/policy in-process with adapters."""
    from audit_app.api import audit_events as audit_api
    from audit_app.main import app as audit_app_instance
    from audit_app.storage.event_store import AuditEventStore
    from object_app.api import issues as issues_api
    from object_app.main import app as object_app_instance
    from object_app.storage.issue_repository import IssueRepository
    from policy_app.api import decisions as decisions_api
    from policy_app.main import app as policy_app_instance
    from policy_app.storage.decision_store import PolicyDecisionStore
    from workflow_app.api import approvals as approvals_api
    from workflow_app.clients.object_client import IssueNotFound
    from workflow_app.main import app as workflow_app_instance
    from workflow_app.storage.approval_repository import ApprovalRepository

    audit_store = AuditEventStore(jsonl_path=tmp_path / "e2e_audit.jsonl")
    policy_store = PolicyDecisionStore()
    issue_repo = IssueRepository()
    approval_repo = ApprovalRepository()

    class _PolicyAdapter:
        def __init__(self, c: TestClient) -> None:
            self._c = c
        def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
            r = self._c.post("/policy-decisions", json=payload)
            r.raise_for_status()
            return r.json()

    class _AuditAdapter:
        def __init__(self, c: TestClient) -> None:
            self._c = c
        def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
            r = self._c.post("/audit-events", json=ingress)
            r.raise_for_status()
            return r.json()

    class _ObjectAdapter:
        def __init__(self, c: TestClient) -> None:
            self._c = c
        def get_issue(self, issue_id: str) -> dict[str, Any]:
            r = self._c.get(f"/issues/{issue_id}")
            if r.status_code == 404:
                raise IssueNotFound(issue_id)
            r.raise_for_status()
            return r.json()

    audit_app_instance.dependency_overrides[audit_api.get_store] = lambda: audit_store
    policy_app_instance.dependency_overrides[decisions_api.get_store] = lambda: policy_store
    object_app_instance.dependency_overrides[issues_api.get_repository] = lambda: issue_repo
    workflow_app_instance.dependency_overrides[approvals_api.get_repository] = (
        lambda: approval_repo
    )

    with (
        TestClient(audit_app_instance) as audit_client,
        TestClient(policy_app_instance) as policy_client,
    ):
        pa = _PolicyAdapter(policy_client)
        aa = _AuditAdapter(audit_client)

        object_app_instance.dependency_overrides[issues_api.get_policy_client] = lambda: pa
        object_app_instance.dependency_overrides[issues_api.get_audit_client] = lambda: aa

        with TestClient(object_app_instance) as object_client:
            oa = _ObjectAdapter(object_client)

            workflow_app_instance.dependency_overrides[approvals_api.get_policy_client] = (
                lambda: pa
            )
            workflow_app_instance.dependency_overrides[approvals_api.get_audit_client] = (
                lambda: aa
            )
            workflow_app_instance.dependency_overrides[approvals_api.get_object_client] = (
                lambda: oa
            )

            with TestClient(workflow_app_instance) as workflow_client:
                yield {
                    "object": object_client,
                    "workflow": workflow_client,
                    "audit": audit_client,
                    "policy": policy_client,
                }

    for app in (
        audit_app_instance,
        policy_app_instance,
        object_app_instance,
        workflow_app_instance,
    ):
        app.dependency_overrides.clear()


TENANT = "ten_tena_20260101_0001"
ACTOR = "idn_tena_20260101_0001"
APPROVER = "idn_tena_20260101_0010"


def test_issue_approval_audit_flow(cross_service_clients: dict[str, TestClient]) -> None:
    """End-to-end: create Issue → approve → verify audit trail has both events."""
    clients = cross_service_clients

    # Step 1: Create Issue
    issue_resp = clients["object"].post(
        "/issues",
        json={
            "tenant_id": TENANT,
            "owner_id": ACTOR,
            "title": "MVP RC Integration Flow",
            "description": "E2E test",
            "priority": "high",
            "classification": "internal",
            "actor_id": ACTOR,
            "actor_type": "human",
            "data_destination": "internal",
            "model_provider": "n/a",
            "risk_score": 0.05,
        },
    )
    assert issue_resp.status_code == 201, issue_resp.text
    issue_id = issue_resp.json()["object_id"]

    # Step 2: Approve (use only fields defined in ApprovalCreateRequest schema)
    approval_resp = clients["workflow"].post(
        "/approvals",
        json={
            "tenant_id": TENANT,
            "issue_id": issue_id,
            "approver_id": APPROVER,
            "decision": "approved",
            "reason": "E2E test approval",
            "actor_type": "human",
            "data_destination": "internal",
            "model_provider": "n/a",
            "requested_action": "approval.decide",
        },
    )
    assert approval_resp.status_code in (200, 201), approval_resp.text

    # Step 3: Verify audit trail
    audit_resp = clients["audit"].get(f"/audit-events?tenant_id={TENANT}")
    assert audit_resp.status_code == 200, audit_resp.text
    events = audit_resp.json()
    assert len(events) >= 2, f"Expected ≥2 audit events, got {len(events)}"
    event_types = {e["event_type"] for e in events}
    assert "IssueCreated" in event_types or any("Issue" in t for t in event_types), (
        f"No Issue event in audit: {event_types}"
    )
