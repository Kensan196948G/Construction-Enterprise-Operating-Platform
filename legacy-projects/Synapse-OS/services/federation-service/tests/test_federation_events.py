"""Federation Event tests (BL-008 / Sprint 2).

BACKLOG_TEST_MAPPING.md の BL-008 row を満たす test カテゴリ:

    Contract        : POST /federation-events / GET /federation-events / GET /{id}
    Policy          : allow / deny / federation_review_required の各 path
    Workflow        : status 遷移 (APPROVED / REVIEW_REQUIRED / BLOCKED)
    Audit           : Shared Audit (source + target に同一 correlation_id) / SOURCE_ONLY 縮退
    Federation      : Trust Level 表示, source/target Tenant 区別, classification 範囲
    Non Goals Guard : Audit Event / Policy Decision を共有対象にできない / source==target 拒否
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from federation_app.clients.audit_client import StubAuditClient
from federation_app.clients.policy_client import StubPolicyClient


def _payload(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "source_tenant": "ten_tena_20260101_0001",
        "target_tenant": "ten_tenb_20260101_0001",
        "owner_id": "idn_tena_20260101_0001",
        "actor_id": "idn_tena_20260101_0001",
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
    decision_id: str = "pde_tena_20260502_0001",
    final_decision: str = "allow",
    reasons: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "policy_decision_id": decision_id,
        "decided_at": "2026-05-02T00:00:00+00:00",
        "final_decision": final_decision,
        "requires_audit": True,
        "reasons": reasons or [f"stub {final_decision}"],
        "applied_rules": [],
        "input_snapshot": {},
    }


# ---------- Contract ----------


def test_create_federation_event_contract_minimum_fields(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """BL-008 Contract: POST 入力で必要最小 set だけで Federation Event が成立する."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    res = client.post("/federation-events", json=_payload())
    assert res.status_code == 201
    body = res.json()
    assert body["object_type"] == "federation_event"
    assert body["object_id"].startswith("fed_tena_")
    assert body["source_tenant"] == "ten_tena_20260101_0001"
    assert body["target_tenant"] == "ten_tenb_20260101_0001"
    assert body["shared_object_type"] == "document"
    assert body["status"] == "approved"


def test_create_federation_event_extra_field_rejected(client: TestClient) -> None:
    """Contract: extra='forbid'. 未知 field は 422."""

    res = client.post("/federation-events", json=_payload(extra_field="bogus"))
    assert res.status_code == 422


def test_get_federation_event_round_trip(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """Contract: POST -> GET /{id} で同じ Object が返る."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    create_res = client.post("/federation-events", json=_payload())
    event_id = create_res.json()["object_id"]

    get_res = client.get(f"/federation-events/{event_id}")
    assert get_res.status_code == 200
    assert get_res.json()["object_id"] == event_id


def test_get_federation_event_not_found(client: TestClient) -> None:
    res = client.get("/federation-events/fed_tena_20260502_9999")
    assert res.status_code == 404


# ---------- Policy / Workflow (status 遷移) ----------


def test_allow_path_becomes_approved(
    client: TestClient, policy_stub: StubPolicyClient, audit_stub: StubAuditClient
) -> None:
    """Policy allow -> status=APPROVED, audit_boundary=SHARED."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    res = client.post("/federation-events", json=_payload())
    body = res.json()
    assert body["status"] == "approved"
    assert body["audit_boundary"] == "shared"
    # SHARED -> source + target で 2 件 audit 追記される
    assert len(audit_stub.events) == 2


def test_deny_path_becomes_blocked_with_source_only_audit(
    client: TestClient, policy_stub: StubPolicyClient, audit_stub: StubAuditClient
) -> None:
    """Policy deny -> status=BLOCKED, audit_boundary=SOURCE_ONLY (target には記録しない)."""

    policy_stub.scripted.append(
        _scripted_decision(
            final_decision="deny",
            reasons=["Trust L1 internal cannot federate cross-tenant"],
        )
    )
    res = client.post(
        "/federation-events",
        json=_payload(trust_level="l1_internal", classification="restricted"),
    )
    body = res.json()
    assert body["status"] == "blocked"
    assert body["audit_boundary"] == "source_only"
    # SOURCE_ONLY -> source 側 1 件だけ
    assert len(audit_stub.events) == 1
    assert audit_stub.events[0]["tenant_id"] == "ten_tena_20260101_0001"
    assert audit_stub.events[0]["event_type"] == "FederationBlocked"


def test_federation_review_required_keeps_review_state(
    client: TestClient, policy_stub: StubPolicyClient, audit_stub: StubAuditClient
) -> None:
    """federation_review_required -> status=REVIEW_REQUIRED, SHARED で双方監査."""

    policy_stub.scripted.append(
        _scripted_decision(
            final_decision="federation_review_required",
            reasons=["Confidential payload requires both-side approval"],
        )
    )
    res = client.post(
        "/federation-events",
        json=_payload(classification="confidential", trust_level="l3_joint"),
    )
    body = res.json()
    assert body["status"] == "review_required"
    assert body["audit_boundary"] == "shared"
    assert len(audit_stub.events) == 2
    assert audit_stub.events[0]["event_type"] == "FederationReviewRequired"


# ---------- Audit (Shared correlation) ----------


def test_shared_audit_uses_same_correlation_id_on_both_sides(
    client: TestClient, policy_stub: StubPolicyClient, audit_stub: StubAuditClient
) -> None:
    """Acceptance 4 #5: source / target audit で同一 correlation_id が使われる."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    res = client.post("/federation-events", json=_payload())
    event_id = res.json()["object_id"]

    assert len(audit_stub.events) == 2
    source_event = audit_stub.events[0]
    target_event = audit_stub.events[1]
    assert source_event["correlation_id"] == event_id
    assert target_event["correlation_id"] == event_id
    assert source_event["tenant_id"] == "ten_tena_20260101_0001"
    assert target_event["tenant_id"] == "ten_tenb_20260101_0001"


def test_audit_after_state_carries_trust_and_shared_object(
    client: TestClient, policy_stub: StubPolicyClient, audit_stub: StubAuditClient
) -> None:
    """Audit: after_state に trust_level / shared_object_* / target_tenant が含まれる."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    client.post("/federation-events", json=_payload())
    after = audit_stub.events[0]["after_state"]
    assert after["trust_level"] == "l3_joint"
    assert after["shared_object_id"] == "doc_tena_20260502_0001"
    assert after["shared_object_type"] == "document"
    assert after["target_tenant"] == "ten_tenb_20260101_0001"


def test_audit_event_refs_recorded_on_event(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """Acceptance 3 + 4: 生成された Audit Event ID が Federation Event に記録される."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    res = client.post("/federation-events", json=_payload())
    body = res.json()
    # SHARED -> source + target の 2 件
    assert len(body["audit_event_refs"]) == 2


# ---------- Federation (Tenant 区別 / Trust 表示) ----------


def test_list_filters_by_source_tenant(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """Acceptance 4 #1: source_tenant でフィルタできる."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    client.post("/federation-events", json=_payload())
    client.post(
        "/federation-events",
        json=_payload(
            source_tenant="ten_tenc_20260101_0001",
            target_tenant="ten_tenb_20260101_0001",
            owner_id="idn_tenc_20260101_0001",
            actor_id="idn_tenc_20260101_0001",
        ),
    )

    res = client.get("/federation-events", params={"tenant_id": "ten_tena_20260101_0001"})
    body = res.json()
    assert len(body) == 1
    assert body[0]["source_tenant"] == "ten_tena_20260101_0001"


def test_list_filters_by_target_tenant_with_as_target_flag(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """Acceptance 4 #1: target_tenant 側からの受信 view が引ける."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    client.post("/federation-events", json=_payload())  # tenA -> tenB
    client.post(
        "/federation-events",
        json=_payload(
            source_tenant="ten_tenc_20260101_0001",
            target_tenant="ten_tenb_20260101_0001",
            owner_id="idn_tenc_20260101_0001",
            actor_id="idn_tenc_20260101_0001",
        ),
    )  # tenC -> tenB

    res = client.get(
        "/federation-events",
        params={"tenant_id": "ten_tenb_20260101_0001", "as_target": True},
    )
    body = res.json()
    assert len(body) == 2
    assert {e["source_tenant"] for e in body} == {
        "ten_tena_20260101_0001",
        "ten_tenc_20260101_0001",
    }
    assert all(e["target_tenant"] == "ten_tenb_20260101_0001" for e in body)


def test_trust_level_visible_on_response(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """Acceptance 4 #3: Trust Level が response に表示される."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    res = client.post("/federation-events", json=_payload(trust_level="l4_partner"))
    assert res.json()["trust_level"] == "l4_partner"


def test_policy_input_passes_target_tenant_and_trust(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """Federation 評価のため target_tenant と trust_level が Policy 入力に渡る."""

    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    client.post("/federation-events", json=_payload(trust_level="l3_joint"))
    sent = policy_stub.calls[0]
    assert sent["object_type"] == "federation_event"
    assert sent["target_tenant"] == "ten_tenb_20260101_0001"
    assert sent["trust_level"] == "l3_joint"
    assert sent["data_destination"] == "tenant:ten_tenb_20260101_0001"


# ---------- Non Goals Guard (ADR-002 violation 検知) ----------


def test_same_source_and_target_rejected(client: TestClient) -> None:
    """Non Goals: ADR-002. Federation Event は cross-tenant 専用で同一 Tenant は拒否."""

    res = client.post(
        "/federation-events",
        json=_payload(target_tenant="ten_tena_20260101_0001"),
    )
    assert res.status_code == 422


def test_audit_event_cannot_be_shared_object(client: TestClient) -> None:
    """Non Goals: Audit Event は通常 Federation 経由では共有不可 (Audit Federation は Sprint 3+)."""

    res = client.post(
        "/federation-events",
        json=_payload(shared_object_type="audit_event", shared_object_id="aud_tena_20260502_0001"),
    )
    assert res.status_code == 422


def test_policy_decision_cannot_be_shared_object(client: TestClient) -> None:
    """Non Goals: Policy Decision はテナント内部判断なので共有不可."""

    res = client.post(
        "/federation-events",
        json=_payload(
            shared_object_type="policy_decision",
            shared_object_id="pde_tena_20260502_0001",
        ),
    )
    assert res.status_code == 422


def test_federation_event_cannot_be_shared_object(client: TestClient) -> None:
    """Non Goals: Federation Event の入れ子 (federation of federations) を禁止."""

    res = client.post(
        "/federation-events",
        json=_payload(
            shared_object_type="federation_event",
            shared_object_id="fed_tena_20260502_0001",
        ),
    )
    assert res.status_code == 422


@pytest.mark.parametrize(
    "decision",
    ["allow", "deny", "federation_review_required"],
)
def test_event_persisted_for_all_outcomes(
    client: TestClient, policy_stub: StubPolicyClient, decision: str
) -> None:
    """Auditability: blocked / review でも Federation Event Object は永続化される (試行事実を消さない)."""

    policy_stub.scripted.append(_scripted_decision(final_decision=decision))
    res = client.post("/federation-events", json=_payload())
    event_id = res.json()["object_id"]

    listing = client.get(
        "/federation-events", params={"tenant_id": "ten_tena_20260101_0001"}
    ).json()
    assert any(e["object_id"] == event_id for e in listing)
