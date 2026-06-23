"""Document API contract / policy / audit tests (BL-007 / Sprint 2).

カバレッジ (BACKLOG_TEST_MAPPING.md "BL-007" 行に対応 / Acceptance 3 整合):
    - Contract:  POST /documents が DocumentCreateRequest を受理し Document schema で返す
    - Schema  :  classification 欠落 / retention_class 欠落 / extra field を 422 で弾く
    - Policy  :  Policy が allow を返すと Document.status = draft (Public/Internal の通常 path)
    - Policy  :  Policy が mask_required を返すと Document.status = review_required
                (Acceptance 3 #2 / DLP-003: Confidential + 外部 AI -> mask)
    - Policy  :  Policy が deny を返すと Document.status = quarantined
                (Acceptance 3 #3 / DLP-004: Restricted + 外部 AI -> deny)
    - Audit   :  DocumentCreated が必ず Audit に積まれる (deny path でも記録される)
    - Audit   :  retention_class が Audit after_state に乗る (Acceptance 3 #4)
    - CRUD    :  GET /documents/{id} / GET /documents?tenant_id=... が正しく動く
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
        "title": "顧客サポート FAQ ドラフト",
        "content_uri": "s3://synapse-tena/docs/faq-draft-v1.md",
        "classification": "internal",
        "retention_class": "standard_5y",
        "actor_id": ACTOR_ID,
        "actor_type": "human",
        "data_destination": "internal",
        "model_provider": "n/a",
        "risk_score": 0.0,
        "requested_action": "document.create",
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


# ----------------------------------------------------------------------------
# Acceptance 3 #1: Document に Classification が付く
# ----------------------------------------------------------------------------


def test_create_document_allow_path(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """Acceptance 3 #1 (classification 必須) + #4 (retention 紐づけ) の通常 path."""

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_d100",
            final_decision="allow",
        )
    )
    res = client.post("/documents", json=_payload())
    assert res.status_code == 201, res.text
    body = res.json()

    # Acceptance 3 #1: Document の Object 表現に classification が含まれる
    assert body["object_id"].startswith("doc_tena_")
    assert body["object_type"] == "document"
    assert body["classification"] == "internal"
    # Acceptance 3 #4: retention_class が Document Object に紐づく
    assert body["retention_class"] == "standard_5y"
    assert body["status"] == "draft"
    assert body["policy_result_ref"] == "pde_tena_20260502_d100"
    assert len(body["audit_event_refs"]) == 1

    # Policy 入力に object_type=document / classification / data_destination が乗る
    assert len(policy_stub.calls) == 1
    p_in = policy_stub.calls[0]
    assert p_in["object_type"] == "document"
    assert p_in["classification"] == "internal"
    assert p_in["action"] == "document.create"
    assert p_in["data_destination"] == "internal"
    assert p_in["is_state_change"] is True

    # Audit に DocumentCreated が積まれ、retention_class が after_state に乗る
    assert len(audit_stub.events) == 1
    evt = audit_stub.events[0]
    assert evt["event_type"] == "DocumentCreated"
    assert evt["correlation_id"] == body["object_id"]
    assert evt["object_id"] == body["object_id"]
    assert evt["object_type"] == "document"
    assert evt["policy_decision_ref"] == "pde_tena_20260502_d100"
    assert evt["policy_result"] == "allow"
    assert evt["after_state"]["status"] == "draft"
    assert evt["after_state"]["classification"] == "internal"
    assert evt["after_state"]["retention_class"] == "standard_5y"


# ----------------------------------------------------------------------------
# Acceptance 3 #2: Confidential 以上は DLP 判定対象 (mask_required path)
# ----------------------------------------------------------------------------


def test_create_document_confidential_external_marks_review(
    client: TestClient,
    policy_stub: StubPolicyClient,
) -> None:
    """Acceptance 3 #2: Confidential を外部 AI 宛に作ろうとすると DLP-003 が
    mask_required を返す想定. Document は review_required で生成される.
    """

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_d200",
            final_decision="mask_required",
            reasons=["DLP-003: confidential payload toward external_ai_cloud must be masked"],
        )
    )
    res = client.post(
        "/documents",
        json=_payload(
            classification="confidential",
            data_destination="external_ai_cloud",
            model_provider="openai/gpt-4o",
        ),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "review_required"
    assert body["classification"] == "confidential"


# ----------------------------------------------------------------------------
# Acceptance 3 #3: Restricted は外部 AI 送信されない (deny path)
# ----------------------------------------------------------------------------


def test_create_document_restricted_external_quarantined_with_audit(
    client: TestClient,
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
) -> None:
    """Acceptance 3 #3: Restricted + external_ai_cloud は DLP-004 deny.
    Document は quarantined 状態で生成され、Audit に "外部送信を試みた事実" が残る.
    """

    policy_stub.scripted.append(
        _scripted_decision(
            decision_id="pde_tena_20260502_d300",
            final_decision="deny",
            reasons=["DLP-004: restricted classification cannot leave the tenant boundary"],
        )
    )
    res = client.post(
        "/documents",
        json=_payload(
            classification="restricted",
            data_destination="external_ai_cloud",
            model_provider="openai/gpt-4o",
        ),
    )
    # 永続化は許す (Auditability) が status=quarantined で物理隔離扱い
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "quarantined"
    assert body["classification"] == "restricted"
    assert body["policy_result_ref"] == "pde_tena_20260502_d300"

    # Audit には "外部送信を試みた" が残る (data_destination も after_state に保存される)
    assert len(audit_stub.events) == 1
    evt = audit_stub.events[0]
    assert evt["policy_result"] == "deny"
    assert evt["after_state"]["status"] == "quarantined"
    assert evt["after_state"]["data_destination"] == "external_ai_cloud"
    assert evt["after_state"]["classification"] == "restricted"


# ----------------------------------------------------------------------------
# Acceptance 3 #4: Retention Policy が Document に必須で紐づく
# ----------------------------------------------------------------------------


@pytest.mark.parametrize(
    "missing_field",
    ["tenant_id", "owner_id", "title", "content_uri", "classification", "retention_class", "actor_id"],
)
def test_create_document_missing_required_field(
    client: TestClient, missing_field: str
) -> None:
    payload = _payload()
    del payload[missing_field]
    res = client.post("/documents", json=payload)
    assert res.status_code == 422


def test_create_document_extra_field_rejected(client: TestClient) -> None:
    """extra='forbid' で未知フィールドは 422."""

    res = client.post("/documents", json=_payload(extra_field="not allowed"))
    assert res.status_code == 422


def test_create_document_invalid_classification(client: TestClient) -> None:
    res = client.post("/documents", json=_payload(classification="top_secret"))
    assert res.status_code == 422


def test_create_document_invalid_retention_class(client: TestClient) -> None:
    res = client.post("/documents", json=_payload(retention_class="forever"))
    assert res.status_code == 422


# ----------------------------------------------------------------------------
# CRUD
# ----------------------------------------------------------------------------


def test_get_document_roundtrip(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    policy_stub.scripted.append(
        _scripted_decision(decision_id="pde_tena_20260502_d400", final_decision="allow")
    )
    create_res = client.post("/documents", json=_payload())
    document_id = create_res.json()["object_id"]

    get_res = client.get(f"/documents/{document_id}")
    assert get_res.status_code == 200
    body = get_res.json()
    assert body["object_id"] == document_id
    assert body["title"] == "顧客サポート FAQ ドラフト"
    assert body["content_uri"] == "s3://synapse-tena/docs/faq-draft-v1.md"
    assert body["retention_class"] == "standard_5y"


def test_get_document_not_found(client: TestClient) -> None:
    res = client.get("/documents/doc_tena_20260502_9999")
    assert res.status_code == 404


def test_list_documents_filters_by_tenant(
    client: TestClient, policy_stub: StubPolicyClient
) -> None:
    for i in range(3):
        policy_stub.scripted.append(
            _scripted_decision(
                decision_id=f"pde_tena_20260502_d{500 + i:03d}", final_decision="allow"
            )
        )
    client.post("/documents", json=_payload(title="Doc A"))
    client.post("/documents", json=_payload(title="Doc B"))
    other = _payload(title="TenantB Doc")
    other["tenant_id"] = TENANT_B_ID
    other["actor_id"] = "idn_tenb_20260101_0001"
    other["owner_id"] = "idn_tenb_20260101_0002"
    client.post("/documents", json=other)

    tena_res = client.get(f"/documents?tenant_id={TENANT_ID}")
    assert tena_res.status_code == 200
    assert len(tena_res.json()) == 2

    tenb_res = client.get(f"/documents?tenant_id={TENANT_B_ID}")
    assert len(tenb_res.json()) == 1
    assert tenb_res.json()[0]["title"] == "TenantB Doc"

    all_res = client.get("/documents")
    assert len(all_res.json()) == 3
