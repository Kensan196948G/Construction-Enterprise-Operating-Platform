"""Sprint 1 末 Acceptance Integration Test (BL-013).

検証する Acceptance Criteria (docs/09_Design_Refinement/MVP_ACCEPTANCE_CRITERIA.md
Acceptance 1):
    1. Issue が Tenant / Owner / Priority / Classification を保有して生成される
    2. Issue Object に Audit Event が紐づく
    3. Approval が Issue にリンクして生成される
    4. (AI 関連 Risk Hint -- Sprint 2 BL-006 で対応するため Sprint 1 では out of scope)
    5. Audit Timeline で IssueCreated -> ApprovalDecided が同一 correlation_id で
       時系列に取り出せる

加えて、ADR / 5 原則由来の Guard も同じ実プロセスで踏み確認する:
    - Federation Native: Cross Tenant Approval は workflow-service が 400 で弾く
    - Auditability: Policy deny でも Approval の "迂回しようとした事実" は Audit に残る
      (ApprovalRequested + after_state.decision="rejected_by_policy")
"""

from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient

TENANT_A = "ten_tena_20260101_0001"
TENANT_B = "ten_tenb_20260101_0001"
ACTOR_A = "idn_tena_20260101_0001"
APPROVER_A = "idn_tena_20260101_0010"
APPROVER_B = "idn_tenb_20260101_0010"


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------


def _create_issue(
    object_client: TestClient,
    *,
    tenant_id: str = TENANT_A,
    owner_id: str = ACTOR_A,
    actor_id: str = ACTOR_A,
    title: str = "新規調達依頼",
    priority: str = "high",
    classification: str = "internal",
    data_destination: str = "internal",
) -> dict[str, Any]:
    res = object_client.post(
        "/issues",
        json={
            "tenant_id": tenant_id,
            "owner_id": owner_id,
            "title": title,
            "description": "Sprint 1 acceptance integration test",
            "priority": priority,
            "classification": classification,
            "actor_id": actor_id,
            "actor_type": "human",
            "data_destination": data_destination,
            "model_provider": "n/a",
            "risk_score": 0.0,
            "requested_action": "issue.create",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()


def _create_approval(
    workflow_client: TestClient,
    *,
    issue_id: str,
    tenant_id: str = TENANT_A,
    approver_id: str = APPROVER_A,
    decision: str = "approved",
    reason: str = "妥当性確認済み",
    data_destination: str = "internal",
) -> Any:
    """Approval POST. 戻り値は ``Response`` (status code を test 側で確認するため)."""

    return workflow_client.post(
        "/approvals",
        json={
            "tenant_id": tenant_id,
            "issue_id": issue_id,
            "approver_id": approver_id,
            "actor_type": "human",
            "decision": decision,
            "reason": reason,
            "data_destination": data_destination,
            "model_provider": "n/a",
            "risk_score": 0.0,
            "requested_action": "approval.decide",
        },
    )


# ----------------------------------------------------------------------------
# Acceptance 1 #1, #2 -- Issue 必須属性 + Audit 紐づけ
# ----------------------------------------------------------------------------


def test_issue_creation_with_required_fields(
    integration_clients: dict[str, TestClient],
) -> None:
    """Acceptance 1 #1: Tenant / Owner / Priority / Classification が保持される.
    Acceptance 1 #2: Issue が Audit Event を 1 件以上参照する.
    """

    issue = _create_issue(integration_clients["object"])

    # 必須 4 属性 (Acceptance 1 #1)
    assert issue["tenant_id"] == TENANT_A
    assert issue["owner_id"] == ACTOR_A
    assert issue["priority"] == "high"
    assert issue["classification"] == "internal"
    # Policy ALLOW (internal + 同 tenant + human) -> 初期 status=draft
    assert issue["status"] == "draft"

    # Audit linkage (Acceptance 1 #2)
    assert issue["policy_result_ref"] is not None
    assert len(issue["audit_event_refs"]) == 1
    assert issue["audit_event_refs"][0].startswith("aud_tena_")

    # Audit Service 側にも IssueCreated が積まれている
    res = integration_clients["audit"].get(
        f"/audit-events?correlation_id={issue['object_id']}"
    )
    assert res.status_code == 200
    events = res.json()
    assert len(events) == 1
    assert events[0]["event_type"] == "IssueCreated"
    assert events[0]["object_id"] == issue["object_id"]
    assert events[0]["after_state"]["classification"] == "internal"


# ----------------------------------------------------------------------------
# Acceptance 1 #3 -- Approval が Issue にリンクして生成される
# ----------------------------------------------------------------------------


def test_approval_links_to_issue(
    integration_clients: dict[str, TestClient],
) -> None:
    """Acceptance 1 #3: Approval Object が issue_id で Issue に紐づく."""

    issue = _create_issue(integration_clients["object"])
    res = _create_approval(integration_clients["workflow"], issue_id=issue["object_id"])
    assert res.status_code == 201, res.text
    approval = res.json()

    # ADR-005: Approval は独立 Object で decision/reason/policy_result_ref を保有する
    assert approval["object_type"] == "approval"
    assert approval["issue_id"] == issue["object_id"]
    assert approval["approver_id"] == APPROVER_A
    assert approval["decision"] == "approved"
    assert approval["reason"] == "妥当性確認済み"
    assert approval["policy_result_ref"] is not None
    assert len(approval["audit_event_refs"]) == 1

    # GET /approvals?issue_id=... で逆引きできる
    listed = integration_clients["workflow"].get(
        f"/approvals?issue_id={issue['object_id']}"
    )
    assert listed.status_code == 200
    body = listed.json()
    assert len(body) == 1
    assert body[0]["object_id"] == approval["object_id"]


# ----------------------------------------------------------------------------
# Acceptance 1 #5 -- Timeline (correlation_id = issue_id) 追跡
# ----------------------------------------------------------------------------


def test_audit_timeline_contains_issue_and_approval(
    integration_clients: dict[str, TestClient],
) -> None:
    """Acceptance 1 #5: Audit Timeline で IssueCreated -> ApprovalDecided が
    同一 correlation_id (= issue_id) で時系列に並ぶ.
    """

    issue = _create_issue(integration_clients["object"])
    approval_res = _create_approval(
        integration_clients["workflow"], issue_id=issue["object_id"]
    )
    assert approval_res.status_code == 201, approval_res.text
    approval = approval_res.json()

    res = integration_clients["audit"].get(
        f"/audit-events?correlation_id={issue['object_id']}"
    )
    assert res.status_code == 200
    timeline = res.json()
    assert len(timeline) == 2

    # 順序: IssueCreated -> ApprovalDecided (occurred_at 昇順 sort 済み)
    types = [e["event_type"] for e in timeline]
    assert types == ["IssueCreated", "ApprovalDecided"]

    issue_event, approval_event = timeline
    # 軸の確認: 両 Event とも correlation_id = issue_id
    assert issue_event["correlation_id"] == issue["object_id"]
    assert approval_event["correlation_id"] == issue["object_id"]
    # Issue Event は Issue 自身を、Approval Event は Approval Object を指す
    assert issue_event["object_id"] == issue["object_id"]
    assert approval_event["object_id"] == approval["object_id"]
    assert approval_event["after_state"]["decision"] == "approved"
    assert approval_event["policy_result"] == "allow"


# ----------------------------------------------------------------------------
# Federation Native -- Cross Tenant Approval を弾く
# ----------------------------------------------------------------------------


def test_cross_tenant_approval_rejected(
    integration_clients: dict[str, TestClient],
) -> None:
    """Federation Native 原則: Issue 所有 tenant と Approval 提出 tenant が
    一致しない場合、workflow-service は 400 で拒否する.

    通常の Object 更新で Cross Tenant 操作が通ると ADR-002 違反になるため、
    Federation Service を経由しない以上は弾かなければならない。
    """

    issue = _create_issue(integration_clients["object"], tenant_id=TENANT_A)
    res = _create_approval(
        integration_clients["workflow"],
        issue_id=issue["object_id"],
        tenant_id=TENANT_B,  # mismatch
        approver_id=APPROVER_B,
    )
    assert res.status_code == 400
    assert "tenant_id mismatch" in res.json()["detail"]

    # Approval は永続化されない
    listed = integration_clients["workflow"].get(
        f"/approvals?issue_id={issue['object_id']}"
    )
    assert listed.json() == []


# ----------------------------------------------------------------------------
# Auditability -- 承認迂回 (Policy deny) 時の Audit 残存
# ----------------------------------------------------------------------------


def test_policy_deny_blocks_approval_and_records_audit(
    integration_clients: dict[str, TestClient],
) -> None:
    """ADR-005 + Workflow Test "承認迂回の拒否":
        restricted Issue に対して external_ai_cloud 宛の Approval を出すと
        DLP-004 が発火 (final_decision=deny). Approval Object は作らないが、
        "迂回しようとした事実" は Audit に ApprovalRequested として残る.
    """

    # 1) restricted な Issue を作る (data_destination=internal なので DLP-004 は発火しない;
    #    APP-002 で approval_required になり status=submitted で生成される)
    issue = _create_issue(
        integration_clients["object"],
        classification="restricted",
        data_destination="internal",
    )
    assert issue["status"] == "submitted"
    assert issue["classification"] == "restricted"

    # 2) Approval 評価時に外部送信を要求 -> DLP-004 deny
    res = _create_approval(
        integration_clients["workflow"],
        issue_id=issue["object_id"],
        data_destination="external_ai_cloud",
    )
    assert res.status_code == 403
    detail = res.json()["detail"]
    assert detail["message"] == "approval blocked by policy"
    assert detail["policy_decision_id"] is not None

    # 3) Approval Object は永続化されていない
    listed = integration_clients["workflow"].get(
        f"/approvals?issue_id={issue['object_id']}"
    )
    assert listed.json() == []

    # 4) しかし Audit には "迂回しようとした事実" が残る
    timeline_res = integration_clients["audit"].get(
        f"/audit-events?correlation_id={issue['object_id']}"
    )
    timeline = timeline_res.json()
    types = [e["event_type"] for e in timeline]
    assert types == ["IssueCreated", "ApprovalRequested"]

    bypass_event = timeline[1]
    assert bypass_event["object_id"] == issue["object_id"]  # Issue 軸の Timeline に積む
    assert bypass_event["object_type"] == "issue"
    assert bypass_event["policy_result"] == "deny"
    assert bypass_event["after_state"]["decision"] == "rejected_by_policy"
    assert bypass_event["after_state"]["attempted_action"] == "approval.decide"
    assert bypass_event["after_state"]["issue_classification"] == "restricted"
