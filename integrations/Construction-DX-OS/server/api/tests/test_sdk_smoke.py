"""SDK smoke tests (Phase 5c-2, Issue 0012).

Starts cdx-server on a random port in a background thread and exercises
the generated Python SDK (cdx_client) against it. Validates that the
SDK's generated API classes can successfully communicate with the server.

Skipped if cdx_client is not on sys.path (i.e., SDK not generated yet).
"""

from __future__ import annotations

import socket
import sys
import threading
import time
from pathlib import Path

import pytest

# Ensure sdk/python is importable from the project root.
_SDK_PATH = Path(__file__).parent.parent.parent.parent / "sdk" / "python"
if _SDK_PATH.exists() and str(_SDK_PATH) not in sys.path:
    sys.path.insert(0, str(_SDK_PATH))

try:
    import cdx_client  # noqa: F401

    _SDK_AVAILABLE = True
except ImportError:
    _SDK_AVAILABLE = False

pytestmark = pytest.mark.skipif(not _SDK_AVAILABLE, reason="cdx_client SDK not generated")


# ---------------------------------------------------------------------------
# Live server fixture
# ---------------------------------------------------------------------------


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


# Match the token set by conftest.py's autouse _set_registration_token fixture
# so that module-scoped sdk_reg_client header agrees with each test's env var.
_SMOKE_REG_TOKEN = "unit-test-registration-token-do-not-use-in-prod"


@pytest.fixture(scope="module")
def cdx_live_server():
    """Start cdx-server on a random port; yield base URL; shut down after tests."""
    import uvicorn

    from cdx_server.app import create_app

    port = _free_port()
    app = create_app()
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error")
    server = uvicorn.Server(config)

    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    # Wait until server is ready (max 5 s).
    deadline = time.monotonic() + 5.0
    while not server.started:
        if time.monotonic() > deadline:
            raise RuntimeError("cdx-server did not start in time")
        time.sleep(0.05)

    yield f"http://127.0.0.1:{port}"

    server.should_exit = True
    thread.join(timeout=3)


@pytest.fixture(scope="module")
def sdk_client(cdx_live_server: str):
    """Return a configured cdx_client ApiClient pointing at the live server."""
    from cdx_client.api_client import ApiClient
    from cdx_client.configuration import Configuration

    cfg = Configuration(host=cdx_live_server)
    return ApiClient(configuration=cfg)


@pytest.fixture(scope="module")
def sdk_reg_client(cdx_live_server: str):
    """Return an ApiClient with registration Bearer token pre-set."""
    from cdx_client.api_client import ApiClient
    from cdx_client.configuration import Configuration

    cfg = Configuration(host=cdx_live_server)
    client = ApiClient(configuration=cfg)
    client.set_default_header("Authorization", f"Bearer {_SMOKE_REG_TOKEN}")
    return client


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestSDKSmoke:
    def test_health_endpoint(self, sdk_client):
        """GET /health should return status 'ok' via SDK HealthApi."""
        from cdx_client.api.health_api import HealthApi

        api = HealthApi(api_client=sdk_client)
        result = api.health_health_get()
        assert result.status == "ok"

    def test_register_device(self, sdk_reg_client):
        """Register a device via SDK DevicesApi and verify response fields."""
        from cdx_client.api.devices_api import DevicesApi
        from cdx_client.models.register_request import RegisterRequest

        devices_api = DevicesApi(api_client=sdk_reg_client)

        reg = devices_api.register_device_api_v1_devices_register_post(
            RegisterRequest(
                device_id="sdk-smoke-device",
                hostname="sdk-smoke.local",
                shared_secret="device-shared-secret-xyz",
            )
        )
        assert reg.device_id == "sdk-smoke-device"
        assert reg.already_registered is False

        # Second call: same device → already_registered True
        reg2 = devices_api.register_device_api_v1_devices_register_post(
            RegisterRequest(
                device_id="sdk-smoke-device",
                hostname="sdk-smoke.local",
                shared_secret="device-shared-secret-xyz",
            )
        )
        assert reg2.already_registered is True

    def test_sdk_api_classes_exist(self):
        """All expected API classes are importable from cdx_client."""
        from cdx_client.api.admin_api import AdminApi  # noqa: F401
        from cdx_client.api.devices_api import DevicesApi  # noqa: F401
        from cdx_client.api.health_api import HealthApi  # noqa: F401
        from cdx_client.api.heartbeat_api import HeartbeatApi  # noqa: F401
        from cdx_client.api.inventory_api import InventoryApi  # noqa: F401
        from cdx_client.api.policy_api import PolicyApi  # noqa: F401
