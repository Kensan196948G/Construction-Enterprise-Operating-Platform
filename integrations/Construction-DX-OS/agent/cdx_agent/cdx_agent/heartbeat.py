"""Heartbeat payload builder.

A heartbeat is a lightweight periodic message stating "the device is alive
and reachable". It is intentionally smaller than an inventory snapshot so
that low-bandwidth construction sites can still keep a presence signal.
"""

from __future__ import annotations

import time
from dataclasses import asdict, dataclass

from cdx_agent.__version__ import __version__


@dataclass(frozen=True, slots=True)
class Heartbeat:
    device_id: str
    agent_version: str
    uptime_seconds: int
    sent_at: str
    kind: str = "heartbeat"

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def _read_uptime_seconds() -> int:
    try:
        with open("/proc/uptime", encoding="utf-8") as fh:
            first = fh.readline().split()[0]
            return int(float(first))
    except (FileNotFoundError, PermissionError, ValueError, IndexError, OSError):
        return 0


def build(device_id: str, now: float | None = None) -> Heartbeat:
    """Assemble a heartbeat record for the given device.

    ``now`` is injectable so tests can pin timestamps.
    """
    sent_epoch = time.time() if now is None else now
    sent_at = time.strftime("%Y-%m-%dT%H:%M:%S%z", time.localtime(sent_epoch)) or ""
    return Heartbeat(
        device_id=device_id,
        agent_version=__version__,
        uptime_seconds=_read_uptime_seconds(),
        sent_at=sent_at,
    )
