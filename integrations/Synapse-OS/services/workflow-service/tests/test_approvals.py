"""Approval API contract / policy / workflow / audit tests (BL-003).

カバレッジ (BACKLOG_TEST_MAPPING.md "BL-003" 行に対応):
    - Contract:  POST /approvals が ApprovalCreateRequest を受理し Approval schema で返す
    - Contract:  GET  /approvals / GET /approvals/{id} が一貫した結果を返す
    - Policy:    Policy が allow を返すと Approval は保存され ApprovalDecided が積まれる
    - Workflow:  Policy が deny を返すと Approval は保存されず 403 + 迂回 Audit のみ残る
                 (= "承認迂回の拒否")
    - Audit:     ApprovalDecided / ApprovalRequested の correlation_id が常に Issue ID と一致
    - Schema:    必須属性が欠ける / 余計な属性 / decision=pending は 422
    - Cross Tenant: Approval payload の tenant_id と Issue.tenant_id が異なる場合 400
                    (Federation 経路を強制するため)
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from workflow_app.clients.audit_client import StubAuditClient
from workflow_app.clients.object_client import StubObjectClient
from workflow_app.clients.policy_client import StubPolicyClient

TENANT_ID = "ten_tena_20260101_0001"
TENANT_B_ID = "ten_tenb_20260101_0001"
APPROVER_ID = "idn_tena_20260101_0010"
ISSUE_ID = "iss_tena_20260502_0001"
ISSUE_ID_B = "iss_tenb_20260502_0001"


def _issue(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "object_id": ISSUE_ID,
        "object_type": "issue",
        "tenant_id": TENANT_ID,
        "owner_id": "idn_tena_20260101_0002",
        "classification": "internal",
        "title": "顧客チャットボット応答精度の改善",
        "status": "draft",
        "priority": "high",
    }
    base.update(overrides)
    return base


def _payload(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "tenant_id": TENANT_ID,
        "issue_id": ISSUE_ID,
        "approver_id": APPROVER_ID,
        "actor_type": "human",
        "decision": "approved",
        "reason": "影響範囲を確認、リリース計画にも整合",
        "requested_action": "approval.decide",
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


def test_approve_allow_path(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    object_stub: StubObjectClient,
) -> None:
    object_stub.register(_issue())
    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_6000",
            final_decision="allow",
            reasons=["approver has authority"],
        )
    )

    res = client.post("/approvals", json=_payload())
    assert res.status_code == 201, res.text
    body = res.json()

    assert body["object_id"].startswith("app_tena_")
    assert body["object_type"] == "approval"
    assert body["issue_id"] == ISSUE_ID
    assert body["approver_id"] == APPROVER_ID
    assert body["decision"] == "approved"
    assert body["reason"].startswith("影響範囲を確認")
    assert body["policy_result_ref"] == "pde_tena_20260502_6000"
    assert body["decided_at"] is not None
    assert len(body["audit_event_refs"]) == 1

    # Policy へ正しい入力が組み立てられているか
    assert len(policy_stub.calls) == 1
    policy_in = policy_stub.calls[0]
    assert policy_in["actor_id"] == APPROVER_ID
    assert policy_in["tenant_id"] == TENANT_ID
    assert policy_in["object_type"] == "approval"
    assert policy_in["action"] == "approval.decide"
    assert policy_in["classification"] == "internal"
    assert policy_in["is_state_change"] is True

    # Audit が ApprovalDecided として、correlation_id = issue_id で積まれているか
    assert len(audit_stub.events) == 1
    evt = audit_stub.events[0]
    assert evt["event_type"] == "ApprovalDecided"
    assert evt["correlation_id"] == ISSUE_ID
    assert evt["object_id"] == body["object_id"]
    assert evt["policy_decision_ref"] == "pde_tena_20260502_6000"
    assert evt["policy_result"] == "allow"
    assert evt["after_state"]["decision"] == "approved"
    assert evt["after_state"]["issue_id"] == ISSUE_ID

    # object-service が一度だけ参照されているか (= Issue 取得は repo ではない)
    assert object_stub.calls == [ISSUE_ID]


def test_approve_rejected_decision_still_persisted(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    object_stub: StubObjectClient,
) -> None:
    """承認者が rejected を選んだケース: Policy は allow だが decision=rejected で保存される."""

    object_stub.register(_issue())
    policy_stub.scripted.append(
        _scripted_decision(decision_id="pde_tena_20260502_6100", final_decision="allow")
    )

    res = client.post("/approvals", json=_payload(decision="rejected", reason="影響度過大"))
    assert res.status_code == 201
    body = res.json()
    assert body["decision"] == "rejected"
    assert body["reason"] == "影響度過大"
    assert audit_stub.events[0]["after_state"]["decision"] == "rejected"


def test_approve_blocked_by_policy_audits_only(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    object_stub: StubObjectClient,
    repo,
) -> None:
    """承認迂回拒否: Policy が deny を返すと Approval は作らず Audit だけ残す.

    BACKLOG_TEST_MAPPING "Workflow: 承認迂回の拒否" を満たす中核テスト。
    """

    object_stub.register(_issue(classification="restricted"))
    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_6200",
            final_decision="deny",
            reasons=["approver lacks authority for restricted issue"],
        )
    )

    res = client.post("/approvals", json=_payload(reason="緊急対応として承認"))
    assert res.status_code == 403
    detail = res.json()["detail"]
    assert detail["policy_decision_id"] == "pde_tena_20260502_6200"
    assert "approver lacks authority for restricted issue" in detail["reasons"]

    # Approval は永続化されていない
    assert len(repo) == 0

    # Audit には「迂回しようとした事実」が残る (correlation_id は Issue ID)
    assert len(audit_stub.events) == 1
    evt = audit_stub.events[0]
    assert evt["event_type"] == "ApprovalRequested"
    assert evt["correlation_id"] == ISSUE_ID
    assert evt["object_id"] == ISSUE_ID
    assert evt["object_type"] == "issue"
    assert evt["policy_result"] == "deny"
    assert evt["after_state"]["decision"] == "rejected_by_policy"
    assert evt["after_state"]["issue_classification"] == "restricted"
    assert evt["after_state"]["attempted_action"] == "approval.decide"


def test_approve_issue_not_found(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """対象 Issue が存在しない場合は 404, Policy も Audit も呼ばれない."""

    res = client.post("/approvals", json=_payload(issue_id="iss_tena_20260502_9999"))
    assert res.status_code == 404
    assert policy_stub.calls == []
    assert audit_stub.events == []


def test_approve_cross_tenant_blocked(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    object_stub: StubObjectClient,
) -> None:
    """Approval payload と Issue の tenant が違う場合は 400.

    Cross Tenant 操作は Federation Service 経由でのみ許可するため
    (ADR-002), 通常の Approval API では弾く。
    """

    object_stub.register(_issue(object_id=ISSUE_ID_B, tenant_id=TENANT_B_ID))
    res = client.post(
        "/approvals", json=_payload(issue_id=ISSUE_ID_B)  # payload tenant=tena, issue tenant=tenb
    )
    assert res.status_code == 400
    assert "Federation" in res.json()["detail"]
    # Policy / Audit は呼ばれない
    assert policy_stub.calls == []
    assert audit_stub.events == []


@pytest.mark.parametrize(
    "missing_field",
    ["tenant_id", "issue_id", "approver_id", "decision"],
)
def test_create_approval_missing_required_field(
    client: TestClient, missing_field: str
) -> None:
    payload = _payload()
    del payload[missing_field]
    res = client.post("/approvals", json=payload)
    assert res.status_code == 422


def test_create_approval_extra_field_rejected(client: TestClient) -> None:
    res = client.post("/approvals", json=_payload(extra_field="x"))
    assert res.status_code == 422


def test_create_approval_invalid_decision(client: TestClient) -> None:
    res = client.post("/approvals", json=_payload(decision="maybe"))
    assert res.status_code == 422


def test_create_approval_pending_decision_rejected(
    client: TestClient,
    object_stub: StubObjectClient,
) -> None:
    """pending は判断不在なので Audit に書けない -> 422."""

    object_stub.register(_issue())
    res = client.post("/approvals", json=_payload(decision="pending"))
    assert res.status_code == 422
    assert "pending" in res.json()["detail"]


def test_get_approval_roundtrip(
    client: TestClient,
    policy_stub: StubPolicyClient,
    object_stub: StubObjectClient,
) -> None:
    object_stub.register(_issue())
    policy_stub.scripted.append(
        _scripted_decision(decision_id="pde_tena_20260502_7000", final_decision="allow")
    )
    create_res = client.post("/approvals", json=_payload())
    approval_id = create_res.json()["object_id"]

    get_res = client.get(f"/approvals/{approval_id}")
    assert get_res.status_code == 200
    assert get_res.json()["object_id"] == approval_id
    assert get_res.json()["issue_id"] == ISSUE_ID


def test_get_approval_not_found(client: TestClient) -> None:
    res = client.get("/approvals/app_tena_20260502_9999")
    assert res.status_code == 404


def test_list_approvals_filters(
    client: TestClient,
    policy_stub: StubPolicyClient,
    object_stub: StubObjectClient,
) -> None:
    object_stub.register(_issue())
    object_stub.register(_issue(object_id="iss_tena_20260502_0002"))
    for i in range(3):
        policy_stub.scripted.append(
            _scripted_decision(
                decision_id=f"pde_tena_20260502_{8000 + i:04d}", final_decision="allow"
            )
        )
    client.post("/approvals", json=_payload())
    client.post("/approvals", json=_payload(issue_id="iss_tena_20260502_0002"))
    client.post("/approvals", json=_payload(issue_id="iss_tena_20260502_0002", reason="2 度目"))

    by_tenant = client.get(f"/approvals?tenant_id={TENANT_ID}")
    assert len(by_tenant.json()) == 3

    by_issue = client.get("/approvals?issue_id=iss_tena_20260502_0002")
    assert len(by_issue.json()) == 2
    for item in by_issue.json():
        assert item["issue_id"] == "iss_tena_20260502_0002"


def test_healthz(client: TestClient) -> None:
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "workflow-service", "sprint": "1"}
