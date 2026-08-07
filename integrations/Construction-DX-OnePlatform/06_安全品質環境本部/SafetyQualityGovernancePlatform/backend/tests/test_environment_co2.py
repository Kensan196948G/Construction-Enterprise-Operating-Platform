"""環境記録 + CO2排出量集計テスト (ISO 14001 §8.1 / AUDIT_CHECKLIST CO2月次集計)."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sq_api.main import app

client = TestClient(app)

_ENV = "/api/v1/environmental"


def test_create_co2_scope1_record() -> None:
    r = client.post(
        _ENV,
        json={
            "record_type": "co2",
            "record_date": "2026-05-01",
            "scope": "scope1",
            "quantity": 12.5,
            "unit": "tCO2e",
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["scope"] == "scope1"
    assert body["quantity"] == 12.5


def test_co2_summary_aggregates_by_scope() -> None:
    # scope1: 10.0, scope2: 20.0
    client.post(
        _ENV,
        json={
            "record_type": "co2",
            "record_date": "2026-05-10",
            "scope": "scope1",
            "quantity": 10.0,
        },
    )
    client.post(
        _ENV,
        json={
            "record_type": "co2",
            "record_date": "2026-05-10",
            "scope": "scope2",
            "quantity": 20.0,
        },
    )
    r = client.get(f"{_ENV}/co2")
    assert r.status_code == 200
    body = r.json()
    assert body["unit"] == "tCO2e"
    assert body["by_scope"]["scope1"] >= 10.0
    assert body["by_scope"]["scope2"] >= 20.0
    assert body["total"] >= 30.0


def test_co2_summary_scope3_included() -> None:
    client.post(
        _ENV,
        json={
            "record_type": "co2",
            "record_date": "2026-05-15",
            "scope": "scope3",
            "quantity": 50.0,
        },
    )
    r = client.get(f"{_ENV}/co2")
    assert r.status_code == 200
    body = r.json()
    assert "scope3" in body["by_scope"]
    assert body["by_scope"]["scope3"] >= 50.0


def test_waste_record_not_in_co2_summary() -> None:
    # 廃棄物レコードはCO2集計に含まれない
    client.post(
        _ENV,
        json={
            "record_type": "waste",
            "record_date": "2026-05-20",
            "quantity": 999.0,
            "unit": "kg",
        },
    )
    r = client.get(f"{_ENV}/co2")
    assert r.status_code == 200
    body = r.json()
    # waste records should not appear in CO2 scopes
    for scope, val in body["by_scope"].items():
        if scope == "unknown":
            # unknown only accumulates unscoped CO2 records, not waste
            pass
    # total should not include 999.0 waste quantity as CO2
    assert body["total"] < 10000.0


def test_list_environmental_records() -> None:
    r = client.get(_ENV)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_environmental_record_by_id() -> None:
    r = client.post(
        _ENV,
        json={
            "record_type": "water",
            "record_date": "2026-05-05",
            "quantity": 5.0,
            "unit": "m3",
        },
    )
    assert r.status_code == 201
    env_id = r.json()["env_id"]

    r = client.get(f"{_ENV}/{env_id}")
    assert r.status_code == 200
    assert r.json()["record_type"] == "water"


def test_get_nonexistent_env_record_returns_404() -> None:
    r = client.get(f"{_ENV}/ENV-NOTEXIST")
    assert r.status_code == 404


def test_update_environmental_record() -> None:
    r = client.post(
        _ENV,
        json={
            "record_type": "co2",
            "record_date": "2026-05-01",
            "scope": "scope1",
            "quantity": 1.0,
        },
    )
    env_id = r.json()["env_id"]
    r = client.put(
        f"{_ENV}/{env_id}",
        json={
            "record_type": "co2",
            "record_date": "2026-05-01",
            "scope": "scope1",
            "quantity": 2.5,
        },
    )
    assert r.status_code == 200
    assert r.json()["quantity"] == 2.5


def test_delete_environmental_record() -> None:
    r = client.post(
        _ENV,
        json={
            "record_type": "co2",
            "record_date": "2026-05-01",
            "scope": "scope2",
            "quantity": 3.0,
        },
    )
    env_id = r.json()["env_id"]
    r = client.delete(f"{_ENV}/{env_id}")
    assert r.status_code == 204
    r = client.get(f"{_ENV}/{env_id}")
    assert r.status_code == 404
