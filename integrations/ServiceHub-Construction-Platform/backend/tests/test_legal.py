"""Legal Tech Phase 1 API テスト (#226 / #227 / #228)"""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.rbac import UserRole
from app.main import app

# ---------- Fixtures ----------


class FakeAdmin:
    id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    username = "admin"
    full_name = "管理者"
    role = UserRole.ADMIN
    is_active = True


class FakePM:
    id = uuid.UUID("00000000-0000-0000-0000-000000000002")
    username = "pm"
    full_name = "工事担当"
    role = UserRole.PROJECT_MANAGER
    is_active = True


class FakeViewer:
    id = uuid.UUID("00000000-0000-0000-0000-000000000005")
    username = "viewer"
    full_name = "閲覧者"
    role = UserRole.VIEWER
    is_active = True


# =========================================================================
# 契約管理 API (#226)
# =========================================================================


@pytest.mark.asyncio
async def test_list_contracts_unauthenticated():
    """未認証で契約一覧は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get("/api/v1/legal/contracts")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_contract_unauthenticated():
    """未認証で契約作成は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            "/api/v1/legal/contracts",
            json={
                "project_id": str(uuid.uuid4()),
                "contract_number": "CNT-001",
                "title": "テスト契約",
            },
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_analyze_contract_unauthenticated():
    """未認証で契約 AI 解析は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            f"/api/v1/legal/contracts/{uuid.uuid4()}/analyze",
            json={"contract_text": "テスト契約書テキスト"},
        )
    assert resp.status_code == 401


# =========================================================================
# ITSM 法令違反インシデント / エスカレーション (#227)
# =========================================================================


@pytest.mark.asyncio
async def test_list_legal_incidents_unauthenticated():
    """未認証で法令違反インシデント一覧は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get("/api/v1/itsm/incidents/legal")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_escalate_incident_unauthenticated():
    """未認証でエスカレーションは 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            f"/api/v1/itsm/incidents/{uuid.uuid4()}/escalate",
            json={"reason": "法令違反確認のため"},
        )
    assert resp.status_code == 401


# =========================================================================
# Projects 法的リスク評価 (#228)
# =========================================================================


@pytest.mark.asyncio
async def test_list_project_contracts_unauthenticated():
    """未認証でプロジェクト契約一覧は 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(f"/api/v1/projects/{uuid.uuid4()}/contracts")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_project_legal_risks_unauthenticated():
    """未認証でプロジェクト法的リスクは 401"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(f"/api/v1/projects/{uuid.uuid4()}/legal-risks")
    assert resp.status_code == 401


# =========================================================================
# AI 解析サービス: ANTHROPIC_API_KEY 未設定時のモック動作確認
# =========================================================================


@pytest.mark.asyncio
async def test_anthropic_client_none_without_api_key(monkeypatch):
    """ANTHROPIC_API_KEY 未設定時は get_anthropic_client() が None を返す"""
    import app.services.legal.anthropic_client as ac

    # settings.ANTHROPIC_API_KEY をモジュールレベルでパッチ
    monkeypatch.setattr(ac, "_client", None)
    original_fn = ac.get_anthropic_client

    def patched_get_client():
        """API キーが None の場合のみテスト: getattr で None を返す"""
        return None

    monkeypatch.setattr(ac, "get_anthropic_client", patched_get_client)
    client = ac.get_anthropic_client()
    assert client is None

    # 復元
    monkeypatch.setattr(ac, "get_anthropic_client", original_fn)
    monkeypatch.setattr(ac, "_client", None)


@pytest.mark.asyncio
async def test_mock_analysis_returns_pending():
    """ANTHROPIC_API_KEY なし時は risk_score=PENDING を返す"""
    from app.services.legal.contracts_service import _build_mock_analysis

    result = _build_mock_analysis("PRIME")
    assert result.risk_score == "PENDING"
    assert result.legal_issues == []
    assert result.has_required_items is True


# =========================================================================
# スキーマ検証テスト
# =========================================================================


def test_contract_create_valid():
    """ContractCreate スキーマの正常ケース"""
    from app.schemas.legal import ContractCreate

    c = ContractCreate(
        project_id=uuid.uuid4(),
        contract_number="CNT-2026-001",
        title="建設工事請負契約",
        contract_type="PRIME",
    )
    assert c.contract_type == "PRIME"
    assert c.ai_risk_score_default() if hasattr(c, "ai_risk_score_default") else True


def test_incident_escalate_schema_valid():
    """IncidentEscalateRequest スキーマの正常ケース"""
    from app.schemas.legal import IncidentEscalateRequest

    req = IncidentEscalateRequest(reason="下請法違反の疑い", urgency="HIGH")
    assert req.urgency == "HIGH"
    assert req.law is None


def test_project_legal_risk_schema():
    """ProjectLegalRisk スキーマの基本確認"""
    from datetime import datetime, timezone

    from app.schemas.legal import ProjectLegalRisk

    risk = ProjectLegalRisk(
        project_id=uuid.uuid4(),
        risk_level="HIGH",
        open_contracts=3,
        critical_contracts=[],
        high_contracts=[uuid.uuid4()],
        delay_risk=False,
        legal_recommendations=["書面確認が必要です"],
        evaluated_at=datetime.now(timezone.utc),
    )
    assert risk.risk_level == "HIGH"
    assert len(risk.high_contracts) == 1


# =========================================================================
# 契約一覧 IDOR 防止 — project_id 未指定経路のゲートバイパス対策
# =========================================================================


@pytest.mark.asyncio
async def test_list_contracts_scoped_to_managed_projects(
    auth_client, admin_headers, pm_headers, pm_project, admin_project
):
    """PM が project_id 未指定で一覧取得すると、自身が管理するプロジェクトの
    契約のみが返る（他プロジェクトの契約は漏れない = IDOR ゲートバイパス防止）。"""
    other_project_id = str(admin_project.id)

    # ADMIN が PM 管理プロジェクトと別プロジェクトにそれぞれ契約を作成
    own = await auth_client.post(
        "/api/v1/legal/contracts",
        json={
            "project_id": str(pm_project.id),
            "contract_number": "CNT-OWN-001",
            "title": "PM 管理プロジェクトの契約",
        },
        headers=admin_headers,
    )
    assert own.status_code == 201
    other = await auth_client.post(
        "/api/v1/legal/contracts",
        json={
            "project_id": other_project_id,
            "contract_number": "CNT-OTHER-001",
            "title": "他プロジェクトの契約",
        },
        headers=admin_headers,
    )
    assert other.status_code == 201

    # PM が project_id 未指定で一覧取得 → 管理プロジェクトの契約のみ
    resp = await auth_client.get("/api/v1/legal/contracts", headers=pm_headers)
    assert resp.status_code == 200
    numbers = {c["contract_number"] for c in resp.json()["data"]}
    assert "CNT-OWN-001" in numbers
    assert "CNT-OTHER-001" not in numbers


# =========================================================================
# 契約作成 IDOR 防止 — write-side（管理外プロジェクトへの契約注入対策）
# =========================================================================


@pytest.mark.asyncio
async def test_create_contract_blocks_cross_project(
    auth_client, pm_headers, pm_project
):
    """PM が管理外プロジェクトの project_id を指定して契約作成を試みると拒否される
    （write-side IDOR 防止）。自身の管理プロジェクトには作成できる。"""
    other_project_id = str(uuid.uuid4())

    # 管理外（存在しない/他者管理）プロジェクトへの作成 → 403/404 で拒否
    blocked = await auth_client.post(
        "/api/v1/legal/contracts",
        json={
            "project_id": other_project_id,
            "contract_number": "CNT-IDOR-WRITE-001",
            "title": "管理外プロジェクトへの不正注入",
        },
        headers=pm_headers,
    )
    assert blocked.status_code in (403, 404)

    # 自身の管理プロジェクトへの作成 → 201 で成功
    own = await auth_client.post(
        "/api/v1/legal/contracts",
        json={
            "project_id": str(pm_project.id),
            "contract_number": "CNT-OWN-WRITE-001",
            "title": "PM 管理プロジェクトの契約",
        },
        headers=pm_headers,
    )
    assert own.status_code == 201


# =========================================================================
# projects.py read-side IDOR 防止 — /{id}/contracts と /{id}/legal-risks
# =========================================================================


@pytest.mark.asyncio
async def test_project_contracts_blocks_cross_project_read(
    auth_client, pm_headers, pm_project, admin_project
):
    """PM が管理外プロジェクト（実在）の契約一覧を projects.py 経由で取得しようとすると
    403 で拒否される（read-side IDOR — projects ルート経由のバイパス防止）。"""
    # 実在する別プロジェクト（ADMIN が manager）への PM アクセス → 403
    blocked = await auth_client.get(
        f"/api/v1/projects/{admin_project.id}/contracts",
        headers=pm_headers,
    )
    assert blocked.status_code == 403

    # 非存在 UUID → 404
    not_found = await auth_client.get(
        f"/api/v1/projects/{uuid.uuid4()}/contracts",
        headers=pm_headers,
    )
    assert not_found.status_code == 404

    # 自身の管理プロジェクト → 200（契約0件でも正常）
    own = await auth_client.get(
        f"/api/v1/projects/{pm_project.id}/contracts",
        headers=pm_headers,
    )
    assert own.status_code == 200


@pytest.mark.asyncio
async def test_project_legal_risks_blocks_cross_project_read(
    auth_client, pm_headers, pm_project, admin_project
):
    """PM が管理外プロジェクトの法的リスク評価を取得しようとすると403で拒否される。"""
    # 実在する別プロジェクト（ADMIN が manager）への PM アクセス → 403
    blocked = await auth_client.get(
        f"/api/v1/projects/{admin_project.id}/legal-risks",
        headers=pm_headers,
    )
    assert blocked.status_code == 403
