"""QR トークン発行/検証ユニットテスト."""
from __future__ import annotations


import pytest

from site_api.services.qr_token import issue_token, verify_token


def test_issue_and_verify() -> None:
    token = issue_token(project_id=1, worker_id=42, ttl=60)
    payload = verify_token(token)
    assert payload["project_id"] == 1
    assert payload["worker_id"] == 42


def test_expired_token() -> None:
    token = issue_token(project_id=1, worker_id=42, ttl=-1)
    with pytest.raises(ValueError):
        verify_token(token)


def test_tampered_token() -> None:
    token = issue_token(project_id=1, worker_id=42, ttl=60)
    tampered = token[:-2] + ("AA" if not token.endswith("AA") else "BB")
    with pytest.raises(ValueError):
        verify_token(tampered)
