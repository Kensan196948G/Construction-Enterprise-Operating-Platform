"""Runtime configuration for cdx-agent.

Resolves runtime values in a layered fashion:

``device_id``
  1. ``CDX_DEVICE_ID`` environment variable (test / explicit override)
  2. ``/etc/cdx-agent/device_id`` (provisioned during OS imaging)
  3. ``/etc/machine-id`` (Debian standard, stable across reboots)
  4. Falls back to a deterministic string so unit tests are reproducible.

``shared_secret``
  1. ``CDX_SHARED_SECRET`` environment variable (preferred)
  2. ``/etc/cdx-agent/shared_secret`` (600-permissions recommended)
  3. Empty — signing is still possible for unit tests but requests against a
     real server will be rejected.

``spool_path``
  Configurable via ``CDX_SPOOL_PATH``; defaults to
  ``/var/lib/cdx-agent/spool/outbox.jsonl``.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_API_ENDPOINT = "https://central.cdx.local/api/v1"
DEFAULT_PROFILE = "standard"
DEVICE_ID_OVERRIDE_PATH = Path("/etc/cdx-agent/device_id")
MACHINE_ID_PATH = Path("/etc/machine-id")
SHARED_SECRET_PATH = Path("/etc/cdx-agent/shared_secret")
DEFAULT_SPOOL_PATH = Path("/var/lib/cdx-agent/spool/outbox.jsonl")
FALLBACK_DEVICE_ID = "unprovisioned-device"

# Conservative defaults; overridden by policy fetch at runtime.
# Heartbeat: 1/min is the standard cadence (matches server token-bucket default).
# Inventory: 1/h is sufficient for change detection without overwhelming the server.
DEFAULT_HEARTBEAT_INTERVAL_SECONDS = 60
DEFAULT_INVENTORY_INTERVAL_SECONDS = 3600


@dataclass(frozen=True, slots=True)
class AgentConfig:
    device_id: str
    api_endpoint: str
    profile: str
    shared_secret: str
    spool_path: Path
    # Operational cadence — set from server policy at startup; defaults used
    # when the server is unreachable or no policy is configured for the profile.
    heartbeat_interval_seconds: int = DEFAULT_HEARTBEAT_INTERVAL_SECONDS
    inventory_interval_seconds: int = DEFAULT_INVENTORY_INTERVAL_SECONDS


def _read_trimmed(path: Path) -> str | None:
    try:
        value = path.read_text(encoding="utf-8").strip()
    except (FileNotFoundError, PermissionError, OSError):
        return None
    return value or None


def resolve_device_id(env: dict[str, str] | None = None) -> str:
    env = os.environ if env is None else env
    override = env.get("CDX_DEVICE_ID")
    if override:
        return override.strip()
    for candidate in (DEVICE_ID_OVERRIDE_PATH, MACHINE_ID_PATH):
        value = _read_trimmed(candidate)
        if value:
            return value
    return FALLBACK_DEVICE_ID


def resolve_shared_secret(env: dict[str, str] | None = None) -> str:
    env = os.environ if env is None else env
    override = env.get("CDX_SHARED_SECRET")
    if override:
        return override
    value = _read_trimmed(SHARED_SECRET_PATH)
    return value or ""


def load_config(env: dict[str, str] | None = None) -> AgentConfig:
    env = os.environ if env is None else env
    spool_path = Path(env.get("CDX_SPOOL_PATH", str(DEFAULT_SPOOL_PATH)))
    return AgentConfig(
        device_id=resolve_device_id(env),
        api_endpoint=env.get("CDX_API_ENDPOINT", DEFAULT_API_ENDPOINT),
        profile=env.get("CDX_PROFILE", DEFAULT_PROFILE),
        shared_secret=resolve_shared_secret(env),
        spool_path=spool_path,
    )
