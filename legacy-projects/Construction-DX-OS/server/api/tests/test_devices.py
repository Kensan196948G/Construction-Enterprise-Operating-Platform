"""Tests for the device registration endpoint."""

from cdx_server.auth import REGISTRATION_TOKEN_ENV

SECRET = "a" * 32


def test_register_new_device(client, registration_headers):
    response = client.post(
        "/api/v1/devices/register",
        json={
            "device_id": "dev-1",
            "profile": "standard",
            "hostname": "host-1",
            "shared_secret": SECRET,
        },
        headers=registration_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["device_id"] == "dev-1"
    assert body["already_registered"] is False


def test_register_returns_already_registered_on_second_call(client, registration_headers):
    payload = {
        "device_id": "dev-2",
        "profile": "field",
        "hostname": "host-2",
        "shared_secret": SECRET,
    }
    first = client.post("/api/v1/devices/register", json=payload, headers=registration_headers)
    second = client.post("/api/v1/devices/register", json=payload, headers=registration_headers)
    assert first.json()["already_registered"] is False
    assert second.json()["already_registered"] is True


def test_register_rejects_short_secret(client, registration_headers):
    response = client.post(
        "/api/v1/devices/register",
        json={
            "device_id": "dev-3",
            "profile": "standard",
            "hostname": "host-3",
            "shared_secret": "tooshort",
        },
        headers=registration_headers,
    )
    assert response.status_code == 422


def test_register_rejects_unknown_profile(client, registration_headers):
    response = client.post(
        "/api/v1/devices/register",
        json={
            "device_id": "dev-4",
            "profile": "executive-luxury",
            "hostname": "host-4",
            "shared_secret": SECRET,
        },
        headers=registration_headers,
    )
    assert response.status_code == 422


def test_register_rejects_device_id_with_control_chars(client, registration_headers):
    response = client.post(
        "/api/v1/devices/register",
        json={
            "device_id": "evil\nheartbeat\n0",
            "profile": "standard",
            "hostname": "h",
            "shared_secret": SECRET,
        },
        headers=registration_headers,
    )
    assert response.status_code == 422


def test_register_requires_bearer_token(client):
    response = client.post(
        "/api/v1/devices/register",
        json={
            "device_id": "dev-noauth",
            "profile": "standard",
            "hostname": "h",
            "shared_secret": SECRET,
        },
    )
    assert response.status_code == 401


def test_register_rejects_wrong_token(client):
    response = client.post(
        "/api/v1/devices/register",
        json={
            "device_id": "dev-bad-token",
            "profile": "standard",
            "hostname": "h",
            "shared_secret": SECRET,
        },
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert response.status_code == 401


def test_register_disabled_when_env_unset(client, monkeypatch):
    """If the operator forgets to set CDX_REGISTRATION_TOKEN, the endpoint
    refuses every request with 503 — closed-by-default semantics."""
    monkeypatch.delenv(REGISTRATION_TOKEN_ENV, raising=False)
    response = client.post(
        "/api/v1/devices/register",
        json={
            "device_id": "dev-disabled",
            "profile": "standard",
            "hostname": "h",
            "shared_secret": SECRET,
        },
        headers={"Authorization": "Bearer anything"},
    )
    assert response.status_code == 503
