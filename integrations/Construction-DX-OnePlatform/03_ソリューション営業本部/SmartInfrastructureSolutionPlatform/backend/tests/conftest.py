"""pytest 共通フィクスチャ."""

from __future__ import annotations

import os

# cdx-shared-auth が import 時に必須環境変数を要求するため、テスト前に設定する。
os.environ.setdefault("ENTRA_TENANT_ID", "test-tenant")
os.environ.setdefault("ENTRA_CLIENT_ID", "test-client")
os.environ.setdefault("ENTRA_CLIENT_SECRET", "test-secret")
os.environ.setdefault("JWT_AUDIENCE", "test-audience")
os.environ.setdefault("CDX_GROUP_ROLE_MAP", "{}")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from sol_api.main import create_app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(create_app())
