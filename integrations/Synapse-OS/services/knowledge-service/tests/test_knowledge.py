"""Knowledge Item tests (BL-011 / Sprint 2).

BACKLOG_TEST_MAPPING.md BL-011 行を満たす test カテゴリ:

    Contract        : POST /knowledge-items / GET /{id} / GET (filter) / extra=forbid
    Policy          : DLP 最終判断は Policy Service へ delegate (calls 観測 + quarantine 反映)
    AI Governance   : AI_GENERATED knowledge は ai_action_id 付き lineage edge を必須とする
    Federation      : FEDERATION_IMPORTED は federation_event_id 必須 + 片側削除禁止
    Audit           : KnowledgeIngested / LegalHoldApplied / KnowledgeDeleted を correlation_id=knowledge_id で発行
    Acceptance      : Document -> Knowledge -> AI Action 由来の Knowledge を Lineage で辿れる
    Non Goals Guard : Audit/Policy を lineage source にできない / Retention/Legal Hold ゲートが効く
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import pytest
from fastapi.testclient import TestClient

from knowledge_app.clients.audit_client import StubAuditClient
from knowledge_app.clients.policy_client import StubPolicyClient


# ---------- helpers ----------


def _payload(**overrides: Any) -> dict[str, Any]:
    """HUMAN_AUTHORED knowledge 作成 payload の baseline."""

    base: dict[str, Any] = {
        "tenant_id": "ten_tena_20260101_0001",
        "owner_id": "idn_tena_20260101_0001",
        "actor_id": "idn_tena_20260101_0001",
        "actor_type": "human",
        "title": "Quarterly Risk Memo",
        "summary": "Sprint 2 BL-011 baseline knowledge for tests.",
        "classification": "internal",
        "transformation_type": "human_authored",
        "lineage_edges": [],
        "retention_class": "document",
        "retain_until": None,
        "federation_event_id": None,
        "requested_action": "knowledge.ingest",
    }
    base.update(overrides)
    return base


def _ai_lineage_edge(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "source_object_id": "aia_tena_20260502_0001",
        "source_object_type": "ai_action",
        "source_tenant": "ten_tena_20260101_0001",
        "transformation_type": "ai_generated",
        "actor_id": "idn_tena_20260101_0001",
        "ai_action_id": "aia_tena_20260502_0001",
        "workflow_id": None,
        "policy_decision_ref": "pde_tena_20260502_0001",
        "audit_event_ref": "aud_tena_20260502_0001",
    }
    base.update(overrides)
    return base


def _document_lineage_edge(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "source_object_id": "doc_tena_20260502_0001",
        "source_object_type": "document",
        "source_tenant": "ten_tena_20260101_0001",
        "transformation_type": "document_ingested",
        "actor_id": "idn_tena_20260101_0001",
        "ai_action_id": None,
        "workflow_id": None,
        "policy_decision_ref": None,
        "audit_event_ref": None,
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


def test_create_knowledge_item_contract_minimum_fields(client: TestClient) -> None:
    """Contract: HUMAN_AUTHORED は lineage edge ゼロでも 201 で成立する."""

    res = client.post("/knowledge-items", json=_payload())
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["object_type"] == "knowledge_item"
    assert body["object_id"].startswith("kno_tena_")
    assert body["transformation_type"] == "human_authored"
    assert body["status"] == "active"
    assert body["legal_hold"] is False


def test_create_knowledge_item_extra_field_rejected(client: TestClient) -> None:
    """Contract: extra='forbid' で未知 field は 422."""

    res = client.post("/knowledge-items", json=_payload(unexpected="bogus"))
    assert res.status_code == 422


def test_get_knowledge_item_round_trip(client: TestClient) -> None:
    """Contract: POST -> GET /{id} で同じ Object を取得できる."""

    created = client.post("/knowledge-items", json=_payload()).json()
    res = client.get(f"/knowledge-items/{created['object_id']}")
    assert res.status_code == 200
    assert res.json()["object_id"] == created["object_id"]


def test_get_knowledge_item_not_found(client: TestClient) -> None:
    res = client.get("/knowledge-items/kno_tena_20260502_9999")
    assert res.status_code == 404


def test_list_filters_by_tenant_and_retention_class(client: TestClient) -> None:
    """Contract: list は tenant_id + retention_class で絞れる."""

    client.post("/knowledge-items", json=_payload())
    client.post(
        "/knowledge-items",
        json=_payload(
            tenant_id="ten_tenb_20260101_0001",
            owner_id="idn_tenb_20260101_0001",
            actor_id="idn_tenb_20260101_0001",
            retention_class="incident_change",
        ),
    )

    res_a = client.get(
        "/knowledge-items",
        params={"tenant_id": "ten_tena_20260101_0001"},
    )
    assert {k["tenant_id"] for k in res_a.json()} == {"ten_tena_20260101_0001"}

    res_inc = client.get(
        "/knowledge-items",
        params={"retention_class": "incident_change"},
    )
    assert all(k["retention_class"] == "incident_change" for k in res_inc.json())
    assert len(res_inc.json()) == 1


# ---------- AI Governance (DATA_LINEAGE_MODEL.md) ----------


def test_ai_generated_without_ai_action_id_is_rejected(client: TestClient) -> None:
    """AI Governance: AI_GENERATED で ai_action_id を持たない lineage は 422."""

    res = client.post(
        "/knowledge-items",
        json=_payload(
            transformation_type="ai_generated",
            lineage_edges=[
                _document_lineage_edge(transformation_type="ai_generated"),
            ],
        ),
    )
    assert res.status_code == 422


def test_ai_generated_with_ai_action_id_is_accepted(client: TestClient) -> None:
    """AI Governance: ai_action_id 付き lineage を 1 件持てば AI_GENERATED は通る."""

    res = client.post(
        "/knowledge-items",
        json=_payload(
            transformation_type="ai_generated",
            lineage_edges=[_ai_lineage_edge()],
        ),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["transformation_type"] == "ai_generated"
    assert body["lineage_edges"][0]["ai_action_id"] == "aia_tena_20260502_0001"


def test_ai_generated_with_empty_lineage_is_rejected(client: TestClient) -> None:
    """AI Governance: AI 由来 Knowledge は出典 0 件では成立しない."""

    res = client.post(
        "/knowledge-items",
        json=_payload(transformation_type="ai_generated", lineage_edges=[]),
    )
    assert res.status_code == 422


# ---------- Federation (FEDERATION_MODEL.md) ----------


def test_federation_imported_requires_federation_event_id(client: TestClient) -> None:
    """Federation: federation_event_id 無しで FEDERATION_IMPORTED は 422."""

    res = client.post(
        "/knowledge-items",
        json=_payload(
            transformation_type="federation_imported",
            lineage_edges=[
                _document_lineage_edge(
                    source_tenant="ten_tenb_20260101_0001",
                    transformation_type="federation_imported",
                ),
            ],
            federation_event_id=None,
        ),
    )
    assert res.status_code == 422


def test_federation_imported_with_event_id_is_accepted(client: TestClient) -> None:
    res = client.post(
        "/knowledge-items",
        json=_payload(
            transformation_type="federation_imported",
            lineage_edges=[
                _document_lineage_edge(
                    source_tenant="ten_tenb_20260101_0001",
                    transformation_type="federation_imported",
                ),
            ],
            federation_event_id="fed_tena_20260502_0001",
        ),
    )
    assert res.status_code == 201
    assert res.json()["federation_event_id"] == "fed_tena_20260502_0001"


def test_cross_tenant_lineage_edge_is_accepted_when_via_federation(
    client: TestClient,
) -> None:
    """Federation: source_tenant != tenant_id を Federation Event 経由で許容する."""

    body = client.post(
        "/knowledge-items",
        json=_payload(
            transformation_type="federation_imported",
            lineage_edges=[
                _document_lineage_edge(
                    source_object_id="doc_tenb_20260502_0001",
                    source_tenant="ten_tenb_20260101_0001",
                    transformation_type="federation_imported",
                ),
            ],
            federation_event_id="fed_tena_20260502_0001",
        ),
    ).json()
    assert body["lineage_edges"][0]["source_tenant"] == "ten_tenb_20260101_0001"


# ---------- Lineage source guard (Non Goals Guard) ----------


@pytest.mark.parametrize("forbidden", ["audit_event", "policy_decision"])
def test_audit_or_policy_cannot_be_lineage_source(
    client: TestClient, forbidden: str
) -> None:
    """Non Goals Guard: AUDIT_EVENT / POLICY_DECISION を Knowledge の派生元にしない."""

    res = client.post(
        "/knowledge-items",
        json=_payload(
            lineage_edges=[
                _document_lineage_edge(
                    source_object_id=f"{forbidden[:3]}_tena_20260502_0001",
                    source_object_type=forbidden,
                ),
            ],
        ),
    )
    assert res.status_code == 422


# ---------- Policy delegation ----------


def test_policy_input_carries_classification_and_transformation(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """Policy delegation: classification + transformation_type を Policy 入力に渡す.

    knowledge-service は DLP 最終判断を持たないので、
    Policy Service が確実に判定材料を受け取れることだけを確認する。
    """

    client.post("/knowledge-items", json=_payload(classification="confidential"))
    sent = policy_stub.calls[0]
    assert sent["object_type"] == "knowledge_item"
    assert sent["classification"] == "confidential"
    assert sent["transformation_type"] == "human_authored"
    assert sent["data_destination"] == "knowledge_store"


def test_policy_quarantine_downgrades_status(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """Policy delegation: quarantine 判定で Knowledge.status=QUARANTINED に格下げされる."""

    policy_stub.scripted.append(
        _scripted_decision(
            final_decision="quarantine",
            reasons=["confidential + external recipient"],
        )
    )
    res = client.post(
        "/knowledge-items", json=_payload(classification="confidential")
    )
    body = res.json()
    assert body["status"] == "quarantined"
    # quarantine -> trust_score 低下
    assert body["trust_score"] < 0.5


def test_policy_allow_keeps_status_active(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    policy_stub.scripted.append(_scripted_decision(final_decision="allow"))
    res = client.post("/knowledge-items", json=_payload())
    assert res.json()["status"] == "active"


# ---------- Audit (ADR-003) ----------


def test_knowledge_ingested_audit_uses_knowledge_id_correlation(
    client: TestClient, audit_stub: StubAuditClient
) -> None:
    """Audit: KnowledgeIngested の correlation_id = knowledge_id."""

    body = client.post("/knowledge-items", json=_payload()).json()
    assert len(audit_stub.events) == 1
    ev = audit_stub.events[0]
    assert ev["event_type"] == "KnowledgeIngested"
    assert ev["correlation_id"] == body["object_id"]
    assert ev["object_id"] == body["object_id"]
    assert ev["object_type"] == "knowledge_item"


def test_audit_event_id_recorded_on_knowledge(
    client: TestClient, audit_stub: StubAuditClient
) -> None:
    """Audit: 生成された Audit Event ID が Knowledge.audit_event_refs に積まれる."""

    body = client.post("/knowledge-items", json=_payload()).json()
    assert len(body["audit_event_refs"]) == 1
    assert body["audit_event_refs"][0] == audit_stub.events[0]["audit_event_id"]


def test_legal_hold_emits_audit_event(
    client: TestClient, audit_stub: StubAuditClient
) -> None:
    """Audit: LegalHoldApplied が audit-service に追記される."""

    created = client.post("/knowledge-items", json=_payload()).json()
    res = client.post(
        f"/knowledge-items/{created['object_id']}/legal-hold",
        json={
            "actor_id": "idn_tena_20260101_0001",
            "actor_type": "human",
            "reason": "litigation hold T-2026-0501",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["legal_hold"] is True
    legal_hold_events = [
        e for e in audit_stub.events if e["event_type"] == "LegalHoldApplied"
    ]
    assert len(legal_hold_events) == 1
    assert legal_hold_events[0]["correlation_id"] == created["object_id"]
    assert legal_hold_events[0]["after_state"]["legal_hold_reason"] == (
        "litigation hold T-2026-0501"
    )


def test_delete_emits_knowledge_deleted_audit(
    client: TestClient, audit_stub: StubAuditClient
) -> None:
    """Audit: KnowledgeDeleted が correlation_id=knowledge_id で発行される."""

    created = client.post("/knowledge-items", json=_payload()).json()
    res = client.delete(
        f"/knowledge-items/{created['object_id']}",
        params={"actor_id": "idn_tena_20260101_0001", "actor_type": "human"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"
    deleted_events = [
        e for e in audit_stub.events if e["event_type"] == "KnowledgeDeleted"
    ]
    assert len(deleted_events) == 1
    assert deleted_events[0]["correlation_id"] == created["object_id"]


# ---------- Retention guard (RETENTION_MODEL.md) ----------


def test_legal_hold_blocks_delete(client: TestClient) -> None:
    """Non Goals Guard: legal_hold=True の Knowledge は DELETE で 409."""

    created = client.post("/knowledge-items", json=_payload()).json()
    client.post(
        f"/knowledge-items/{created['object_id']}/legal-hold",
        json={
            "actor_id": "idn_tena_20260101_0001",
            "reason": "audit investigation",
        },
    )
    res = client.delete(
        f"/knowledge-items/{created['object_id']}",
        params={"actor_id": "idn_tena_20260101_0001"},
    )
    assert res.status_code == 409
    assert "legal hold" in res.json()["detail"].lower()


def test_federation_derived_blocks_delete(client: TestClient) -> None:
    """Non Goals Guard: federation_event_id を持つ Knowledge は片側削除禁止 (409)."""

    created = client.post(
        "/knowledge-items",
        json=_payload(
            transformation_type="federation_imported",
            lineage_edges=[
                _document_lineage_edge(
                    source_tenant="ten_tenb_20260101_0001",
                    transformation_type="federation_imported",
                ),
            ],
            federation_event_id="fed_tena_20260502_0001",
        ),
    ).json()
    res = client.delete(
        f"/knowledge-items/{created['object_id']}",
        params={"actor_id": "idn_tena_20260101_0001"},
    )
    assert res.status_code == 409
    assert "federation" in res.json()["detail"].lower()


def test_retain_until_in_future_blocks_delete(client: TestClient) -> None:
    """Non Goals Guard: retain_until 未到達は DELETE で 409."""

    future = (datetime.now(tz=timezone.utc) + timedelta(days=30)).isoformat()
    created = client.post(
        "/knowledge-items",
        json=_payload(retain_until=future),
    ).json()
    res = client.delete(
        f"/knowledge-items/{created['object_id']}",
        params={"actor_id": "idn_tena_20260101_0001"},
    )
    assert res.status_code == 409
    assert "retain_until" in res.json()["detail"]


def test_retain_until_past_allows_delete(client: TestClient) -> None:
    """Retention 期限到達後は DELETE が通る (status=DELETED に遷移)."""

    past = (datetime.now(tz=timezone.utc) - timedelta(days=1)).isoformat()
    created = client.post(
        "/knowledge-items",
        json=_payload(retain_until=past),
    ).json()
    res = client.delete(
        f"/knowledge-items/{created['object_id']}",
        params={"actor_id": "idn_tena_20260101_0001"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"


# ---------- Lineage traversal ----------


def test_lineage_returns_direct_edges_at_depth_one(client: TestClient) -> None:
    """Lineage: 直接の lineage_edge は depth=1 で返る."""

    created = client.post(
        "/knowledge-items",
        json=_payload(
            transformation_type="ai_generated",
            lineage_edges=[
                _ai_lineage_edge(),
                _document_lineage_edge(),
            ],
        ),
    ).json()
    res = client.get(f"/knowledge-items/{created['object_id']}/lineage")
    assert res.status_code == 200
    nodes = res.json()
    assert len(nodes) == 2
    assert {n["object_id"] for n in nodes} == {
        "aia_tena_20260502_0001",
        "doc_tena_20260502_0001",
    }
    assert all(n["depth"] == 1 for n in nodes)


def test_lineage_recurses_through_knowledge_items(client: TestClient) -> None:
    """Lineage: KNOWLEDGE_ITEM 種別の edge は再帰展開される (KNOWLEDGE_GRAPH_MODEL.md)."""

    parent = client.post(
        "/knowledge-items",
        json=_payload(
            title="Source memo",
            lineage_edges=[_document_lineage_edge()],
        ),
    ).json()

    child = client.post(
        "/knowledge-items",
        json=_payload(
            title="Derived report",
            transformation_type="derived",
            lineage_edges=[
                _document_lineage_edge(
                    source_object_id=parent["object_id"],
                    source_object_type="knowledge_item",
                    transformation_type="derived",
                ),
            ],
        ),
    ).json()

    res = client.get(
        f"/knowledge-items/{child['object_id']}/lineage",
        params={"max_depth": 3},
    )
    nodes = res.json()
    # 直接 edge (parent kno) + parent から辿った doc edge の 2 種が出る
    object_ids = {n["object_id"] for n in nodes}
    assert parent["object_id"] in object_ids
    assert "doc_tena_20260502_0001" in object_ids
    # depth 値が 1 (parent) と 2 (doc) で記録される
    depths_by_id = {n["object_id"]: n["depth"] for n in nodes}
    assert depths_by_id[parent["object_id"]] == 1
    assert depths_by_id["doc_tena_20260502_0001"] == 2


def test_lineage_max_depth_caps_recursion(client: TestClient) -> None:
    """Lineage: max_depth=1 では孫 edge は出ない."""

    parent = client.post(
        "/knowledge-items",
        json=_payload(
            title="Source memo",
            lineage_edges=[_document_lineage_edge()],
        ),
    ).json()
    child = client.post(
        "/knowledge-items",
        json=_payload(
            title="Derived",
            transformation_type="derived",
            lineage_edges=[
                _document_lineage_edge(
                    source_object_id=parent["object_id"],
                    source_object_type="knowledge_item",
                    transformation_type="derived",
                ),
            ],
        ),
    ).json()
    nodes = client.get(
        f"/knowledge-items/{child['object_id']}/lineage",
        params={"max_depth": 1},
    ).json()
    object_ids = {n["object_id"] for n in nodes}
    assert parent["object_id"] in object_ids
    assert "doc_tena_20260502_0001" not in object_ids


# ---------- Acceptance: Document -> Knowledge -> AI Action 追跡 ----------


def test_document_to_ai_to_knowledge_lineage_chain_traceable(
    client: TestClient,
) -> None:
    """Acceptance: 1 つの Knowledge から Document / AI Action 双方が辿れる.

    Knowledge Graph 設計が「AI 判断の根拠基盤」として成立しているかを確認する。
    """

    body = client.post(
        "/knowledge-items",
        json=_payload(
            transformation_type="ai_generated",
            lineage_edges=[
                _ai_lineage_edge(),
                _document_lineage_edge(),
            ],
        ),
    ).json()
    nodes = client.get(f"/knowledge-items/{body['object_id']}/lineage").json()
    types = {n["object_type"] for n in nodes}
    assert "ai_action" in types
    assert "document" in types
    # AI source ノードには ai_action_id が露出している (Explainability)
    ai_node = next(n for n in nodes if n["object_type"] == "ai_action")
    assert ai_node["ai_action_id"] == "aia_tena_20260502_0001"


# ---------- Trust score ----------


def test_trust_score_increases_with_lineage_completeness(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    """KNOWLEDGE_GRAPH_MODEL.md: lineage 充足度が高いほど trust_score が上がる."""

    bare = client.post("/knowledge-items", json=_payload()).json()
    rich = client.post(
        "/knowledge-items",
        json=_payload(
            transformation_type="ai_generated",
            lineage_edges=[_ai_lineage_edge()],  # audit_event_ref + policy_decision_ref 付き
        ),
    ).json()
    assert rich["trust_score"] > bare["trust_score"]
