"""J-SOX 業務統制: 与信判定後受注テスト (02_営業本部)."""
from __future__ import annotations

import os
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

os.environ.setdefault("ENTRA_TENANT_ID", "test-tenant")
os.environ.setdefault("ENTRA_CLIENT_ID", "test-client")
os.environ.setdefault("ENTRA_CLIENT_SECRET", "test-secret")
os.environ.setdefault("JWT_AUDIENCE", "test-audience")
os.environ.setdefault("CDX_GROUP_ROLE_MAP", "{}")

from fastapi.testclient import TestClient  # noqa: E402

from cdx_auth.dependencies import get_current_user  # noqa: E402
from crm_api.db.session import get_db_session  # noqa: E402
from crm_api.main import create_app  # noqa: E402

_FAKE_USER = MagicMock(sub="test-user", email="test@example.com")
_app = create_app()
_app.dependency_overrides[get_current_user] = lambda: _FAKE_USER

_BASE = "/api/v1/contracts"
_CONTRACT = {
    "contract_number": "CTR-TEST-001",
    "client_id": 1,
    "project_name": "テストプロジェクト",
    "contract_amount": "3000000",
}


def _make_test_client(credit_rank: str, credit_limit: float | None = None) -> TestClient:
    """指定の与信条件を持つクライアントモックを注入した TestClient を返す."""
    mock_cli = MagicMock()
    mock_cli.credit_rank = credit_rank
    mock_cli.credit_limit = Decimal(str(credit_limit)) if credit_limit is not None else None

    async def _mock_db():
        session = AsyncMock()
        session.get = AsyncMock(return_value=mock_cli)
        session.add = MagicMock(side_effect=lambda obj: setattr(obj, "id", 1))
        session.flush = AsyncMock()
        yield session

    _app.dependency_overrides[get_db_session] = _mock_db
    return TestClient(_app)


def test_credit_rank_D_rejected() -> None:
    """credit_rank=D の顧客への受注は 422."""
    r = _make_test_client("D", credit_limit=10_000_000).post(_BASE, json=_CONTRACT)
    assert r.status_code == 422, r.text
    assert "与信" in r.json()["detail"]


def test_credit_rank_unevaluated_rejected() -> None:
    """credit_rank=未評価 の顧客への受注は 422."""
    r = _make_test_client("未評価", credit_limit=10_000_000).post(_BASE, json=_CONTRACT)
    assert r.status_code == 422, r.text
    assert "与信" in r.json()["detail"]


def test_credit_limit_exceeded_rejected() -> None:
    """contract_amount が credit_limit を超過する場合は 422."""
    body = {**_CONTRACT, "contract_amount": "5000000"}
    r = _make_test_client("A", credit_limit=1_000_000).post(_BASE, json=body)
    assert r.status_code == 422, r.text
    assert "与信" in r.json()["detail"]


def test_valid_credit_creates_contract() -> None:
    """credit_rank=A かつ amount ≤ limit の場合は 201."""
    r = _make_test_client("A", credit_limit=10_000_000).post(_BASE, json=_CONTRACT)
    assert r.status_code == 201, r.text
