"""顧客・案件・入札・見積・契約・活動・ダッシュボードルートの CRUD テスト (02_営業本部).

dependency_overrides パターンで get_current_user / get_db_session をモック化し、
DB 接続なしにルートの業務ロジックを検証する。
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from cdx_auth.dependencies import get_current_user
from crm_api.db.session import get_db_session
from crm_api.main import create_app

_FAKE_USER = MagicMock(sub="test-user-001", email="test@cdx.example.com", name="テストユーザー")


# ── DB セッションモック ヘルパー ────────────────────────────────────────────


def _scalars_all(rows: list) -> MagicMock:
    """session.execute().scalars().all() → rows を返すモック."""
    r = MagicMock()
    r.scalars.return_value.all.return_value = rows
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
    scalar_side_effects: list | None = None,
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
        if scalar_side_effects is not None:
            session.scalar = AsyncMock(side_effect=scalar_side_effects)
        session.get = AsyncMock(return_value=get_rv)
        session.add = MagicMock(side_effect=_add_defaults)
        session.flush = AsyncMock()
        yield session

    _app.dependency_overrides[get_db_session] = _mock_db
    return TestClient(_app)


# ── 顧客 ──────────────────────────────────────────────────────────────────


def _client_mock(id_val: int = 1, credit_rank: str = "A") -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.client_code = "CLI-001"
    obj.client_name = "テスト建設株式会社"
    obj.client_type = "corporate"
    obj.industry = "建設"
    obj.address = "東京都渋谷区"
    obj.phone = None
    obj.email = None
    obj.credit_rank = credit_rank
    obj.credit_limit = None
    obj.relationship_score = Decimal("0")
    obj.notes = None
    return obj


def test_clients_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/clients")
    assert r.status_code == 200
    assert r.json() == []


def test_clients_create_returns_201() -> None:
    client = _make_client()
    payload = {"client_code": "CLI-TEST-001", "client_name": "テスト顧客", "client_type": "private"}
    r = client.post("/api/v1/clients", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["client_code"] == "CLI-TEST-001"
    assert body["id"] == 1


def test_clients_get_by_id() -> None:
    mock_cli = _client_mock()
    client = _make_client(get_rv=mock_cli)
    r = client.get("/api/v1/clients/1")
    assert r.status_code == 200
    assert r.json()["client_code"] == "CLI-001"


def test_clients_get_not_found() -> None:
    client = _make_client(get_rv=None)
    r = client.get("/api/v1/clients/999")
    assert r.status_code == 404


def test_clients_credit_assessment_updates_rank() -> None:
    mock_cli = _client_mock(credit_rank="B")
    client = _make_client(get_rv=mock_cli)
    r = client.post("/api/v1/clients/1/credit-assessment", json={"credit_rank": "A"})
    assert r.status_code == 200
    # route sets client.credit_rank = "A" on mock
    assert r.json()["credit_rank"] == "A"


# ── 案件パイプライン ──────────────────────────────────────────────────────


def _opportunity_mock(id_val: int = 1, stage: str = "lead") -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.opportunity_code = "OPP-001"
    obj.title = "テスト案件"
    obj.client_id = 1
    obj.stage = stage
    obj.project_type = "private"
    obj.work_category = None
    obj.win_probability = Decimal("0.5")
    obj.expected_amount = Decimal("5000000")
    obj.expected_close_date = None
    obj.owner_employee_code = None
    obj.description = None
    return obj


def test_opportunities_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/opportunities")
    assert r.status_code == 200
    assert r.json() == []


def test_opportunities_create_returns_201() -> None:
    client = _make_client()
    payload = {
        "opportunity_code": "OPP-TEST-001",
        "title": "テスト新規案件",
        "client_id": 1,
        "stage": "lead",
    }
    r = client.post("/api/v1/opportunities", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["opportunity_code"] == "OPP-TEST-001"
    assert body["id"] == 1


def test_opportunities_patch_updates_stage() -> None:
    mock_opp = _opportunity_mock(stage="lead")
    client = _make_client(get_rv=mock_opp)
    r = client.patch("/api/v1/opportunities/1", json={"stage": "proposal"})
    assert r.status_code == 200
    assert r.json()["stage"] == "proposal"


def test_opportunities_get_by_id() -> None:
    mock_opp = _opportunity_mock()
    client = _make_client(get_rv=mock_opp)
    r = client.get("/api/v1/opportunities/1")
    assert r.status_code == 200
    assert r.json()["opportunity_code"] == "OPP-001"


def test_opportunities_get_not_found() -> None:
    client = _make_client(get_rv=None)
    r = client.get("/api/v1/opportunities/999")
    assert r.status_code == 404


def test_opportunities_forecast_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/opportunities/forecast/summary")
    assert r.status_code == 200
    body = r.json()
    assert body["total_count"] == 0
    assert body["model_used"] == "weighted_average"


# ── 入札 ──────────────────────────────────────────────────────────────────


def _bid_mock(id_val: int = 1) -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.bid_code = "BID-001"
    obj.opportunity_id = None
    obj.bid_type = "public"
    obj.bid_method = None
    obj.issuer_name = "国土交通省"
    obj.project_name = "○○道路整備工事"
    obj.announcement_date = None
    obj.bid_date = None
    obj.award_date = None
    obj.bid_price = Decimal("98000000")
    obj.estimated_price = Decimal("100000000")
    obj.award_price = None
    obj.technical_score = None
    obj.price_score = None
    obj.evaluation_score = None
    obj.result = "pending"
    obj.winner_name = None
    obj.remarks = None
    return obj


def test_bids_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/bids")
    assert r.status_code == 200
    assert r.json() == []


def test_bids_create_returns_201() -> None:
    client = _make_client()
    payload = {
        "bid_code": "BID-TEST-001",
        "issuer_name": "国土交通省",
        "project_name": "テスト橋梁工事",
        "bid_type": "public",
    }
    r = client.post("/api/v1/bids", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["bid_code"] == "BID-TEST-001"
    assert body["id"] == 1


def test_bids_get_by_id() -> None:
    mock_bid = _bid_mock()
    client = _make_client(get_rv=mock_bid)
    r = client.get("/api/v1/bids/1")
    assert r.status_code == 200
    assert r.json()["bid_code"] == "BID-001"


def test_bids_get_not_found() -> None:
    client = _make_client(get_rv=None)
    r = client.get("/api/v1/bids/999")
    assert r.status_code == 404


def test_bids_stats_returns_summary() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/bids/stats/summary")
    assert r.status_code == 200
    body = r.json()
    assert body["total_count"] == 0
    assert "win_rate" in body


# ── 見積 ──────────────────────────────────────────────────────────────────


def _quotation_mock(id_val: int = 1) -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.quotation_number = "Q-001"
    obj.version = 1
    obj.client_id = 1
    obj.opportunity_id = None
    obj.title = "テスト見積書"
    obj.subtotal_amount = Decimal("1000000")
    obj.tax_amount = Decimal("100000")
    obj.total_amount = Decimal("1100000")
    obj.issue_date = None
    obj.valid_until = None
    obj.status = "draft"
    obj.pdf_path = None
    obj.pdf_sha256 = None
    return obj


def test_quotations_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/quotations")
    assert r.status_code == 200
    assert r.json() == []


def test_quotations_create_returns_201() -> None:
    # execute returns None (no prior version) → version=1
    client = _make_client(execute_rv=_scalar_one_or_none(None))
    payload = {
        "quotation_number": "Q-TEST-001",
        "client_id": 1,
        "title": "テスト見積書",
    }
    r = client.post("/api/v1/quotations", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["quotation_number"] == "Q-TEST-001"
    assert body["version"] == 1
    assert body["id"] == 1


def test_quotations_get_by_id() -> None:
    mock_q = _quotation_mock()
    client = _make_client(get_rv=mock_q)
    r = client.get("/api/v1/quotations/1")
    assert r.status_code == 200
    assert r.json()["quotation_number"] == "Q-001"


def test_quotations_get_not_found() -> None:
    client = _make_client(get_rv=None)
    r = client.get("/api/v1/quotations/999")
    assert r.status_code == 404


# ── 契約 (J-SOX 与信ゲート) ─────────────────────────────────────────────


def _contract_mock(id_val: int = 1) -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.contract_number = "CTR-001"
    obj.client_id = 1
    obj.opportunity_id = None
    obj.quotation_id = None
    obj.project_name = "テスト建設工事"
    obj.work_site = None
    obj.contract_amount = Decimal("5000000")
    obj.contract_date = None
    obj.work_start_date = None
    obj.work_end_date = None
    obj.status = "draft"
    obj.payment_terms = None
    obj.remarks = None
    return obj


def test_contracts_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/contracts")
    assert r.status_code == 200
    assert r.json() == []


def test_contracts_create_returns_201() -> None:
    # session.get returns client with credit_rank="A" → passes J-SOX gate
    mock_cli = _client_mock(credit_rank="A")
    client = _make_client(get_rv=mock_cli)
    payload = {
        "contract_number": "CTR-TEST-001",
        "client_id": 1,
        "project_name": "テスト建設工事",
        "contract_amount": "3000000",
    }
    r = client.post("/api/v1/contracts", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["contract_number"] == "CTR-TEST-001"
    assert body["id"] == 1


def test_contracts_create_credit_ng_rank_d() -> None:
    """J-SOX 業務統制: credit_rank=D の顧客に対して契約作成を拒否する."""
    bad_client = MagicMock()
    bad_client.credit_rank = "D"
    bad_client.credit_limit = None
    client = _make_client(get_rv=bad_client)
    payload = {
        "contract_number": "CTR-NG-001",
        "client_id": 1,
        "project_name": "NG案件",
        "contract_amount": "1000000",
    }
    r = client.post("/api/v1/contracts", json=payload)
    assert r.status_code == 422


def test_contracts_create_credit_ng_unrated() -> None:
    """J-SOX 業務統制: credit_rank=未評価 の顧客に対して契約作成を拒否する."""
    bad_client = MagicMock()
    bad_client.credit_rank = "未評価"
    bad_client.credit_limit = None
    client = _make_client(get_rv=bad_client)
    payload = {
        "contract_number": "CTR-NG-002",
        "client_id": 2,
        "project_name": "未評価NG案件",
        "contract_amount": "500000",
    }
    r = client.post("/api/v1/contracts", json=payload)
    assert r.status_code == 422


def test_contracts_get_by_id() -> None:
    mock_ctr = _contract_mock()
    client = _make_client(get_rv=mock_ctr)
    r = client.get("/api/v1/contracts/1")
    assert r.status_code == 200
    assert r.json()["contract_number"] == "CTR-001"


# ── 営業活動 ─────────────────────────────────────────────────────────────


def _activity_mock(id_val: int = 1) -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.activity_date = date(2026, 6, 1)
    obj.activity_type = "visit"
    obj.client_id = 1
    obj.opportunity_id = None
    obj.subject = "テスト訪問"
    obj.contact_person = None
    obj.content = None
    obj.result = None
    obj.follow_up_date = None
    obj.follow_up_action = None
    obj.reporter_employee_code = None
    obj.follow_up_completed_at = None
    return obj


def test_activities_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/activities")
    assert r.status_code == 200
    assert r.json() == []


def test_activities_create_returns_201() -> None:
    client = _make_client()
    payload = {
        "activity_date": "2026-06-01",
        "activity_type": "visit",
        "client_id": 1,
        "subject": "テスト顧客訪問",
    }
    r = client.post("/api/v1/activities", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["subject"] == "テスト顧客訪問"
    assert body["id"] == 1


def test_activities_get_by_id() -> None:
    mock_act = _activity_mock()
    client = _make_client(get_rv=mock_act)
    r = client.get("/api/v1/activities/1")
    assert r.status_code == 200
    assert r.json()["activity_type"] == "visit"


# ── ダッシュボード ─────────────────────────────────────────────────────────


def test_dashboard_summary_returns_counts() -> None:
    # session.scalar() is called 7 times: pipe_count, pipe_amount, won_count, won_amount,
    # lost_count, contract_count, contract_amount
    client = _make_client(scalar_side_effects=[10, 5_000_000, 3, 2_000_000, 2, 8, 10_000_000])
    r = client.get("/api/v1/dashboard/summary")
    assert r.status_code == 200
    body = r.json()
    assert body["pipeline_count"] == 10
    assert body["won_count"] == 3
    assert body["lost_count"] == 2
    assert body["contract_count"] == 8
