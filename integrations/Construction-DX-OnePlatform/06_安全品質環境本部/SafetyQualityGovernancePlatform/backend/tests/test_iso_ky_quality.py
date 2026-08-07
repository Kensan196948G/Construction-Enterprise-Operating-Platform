"""ISO監査 + KY活動 + 品質記録テスト (ISO 9001/14001/45001 / AUDIT_CHECKLIST)."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sq_api.main import app

client = TestClient(app)

_AUDIT = "/api/v1/iso-audits"
_KY = "/api/v1/ky-activities"
_QUALITY = "/api/v1/quality-records"

_AUDIT_PAYLOAD = {
    "audit_type": "internal",
    "iso_standard": "ISO9001",
    "plan_date": "2026-06-01",
    "audit_date": "2026-06-15",
    "scope": "施工プロセス全般",
    "lead_auditor": "auditor-001",
    "status": "planned",
}


# ── ISO 監査 CRUD ──────────────────────────────────────────────────────────


def test_iso_audit_create() -> None:
    r = client.post(_AUDIT, json=_AUDIT_PAYLOAD)
    assert r.status_code == 201
    body = r.json()
    assert body["iso_standard"] == "ISO9001"
    assert "audit_id" in body


def test_iso_audit_list() -> None:
    client.post(_AUDIT, json=_AUDIT_PAYLOAD)
    r = client.get(_AUDIT)
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_iso_audit_get_by_id() -> None:
    r = client.post(_AUDIT, json={**_AUDIT_PAYLOAD, "iso_standard": "ISO14001"})
    audit_id = r.json()["audit_id"]
    r = client.get(f"{_AUDIT}/{audit_id}")
    assert r.status_code == 200
    assert r.json()["iso_standard"] == "ISO14001"


def test_iso_audit_update() -> None:
    r = client.post(_AUDIT, json=_AUDIT_PAYLOAD)
    audit_id = r.json()["audit_id"]
    r = client.put(
        f"{_AUDIT}/{audit_id}", json={**_AUDIT_PAYLOAD, "status": "completed"}
    )
    assert r.status_code == 200
    assert r.json()["status"] == "completed"


def test_iso_audit_delete() -> None:
    r = client.post(_AUDIT, json=_AUDIT_PAYLOAD)
    audit_id = r.json()["audit_id"]
    r = client.delete(f"{_AUDIT}/{audit_id}")
    assert r.status_code == 204
    r = client.get(f"{_AUDIT}/{audit_id}")
    assert r.status_code == 404


def test_iso_audit_get_nonexistent_returns_404() -> None:
    r = client.get(f"{_AUDIT}/AUDIT-NOTEXIST")
    assert r.status_code == 404


# ── チェックリストテンプレート ──────────────────────────────────────────────


def test_checklist_template_iso9001() -> None:
    r = client.get(f"{_AUDIT}/checklist-template?standard=ISO9001")
    assert r.status_code == 200
    body = r.json()
    assert body["standard"] == "ISO9001"
    assert len(body["items"]) >= 3


def test_checklist_template_iso14001() -> None:
    r = client.get(f"{_AUDIT}/checklist-template?standard=ISO14001")
    assert r.status_code == 200
    assert r.json()["standard"] == "ISO14001"
    assert len(r.json()["items"]) >= 3


def test_checklist_template_iso45001() -> None:
    r = client.get(f"{_AUDIT}/checklist-template?standard=ISO45001")
    assert r.status_code == 200
    assert r.json()["standard"] == "ISO45001"
    assert len(r.json()["items"]) >= 3


# ── KY 活動 CRUD ───────────────────────────────────────────────────────────

_KY_PAYLOAD = {
    "activity_date": "2026-06-01",
    "work_content": "足場組立作業",
    "hazards": [
        {"hazard": "高所からの落下", "risk_rank": "A", "measure": "安全帯着用"},
        {"hazard": "工具落下", "risk_rank": "B", "measure": "落下防止ネット設置"},
    ],
    "participants": ["worker-001", "worker-002"],
    "leader_id": "leader-001",
}


def test_ky_activity_create() -> None:
    r = client.post(_KY, json=_KY_PAYLOAD)
    assert r.status_code == 201
    body = r.json()
    assert "ky_id" in body
    assert len(body["hazards"]) == 2


def test_ky_activity_list() -> None:
    client.post(_KY, json=_KY_PAYLOAD)
    r = client.get(_KY)
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_ky_activity_get_by_id() -> None:
    r = client.post(_KY, json=_KY_PAYLOAD)
    ky_id = r.json()["ky_id"]
    r = client.get(f"{_KY}/{ky_id}")
    assert r.status_code == 200
    assert r.json()["work_content"] == "足場組立作業"


def test_ky_activity_get_nonexistent_returns_404() -> None:
    r = client.get(f"{_KY}/KY-NOTEXIST")
    assert r.status_code == 404


def test_ky_activity_update() -> None:
    r = client.post(_KY, json=_KY_PAYLOAD)
    ky_id = r.json()["ky_id"]
    updated = {**_KY_PAYLOAD, "work_content": "解体作業"}
    r = client.put(f"{_KY}/{ky_id}", json=updated)
    assert r.status_code == 200
    assert r.json()["work_content"] == "解体作業"


def test_ky_activity_delete() -> None:
    r = client.post(_KY, json=_KY_PAYLOAD)
    ky_id = r.json()["ky_id"]
    r = client.delete(f"{_KY}/{ky_id}")
    assert r.status_code == 204
    r = client.get(f"{_KY}/{ky_id}")
    assert r.status_code == 404


# ── 品質記録 (合否自動判定) ────────────────────────────────────────────────


def test_quality_inspection_pass_within_spec() -> None:
    r = client.post(
        _QUALITY,
        json={
            "title": "コンクリート圧縮強度",
            "record_type": "inspection",
            "measurement_value": 28.5,
            "spec_upper": 35.0,
            "spec_lower": 24.0,
        },
    )
    assert r.status_code == 201
    assert r.json()["result"] == "pass"


def test_quality_inspection_fail_over_upper() -> None:
    r = client.post(
        _QUALITY,
        json={
            "title": "鉄筋径",
            "record_type": "inspection",
            "measurement_value": 36.0,
            "spec_upper": 35.0,
            "spec_lower": 25.0,
        },
    )
    assert r.status_code == 201
    assert r.json()["result"] == "fail"


def test_quality_inspection_fail_below_lower() -> None:
    r = client.post(
        _QUALITY,
        json={
            "title": "スランプ値",
            "record_type": "inspection",
            "measurement_value": 5.0,
            "spec_upper": 20.0,
            "spec_lower": 8.0,
        },
    )
    assert r.status_code == 201
    assert r.json()["result"] == "fail"


def test_quality_record_list_and_get() -> None:
    r = client.post(
        _QUALITY,
        json={"title": "外観検査", "record_type": "test", "result": "pass"},
    )
    assert r.status_code == 201
    qid = r.json()["quality_id"]

    r = client.get(_QUALITY)
    assert r.status_code == 200
    assert any(it["quality_id"] == qid for it in r.json())

    r = client.get(f"{_QUALITY}/{qid}")
    assert r.status_code == 200
    assert r.json()["title"] == "外観検査"


def test_quality_record_delete() -> None:
    r = client.post(
        _QUALITY,
        json={"title": "溶接検査", "record_type": "inspection", "result": "pass"},
    )
    qid = r.json()["quality_id"]
    r = client.delete(f"{_QUALITY}/{qid}")
    assert r.status_code == 204
    assert client.get(f"{_QUALITY}/{qid}").status_code == 404
