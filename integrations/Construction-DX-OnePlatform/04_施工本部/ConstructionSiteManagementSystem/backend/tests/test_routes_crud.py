"""施工プロジェクト・日報・勤怠・重機・原価・出来高ルートの CRUD テスト (04_施工本部).

dependency_overrides パターンで get_current_user / get_db_session をモック化し、
DB 接続なしにルートの業務ロジックを検証する。
"""

from __future__ import annotations

from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from cdx_auth.dependencies import get_current_user
from site_api.db.session import get_db_session
from site_api.main import create_app

_FAKE_USER = MagicMock(sub="test-user-001", email="test@cdx.example.com", name="テストユーザー")


# ── DB セッションモック ヘルパー ────────────────────────────────────────────


def _scalars_all(rows: list) -> MagicMock:
    """session.execute().scalars().all() → rows を返すモック."""
    r = MagicMock()
    r.scalars.return_value.all.return_value = rows
    return r


def _scalar_one(value: object) -> MagicMock:
    """session.execute().scalar_one() → value を返すモック."""
    r = MagicMock()
    r.scalar_one.return_value = value
    return r


def _scalar_one_or_none(value: object) -> MagicMock:
    """session.execute().scalar_one_or_none() → value を返すモック."""
    r = MagicMock()
    r.scalar_one_or_none.return_value = value
    return r


def _add_defaults(obj: object) -> None:
    """session.add() の副作用: id を DB 相当値に設定する."""
    obj.id = 1  # type: ignore[attr-defined]


def _make_client(
    *,
    execute_rv: MagicMock | None = None,
    execute_side_effects: list | None = None,
    get_rv: object = None,
) -> TestClient:
    """dependency_overrides 付き TestClient を生成する."""
    _app = create_app()
    _app.dependency_overrides[get_current_user] = lambda: _FAKE_USER

    async def _mock_db():  # type: ignore[return]
        session = AsyncMock()
        if execute_side_effects is not None:
            session.execute = AsyncMock(side_effect=execute_side_effects)
        elif execute_rv is not None:
            session.execute = AsyncMock(return_value=execute_rv)
        session.get = AsyncMock(return_value=get_rv)
        session.add = MagicMock(side_effect=_add_defaults)
        session.flush = AsyncMock()
        yield session

    _app.dependency_overrides[get_db_session] = _mock_db
    return TestClient(_app)


# ── プロジェクト ─────────────────────────────────────────────────────────────


def _project_mock(id_val: int = 1) -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.project_code = "PROJ-001"
    obj.project_name = "テスト施工現場"
    obj.site_address = "東京都渋谷区"
    obj.contract_amount = 1_000_000.0
    obj.start_date = None
    obj.end_date = None
    obj.status = "active"
    return obj


def test_projects_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/projects")
    assert r.status_code == 200
    assert r.json() == []


def test_projects_list_returns_data() -> None:
    client = _make_client(execute_rv=_scalars_all([_project_mock()]))
    r = client.get("/api/v1/projects")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["project_code"] == "PROJ-001"
    assert body[0]["status"] == "active"


def test_projects_create_returns_201() -> None:
    client = _make_client()
    payload = {"project_code": "PROJ-TEST-001", "project_name": "テスト新規プロジェクト"}
    r = client.post("/api/v1/projects", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["project_code"] == "PROJ-TEST-001"
    assert body["id"] == 1


def test_projects_get_by_id() -> None:
    mock_proj = _project_mock()
    client = _make_client(get_rv=mock_proj)
    r = client.get("/api/v1/projects/1")
    assert r.status_code == 200
    assert r.json()["project_code"] == "PROJ-001"


def test_projects_get_not_found() -> None:
    client = _make_client(get_rv=None)
    r = client.get("/api/v1/projects/999")
    assert r.status_code == 404


# ── 作業日報 ─────────────────────────────────────────────────────────────────


def _daily_report_mock(id_val: int = 1, approval_status: str = "draft") -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.project_id = 1
    obj.report_date = date(2026, 6, 1)
    obj.weather = None
    obj.temperature_max = None
    obj.temperature_min = None
    obj.work_content = None
    obj.safety_notes = None
    obj.ky_records = None
    obj.reporter_id = None
    obj.client_id = None
    obj.approval_status = approval_status
    return obj


def test_daily_reports_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/daily-reports")
    assert r.status_code == 200
    assert r.json() == []


def test_daily_reports_create_sets_draft() -> None:
    client = _make_client()
    payload = {"project_id": 1, "report_date": "2026-06-01", "weather": "晴れ"}
    r = client.post("/api/v1/daily-reports", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["approval_status"] == "draft"
    assert body["id"] == 1


def test_daily_reports_submit() -> None:
    mock_rec = _daily_report_mock(approval_status="draft")
    client = _make_client(get_rv=mock_rec)
    r = client.post("/api/v1/daily-reports/1/submit")
    assert r.status_code == 200
    # route sets rec.approval_status = "submitted" on mock
    assert r.json()["approval_status"] == "submitted"


def test_daily_reports_approve() -> None:
    # MagicMock.has_role() returns truthy → role check passes
    mock_rec = _daily_report_mock(approval_status="submitted")
    client = _make_client(get_rv=mock_rec)
    r = client.post("/api/v1/daily-reports/1/approve")
    assert r.status_code == 200
    assert r.json()["approval_status"] == "approved"


# ── 勤怠 QR ──────────────────────────────────────────────────────────────────


def test_attendance_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/attendance")
    assert r.status_code == 200
    assert r.json() == []


def test_attendance_qr_issue_returns_token() -> None:
    client = _make_client()
    with patch("site_api.routes.attendance.issue_token", return_value="qr-test-token-001"):
        r = client.post(
            "/api/v1/attendance/qr/issue",
            json={"project_id": 1, "worker_id": 42},
        )
    assert r.status_code == 200
    body = r.json()
    assert body["token"] == "qr-test-token-001"
    assert "expires_in" in body


def test_attendance_qr_checkin_returns_201() -> None:
    fake_payload = {"project_id": 1, "worker_id": 42, "jti": "jti-test-001"}
    client = _make_client()
    with patch("site_api.routes.attendance.verify_token", return_value=fake_payload):
        r = client.post(
            "/api/v1/attendance/qr/checkin",
            json={"token": "valid-token", "worker_name": "山田太郎", "direction": "in"},
        )
    assert r.status_code == 201
    body = r.json()
    assert body["worker_name"] == "山田太郎"
    assert body["method"] == "qr_code"


def test_attendance_qr_checkin_invalid_token_returns_400() -> None:
    client = _make_client()
    with patch(
        "site_api.routes.attendance.verify_token",
        side_effect=ValueError("expired token"),
    ):
        r = client.post(
            "/api/v1/attendance/qr/checkin",
            json={"token": "bad-token", "worker_name": "田中次郎", "direction": "in"},
        )
    assert r.status_code == 400


# ── 重機 ─────────────────────────────────────────────────────────────────────


def _equipment_mock(id_val: int = 1) -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.equipment_name = "バックホウ 0.7m3"
    obj.equipment_type = "excavator"
    obj.project_id = 1
    obj.gps_device_id = None
    obj.current_location_wkt = None
    obj.status = "active"
    obj.operating_hours = None
    return obj


def test_equipment_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/equipment")
    assert r.status_code == 200
    assert r.json() == []


def test_equipment_create_returns_201() -> None:
    client = _make_client()
    payload = {"equipment_name": "クローラクレーン 25t", "status": "active"}
    r = client.post("/api/v1/equipment", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["equipment_name"] == "クローラクレーン 25t"
    assert body["id"] == 1


def test_equipment_list_returns_data() -> None:
    client = _make_client(execute_rv=_scalars_all([_equipment_mock()]))
    r = client.get("/api/v1/equipment")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["equipment_name"] == "バックホウ 0.7m3"


# ── 原価記録 ─────────────────────────────────────────────────────────────────


def test_costs_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/cost-records")
    assert r.status_code == 200
    assert r.json() == []


def test_costs_create_returns_201() -> None:
    client = _make_client()
    payload = {
        "project_id": 1,
        "record_date": "2026-06-01",
        "cost_category": "labor",
        "amount": "150000.00",
    }
    r = client.post("/api/v1/cost-records", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["cost_category"] == "labor"
    assert body["id"] == 1


def test_costs_eac_returns_metrics() -> None:
    # BAC=1,000,000  AC=500,000  progress=60% → EV=600,000  CPI=1.2  EAC≈833,333
    project_mock = _project_mock()
    project_mock.contract_amount = 1_000_000.0
    client = _make_client(
        get_rv=project_mock,
        execute_side_effects=[_scalar_one(500_000.0), _scalar_one_or_none(60)],
    )
    r = client.get("/api/v1/cost-records/1/eac")
    assert r.status_code == 200
    body = r.json()
    assert body["bac"] == pytest.approx(1_000_000.0)
    assert body["ac"] == pytest.approx(500_000.0)
    assert body["progress_rate"] == pytest.approx(0.6, rel=1e-3)
    assert body["eac"] > 0


# ── 出来高 ────────────────────────────────────────────────────────────────────


def test_progress_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/projects/1/progress")
    assert r.status_code == 200
    assert r.json() == []


def test_progress_create_returns_201() -> None:
    client = _make_client()
    payload = {"record_date": "2026-06-01", "progress_rate": "45.5"}
    r = client.post("/api/v1/projects/1/progress", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert float(body["progress_rate"]) == pytest.approx(45.5, rel=1e-3)
    assert body["id"] == 1
