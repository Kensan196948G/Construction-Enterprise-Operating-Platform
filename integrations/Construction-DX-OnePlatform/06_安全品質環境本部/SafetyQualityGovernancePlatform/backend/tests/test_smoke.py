"""FastAPI smoke tests."""
from fastapi.testclient import TestClient
from sq_api.main import app

client = TestClient(app)


def test_health() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_near_miss_create_list_analysis() -> None:
    payload = {
        "occurred_at": "2026-05-22T09:00:00+09:00",
        "description": "資材置場で躓きそうになった",
        "cause_analysis": {"man": True, "machine": False, "material": True, "method": False},
        "risk_level": "medium",
    }
    r = client.post("/api/v1/near-miss", json=payload)
    assert r.status_code == 201

    r = client.get("/api/v1/near-miss/analysis")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert body["by_4m"].get("man", 0) >= 1


def test_accidents_stats() -> None:
    client.post(
        "/api/v1/accidents",
        json={
            "occurred_at": "2026-04-01T10:00:00+09:00",
            "severity": "minor",
            "injuries": 2,
            "lost_days": 100,
            "total_work_hours": 1_000_000,
        },
    )
    r = client.get("/api/v1/accidents/stats?total_work_hours=1000000")
    assert r.status_code == 200
    body = r.json()
    assert body["frequency_rate"] >= 2.0


def test_iso_checklist() -> None:
    r = client.get("/api/v1/iso-audits/checklist-template?standard=ISO45001")
    assert r.status_code == 200
    assert len(r.json()["items"]) >= 3


def test_ai_predict_risk() -> None:
    r = client.post(
        "/api/v1/ai/predict-risk",
        json={"work_content": "高所作業", "workers": 5, "hazards": ["fall", "wind"]},
    )
    assert r.status_code == 200
    assert "risk_level" in r.json()
