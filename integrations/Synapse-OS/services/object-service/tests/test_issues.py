"""Issue API contract / policy / audit tests (BL-002).

カバレッジ (BACKLOG_TEST_MAPPING.md "BL-002" 行に対応):
    - Contract:  POST /issues が IssueCreateRequest を受理し Issue schema で返す
    - Contract:  GET  /issues / GET /issues/{id} が一貫した結果を返す
    - Policy:    Policy が deny を返すと Issue.status = rejected
    - Policy:    Policy が approval_required を返すと Issue.status = submitted
    - Audit:     IssueCreated が必ず Audit に積まれ、Issue.audit_event_refs に id が入る
    - Audit:     deny path でも Audit 送出される (Auditability 原則)
    - Schema:    必須属性が欠ける / 余計な属性を含むと 422
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from object_app.clients.audit_client import StubAuditClient
from object_app.clients.policy_client import StubPolicyClient

TENANT_ID = "ten_tena_20260101_0001"
TENANT_B_ID = "ten_tenb_20260101_0001"
ACTOR_ID = "idn_tena_20260101_0001"
OWNER_ID = "idn_tena_20260101_0002"


def _payload(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "tenant_id": TENANT_ID,
        "owner_id": OWNER_ID,
        "title": "顧客チャットボット応答精度の改善",
        "description": "誤回答率が 12% を超えたためスケジューリングを見直したい",
        "priority": "high",
        "classification": "internal",
        "actor_id": ACTOR_ID,
        "actor_type": "human",
        "requested_action": "issue.create",
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


def test_create_issue_allow_path(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_1000",
            final_decision="allow",
            reasons=["allow by default"],
        )
    )
    res = client.post("/issues", json=_payload())
    assert res.status_code == 201, res.text
    body = res.json()

    assert body["object_id"].startswith("iss_tena_")
    assert body["object_type"] == "issue"
    assert body["status"] == "draft"
    assert body["priority"] == "high"
    assert body["classification"] == "internal"
    assert body["policy_result_ref"] == "pde_tena_20260502_1000"
    assert len(body["audit_event_refs"]) == 1

    # Policy へ正しい入力が組み立てられているか
    assert len(policy_stub.calls) == 1
    policy_in = policy_stub.calls[0]
    assert policy_in["actor_id"] == ACTOR_ID
    assert policy_in["tenant_id"] == TENANT_ID
    assert policy_in["object_type"] == "issue"
    assert policy_in["action"] == "issue.create"
    assert policy_in["is_state_change"] is True

    # Audit が IssueCreated として積まれているか
    assert len(audit_stub.events) == 1
    audit_evt = audit_stub.events[0]
    assert audit_evt["event_type"] == "IssueCreated"
    assert audit_evt["correlation_id"] == body["object_id"]
    assert audit_evt["object_id"] == body["object_id"]
    assert audit_evt["policy_decision_ref"] == "pde_tena_20260502_1000"
    assert audit_evt["policy_result"] == "allow"
    assert audit_evt["after_state"]["status"] == "draft"


def test_create_issue_deny_path_still_audits(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """deny でも Issue は永続化され、Audit は必ず記録される (Auditability 原則)."""

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_2000",
            final_decision="deny",
            reasons=["restricted classification cannot be created via this path"],
        )
    )
    res = client.post("/issues", json=_payload(classification="restricted"))
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "rejected"
    assert body["classification"] == "restricted"
    assert body["policy_result_ref"] == "pde_tena_20260502_2000"

    assert len(audit_stub.events) == 1
    assert audit_stub.events[0]["policy_result"] == "deny"
    assert audit_stub.events[0]["after_state"]["status"] == "rejected"


def test_create_issue_approval_required_marks_submitted(
    client: TestClient,
    policy_stub: StubPolicyClient,
) -> None:
    """approval_required は BL-003 の入口. ここでは status = submitted までを保証する."""

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_3000",
            final_decision="approval_required",
            reasons=["critical priority requires approval"],
        )
    )
    res = client.post("/issues", json=_payload(priority="critical"))
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "submitted"
    assert body["priority"] == "critical"


@pytest.mark.parametrize(
    "missing_field", ["tenant_id", "owner_id", "title", "priority", "actor_id"]
)
def test_create_issue_missing_required_field(
    client: TestClient, missing_field: str
) -> None:
    payload = _payload()
    del payload[missing_field]
    res = client.post("/issues", json=payload)
    assert res.status_code == 422


def test_create_issue_extra_field_rejected(client: TestClient) -> None:
    """extra='forbid' のため未知フィールドは即拒否."""

    res = client.post("/issues", json=_payload(extra_field="not allowed"))
    assert res.status_code == 422


def test_create_issue_invalid_priority(client: TestClient) -> None:
    res = client.post("/issues", json=_payload(priority="urgent"))
    assert res.status_code == 422


def test_get_issue_roundtrip(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    policy_stub.scripted.append(
        _scripted_decision(decision_id="pde_tena_20260502_4000", final_decision="allow")
    )
    create_res = client.post("/issues", json=_payload())
    issue_id = create_res.json()["object_id"]

    get_res = client.get(f"/issues/{issue_id}")
    assert get_res.status_code == 200
    assert get_res.json()["object_id"] == issue_id
    assert get_res.json()["title"] == "顧客チャットボット応答精度の改善"


def test_get_issue_not_found(client: TestClient) -> None:
    res = client.get("/issues/iss_tena_20260502_9999")
    assert res.status_code == 404


def test_list_issues_filters_by_tenant(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    for i in range(3):
        policy_stub.scripted.append(
            _scripted_decision(
                decision_id=f"pde_tena_20260502_{5000 + i:04d}", final_decision="allow"
            )
        )
    client.post("/issues", json=_payload(title="Issue A"))
    client.post("/issues", json=_payload(title="Issue B"))
    other = _payload(title="TenantB Issue")
    other["tenant_id"] = TENANT_B_ID
    other["actor_id"] = "idn_tenb_20260101_0001"
    other["owner_id"] = "idn_tenb_20260101_0002"
    client.post("/issues", json=other)

    tena_res = client.get(f"/issues?tenant_id={TENANT_ID}")
    assert tena_res.status_code == 200
    assert len(tena_res.json()) == 2

    tenb_res = client.get(f"/issues?tenant_id={TENANT_B_ID}")
    assert len(tenb_res.json()) == 1
    assert tenb_res.json()[0]["title"] == "TenantB Issue"

    all_res = client.get("/issues")
    assert len(all_res.json()) == 3


def test_healthz(client: TestClient) -> None:
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "object-service", "sprint": "1"}


# ---------------------------------------------------------------------------
# Sprint 3: Governed Action — GET (Audit), PATCH (Policy + Audit), DELETE (Policy + Audit)
# ---------------------------------------------------------------------------


def _create_issue(
    client: TestClient,
    policy_stub: StubPolicyClient,
    *,
    decision_id: str = "pde_tena_20260502_6000",
) -> dict[str, Any]:
    """Helper: Issue を作成して body を返す."""
    policy_stub.scripted.append(
        _scripted_decision(decision_id=decision_id, final_decision="allow")
    )
    res = client.post("/issues", json=_payload())
    assert res.status_code == 201, res.text
    return res.json()


def test_get_issue_audit_recorded(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """GET /issues/{id} は Audit Event (IssueRead) を記録する."""

    body = _create_issue(client, policy_stub, decision_id="pde_tena_20260502_6001")
    issue_id = body["object_id"]
    initial_audit_count = len(audit_stub.events)

    get_res = client.get(
        f"/issues/{issue_id}?actor_id={ACTOR_ID}&actor_type=human&record_audit=true"
    )
    assert get_res.status_code == 200

    # IssueRead が追加で積まれているか
    assert len(audit_stub.events) == initial_audit_count + 1
    read_evt = audit_stub.events[-1]
    assert read_evt["event_type"] == "IssueRead"
    assert read_evt["action"] == "issue.read"
    assert read_evt["object_id"] == issue_id
    assert read_evt["actor_id"] == ACTOR_ID

    # audit_event_refs にも追記されているか
    updated_body = get_res.json()
    assert len(updated_body["audit_event_refs"]) >= 2


def test_update_issue_audit_recorded(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """PATCH /issues/{id} は Policy チェック + Audit (IssueUpdated) を記録する."""

    body = _create_issue(client, policy_stub, decision_id="pde_tena_20260502_7001")
    issue_id = body["object_id"]

    # PATCH 用の Policy decision を追加
    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_7002",
            final_decision="allow",
        )
    )

    patch_res = client.patch(
        f"/issues/{issue_id}",
        json={
            "title": "更新後タイトル",
            "priority": "low",
            "actor_id": ACTOR_ID,
            "actor_type": "human",
        },
    )
    assert patch_res.status_code == 200, patch_res.text
    updated = patch_res.json()

    # フィールドが更新されているか
    assert updated["title"] == "更新後タイトル"
    assert updated["priority"] == "low"

    # Audit が IssueUpdated として積まれているか
    update_events = [e for e in audit_stub.events if e["event_type"] == "IssueUpdated"]
    assert len(update_events) >= 1
    update_evt = update_events[-1]
    assert update_evt["action"] == "issue.update"
    assert update_evt["object_id"] == issue_id
    assert update_evt["actor_id"] == ACTOR_ID
    assert update_evt["policy_decision_ref"] == "pde_tena_20260502_7002"

    # before_state / after_state が記録されているか
    assert update_evt["before_state"]["title"] == "顧客チャットボット応答精度の改善"
    assert update_evt["after_state"]["title"] == "更新後タイトル"
    assert update_evt["after_state"]["priority"] == "low"

    # audit_event_refs に追記されているか
    assert len(updated["audit_event_refs"]) >= 2


def test_update_issue_denied_by_policy(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """PATCH が Policy deny を返すと 403 になり、Issue は変更されない."""

    body = _create_issue(client, policy_stub, decision_id="pde_tena_20260502_8001")
    issue_id = body["object_id"]

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_8002",
            final_decision="deny",
            reasons=["patch not allowed"],
        )
    )

    patch_res = client.patch(
        f"/issues/{issue_id}",
        json={"title": "拒否されるはず", "actor_id": ACTOR_ID},
    )
    assert patch_res.status_code == 403

    # 元の Issue が変わっていないことを確認
    get_res = client.get(f"/issues/{issue_id}")
    assert get_res.json()["title"] == "顧客チャットボット応答精度の改善"


def test_delete_issue_governed_action(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """DELETE /issues/{id} は 204 を返し、その後 GET が 404 になる."""

    body = _create_issue(client, policy_stub, decision_id="pde_tena_20260502_9001")
    issue_id = body["object_id"]

    # DELETE 用 Policy decision
    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_9002",
            final_decision="allow",
        )
    )

    delete_res = client.delete(
        f"/issues/{issue_id}?actor_id={ACTOR_ID}&actor_type=human"
    )
    assert delete_res.status_code == 204, delete_res.text

    # 削除後は 404
    get_res = client.get(f"/issues/{issue_id}")
    assert get_res.status_code == 404

    # Audit が IssueDeleted として積まれているか
    delete_events = [e for e in audit_stub.events if e["event_type"] == "IssueDeleted"]
    assert len(delete_events) == 1
    delete_evt = delete_events[0]
    assert delete_evt["action"] == "issue.delete"
    assert delete_evt["object_id"] == issue_id
    assert delete_evt["actor_id"] == ACTOR_ID
    assert delete_evt["policy_decision_ref"] == "pde_tena_20260502_9002"
    assert delete_evt["before_state"]["title"] == "顧客チャットボット応答精度の改善"


def test_delete_issue_denied_by_policy(
    client: TestClient,
    policy_stub: StubPolicyClient,
) -> None:
    """DELETE が Policy deny を返すと 403 になり、Issue は残る."""

    body = _create_issue(client, policy_stub, decision_id="pde_tena_20260502_9003")
    issue_id = body["object_id"]

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_9004",
            final_decision="deny",
        )
    )

    delete_res = client.delete(
        f"/issues/{issue_id}?actor_id={ACTOR_ID}&actor_type=human"
    )
    assert delete_res.status_code == 403

    # Issue は残っている
    get_res = client.get(f"/issues/{issue_id}")
    assert get_res.status_code == 200


def test_update_issue_not_found(client: TestClient) -> None:
    """存在しない issue_id で PATCH すると 404."""
    res = client.patch(
        "/issues/iss_tena_99999999_9999",
        json={"title": "新タイトル", "actor_id": ACTOR_ID},
    )
    assert res.status_code == 404


def test_delete_issue_not_found(client: TestClient) -> None:
    """存在しない issue_id で DELETE すると 404."""
    res = client.delete(
        f"/issues/iss_tena_99999999_9999?actor_id={ACTOR_ID}"
    )
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# Sprint 4: Governed Action — Audit / Policy deny 詳細テスト
# ---------------------------------------------------------------------------


def test_get_issue_without_record_audit_does_not_add_audit(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """GET /issues/{id} は record_audit=false（デフォルト）の場合 Audit を追加しない.

    IssueCreated の 1 件のみが記録されること。
    """
    body = _create_issue(client, policy_stub, decision_id="pde_tena_20260502_a001")
    issue_id = body["object_id"]
    count_after_create = len(audit_stub.events)

    # record_audit を指定しない（デフォルト false）
    get_res = client.get(f"/issues/{issue_id}?actor_id={ACTOR_ID}&actor_type=human")
    assert get_res.status_code == 200

    # Audit イベント数が増えていないこと
    assert len(audit_stub.events) == count_after_create


def test_get_issue_with_record_audit_false_does_not_add_audit(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """GET /issues/{id}?record_audit=false は明示的に false を指定しても Audit を追加しない."""
    body = _create_issue(client, policy_stub, decision_id="pde_tena_20260502_a002")
    issue_id = body["object_id"]
    count_after_create = len(audit_stub.events)

    get_res = client.get(
        f"/issues/{issue_id}?actor_id={ACTOR_ID}&actor_type=human&record_audit=false"
    )
    assert get_res.status_code == 200
    assert len(audit_stub.events) == count_after_create


def test_patch_issue_policy_deny_returns_403_and_audit_not_recorded(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """PATCH /issues/{id} が Policy deny の場合:
    - 403 を返すこと
    - Audit には IssueUpdated が記録されないこと（fail-closed の Audit-after-allow 原則）
    - Issue の内容が変更されないこと
    """
    body = _create_issue(client, policy_stub, decision_id="pde_tena_20260502_b001")
    issue_id = body["object_id"]
    count_after_create = len(audit_stub.events)

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_b002",
            final_decision="deny",
            reasons=["patch not allowed by policy"],
        )
    )

    patch_res = client.patch(
        f"/issues/{issue_id}",
        json={"title": "deny で変更されないはず", "actor_id": ACTOR_ID, "actor_type": "human"},
    )
    assert patch_res.status_code == 403

    # IssueUpdated は記録されていないこと
    updated_events = [e for e in audit_stub.events if e["event_type"] == "IssueUpdated"]
    assert len(updated_events) == 0

    # Audit イベント総数も増えていないこと（deny path は audit-first がない）
    assert len(audit_stub.events) == count_after_create

    # Issue の内容が変更されていないことを確認
    get_res = client.get(f"/issues/{issue_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "顧客チャットボット応答精度の改善"


def test_patch_issue_policy_deny_with_different_decisions(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """PATCH が approval_required など deny 以外の非 allow 決定でも 403 を返す.

    fail-closed 原則: "allow" 以外は全て拒否される。
    """
    body = _create_issue(client, policy_stub, decision_id="pde_tena_20260502_c001")
    issue_id = body["object_id"]

    for final_decision in ["approval_required", "deny", "quarantine"]:
        policy_stub.scripted.append(
            _scripted_decision(
                decision_id=f"pde_tena_20260502_c{final_decision[:4]}",
                final_decision=final_decision,
            )
        )
        patch_res = client.patch(
            f"/issues/{issue_id}",
            json={
                "title": f"{final_decision} パス",
                "actor_id": ACTOR_ID,
                "actor_type": "human",
            },
        )
        assert patch_res.status_code == 403, (
            f"Expected 403 for decision={final_decision}, got {patch_res.status_code}"
        )
