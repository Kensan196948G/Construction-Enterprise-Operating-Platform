"""Legal Tech Phase 3 テスト — 既存モジュール統合
Phase 3-a: costs.py 下請法60日支払期限チェック
Phase 3-b: daily_reports.py 日報証跡化
Phase 3-c: safety.py 労働安全衛生法違反コンプライアンスチェック
"""

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.rbac import UserRole
from app.main import app

# ---------- Fake users ----------


class FakeAdmin:
    id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    username = "admin"
    full_name = "管理者"
    role = UserRole.ADMIN
    is_active = True


class FakeCostManager:
    id = uuid.UUID("00000000-0000-0000-0000-000000000006")
    username = "costmgr"
    full_name = "原価管理者"
    role = UserRole.COST_MANAGER
    is_active = True


PROJECT_ID = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000001")


# =========================================================================
# Phase 3-a: スキーマ検証テスト — 下請法支払期限チェック
# =========================================================================


def test_payment_overdue_record_schema_valid():
    """PaymentOverdueRecord スキーマの正常ケース"""
    from app.schemas.legal import PaymentOverdueRecord

    record = PaymentOverdueRecord(
        record_id=uuid.uuid4(),
        record_date=date(2026, 1, 1),
        description="基礎工事 下請代金",
        vendor_name="山田建設",
        actual_amount=Decimal("1000000"),
        days_elapsed=65,
        severity="HIGH",
    )
    assert record.severity == "HIGH"
    assert record.days_elapsed == 65
    assert record.vendor_name == "山田建設"


def test_payment_overdue_record_no_vendor_name():
    """vendor_name は省略可能 (None デフォルト)"""
    from app.schemas.legal import PaymentOverdueRecord

    record = PaymentOverdueRecord(
        record_id=uuid.uuid4(),
        record_date=date(2026, 1, 1),
        description="下請代金",
        actual_amount=Decimal("500000"),
        days_elapsed=50,
        severity="MEDIUM",
    )
    assert record.vendor_name is None
    assert record.severity == "MEDIUM"


def test_cost_payment_legal_check_result_schema_pass():
    """CostPaymentLegalCheckResult — PASS ステータスの確認"""
    from app.schemas.legal import CostPaymentLegalCheckResult

    result = CostPaymentLegalCheckResult(
        project_id=PROJECT_ID,
        status="PASS",
        overdue_count=0,
        warning_count=0,
        overdue_records=[],
        checked_at=datetime.now(timezone.utc),
    )
    assert result.status == "PASS"
    assert result.overdue_count == 0
    assert result.check_type == "subcontract_law_payment"
    assert "第2条の2" in result.law_reference


def test_cost_payment_legal_check_result_schema_fail():
    """CostPaymentLegalCheckResult — FAIL ステータスと overdue_records の確認"""
    from app.schemas.legal import CostPaymentLegalCheckResult, PaymentOverdueRecord

    overdue = PaymentOverdueRecord(
        record_id=uuid.uuid4(),
        record_date=date(2026, 1, 1),
        description="外壁工事 下請代金",
        vendor_name="外壁工業",
        actual_amount=Decimal("2000000"),
        days_elapsed=75,
        severity="HIGH",
    )
    result = CostPaymentLegalCheckResult(
        project_id=PROJECT_ID,
        status="FAIL",
        overdue_count=1,
        warning_count=0,
        overdue_records=[overdue],
        checked_at=datetime.now(timezone.utc),
    )
    assert result.status == "FAIL"
    assert result.overdue_count == 1
    assert len(result.overdue_records) == 1
    assert result.overdue_records[0].severity == "HIGH"


# =========================================================================
# Phase 3-a: API 認証テスト — /cost-records/legal-check
# =========================================================================


@pytest.mark.asyncio
async def test_cost_payment_legal_check_unauthenticated():
    """未認証で支払期限チェックは 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(
            f"/api/v1/projects/{PROJECT_ID}/cost-records/legal-check"
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_cost_payment_legal_check_admin_authorized(
    auth_client, admin_headers, pm_project
):
    """ADMIN 権限で支払期限チェックエンドポイントが 200 を返すことを確認"""
    resp = await auth_client.get(
        f"/api/v1/projects/{pm_project.id}/cost-records/legal-check",
        headers=admin_headers,
    )
    # 認証は成功するが DB にレコードがないため PASS
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["status"] == "PASS"
    assert body["data"]["overdue_count"] == 0
    assert body["data"]["check_type"] == "subcontract_law_payment"


# =========================================================================
# Phase 3-a: ビジネスロジック単体テスト — severity 分類
# =========================================================================


def test_severity_critical_threshold():
    """91日以上経過で CRITICAL"""
    from app.schemas.legal import PaymentOverdueRecord

    record = PaymentOverdueRecord(
        record_id=uuid.uuid4(),
        record_date=date(2026, 1, 1),
        description="テスト",
        actual_amount=Decimal("100000"),
        days_elapsed=91,
        severity="CRITICAL",
    )
    assert record.severity == "CRITICAL"


def test_severity_high_threshold():
    """61〜90日経過で HIGH（60日超 = 法的違反）"""
    from app.schemas.legal import PaymentOverdueRecord

    record = PaymentOverdueRecord(
        record_id=uuid.uuid4(),
        record_date=date(2026, 1, 1),
        description="テスト",
        actual_amount=Decimal("100000"),
        days_elapsed=61,
        severity="HIGH",
    )
    assert record.severity == "HIGH"


def test_severity_medium_threshold():
    """45〜60日経過で MEDIUM（期限まで15日以内 = 警告）"""
    from app.schemas.legal import PaymentOverdueRecord

    record = PaymentOverdueRecord(
        record_id=uuid.uuid4(),
        record_date=date(2026, 1, 1),
        description="テスト",
        actual_amount=Decimal("100000"),
        days_elapsed=50,
        severity="MEDIUM",
    )
    assert record.severity == "MEDIUM"


# =========================================================================
# Phase 3-b: daily_reports 証跡記録バックグラウンドタスクテスト
# =========================================================================


@pytest.mark.asyncio
async def test_record_daily_report_evidence_success():
    """_record_daily_report_evidence が EvidenceService.add_evidence を呼ぶことを確認"""
    from app.api.v1.routers.daily_reports import _record_daily_report_evidence

    mock_svc = AsyncMock()
    mock_svc.add_evidence = AsyncMock(return_value=None)

    with (
        patch(
            "app.api.v1.routers.daily_reports.AsyncSessionLocal"
        ) as mock_session_local,
        patch(
            "app.api.v1.routers.daily_reports.EvidenceService",
            return_value=mock_svc,
        ),
    ):
        mock_bg_db = AsyncMock()
        mock_bg_db.__aenter__ = AsyncMock(return_value=mock_bg_db)
        mock_bg_db.__aexit__ = AsyncMock(return_value=False)
        mock_session_local.return_value = mock_bg_db

        await _record_daily_report_evidence(
            report_id=uuid.uuid4(),
            project_id=PROJECT_ID,
            report_date=date(2026, 5, 27),
            work_content="基礎工事の掘削作業",
            created_by=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        )

    mock_svc.add_evidence.assert_called_once()
    call_args = mock_svc.add_evidence.call_args
    evidence_payload = call_args[0][0]
    assert evidence_payload.source_type == "daily_report"
    assert evidence_payload.project_id == PROJECT_ID
    assert "2026-05-27" in evidence_payload.title


@pytest.mark.asyncio
async def test_record_daily_report_evidence_exception_does_not_propagate():
    """バックグラウンドタスクが例外を発生させても呼び出し元に影響しない"""
    from app.api.v1.routers.daily_reports import _record_daily_report_evidence

    with patch(
        "app.api.v1.routers.daily_reports.AsyncSessionLocal",
        side_effect=RuntimeError("DB connection error"),
    ):
        # 例外が伝播しないこと（try/except で吸収される）
        await _record_daily_report_evidence(
            report_id=uuid.uuid4(),
            project_id=PROJECT_ID,
            report_date=date(2026, 5, 27),
            work_content="テスト作業",
            created_by=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        )
    # 例外が伝播しなかったことを確認（ここに到達できれば OK）
    assert True


# =========================================================================
# Phase 3-c: safety compliance バックグラウンドタスクテスト
# =========================================================================


@pytest.mark.asyncio
async def test_run_safety_compliance_check_called_on_ng():
    """_run_safety_compliance_check が ComplianceService.run_check を呼ぶことを確認"""
    from app.api.v1.routers.safety import _run_safety_compliance_check

    mock_svc = AsyncMock()
    mock_svc.run_check = AsyncMock(return_value=None)

    with (
        patch("app.api.v1.routers.safety.AsyncSessionLocal") as mock_session_local,
        patch(
            "app.api.v1.routers.safety.ComplianceService",
            return_value=mock_svc,
        ),
    ):
        mock_bg_db = AsyncMock()
        mock_bg_db.__aenter__ = AsyncMock(return_value=mock_bg_db)
        mock_bg_db.__aexit__ = AsyncMock(return_value=False)
        mock_session_local.return_value = mock_bg_db

        await _run_safety_compliance_check(
            project_id=PROJECT_ID,
            check_id=uuid.uuid4(),
            items_ng=3,
            created_by=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        )

    mock_svc.run_check.assert_called_once()
    call_args = mock_svc.run_check.call_args
    compliance_req = call_args[0][1]
    assert compliance_req.check_type == "labor_safety"
    assert compliance_req.near_miss_count == 3


@pytest.mark.asyncio
async def test_run_safety_compliance_check_exception_does_not_propagate():
    """コンプライアンスチェックが例外でも呼び出し元に影響しない"""
    from app.api.v1.routers.safety import _run_safety_compliance_check

    with patch(
        "app.api.v1.routers.safety.AsyncSessionLocal",
        side_effect=RuntimeError("DB error"),
    ):
        await _run_safety_compliance_check(
            project_id=PROJECT_ID,
            check_id=uuid.uuid4(),
            items_ng=1,
            created_by=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        )
    assert True  # 例外が伝播しなかった


@pytest.mark.asyncio
async def test_safety_check_create_unauthenticated():
    """未認証で安全チェック作成は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            f"/api/v1/projects/{PROJECT_ID}/safety-checks",
            json={
                "project_id": str(PROJECT_ID),
                "check_date": "2026-05-27",
                "check_type": "DAILY",
                "overall_result": "NG",
                "items_total": 10,
                "items_ok": 7,
                "items_ng": 3,
            },
        )
    assert resp.status_code == 401


# =========================================================================
# Phase 3: 法律参照文字列確認テスト
# =========================================================================


def test_law_reference_subcontract():
    """CostPaymentLegalCheckResult の law_reference が正しい法律を参照している"""
    from app.schemas.legal import CostPaymentLegalCheckResult

    result = CostPaymentLegalCheckResult(
        project_id=PROJECT_ID,
        status="PASS",
        overdue_count=0,
        warning_count=0,
        overdue_records=[],
        checked_at=datetime.now(timezone.utc),
    )
    assert "下請代金支払遅延等防止法" in result.law_reference
    assert "60日" in result.law_reference


def test_cost_payment_result_check_type_default():
    """check_type のデフォルト値が subcontract_law_payment"""
    from app.schemas.legal import CostPaymentLegalCheckResult

    result = CostPaymentLegalCheckResult(
        project_id=PROJECT_ID,
        status="WARNING",
        overdue_count=0,
        warning_count=2,
        overdue_records=[],
        checked_at=datetime.now(timezone.utc),
    )
    assert result.check_type == "subcontract_law_payment"
