"""工事案件管理 統合テスト"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_projects_crud_lifecycle(auth_client: AsyncClient, admin_headers: dict):
    """工事案件 CRUD ライフサイクルテスト"""
    # 1. 作成
    payload = {
        "name": "テスト工事案件",
        "project_code": "PRJ-TEST-001",
        "description": "統合テスト用案件",
        "status": "PLANNING",
        "budget": 10000000.0,
        "start_date": "2026-04-01",
        "end_date": "2026-09-30",
        "location": "東京都千代田区",
        "client_name": "テスト施主株式会社",
    }
    resp = await auth_client.post(
        "/api/v1/projects/", json=payload, headers=admin_headers
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["data"]["name"] == "テスト工事案件"
    project_id = data["data"]["id"]

    # 2. 取得
    resp = await auth_client.get(
        f"/api/v1/projects/{project_id}", headers=admin_headers
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["project_code"] == "PRJ-TEST-001"

    # 3. 一覧
    resp = await auth_client.get("/api/v1/projects/", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["meta"]["total"] >= 1

    # 4. 更新
    resp = await auth_client.put(
        f"/api/v1/projects/{project_id}",
        json={"status": "IN_PROGRESS"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "IN_PROGRESS"


@pytest.mark.asyncio
async def test_projects_viewer_cannot_create(
    auth_client: AsyncClient, viewer_headers: dict
):
    """VIEWERは案件作成不可"""
    resp = await auth_client.post(
        "/api/v1/projects/",
        json={
            "name": "VIEWER案件",
            "project_code": "PRJ-V-001",
            "description": "test",
            "status": "PLANNING",
        },
        headers=viewer_headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_project_creator_becomes_manager(
    auth_client: AsyncClient, pm_headers: dict
):
    """manager_id 未指定で作成すると作成者が manager になる (IDOR モデルの所有者既定)。

    これにより PM が作成した自プロジェクトに対して書き込み可能になる
    （孤児プロジェクト防止）。
    """
    resp = await auth_client.post(
        "/api/v1/projects/",
        json={
            "name": "作成者manager案件",
            "project_code": "PRJ-MGR-001",
            "client_name": "テスト施主",
        },
        headers=pm_headers,
    )
    assert resp.status_code == 201, resp.text
    project_id = resp.json()["data"]["id"]

    # PM は自身が作成した（= manager の）プロジェクトに日報を作成できる
    report = await auth_client.post(
        f"/api/v1/projects/{project_id}/daily-reports",
        json={"project_id": project_id, "report_date": "2026-05-01"},
        headers=pm_headers,
    )
    assert report.status_code == 201, report.text


@pytest.mark.asyncio
async def test_projects_unauthenticated(client: AsyncClient):
    """未認証で401"""
    resp = await client.get("/api/v1/projects/")
    assert resp.status_code == 401


# =========================================================================
# Phase 7 — projects /{id}/contracts + /{id}/legal-risks の IDOR 保護
# 統合テスト（PR #242 / Issue #243）
# =========================================================================


@pytest.mark.asyncio
async def test_projects_contracts_idor_protection(
    auth_client: AsyncClient, admin_headers: dict, pm_headers: dict
):
    """ADMIN が作成したプロジェクトの契約一覧に PM がアクセス → 403（統合テスト）。

    projects.py の GET /{id}/contracts に assert_project_access が適用されており、
    PM は ADMIN 管理のプロジェクト（自分が manager でない）にアクセスできない。
    """
    # ADMIN がプロジェクトを作成（manager = ADMIN_USER_ID）
    proj = await auth_client.post(
        "/api/v1/projects/",
        json={
            "name": "ADMIN管理プロジェクト(IDOR統合検証)",
            "project_code": "PRJ-IDOR-I-001",
            "client_name": "テスト施主",
        },
        headers=admin_headers,
    )
    assert proj.status_code == 201, proj.text
    project_id = proj.json()["data"]["id"]

    # PM が ADMIN 所有プロジェクトの契約一覧にアクセス → 403
    blocked = await auth_client.get(
        f"/api/v1/projects/{project_id}/contracts",
        headers=pm_headers,
    )
    assert blocked.status_code == 403, (
        f"Expected 403, got {blocked.status_code}: {blocked.text}"
    )


@pytest.mark.asyncio
async def test_projects_legal_risks_idor_protection(
    auth_client: AsyncClient, admin_headers: dict, pm_headers: dict
):
    """ADMIN 作成プロジェクトの法的リスク評価に PM がアクセス → 403（統合テスト）。"""
    # ADMIN がプロジェクトを作成
    proj = await auth_client.post(
        "/api/v1/projects/",
        json={
            "name": "ADMIN管理プロジェクト(IDOR統合検証-2)",
            "project_code": "PRJ-IDOR-I-002",
            "client_name": "テスト施主",
        },
        headers=admin_headers,
    )
    assert proj.status_code == 201, proj.text
    project_id = proj.json()["data"]["id"]

    # PM が ADMIN 所有プロジェクトの法的リスクにアクセス → 403
    blocked = await auth_client.get(
        f"/api/v1/projects/{project_id}/legal-risks",
        headers=pm_headers,
    )
    assert blocked.status_code == 403, (
        f"Expected 403, got {blocked.status_code}: {blocked.text}"
    )


@pytest.mark.asyncio
async def test_projects_contracts_accessible_to_own_manager(
    auth_client: AsyncClient, pm_headers: dict
):
    """PM が自身の管理プロジェクトの契約一覧を取得できる（200）（統合テスト）。"""
    # PM がプロジェクトを作成（作成者が自動的に manager になる）
    proj = await auth_client.post(
        "/api/v1/projects/",
        json={
            "name": "PM自身の管理プロジェクト(統合検証)",
            "project_code": "PRJ-PM-I-001",
            "client_name": "テスト施主",
        },
        headers=pm_headers,
    )
    assert proj.status_code == 201, proj.text
    project_id = proj.json()["data"]["id"]

    # PM が自プロジェクトの契約一覧にアクセス → 200（contracts なし=空リスト）
    own = await auth_client.get(
        f"/api/v1/projects/{project_id}/contracts",
        headers=pm_headers,
    )
    assert own.status_code == 200, f"Expected 200, got {own.status_code}: {own.text}"
