"""Shared fixtures for cdx-server tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.auth import REGISTRATION_TOKEN_ENV
from cdx_server.rate_limit import NullRateLimiter
from cdx_server.storage import InMemoryStorage

REGISTRATION_TOKEN = "unit-test-registration-token-do-not-use-in-prod"


@pytest.fixture
def storage() -> InMemoryStorage:
    return InMemoryStorage()


@pytest.fixture(autouse=True)
def _set_registration_token(monkeypatch):
    """Enable the registration endpoint for every test by default.

    Tests that want the endpoint disabled (503 path) clear it explicitly.
    """
    monkeypatch.setenv(REGISTRATION_TOKEN_ENV, REGISTRATION_TOKEN)
    yield


@pytest.fixture
def registration_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {REGISTRATION_TOKEN}"}


@pytest.fixture
def client(storage: InMemoryStorage) -> TestClient:
    """Default client uses NullRateLimiter so existing tests are unaffected
    by rate-limit policy changes; rate-limit tests build their own app."""
    app = create_app(storage=storage, rate_limiter=NullRateLimiter())
    return TestClient(app)


@pytest.fixture
def registered_device(client: TestClient, registration_headers: dict[str, str]) -> dict[str, str]:
    """Provision one test device and return the handful of values tests need."""
    device = {
        "device_id": "dev-test-001",
        "profile": "standard",
        "hostname": "test-host",
        "shared_secret": "unit-test-shared-secret-000000000",
    }
    response = client.post(
        "/api/v1/devices/register",
        json=device,
        headers=registration_headers,
    )
    assert response.status_code == 200, response.text
    return device
