"""Legal Tech Phase 2 テスト — 証跡タイムライン + コンプライアンスチェック"""

import uuid
from datetime import date, datetime, timezone

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


class FakeViewer:
    id = uuid.UUID("00000000-0000-0000-0000-000000000005")
    username = "viewer"
    full_name = "閲覧者"
    role = UserRole.VIEWER
    is_active = True


PROJECT_ID = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000001")


# =========================================================================
# 証跡タイムライン API — 認証テスト
# =========================================================================


@pytest.mark.asyncio
async def test_evidence_timeline_unauthenticated():
    """未認証で証跡タイムラインは 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(f"/api/v1/legal/evidence/{PROJECT_ID}/timeline")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_add_evidence_unauthenticated():
    """未認証で証跡追加は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            f"/api/v1/legal/evidence/{PROJECT_ID}",
            json={
                "project_id": str(PROJECT_ID),
                "source_type": "daily_report",
                "title": "テスト証跡",
                "event_date": "2026-05-01",
            },
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_verify_evidence_unauthenticated():
    """未認証で整合性検証は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(f"/api/v1/legal/evidence/{PROJECT_ID}/verify")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_evidence_entry_unauthenticated():
    """未認証で証跡詳細取得は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(f"/api/v1/legal/evidence/entry/{uuid.uuid4()}")
    assert resp.status_code == 401


# =========================================================================
# コンプライアンスチェック API — 認証テスト
# =========================================================================


@pytest.mark.asyncio
async def test_compliance_check_unauthenticated():
    """未認証でコンプライアンスチェックは 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            f"/api/v1/legal/compliance/{PROJECT_ID}/check",
            json={"check_type": "all"},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_compliance_status_unauthenticated():
    """未認証でコンプライアンスステータスは 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(f"/api/v1/legal/compliance/{PROJECT_ID}/status")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_compliance_history_unauthenticated():
    """未認証でコンプライアンス履歴は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(f"/api/v1/legal/compliance/{PROJECT_ID}/history")
    assert resp.status_code == 401


# =========================================================================
# スキーマ検証テスト
# =========================================================================


def test_legal_evidence_create_valid():
    """LegalEvidenceCreate スキーマの正常ケース"""
    from app.schemas.legal import LegalEvidenceCreate

    ev = LegalEvidenceCreate(
        project_id=PROJECT_ID,
        source_type="daily_report",
        title="基礎工事 日報",
        event_date=date(2026, 5, 1),
    )
    assert ev.source_type == "daily_report"
    assert ev.content_hash is None


def test_legal_evidence_create_invalid_source_type():
    """無効な source_type でバリデーションエラー"""
    from pydantic import ValidationError

    from app.schemas.legal import LegalEvidenceCreate

    with pytest.raises(ValidationError):
        LegalEvidenceCreate(
            project_id=PROJECT_ID,
            source_type="invalid_type",
            title="テスト",
            event_date=date(2026, 5, 1),
        )


def test_compliance_check_request_valid():
    """ComplianceCheckRequest スキーマの正常ケース"""
    from app.schemas.legal import ComplianceCheckRequest

    req = ComplianceCheckRequest(
        check_type="subcontract_law",
        payment_overdue_days=30,
    )
    assert req.check_type == "subcontract_law"
    assert req.payment_overdue_days == 30


def test_compliance_check_request_invalid_check_type():
    """無効な check_type でバリデーションエラー"""
    from pydantic import ValidationError

    from app.schemas.legal import ComplianceCheckRequest

    with pytest.raises(ValidationError):
        ComplianceCheckRequest(check_type="invalid_law")


def test_compliance_violation_schema():
    """ComplianceViolation スキーマの基本確認"""
    from app.schemas.legal import ComplianceViolation

    v = ComplianceViolation(
        law="subcontract_law",
        article="下請代金支払遅延等防止法第2条の2",
        description="支払期限超過",
        severity="CRITICAL",
        recommendation="直ちに支払い手続きを実施してください",
    )
    assert v.severity == "CRITICAL"


def test_legal_evidence_timeline_schema():
    """LegalEvidenceTimeline スキーマの基本確認"""
    from app.schemas.legal import LegalEvidenceTimeline

    timeline = LegalEvidenceTimeline(
        project_id=PROJECT_ID,
        total_entries=0,
        entries=[],
        integrity_ok=True,
        evaluated_at=datetime.now(timezone.utc),
    )
    assert timeline.integrity_ok is True
    assert timeline.total_entries == 0


def test_evidence_verify_result_schema():
    """EvidenceVerifyResult スキーマの基本確認"""
    from app.schemas.legal import EvidenceVerifyResult

    result = EvidenceVerifyResult(
        project_id=PROJECT_ID,
        total_checked=5,
        hash_mismatches=0,
        tampered_ids=[],
        integrity_ok=True,
        verified_at=datetime.now(timezone.utc),
    )
    assert result.integrity_ok is True
    assert result.hash_mismatches == 0


def test_compliance_status_summary_not_checked():
    """ComplianceStatusSummary: チェック未実施の初期状態"""
    from app.schemas.legal import ComplianceStatusSummary

    summary = ComplianceStatusSummary(
        project_id=PROJECT_ID,
        latest_check_id=None,
        overall_status="NOT_CHECKED",
        overall_score=None,
        critical_violations=0,
        high_violations=0,
        last_checked_at=None,
    )
    assert summary.overall_status == "NOT_CHECKED"
    assert summary.latest_check_id is None


# =========================================================================
# ルールベースコンプライアンスエンジン ユニットテスト
# =========================================================================


@pytest.mark.asyncio
async def test_rule_based_compliance_pass():
    """ルールベース: 問題なし → PASS"""
    from app.schemas.legal import ComplianceCheckRequest
    from app.services.legal.compliance_service import _rule_based_compliance

    req = ComplianceCheckRequest(
        check_type="all",
        payment_overdue_days=10,
        near_miss_count=0,
        project_summary="適切な建設プロジェクト",
    )
    status, score, violations, recs = _rule_based_compliance(req)
    assert status == "PASS"
    assert score >= 85
    assert all(v.severity not in ("CRITICAL", "HIGH") for v in violations)


@pytest.mark.asyncio
async def test_rule_based_compliance_subcontract_critical():
    """ルールベース: 下請法 支払期限超過61日 → CRITICAL 違反"""
    from app.schemas.legal import ComplianceCheckRequest
    from app.services.legal.compliance_service import _rule_based_compliance

    req = ComplianceCheckRequest(
        check_type="subcontract_law",
        payment_overdue_days=61,
    )
    status, score, violations, recs = _rule_based_compliance(req)
    assert status == "FAIL"
    assert any(v.severity == "CRITICAL" for v in violations)
    assert any(v.law == "subcontract_law" for v in violations)
    assert score < 50


@pytest.mark.asyncio
async def test_rule_based_compliance_subcontract_warning():
    """ルールベース: 下請法 支払期限48日 → HIGH 警告"""
    from app.schemas.legal import ComplianceCheckRequest
    from app.services.legal.compliance_service import _rule_based_compliance

    req = ComplianceCheckRequest(
        check_type="subcontract_law",
        payment_overdue_days=48,
    )
    status, score, violations, recs = _rule_based_compliance(req)
    assert any(v.severity == "HIGH" for v in violations)
    assert status in ("WARNING", "FAIL")


@pytest.mark.asyncio
async def test_rule_based_compliance_labor_safety_high():
    """ルールベース: ヒヤリハット5件以上 → HIGH 違反"""
    from app.schemas.legal import ComplianceCheckRequest
    from app.services.legal.compliance_service import _rule_based_compliance

    req = ComplianceCheckRequest(
        check_type="labor_safety",
        near_miss_count=5,
    )
    status, score, violations, recs = _rule_based_compliance(req)
    assert any(v.law == "labor_safety" for v in violations)
    assert any(v.severity == "HIGH" for v in violations)


@pytest.mark.asyncio
async def test_rule_based_compliance_labor_safety_medium():
    """ルールベース: ヒヤリハット2件 → MEDIUM 警告"""
    from app.schemas.legal import ComplianceCheckRequest
    from app.services.legal.compliance_service import _rule_based_compliance

    req = ComplianceCheckRequest(
        check_type="labor_safety",
        near_miss_count=2,
    )
    status, score, violations, recs = _rule_based_compliance(req)
    assert any(v.severity == "MEDIUM" for v in violations)


@pytest.mark.asyncio
async def test_rule_based_compliance_construction_law_critical():
    """ルールベース: 一括下請負 → CRITICAL"""
    from app.schemas.legal import ComplianceCheckRequest
    from app.services.legal.compliance_service import _rule_based_compliance

    req = ComplianceCheckRequest(
        check_type="construction_law",
        project_summary="一括下請で全工事を外注",
    )
    status, score, violations, recs = _rule_based_compliance(req)
    assert any(v.law == "construction_law" for v in violations)
    assert any(v.severity == "CRITICAL" for v in violations)


@pytest.mark.asyncio
async def test_rule_based_compliance_score_floor():
    """ルールベース: 複数違反でもスコアは 0 未満にならない"""
    from app.schemas.legal import ComplianceCheckRequest
    from app.services.legal.compliance_service import _rule_based_compliance

    req = ComplianceCheckRequest(
        check_type="all",
        payment_overdue_days=90,
        near_miss_count=10,
        project_summary="一括下請負を実施",
    )
    _, score, _, _ = _rule_based_compliance(req)
    assert score >= 0


# =========================================================================
# EvidenceService ユニットテスト（ハッシュ自動計算）
# =========================================================================


@pytest.mark.asyncio
async def test_evidence_service_auto_hash(mocker):
    """content_hash 未指定時に SHA-256 が自動計算される"""
    from app.schemas.legal import LegalEvidenceCreate
    from app.services.legal.evidence_service import EvidenceService

    db = mocker.AsyncMock()
    svc = EvidenceService(db)

    # Mock the repository
    mock_evidence = mocker.MagicMock()
    mock_evidence.id = uuid.uuid4()
    mock_evidence.project_id = PROJECT_ID
    mock_evidence.source_type = "daily_report"
    mock_evidence.source_id = None
    mock_evidence.title = "テスト日報"
    mock_evidence.description = None
    mock_evidence.event_date = date(2026, 5, 1)
    mock_evidence.content_hash = "a" * 64  # will be overwritten
    mock_evidence.metadata_json = None
    mock_evidence.created_at = datetime.now(timezone.utc)
    mock_evidence.created_by = uuid.uuid4()

    mocker.patch.object(svc.repo, "create", return_value=mock_evidence)

    data = LegalEvidenceCreate(
        project_id=PROJECT_ID,
        source_type="daily_report",
        title="テスト日報",
        event_date=date(2026, 5, 1),
        # content_hash is NOT provided
    )

    resp = await svc.add_evidence(data, created_by=uuid.uuid4())
    assert resp is not None

    # Verify that create was called with a non-None hash
    call_args = svc.repo.create.call_args
    assert call_args is not None
    passed_data = call_args[0][0]
    assert passed_data.content_hash is not None
    assert len(passed_data.content_hash) == 64


@pytest.mark.asyncio
async def test_evidence_service_existing_hash_preserved(mocker):
    """content_hash 指定時は既存値を保持する"""
    import hashlib

    from app.schemas.legal import LegalEvidenceCreate
    from app.services.legal.evidence_service import EvidenceService

    db = mocker.AsyncMock()
    svc = EvidenceService(db)

    existing_hash = hashlib.sha256(b"external-hash-value").hexdigest()

    mock_evidence = mocker.MagicMock()
    mock_evidence.id = uuid.uuid4()
    mock_evidence.project_id = PROJECT_ID
    mock_evidence.source_type = "contract"
    mock_evidence.source_id = None
    mock_evidence.title = "契約書スキャン"
    mock_evidence.description = None
    mock_evidence.event_date = date(2026, 5, 15)
    mock_evidence.content_hash = existing_hash
    mock_evidence.metadata_json = None
    mock_evidence.created_at = datetime.now(timezone.utc)
    mock_evidence.created_by = uuid.uuid4()

    mocker.patch.object(svc.repo, "create", return_value=mock_evidence)

    data = LegalEvidenceCreate(
        project_id=PROJECT_ID,
        source_type="contract",
        title="契約書スキャン",
        event_date=date(2026, 5, 15),
        content_hash=existing_hash,
    )

    await svc.add_evidence(data, created_by=uuid.uuid4())
    call_args = svc.repo.create.call_args
    passed_data = call_args[0][0]
    assert passed_data.content_hash == existing_hash
