"""不適合管理 + CAPA ワークフロー統制テスト (ISO 9001 §10.2 / J-SOX 品質統制)."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sq_api.main import app

client = TestClient(app)

_NC = "/api/v1/nonconformity"

_PAYLOAD = {
    "title": "コンクリート強度不足",
    "detected_at": "2026-05-01",
    "severity": "major",
    "corrective_action": "配合比見直し",
}


def test_create_nonconformity_defaults_open() -> None:
    r = client.post(_NC, json=_PAYLOAD)
    assert r.status_code == 201
    body = r.json()
    assert body["capa_status"] == "open"
    assert "nc_id" in body


def test_list_nonconformity_returns_created() -> None:
    r = client.post(_NC, json={**_PAYLOAD, "title": "鉄筋かぶり不足"})
    assert r.status_code == 201
    nc_id = r.json()["nc_id"]

    r = client.get(_NC)
    assert r.status_code == 200
    ids = [it["nc_id"] for it in r.json()]
    assert nc_id in ids


def test_advance_capa_status_open_to_corrected() -> None:
    r = client.post(_NC, json=_PAYLOAD)
    nc_id = r.json()["nc_id"]

    r = client.post(f"{_NC}/{nc_id}/capa/advance")
    assert r.status_code == 200
    assert r.json()["capa_status"] == "corrected"


def test_advance_capa_full_lifecycle_to_closed() -> None:
    r = client.post(_NC, json=_PAYLOAD)
    nc_id = r.json()["nc_id"]
    # open → corrected → prevented → verified → closed (4 advances)
    for expected in ["corrected", "prevented", "verified", "closed"]:
        r = client.post(f"{_NC}/{nc_id}/capa/advance")
        assert r.status_code == 200
        assert r.json()["capa_status"] == expected


def test_advance_capa_stays_closed() -> None:
    r = client.post(_NC, json=_PAYLOAD)
    nc_id = r.json()["nc_id"]
    for _ in range(5):
        client.post(f"{_NC}/{nc_id}/capa/advance")
    r = client.post(f"{_NC}/{nc_id}/capa/advance")
    assert r.status_code == 200
    assert r.json()["capa_status"] == "closed"


def test_invalid_capa_status_rejected() -> None:
    r = client.post(_NC, json={**_PAYLOAD, "capa_status": "invalid_stage"})
    assert r.status_code == 400


def test_capa_status_report_includes_open() -> None:
    client.post(_NC, json={**_PAYLOAD, "title": "塗装剥離"})
    r = client.get(f"{_NC}/capa-status")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert body["by_stage"]["open"] >= 1


def test_get_nonconformity_by_id() -> None:
    r = client.post(_NC, json={**_PAYLOAD, "title": "防水不良"})
    nc_id = r.json()["nc_id"]

    r = client.get(f"{_NC}/{nc_id}")
    assert r.status_code == 200
    assert r.json()["title"] == "防水不良"


def test_get_nonexistent_returns_404() -> None:
    r = client.get(f"{_NC}/NC-NOTEXIST")
    assert r.status_code == 404


def test_update_nonconformity() -> None:
    r = client.post(_NC, json=_PAYLOAD)
    nc_id = r.json()["nc_id"]
    updated = {**_PAYLOAD, "severity": "minor", "title": "更新後タイトル"}
    r = client.put(f"{_NC}/{nc_id}", json=updated)
    assert r.status_code == 200
    assert r.json()["severity"] == "minor"
    assert r.json()["title"] == "更新後タイトル"


def test_delete_nonconformity() -> None:
    r = client.post(_NC, json=_PAYLOAD)
    nc_id = r.json()["nc_id"]
    r = client.delete(f"{_NC}/{nc_id}")
    assert r.status_code == 204
    r = client.get(f"{_NC}/{nc_id}")
    assert r.status_code == 404
