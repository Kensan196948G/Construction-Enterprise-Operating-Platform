"""Legal Tech 統合テスト — contracts/evidence CRUD + IDOR 保護を DB 経由で検証。

対象: PR #236（IDOR 防止）/ PR #242（read-side IDOR）の統合レベル確認。
Issue #245
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


def _project_payload(suffix: str = "001") -> dict:
    return {
        "name": f"法的テスト工事{suffix}",
        "project_code": f"LEGAL-PRJ-{suffix}",
        "client_name": "法的テスト施主",
    }


# =========================================================================
# 契約管理（contracts）統合テスト
# =========================================================================


@pytest.mark.asyncio
async def test_contracts_crud_lifecycle(auth_client: AsyncClient, admin_headers: dict):
    """契約 CRUD ライフサイクルテスト（ADMIN として正常フロー確認）"""
    # 1. プロジェクト作成
    prj = await auth_client.post(
        "/api/v1/projects/", json=_project_payload("C01"), headers=admin_headers
    )
    assert prj.status_code == 201
    project_id = prj.json()["data"]["id"]

    # 2. 契約作成
    contract_payload = {
        "project_id": project_id,
        "contract_number": "CNT-INTG-001",
        "title": "統合テスト用工事請負契約",
        "contract_type": "PRIME",
    }
    create_resp = await auth_client.post(
        "/api/v1/legal/contracts",
        json=contract_payload,
        headers=admin_headers,
    )
    assert create_resp.status_code == 201, create_resp.text
    contract_id = create_resp.json()["data"]["id"]

    # 3. 詳細取得
    get_resp = await auth_client.get(
        f"/api/v1/legal/contracts/{contract_id}",
        headers=admin_headers,
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["contract_number"] == "CNT-INTG-001"

    # 4. projects /{id}/contracts 経由でも取得できる
    proj_contracts = await auth_client.get(
        f"/api/v1/projects/{project_id}/contracts",
        headers=admin_headers,
    )
    assert proj_contracts.status_code == 200
    contract_numbers = [c["contract_number"] for c in proj_contracts.json()["data"]]
    assert "CNT-INTG-001" in contract_numbers


@pytest.mark.asyncio
async def test_contracts_idor_protection_integration(
    auth_client: AsyncClient, admin_headers: dict, pm_headers: dict
):
    """contracts IDOR 保護 統合テスト — PM は ADMIN 所有プロジェクトの契約に不可。

    単体テスト（test_legal.py）との違い: プロジェクト作成 → 契約登録 → IDOR 確認の
    一連フローを実 DB（SQLite インメモリ）で通して検証する。
    """
    # ADMIN がプロジェクトと契約を作成
    prj = await auth_client.post(
        "/api/v1/projects/", json=_project_payload("C02"), headers=admin_headers
    )
    assert prj.status_code == 201
    admin_project_id = prj.json()["data"]["id"]

    contract = await auth_client.post(
        "/api/v1/legal/contracts",
        json={
            "project_id": admin_project_id,
            "contract_number": "CNT-IDOR-INT-001",
            "title": "IDOR 統合検証用契約",
            "contract_type": "PRIME",
        },
        headers=admin_headers,
    )
    assert contract.status_code == 201
    contract_id = contract.json()["data"]["id"]

    # PM は ADMIN プロジェクトの contracts 一覧にアクセス不可 → 403
    list_blocked = await auth_client.get(
        f"/api/v1/projects/{admin_project_id}/contracts",
        headers=pm_headers,
    )
    assert list_blocked.status_code == 403

    # PM は ADMIN プロジェクト所属の契約詳細にも直接アクセス不可 → 403
    get_blocked = await auth_client.get(
        f"/api/v1/legal/contracts/{contract_id}",
        headers=pm_headers,
    )
    assert get_blocked.status_code == 403


@pytest.mark.asyncio
async def test_contracts_create_idor_blocked(
    auth_client: AsyncClient, admin_headers: dict, pm_headers: dict
):
    """contracts create-side IDOR 統合テスト — PM は ADMIN プロジェクトに注入不可。

    PR #236（92c9bac）の create-side IDOR 修正の統合レベル確認。
    """
    # ADMIN がプロジェクトを作成（manager = ADMIN）
    prj = await auth_client.post(
        "/api/v1/projects/", json=_project_payload("C03"), headers=admin_headers
    )
    assert prj.status_code == 201
    admin_project_id = prj.json()["data"]["id"]

    # PM が ADMIN 所有プロジェクトに契約を注入しようとすると 403
    blocked = await auth_client.post(
        "/api/v1/legal/contracts",
        json={
            "project_id": admin_project_id,
            "contract_number": "CNT-INJECT-001",
            "title": "不正注入テスト",
            "contract_type": "PRIME",
        },
        headers=pm_headers,
    )
    assert blocked.status_code == 403, (
        f"Expected 403 (IDOR create blocked), got {blocked.status_code}: {blocked.text}"
    )


# =========================================================================
# 証跡タイムライン（evidence）統合テスト
# =========================================================================


@pytest.mark.asyncio
async def test_evidence_timeline_lifecycle(
    auth_client: AsyncClient, admin_headers: dict
):
    """法的証跡タイムライン CRUD ライフサイクルテスト"""
    # プロジェクト作成
    prj = await auth_client.post(
        "/api/v1/projects/", json=_project_payload("E01"), headers=admin_headers
    )
    assert prj.status_code == 201
    project_id = prj.json()["data"]["id"]

    # 証跡登録
    evidence_payload = {
        "project_id": project_id,
        "source_type": "daily_report",
        "title": "統合テスト証跡",
        "event_date": "2026-05-31",
        "description": "統合テスト用の証跡エントリ",
    }
    post_resp = await auth_client.post(
        f"/api/v1/legal/evidence/{project_id}",
        json=evidence_payload,
        headers=admin_headers,
    )
    assert post_resp.status_code == 201, post_resp.text

    # タイムライン取得
    timeline_resp = await auth_client.get(
        f"/api/v1/legal/evidence/{project_id}/timeline",
        headers=admin_headers,
    )
    assert timeline_resp.status_code == 200
    assert len(timeline_resp.json()["data"]) >= 1

    # 整合性検証
    verify_resp = await auth_client.get(
        f"/api/v1/legal/evidence/{project_id}/verify",
        headers=admin_headers,
    )
    assert verify_resp.status_code == 200


@pytest.mark.asyncio
async def test_evidence_idor_protection_integration(
    auth_client: AsyncClient, admin_headers: dict, pm_headers: dict
):
    """evidence IDOR 保護 統合テスト — PM は ADMIN 所有プロジェクトの証跡に不可。"""
    # ADMIN がプロジェクトを作成
    prj = await auth_client.post(
        "/api/v1/projects/", json=_project_payload("E02"), headers=admin_headers
    )
    assert prj.status_code == 201
    admin_project_id = prj.json()["data"]["id"]

    # PM は ADMIN プロジェクトの証跡タイムラインにアクセス不可 → 403
    blocked = await auth_client.get(
        f"/api/v1/legal/evidence/{admin_project_id}/timeline",
        headers=pm_headers,
    )
    assert blocked.status_code == 403
