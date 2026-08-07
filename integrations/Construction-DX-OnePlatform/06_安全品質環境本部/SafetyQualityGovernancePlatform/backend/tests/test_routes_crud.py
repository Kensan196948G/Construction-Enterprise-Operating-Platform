"""安全品質環境ルートの CRUD テスト (06_安全品質環境本部).

MemoryStore バックエンドのため DB モック不要。
TestClient(app) を直接使い、作成→取得→404 を検証する。
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from sq_api.main import app

client = TestClient(app)

_NONEXISTENT = str(uuid.uuid4())


# ── ヒヤリハット (near-miss) ────────────────────────────────────────────────


_NM_BASE = "/api/v1/near-miss"


def test_near_miss_create_returns_201() -> None:
    payload = {
        "occurred_at": "2026-06-01T08:00:00+09:00",
        "description": "足場板が滑りかけた",
        "risk_level": "medium",
    }
    r = client.post(_NM_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["description"] == "足場板が滑りかけた"
    assert body["risk_level"] == "medium"
    assert "near_miss_id" in body


def test_near_miss_list_returns_created() -> None:
    payload = {
        "occurred_at": "2026-06-01T09:00:00+09:00",
        "description": "クレーン旋回範囲内への誤侵入",
        "risk_level": "high",
    }
    r = client.post(_NM_BASE, json=payload)
    assert r.status_code == 201
    nm_id = r.json()["near_miss_id"]

    r = client.get(_NM_BASE)
    assert r.status_code == 200
    ids = [it["near_miss_id"] for it in r.json()]
    assert nm_id in ids


def test_near_miss_get_by_id() -> None:
    payload = {
        "occurred_at": "2026-06-01T10:00:00+09:00",
        "description": "転落防止ネット設置漏れ発見",
        "risk_level": "low",
    }
    r = client.post(_NM_BASE, json=payload)
    assert r.status_code == 201
    nm_id = r.json()["near_miss_id"]

    r = client.get(f"{_NM_BASE}/{nm_id}")
    assert r.status_code == 200
    assert r.json()["near_miss_id"] == nm_id


def test_near_miss_get_not_found() -> None:
    r = client.get(f"{_NM_BASE}/{_NONEXISTENT}")
    assert r.status_code == 404


def test_near_miss_analysis_returns_4m_summary() -> None:
    payload = {
        "occurred_at": "2026-06-01T11:00:00+09:00",
        "description": "資材の積み過ぎで不安定",
        "cause_analysis": {
            "man": True,
            "machine": False,
            "material": True,
            "method": False,
        },
        "risk_level": "medium",
    }
    client.post(_NM_BASE, json=payload)

    r = client.get(f"{_NM_BASE}/analysis")
    assert r.status_code == 200
    body = r.json()
    assert "total" in body
    assert "by_4m" in body
    assert body["total"] >= 1


# ── 労災事故 (accidents) ────────────────────────────────────────────────────


_ACC_BASE = "/api/v1/accidents"


def test_accidents_create_returns_201() -> None:
    payload = {
        "occurred_at": "2026-06-01T07:30:00+09:00",
        "severity": "minor",
        "description": "工具落下による軽傷",
        "lost_days": 1,
        "total_work_hours": 5000.0,
        "injuries": 1,
    }
    r = client.post(_ACC_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["severity"] == "minor"
    assert "accident_id" in body


def test_accidents_get_by_id() -> None:
    payload = {
        "occurred_at": "2026-06-01T08:30:00+09:00",
        "severity": "serious",
        "description": "転落事故",
        "lost_days": 14,
        "total_work_hours": 8000.0,
        "injuries": 1,
    }
    r = client.post(_ACC_BASE, json=payload)
    assert r.status_code == 201
    acc_id = r.json()["accident_id"]

    r = client.get(f"{_ACC_BASE}/{acc_id}")
    assert r.status_code == 200
    assert r.json()["accident_id"] == acc_id


def test_accidents_get_not_found() -> None:
    r = client.get(f"{_ACC_BASE}/{_NONEXISTENT}")
    assert r.status_code == 404


def test_accidents_stats_returns_rate_metrics() -> None:
    r = client.get(f"{_ACC_BASE}/stats", params={"total_work_hours": 10000.0})
    assert r.status_code == 200
    body = r.json()
    # 度数率 = (傷者数 / 延べ労働時間) × 1,000,000
    assert "frequency_rate" in body
    assert "severity_rate" in body
    assert "injuries" in body


# ── 安全パトロール (patrols) ────────────────────────────────────────────────


_PAT_BASE = "/api/v1/patrols"


def test_patrols_create_returns_201() -> None:
    payload = {
        "patrol_date": "2026-06-01",
        "overall_rating": "A",
        "correction_status": "open",
    }
    r = client.post(_PAT_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["overall_rating"] == "A"
    assert "patrol_id" in body


def test_patrols_get_by_id() -> None:
    payload = {"patrol_date": "2026-06-02", "overall_rating": "B"}
    r = client.post(_PAT_BASE, json=payload)
    assert r.status_code == 201
    pat_id = r.json()["patrol_id"]

    r = client.get(f"{_PAT_BASE}/{pat_id}")
    assert r.status_code == 200
    assert r.json()["patrol_id"] == pat_id


def test_patrols_get_not_found() -> None:
    r = client.get(f"{_PAT_BASE}/{_NONEXISTENT}")
    assert r.status_code == 404


def test_patrols_list_returns_created() -> None:
    payload = {"patrol_date": "2026-06-03", "overall_rating": "C"}
    r = client.post(_PAT_BASE, json=payload)
    assert r.status_code == 201
    pat_id = r.json()["patrol_id"]

    r = client.get(_PAT_BASE)
    assert r.status_code == 200
    ids = [it["patrol_id"] for it in r.json()]
    assert pat_id in ids


# ── 環境記録 (environmental) ────────────────────────────────────────────────


_ENV_BASE = "/api/v1/environmental"


def test_environment_create_co2_returns_201() -> None:
    payload = {
        "record_type": "co2",
        "record_date": "2026-06-01",
        "scope": "scope1",
        "quantity": 12.5,
        "unit": "tCO2e",
    }
    r = client.post(_ENV_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["record_type"] == "co2"
    assert body["scope"] == "scope1"
    assert pytest.approx(12.5) == body["quantity"]
    assert "env_id" in body


def test_environment_get_by_id() -> None:
    payload = {
        "record_type": "co2",
        "record_date": "2026-06-01",
        "scope": "scope2",
        "quantity": 8.0,
        "unit": "tCO2e",
    }
    r = client.post(_ENV_BASE, json=payload)
    assert r.status_code == 201
    env_id = r.json()["env_id"]

    r = client.get(f"{_ENV_BASE}/{env_id}")
    assert r.status_code == 200
    assert r.json()["env_id"] == env_id


def test_environment_get_not_found() -> None:
    r = client.get(f"{_ENV_BASE}/{_NONEXISTENT}")
    assert r.status_code == 404


def test_environment_co2_summary_includes_scope() -> None:
    # Create a scope3 record to ensure at least one entry
    client.post(
        _ENV_BASE,
        json={
            "record_type": "co2",
            "record_date": "2026-06-01",
            "scope": "scope3",
            "quantity": 3.0,
        },
    )
    r = client.get(f"{_ENV_BASE}/co2")
    assert r.status_code == 200
    body = r.json()
    assert "by_scope" in body
    assert "total" in body
    assert body["total"] >= 3.0


def test_environment_list_returns_records() -> None:
    r = client.get(_ENV_BASE)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ── AI 危険予測 (ai/predict-risk) ──────────────────────────────────────────


_AI_BASE = "/api/v1/ai"


def test_ai_predict_risk_returns_risk_level() -> None:
    payload = {
        "work_content": "鉄骨溶接作業 高所 30m",
        "workers": 5,
        "historical_near_miss_count": 3,
        "hazards": ["火花飛散", "高所墜落"],
    }
    r = client.post(f"{_AI_BASE}/predict-risk", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "risk_level" in body
    assert body["risk_level"] in {"low", "medium", "high", "critical"}


def test_ai_predict_risk_stub_includes_countermeasures() -> None:
    payload = {
        "work_content": "掘削工事",
        "workers": 2,
        "historical_near_miss_count": 0,
    }
    r = client.post(f"{_AI_BASE}/predict-risk", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "suggested_countermeasures" in body
    assert isinstance(body["suggested_countermeasures"], list)


# ── 品質記録 spec 超過自動判定 ─────────────────────────────────────────────


_QR_BASE = "/api/v1/quality-records"


def test_quality_result_becomes_fail_when_value_exceeds_spec() -> None:
    """measurement_value > spec_upper の場合 result が fail に変わる."""
    payload = {
        "title": "コンクリート圧縮強度",
        "record_type": "test",
        "measurement_value": 30.0,
        "spec_upper": 25.0,
        "spec_lower": 18.0,
        "result": "pass",
    }
    r = client.post(_QR_BASE, json=payload)
    assert r.status_code == 201
    assert r.json()["result"] == "fail"


def test_quality_result_pass_within_spec() -> None:
    payload = {
        "title": "コンクリート圧縮強度 (範囲内)",
        "record_type": "test",
        "measurement_value": 22.0,
        "spec_upper": 25.0,
        "spec_lower": 18.0,
        "result": "pass",
    }
    r = client.post(_QR_BASE, json=payload)
    assert r.status_code == 201
    assert r.json()["result"] == "pass"


# ── 不適合管理 invalid status ──────────────────────────────────────────────


_NC_BASE = "/api/v1/nonconformity"


def test_nonconformity_invalid_capa_status_returns_400() -> None:
    payload = {
        "title": "NG テスト",
        "detected_at": "2026-06-01",
        "capa_status": "invalid_status",
    }
    r = client.post(_NC_BASE, json=payload)
    assert r.status_code == 400


# ── ISO 監査 チェックリストテンプレ ─────────────────────────────────────────


_AUDIT_BASE = "/api/v1/iso-audits"


def test_iso_audit_checklist_template_returns_items() -> None:
    r = client.get(f"{_AUDIT_BASE}/checklist-template", params={"standard": "ISO9001"})
    assert r.status_code == 200
    body = r.json()
    assert body["standard"] == "ISO9001"
    assert isinstance(body["items"], list)
    assert len(body["items"]) > 0


def test_iso_audit_checklist_template_iso14001() -> None:
    r = client.get(f"{_AUDIT_BASE}/checklist-template", params={"standard": "ISO14001"})
    assert r.status_code == 200
    assert r.json()["standard"] == "ISO14001"
