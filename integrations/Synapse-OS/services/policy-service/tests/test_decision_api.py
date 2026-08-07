"""Policy Decision API インテグレーションテスト.

確認事項:
- POST /policy-decisions が PolicyDecisionResult を返す
- pde_{scope}_{yyyymmdd}_{seq} 形式の ID が払い出される
- deny でも HTTP 200 で Decision Record が返ることが Auditability 要件
- GET /policy-decisions/{id} で発行済み決定を再取得できる
- 未知 ID は 404
- /healthz が 200
"""

from __future__ import annotations

import re

PDE_ID_PATTERN = re.compile(r"^pde_(tena|tenb|tenc|global)_\d{8}_\d{4,}$")


def test_healthz(client) -> None:
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json()["service"] == "policy-service"


def test_post_decision_allow(client, base_input) -> None:
    payload = {**base_input, "classification": "public"}
    res = client.post("/policy-decisions", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert PDE_ID_PATTERN.match(body["policy_decision_id"])
    assert body["final_decision"] == "allow"
    assert any(r["rule_id"] == "AUTH-001" for r in body["applied_rules"])


def test_post_decision_deny_returns_200_with_explanation(client, base_input) -> None:
    """deny は HTTP 失敗ではない: 200 で Decision Record を返す."""
    payload = {
        **base_input,
        "actor_type": "ai_agent",
        "is_ai_execution": True,
        "classification": "restricted",
        "data_destination": "external_ai_cloud",
        "model_provider": "external_cloud",
        "has_prompt_audit_ref": True,
        "has_dlp_result_ref": True,
    }
    res = client.post("/policy-decisions", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["final_decision"] == "deny"
    assert any(r["rule_id"] == "AI-004" for r in body["applied_rules"])
    assert body["requires_audit"] is True


def test_post_then_get_round_trip(client, base_input) -> None:
    res = client.post("/policy-decisions", json=base_input)
    decision_id = res.json()["policy_decision_id"]
    got = client.get(f"/policy-decisions/{decision_id}")
    assert got.status_code == 200
    assert got.json()["policy_decision_id"] == decision_id


def test_get_unknown_returns_404(client) -> None:
    res = client.get("/policy-decisions/pde_tena_20260502_9999")
    assert res.status_code == 404


def test_id_sequence_is_per_scope_per_day(client, base_input) -> None:
    ids = []
    for _ in range(3):
        res = client.post("/policy-decisions", json=base_input)
        ids.append(res.json()["policy_decision_id"])
    seqs = [int(i.split("_")[-1]) for i in ids]
    assert seqs == sorted(seqs)
    assert len(set(seqs)) == 3


def test_post_rejects_invalid_input_schema(client, base_input) -> None:
    """extra='forbid' のため未定義フィールドは 422."""
    bad = {**base_input, "unknown_field": "x"}
    res = client.post("/policy-decisions", json=bad)
    assert res.status_code == 422
