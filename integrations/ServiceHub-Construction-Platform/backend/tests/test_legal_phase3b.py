"""Legal Tech Phase 3b テスト — ダッシュボード/通知/ナレッジ/写真 統合
Phase 3b-1: dashboard.py  GET /dashboard/legal-risks
Phase 3b-2: notifications.py GET /notifications/legal-deadlines
Phase 3b-3: knowledge.py  GET /knowledge/articles/legal
           knowledge.py  POST /knowledge/articles/{id}/tag-legal
Phase 3b-4: photos.py    POST /projects/{id}/photos/{photo_id}/evidence
            photos.py    GET  /projects/{id}/photos/evidence
"""

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

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


class FakeProjectManager:
    id = uuid.UUID("00000000-0000-0000-0000-000000000002")
    username = "pm"
    full_name = "PM"
    role = UserRole.PROJECT_MANAGER
    is_active = True


PROJECT_ID = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000001")
PHOTO_ID = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000001")
ARTICLE_ID = uuid.UUID("cccccccc-0000-0000-0000-000000000001")


# =========================================================================
# Phase 3b-1: スキーマ検証テスト — Legal Risk Dashboard
# =========================================================================


def test_legal_risk_project_entry_schema():
    """LegalRiskProjectEntry スキーマの正常ケース"""
    from app.schemas.legal import LegalRiskProjectEntry

    entry = LegalRiskProjectEntry(
        project_id=PROJECT_ID,
        project_name="テスト工事",
        risk_level="HIGH",
        contracts_total=5,
        contracts_critical=0,
        contracts_high=2,
        compliance_status="WARNING",
        expiring_in_30d=1,
    )
    assert entry.risk_level == "HIGH"
    assert entry.contracts_total == 5
    assert entry.expiring_in_30d == 1


def test_legal_risk_dashboard_schema():
    """LegalRiskDashboard スキーマの正常ケース"""
    from app.schemas.legal import LegalRiskDashboard

    dashboard = LegalRiskDashboard(
        total_contracts=10,
        critical_count=1,
        high_count=3,
        medium_count=4,
        low_count=2,
        compliance_failures=2,
        compliance_warnings=1,
        expiring_30d=2,
        expiring_60d=4,
        projects=[],
        evaluated_at=datetime.now(timezone.utc),
    )
    assert dashboard.total_contracts == 10
    assert dashboard.critical_count == 1
    assert dashboard.compliance_failures == 2


# =========================================================================
# Phase 3b-2: スキーマ検証テスト — Contract Deadline Alert
# =========================================================================


def test_contract_deadline_alert_schema():
    """ContractDeadlineAlert スキーマ — urgency 区分確認"""
    from app.schemas.legal import ContractDeadlineAlert

    alert = ContractDeadlineAlert(
        contract_id=uuid.uuid4(),
        project_id=PROJECT_ID,
        project_name="橋梁工事",
        contract_number="CNT-001",
        title="元請け契約",
        period_end=date(2026, 7, 14),
        days_until_expiry=6,
        urgency="CRITICAL",
        contract_type="PRIME",
        amount=Decimal("50000000"),
    )
    assert alert.urgency == "CRITICAL"
    assert alert.days_until_expiry == 6


def test_legal_deadline_notification_schema():
    """LegalDeadlineNotification スキーマの正常ケース"""
    from app.schemas.legal import LegalDeadlineNotification

    notif = LegalDeadlineNotification(
        total_alerts=3,
        critical_alerts=1,
        high_alerts=1,
        medium_alerts=1,
        low_alerts=0,
        contract_deadlines=[],
        generated_at=datetime.now(timezone.utc),
    )
    assert notif.total_alerts == 3
    assert notif.critical_alerts == 1


# =========================================================================
# Phase 3b-3: スキーマ検証テスト — Knowledge Legal Tag
# =========================================================================


def test_legal_article_tag_request_schema():
    """LegalArticleTagRequest — law_tags 最低1件必須"""
    from app.schemas.legal import LegalArticleTagRequest

    req = LegalArticleTagRequest(law_tags=["建設業法", "下請法"])
    assert len(req.law_tags) == 2
    assert "建設業法" in req.law_tags


def test_legal_article_tag_request_empty_raises():
    """LegalArticleTagRequest — 空リストは Validation エラー"""
    import pytest
    from pydantic import ValidationError

    from app.schemas.legal import LegalArticleTagRequest

    with pytest.raises(ValidationError):
        LegalArticleTagRequest(law_tags=[])


def test_legal_article_tag_response_schema():
    """LegalArticleTagResponse スキーマの正常ケース"""
    from app.schemas.legal import LegalArticleTagResponse

    resp = LegalArticleTagResponse(
        article_id=ARTICLE_ID,
        tags="建設業法,下請法",
        legal_laws=["建設業法", "下請法"],
        updated_at=datetime.now(timezone.utc),
    )
    assert resp.tags == "建設業法,下請法"
    assert len(resp.legal_laws) == 2


# =========================================================================
# Phase 3b-4: スキーマ検証テスト — Photo Evidence
# =========================================================================


def test_photo_evidence_create_schema():
    """PhotoEvidenceCreate スキーマの正常ケース"""
    from app.schemas.legal import PhotoEvidenceCreate

    payload = PhotoEvidenceCreate(
        title="鉄筋配置確認写真",
        description="基礎部鉄筋の配置状況を記録",
        event_date=date(2026, 6, 14),
        metadata_json={"camera": "Canon EOS R5"},
    )
    assert payload.title == "鉄筋配置確認写真"
    assert payload.event_date == date(2026, 6, 14)


def test_photo_evidence_create_optional_description():
    """PhotoEvidenceCreate — description と metadata_json は省略可能"""
    from app.schemas.legal import PhotoEvidenceCreate

    payload = PhotoEvidenceCreate(
        title="工事進捗写真",
        event_date=date(2026, 6, 14),
    )
    assert payload.description is None
    assert payload.metadata_json is None


def test_photo_evidence_response_schema():
    """PhotoEvidenceResponse スキーマの正常ケース"""
    from app.schemas.legal import PhotoEvidenceResponse

    resp = PhotoEvidenceResponse(
        evidence_id=uuid.uuid4(),
        photo_id=PHOTO_ID,
        project_id=PROJECT_ID,
        title="鉄筋確認",
        content_hash="a" * 64,
        registered_at=datetime.now(timezone.utc),
    )
    assert len(resp.content_hash) == 64
    assert resp.photo_id == PHOTO_ID


# =========================================================================
# Phase 3b: API 認証テスト — 未認証 401
# =========================================================================


@pytest.mark.asyncio
async def test_dashboard_legal_risks_unauthenticated():
    """未認証で GET /dashboard/legal-risks は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get("/api/v1/dashboard/legal-risks")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_notifications_legal_deadlines_unauthenticated():
    """未認証で GET /notifications/legal-deadlines は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get("/api/v1/notifications/legal-deadlines")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_knowledge_legal_articles_unauthenticated():
    """未認証で GET /knowledge/articles/legal は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get("/api/v1/knowledge/articles/legal")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_knowledge_tag_legal_unauthenticated():
    """未認証で POST /knowledge/articles/{id}/tag-legal は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            f"/api/v1/knowledge/articles/{ARTICLE_ID}/tag-legal",
            json={"law_tags": ["建設業法"]},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_photos_register_evidence_unauthenticated():
    """未認証で POST /projects/{id}/photos/{photo_id}/evidence は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            f"/api/v1/projects/{PROJECT_ID}/photos/{PHOTO_ID}/evidence",
            json={
                "title": "証跡写真",
                "event_date": "2026-06-14",
            },
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_photos_list_evidence_unauthenticated():
    """未認証で GET /projects/{id}/photos/evidence は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(f"/api/v1/projects/{PROJECT_ID}/photos/evidence")
    assert resp.status_code == 401


# =========================================================================
# Phase 3b: API 認証テスト — 認証済み (DB あり)
# =========================================================================


@pytest.mark.asyncio
async def test_dashboard_legal_risks_admin_authorized(auth_client, admin_headers):
    """ADMIN 権限で GET /dashboard/legal-risks は 200"""
    resp = await auth_client.get(
        "/api/v1/dashboard/legal-risks",
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body
    data = body["data"]
    assert "total_contracts" in data
    assert "critical_count" in data
    assert "expiring_30d" in data
    assert isinstance(data["projects"], list)


@pytest.mark.asyncio
async def test_notifications_legal_deadlines_admin_authorized(
    auth_client, admin_headers
):
    """ADMIN 権限で GET /notifications/legal-deadlines は 200"""
    resp = await auth_client.get(
        "/api/v1/notifications/legal-deadlines",
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    data = body["data"]
    assert "total_alerts" in data
    assert "critical_alerts" in data
    assert "contract_deadlines" in data


@pytest.mark.asyncio
async def test_notifications_legal_deadlines_days_param(auth_client, admin_headers):
    """days パラメータが 1〜365 で有効"""
    resp = await auth_client.get(
        "/api/v1/notifications/legal-deadlines?days=30",
        headers=admin_headers,
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_notifications_legal_deadlines_days_invalid(auth_client, admin_headers):
    """days=0 は 422 Unprocessable Entity"""
    resp = await auth_client.get(
        "/api/v1/notifications/legal-deadlines?days=0",
        headers=admin_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_knowledge_legal_articles_admin_authorized(auth_client, admin_headers):
    """ADMIN 権限で GET /knowledge/articles/legal は 200"""
    resp = await auth_client.get(
        "/api/v1/knowledge/articles/legal",
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body
    assert "meta" in body
    assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_knowledge_tag_legal_article_not_found(auth_client, admin_headers):
    """存在しない記事へのタグ付けは 404"""
    resp = await auth_client.post(
        f"/api/v1/knowledge/articles/{uuid.uuid4()}/tag-legal",
        headers=admin_headers,
        json={"law_tags": ["建設業法"]},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_photos_list_evidence_admin_not_found_project(auth_client, admin_headers):
    """存在しないプロジェクトへのアクセスは 404"""
    nonexistent = uuid.uuid4()
    resp = await auth_client.get(
        f"/api/v1/projects/{nonexistent}/photos/evidence",
        headers=admin_headers,
    )
    assert resp.status_code == 404


# =========================================================================
# Phase 3b: urgency 計算ロジック単体テスト
# =========================================================================


def test_urgency_critical_boundary():
    """7日以内は CRITICAL"""
    from app.schemas.legal import ContractDeadlineAlert

    alert = ContractDeadlineAlert(
        contract_id=uuid.uuid4(),
        project_id=PROJECT_ID,
        contract_number="C-001",
        title="テスト",
        period_end=date(2026, 6, 21),
        days_until_expiry=7,
        urgency="CRITICAL",
        contract_type="PRIME",
    )
    assert alert.urgency == "CRITICAL"


def test_urgency_high_boundary():
    """8〜30日は HIGH"""
    from app.schemas.legal import ContractDeadlineAlert

    alert = ContractDeadlineAlert(
        contract_id=uuid.uuid4(),
        project_id=PROJECT_ID,
        contract_number="C-002",
        title="テスト",
        period_end=date(2026, 7, 14),
        days_until_expiry=30,
        urgency="HIGH",
        contract_type="SUB",
    )
    assert alert.urgency == "HIGH"


def test_urgency_medium_boundary():
    """31〜60日は MEDIUM"""
    from app.schemas.legal import ContractDeadlineAlert

    alert = ContractDeadlineAlert(
        contract_id=uuid.uuid4(),
        project_id=PROJECT_ID,
        contract_number="C-003",
        title="テスト",
        period_end=date(2026, 8, 13),
        days_until_expiry=60,
        urgency="MEDIUM",
        contract_type="PRIME",
    )
    assert alert.urgency == "MEDIUM"


def test_urgency_low_boundary():
    """61〜90日は LOW"""
    from app.schemas.legal import ContractDeadlineAlert

    alert = ContractDeadlineAlert(
        contract_id=uuid.uuid4(),
        project_id=PROJECT_ID,
        contract_number="C-004",
        title="テスト",
        period_end=date(2026, 9, 12),
        days_until_expiry=90,
        urgency="LOW",
        contract_type="PRIME",
    )
    assert alert.urgency == "LOW"
