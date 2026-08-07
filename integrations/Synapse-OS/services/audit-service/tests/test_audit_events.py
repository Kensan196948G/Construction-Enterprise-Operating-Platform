"""audit-service 受信 API テスト.

確認事項:
- POST /audit-events で audit_event_id (aud_*) と hash_ref (sha256:*) がサーバ採番される
- Immutable: AuditEvent はレスポンスでも frozen を守れる (再現性のあるシリアライズ)
- JSONL ファイルに append される
- GET /audit-events?correlation_id=... でフィルタできる
- GET /audit-events/{id} で取得できる、未知 ID は 404
- AI Audit Extension が AI 系 Event で正しく扱われる
- extra='forbid' により未定義フィールドは 422
"""

from __future__ import annotations

import json
import re

AUD_ID_PATTERN = re.compile(r"^aud_(tena|tenb|tenc|global)_\d{8}_\d{4,}$")
HASH_PATTERN = re.compile(r"^sha256:[0-9a-f]{64}$")


def test_healthz(client) -> None:
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json()["service"] == "audit-service"


def test_ingest_assigns_id_and_hash(client, base_ingress) -> None:
    res = client.post("/audit-events", json=base_ingress)
    assert res.status_code == 201, res.text
    body = res.json()
    assert AUD_ID_PATTERN.match(body["audit_event_id"])
    assert HASH_PATTERN.match(body["hash_ref"])
    assert body["event_type"] == "PolicyEvaluated"


def test_ingest_appends_jsonl(client, store, base_ingress) -> None:
    client.post("/audit-events", json=base_ingress)
    client.post("/audit-events", json={**base_ingress, "correlation_id": "corr-0002"})
    lines = store._path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 2
    parsed = [json.loads(line) for line in lines]
    assert parsed[0]["correlation_id"] == "corr-0001"
    assert parsed[1]["correlation_id"] == "corr-0002"


def test_filter_by_correlation_id(client, base_ingress) -> None:
    client.post("/audit-events", json={**base_ingress, "correlation_id": "corr-A"})
    client.post("/audit-events", json={**base_ingress, "correlation_id": "corr-B"})
    client.post("/audit-events", json={**base_ingress, "correlation_id": "corr-A"})

    res = client.get("/audit-events", params={"correlation_id": "corr-A"})
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 2
    assert all(ev["correlation_id"] == "corr-A" for ev in body)


def test_get_by_id_round_trip(client, base_ingress) -> None:
    posted = client.post("/audit-events", json=base_ingress).json()
    got = client.get(f"/audit-events/{posted['audit_event_id']}")
    assert got.status_code == 200
    assert got.json()["audit_event_id"] == posted["audit_event_id"]


def test_unknown_id_returns_404(client) -> None:
    res = client.get("/audit-events/aud_tena_20260502_9999")
    assert res.status_code == 404


def test_extra_field_rejected(client, base_ingress) -> None:
    res = client.post("/audit-events", json={**base_ingress, "unknown": 1})
    assert res.status_code == 422


def test_ai_audit_extension_accepted(client, base_ingress) -> None:
    payload = {
        **base_ingress,
        "event_type": "AIPromptExecuted",
        "action": "ai.execute",
        "object_type": "ai_action",
        "object_id": "aia_tena_20260502_0001",
        "ai_extension": {
            "prompt_audit_ref": "ref_prompt_001",
            "model_provider": "external_cloud",
            "model_name": "claude-sonnet-4-6",
            "context_source_refs": ["doc_tena_20260502_0001"],
            "dlp_result_ref": "ref_dlp_001",
            "reasoning_summary_ref": "ref_reason_001",
            "confidence": 0.92,
            "risk_score": 0.35,
        },
    }
    res = client.post("/audit-events", json=payload)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["ai_extension"]["model_name"] == "claude-sonnet-4-6"


def test_event_is_frozen_in_store(client, store, base_ingress) -> None:
    """AuditEvent (frozen=True) は永続化後に書き換え不可."""
    posted = client.post("/audit-events", json=base_ingress).json()
    event = store.get(posted["audit_event_id"])
    assert event is not None
    import pydantic

    try:
        event.action = "tampered"
    except (pydantic.ValidationError, TypeError, AttributeError):
        pass
    else:
        raise AssertionError("AuditEvent must be frozen")


def test_hash_changes_with_payload(client, base_ingress) -> None:
    """hash_ref は payload 内容に依存する (改ざん検知の素地)."""
    a = client.post("/audit-events", json=base_ingress).json()["hash_ref"]
    b = client.post(
        "/audit-events", json={**base_ingress, "correlation_id": "corr-different"}
    ).json()["hash_ref"]
    assert a != b


def test_first_event_has_genesis_previous_hash(client, base_ingress) -> None:
    """チェーン先頭イベントは previous_hash_ref = 'genesis' となる."""
    res = client.post("/audit-events", json=base_ingress)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["previous_hash_ref"] == "genesis"


def test_second_event_links_to_first(client, base_ingress) -> None:
    """2 番目のイベントは直前の hash_ref を previous_hash_ref に持つ."""
    first = client.post("/audit-events", json=base_ingress).json()
    second = client.post("/audit-events", json={**base_ingress, "correlation_id": "corr-0002"}).json()
    assert second["previous_hash_ref"] == first["hash_ref"]


def test_hash_chain_grows_sequentially(client, base_ingress) -> None:
    """複数イベントでチェーンが順に連結される."""
    events = []
    for i in range(3):
        r = client.post("/audit-events", json={**base_ingress, "correlation_id": f"corr-{i}"})
        assert r.status_code == 201
        events.append(r.json())

    assert events[0]["previous_hash_ref"] == "genesis"
    assert events[1]["previous_hash_ref"] == events[0]["hash_ref"]
    assert events[2]["previous_hash_ref"] == events[1]["hash_ref"]


def test_verify_valid_chain(client, base_ingress) -> None:
    """正常なチェーンは verify で valid=True を返す."""
    tenant_id = base_ingress["tenant_id"]
    for i in range(3):
        r = client.post("/audit-events", json={**base_ingress, "correlation_id": f"corr-v{i}"})
        assert r.status_code == 201

    res = client.get("/audit-events/verify", params={"tenant_id": tenant_id})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["tenant_id"] == tenant_id
    assert body["total_events"] == 3
    assert body["valid"] is True
    assert body["broken_at"] is None


def test_verify_empty_tenant(client) -> None:
    """イベントが存在しないテナントは valid=True, total_events=0 を返す."""
    res = client.get("/audit-events/verify", params={"tenant_id": "ten_tena_20260502_9999"})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["valid"] is True
    assert body["total_events"] == 0
    assert body["broken_at"] is None
