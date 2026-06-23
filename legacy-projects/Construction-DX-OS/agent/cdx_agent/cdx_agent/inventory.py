"""Inventory collection for cdx-agent MVP.

Minimum viable fields per docs/cdx-agent仕様書.md:
device_id, hostname, cpu, memory, os_version, kernel_version, timezone.

Each collector is pure-Python (no external dependencies) so the agent runs
on a freshly imaged Debian client with no extra packages.
"""

from __future__ import annotations

import os
import platform
import socket
import time
from dataclasses import asdict, dataclass


@dataclass(frozen=True, slots=True)
class InventorySnapshot:
    device_id: str
    hostname: str
    cpu: str
    cpu_count: int
    memory_bytes: int
    os_version: str
    kernel_version: str
    timezone: str
    collected_at: str

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def _detect_memory_bytes() -> int:
    """Read total memory from /proc/meminfo.

    Returns 0 on non-Linux or unreadable environments so the caller can still
    emit a valid (though degraded) inventory record. Silently swallowing here
    is deliberate: inventory collection must never crash the agent.
    """
    try:
        with open("/proc/meminfo", encoding="utf-8") as fh:
            for line in fh:
                if line.startswith("MemTotal:"):
                    kb = int(line.split()[1])
                    return kb * 1024
    except (FileNotFoundError, PermissionError, ValueError, OSError):
        return 0
    return 0


def _detect_os_version() -> str:
    """Parse PRETTY_NAME from /etc/os-release (Debian/systemd standard)."""
    try:
        with open("/etc/os-release", encoding="utf-8") as fh:
            for line in fh:
                if line.startswith("PRETTY_NAME="):
                    return line.split("=", 1)[1].strip().strip('"')
    except (FileNotFoundError, PermissionError, OSError):
        pass
    return platform.platform()


def _detect_timezone() -> str:
    return time.strftime("%Z") or "UTC"


def collect(device_id: str) -> InventorySnapshot:
    return InventorySnapshot(
        device_id=device_id,
        hostname=socket.gethostname(),
        cpu=platform.processor() or platform.machine(),
        cpu_count=os.cpu_count() or 0,
        memory_bytes=_detect_memory_bytes(),
        os_version=_detect_os_version(),
        kernel_version=platform.release(),
        timezone=_detect_timezone(),
        collected_at=time.strftime("%Y-%m-%dT%H:%M:%S%z") or "",
    )
