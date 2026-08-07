"""Dashboard API tests (BL-010).

カバレッジ (BACKLOG_TEST_MAPPING.md "BL-010" 行に対応):
    - UX:        Acceptance 5 必須 4 値 (open_issue / pending_approval / critical_audit /
                  + recent_issues navigation) が返る
    - AI:        Sprint 1 では AI 領域は 0 / sprint_ready=False (Sprint 2 切替準備)
    - Federation: Sprint 1 では Federation 領域は 0 / sprint_ready=False
    - Audit:     critical_audit_count = policy_result=deny の件数
    - Non Goals: dashboard-service に POST/PUT/DELETE エンドポイントが存在しない
                  (= "業務状態の直接変更を持たない" を機械的に検証)
"""

from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient

from dashboard_app.clients.approval_client import StubApprovalReadClient
from dashboard_app.clients.audit_client import StubAuditReadClient
from dashboard_app.clients.issue_client import StubIssueReadClient
from dashboard_app.main import app

TENANT_ID = "ten_tena_20260101_0001"
TENANT_B_ID = "ten_tenb_20260101_0001"


def _issue(
    *,
    object_id: str,
    status: str = "draft",
    priority: str = "medium",
    classification: str = "internal",
    tenant_id: str = TENANT_ID,
    title: str = "サンプル Issue",
    created_at: str = "2026-05-01T00:00:00+00:00",
) -> dict[str, Any]:
    return {
        "object_id": object_id,
        "object_type": "issue",
        "tenant_id": tenant_id,
        "owner_id": "idn_tena_20260101_0002",
        "classification": classification,
        "status": status,
        "priority": priority,
        "title": title,
        "created_at": created_at,
    }


def _approval(
    *,
    object_id: str,
    issue_id: str,
    decision: str = "approved",
    tenant_id: str = TENANT_ID,
    decided_at: str = "2026-05-02T00:00:00+00:00",
) -> dict[str, Any]:
    return {
        "object_id": object_id,
        "object_type": "approval",
        "tenant_id": tenant_id,
        "issue_id": issue_id,
        "approver_id": "idn_tena_20260101_0010",
        "decision": decision,
        "decided_at": decided_at,
    }


def _audit(
    *,
    event_type: str = "ApprovalDecided",
    policy_result: str = "allow",
    tenant_id: str = TENANT_ID,
) -> dict[str, Any]:
    return {
        "event_type": event_type,
        "tenant_id": tenant_id,
        "policy_result": policy_result,
    }


def test_enterprise_health_counts(
    client: TestClient,
    issue_stub: StubIssueReadClient,
    audit_stub: StubAuditReadClient,
) -> None:
    """Acceptance 5 中核: Enterprise Health の 3 値が正しく集計される."""

    # 4 件の Issue: 3 件 open, そのうち 2 件は approval_required
    issue_stub.register(_issue(object_id="iss_tena_20260501_0001", status="draft"))
    issue_stub.register(
        _issue(object_id="iss_tena_20260501_0002", status="approval_required")
    )
    issue_stub.register(
        _issue(object_id="iss_tena_20260501_0003", status="approval_required")
    )
    issue_stub.register(_issue(object_id="iss_tena_20260501_0004", status="closed"))

    # Audit: 5 件中 2 件が deny
    audit_stub.register(_audit(policy_result="allow"))
    audit_stub.register(_audit(policy_result="allow"))
    audit_stub.register(_audit(policy_result="deny"))
    audit_stub.register(_audit(policy_result="deny"))
    audit_stub.register(_audit(policy_result="approval_required"))

    res = client.get(f"/dashboard/enterprise-health?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    body = res.json()
    assert body["open_issue_count"] == 3
    assert body["pending_approval_count"] == 2
    assert body["critical_audit_count"] == 2


def test_overview_returns_all_areas_sprint1(
    client: TestClient,
    issue_stub: StubIssueReadClient,
    approval_stub: StubApprovalReadClient,
    audit_stub: StubAuditReadClient,
) -> None:
    """Sprint 1 Dashboard: 全 area が返り、AI/DLP/Federation は sprint_ready=False で 0."""

    issue_stub.register(
        _issue(object_id="iss_tena_20260501_0001", status="approval_required")
    )
    approval_stub.register(
        _approval(object_id="app_tena_20260502_0001", issue_id="iss_tena_20260501_0001")
    )
    audit_stub.register(_audit(policy_result="deny"))

    res = client.get(f"/dashboard/overview?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    body = res.json()

    assert body["tenant_id"] == TENANT_ID
    assert body["sprint"] == "1"
    assert body["generated_at"] is not None

    # Enterprise Health は実値
    assert body["enterprise_health"]["open_issue_count"] == 1
    assert body["enterprise_health"]["pending_approval_count"] == 1
    assert body["enterprise_health"]["critical_audit_count"] == 1

    # Sprint 2 領域は sprint_ready=False, 全カウンタ 0
    assert body["ai_activity"] == {
        "ai_action_count": 0,
        "high_ai_risk_count": 0,
        "external_ai_block_count": 0,
        "sprint_ready": False,
    }
    assert body["dlp_alerts"] == {
        "dlp_violation_count": 0,
        "restricted_document_count": 0,
        "sprint_ready": False,
    }
    assert body["federation_stats"] == {
        "pending_federation_request_count": 0,
        "trust_warning_count": 0,
        "sprint_ready": False,
    }


def test_overview_recent_issues_carry_navigation_fields(
    client: TestClient,
    issue_stub: StubIssueReadClient,
) -> None:
    """Acceptance 5: Dashboard から対象 Object へ遷移できる
    -> recent_issues が object_id / title / status / priority / classification を持つ.
    """

    for i in range(7):
        issue_stub.register(
            _issue(
                object_id=f"iss_tena_20260501_{i:04d}",
                title=f"Issue {i}",
                created_at=f"2026-05-{i + 1:02d}T00:00:00+00:00",
                priority="high" if i % 2 == 0 else "low",
            )
        )

    res = client.get(f"/dashboard/overview?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    recent = res.json()["recent_issues"]
    assert len(recent) == 5  # RECENT_LIMIT
    # created_at 降順
    assert recent[0]["object_id"] == "iss_tena_20260501_0006"
    assert recent[-1]["object_id"] == "iss_tena_20260501_0002"
    # navigation 必須項目
    for item in recent:
        assert item["object_id"]
        assert item["title"]
        assert item["status"]
        assert item["priority"]
        assert item["classification"]


def test_overview_recent_approvals_present(
    client: TestClient,
    approval_stub: StubApprovalReadClient,
) -> None:
    approval_stub.register(
        _approval(
            object_id="app_tena_20260502_0001",
            issue_id="iss_tena_20260501_0001",
            decision="approved",
            decided_at="2026-05-02T01:00:00+00:00",
        )
    )
    approval_stub.register(
        _approval(
            object_id="app_tena_20260502_0002",
            issue_id="iss_tena_20260501_0002",
            decision="rejected",
            decided_at="2026-05-02T02:00:00+00:00",
        )
    )

    res = client.get(f"/dashboard/overview?tenant_id={TENANT_ID}")
    body = res.json()
    assert len(body["recent_approvals"]) == 2
    assert body["recent_approvals"][0]["object_id"] == "app_tena_20260502_0002"
    assert body["recent_approvals"][0]["decision"] == "rejected"


def test_tenant_filter_isolates_data(
    client: TestClient,
    issue_stub: StubIssueReadClient,
    audit_stub: StubAuditReadClient,
) -> None:
    """Federation 境界: 違う tenant のデータが集計に混じらない."""

    issue_stub.register(_issue(object_id="iss_tena_20260501_0001"))
    issue_stub.register(
        _issue(object_id="iss_tenb_20260501_0001", tenant_id=TENANT_B_ID)
    )
    audit_stub.register(_audit(policy_result="deny", tenant_id=TENANT_ID))
    audit_stub.register(_audit(policy_result="deny", tenant_id=TENANT_B_ID))

    res_a = client.get(f"/dashboard/enterprise-health?tenant_id={TENANT_ID}")
    res_b = client.get(f"/dashboard/enterprise-health?tenant_id={TENANT_B_ID}")
    assert res_a.json()["open_issue_count"] == 1
    assert res_a.json()["critical_audit_count"] == 1
    assert res_b.json()["open_issue_count"] == 1
    assert res_b.json()["critical_audit_count"] == 1


def test_tenant_id_required(client: TestClient) -> None:
    """tenant_id が無いと 422 (Federation 境界保護)."""

    res = client.get("/dashboard/enterprise-health")
    assert res.status_code == 422
    res = client.get("/dashboard/overview")
    assert res.status_code == 422


def test_dashboard_is_read_only(client: TestClient) -> None:
    """Non Goals Guard: dashboard-service には POST/PUT/DELETE エンドポイントが存在しない.

    SERVICE_RESPONSIBILITY_MODEL "Dashboard Service: 業務状態の直接変更を持たない"
    を route table レベルで機械的に検証する。
    """

    write_methods = {"POST", "PUT", "DELETE", "PATCH"}
    for route in app.routes:
        methods = getattr(route, "methods", set()) or set()
        path = getattr(route, "path", "")
        forbidden = methods & write_methods
        assert not forbidden, (
            f"dashboard-service must be read-only, but {path} exposes {forbidden}"
        )


def test_overview_empty_state(client: TestClient) -> None:
    """1 件もデータがない初期状態でも 0 で返る (UI が落ちないことの保証)."""

    res = client.get(f"/dashboard/overview?tenant_id={TENANT_ID}")
    assert res.status_code == 200
    body = res.json()
    assert body["enterprise_health"] == {
        "open_issue_count": 0,
        "pending_approval_count": 0,
        "critical_audit_count": 0,
    }
    assert body["recent_issues"] == []
    assert body["recent_approvals"] == []


def test_healthz(client: TestClient) -> None:
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "dashboard-service", "sprint": "1"}
