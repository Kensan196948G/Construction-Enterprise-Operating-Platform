"""SNMPv3 trap receiver for Cisco devices (pysnmp-lextudio v3).

Resolves trap OIDs via :mod:`snmp_mib`, packages each notification as a
:class:`TrapEvent`, and persists via a caller-provided async callback.
"""
from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from itsm_api.services import snmp_mib

logger = logging.getLogger(__name__)


@dataclass
class TrapEvent:
    time: datetime
    device_ip: str | None
    trap_oid: str | None
    severity: str = "medium"
    interface: str | None = None
    message: str | None = None
    varbinds: dict[str, str] = field(default_factory=dict)


PersistFn = Callable[[TrapEvent], Awaitable[None]]


def build_event(
    var_binds: list[tuple[Any, Any]],
    *,
    device_ip: str | None = None,
    now: datetime | None = None,
) -> TrapEvent:
    """Translate a pysnmp varbinds list into a :class:`TrapEvent`.

    The first varbind is typically ``sysUpTime``; the second is the snmpTrapOID
    (``1.3.6.1.6.3.1.1.4.1.0``). Remaining varbinds are payload.
    """
    vb = {str(o): str(v) for o, v in var_binds}
    trap_oid: str | None = None
    for k, v in vb.items():
        if k.endswith("1.3.6.1.6.3.1.1.4.1.0") or "snmpTrapOID" in k:
            trap_oid = v
            break
    sem = snmp_mib.resolve(trap_oid or "")
    interface = snmp_mib.interface_from_varbinds(vb)
    message = sem.description or trap_oid
    return TrapEvent(
        time=now or datetime.now(UTC),
        device_ip=device_ip,
        trap_oid=trap_oid,
        severity=sem.severity,
        interface=interface,
        message=message,
        varbinds=vb,
    )


def event_to_row(ev: TrapEvent) -> dict:
    return {
        "time": ev.time,
        "device_ip": ev.device_ip,
        "trap_oid": ev.trap_oid,
        "severity": ev.severity,
        "interface": ev.interface,
        "message": ev.message,
        "varbinds": ev.varbinds,
    }


async def start_trap_receiver(  # pragma: no cover - external IO
    host: str,
    port: int,
    persist: PersistFn,
    *,
    v3_user: str = "",
    auth_key: str = "",
    priv_key: str = "",
) -> None:
    """Bootstrap a pysnmp v3 trap receiver (SHA/AES). Returns after start."""
    try:
        from pysnmp.entity import config, engine
        from pysnmp.entity.rfc3413 import ntfrcv
    except Exception as exc:  # noqa: BLE001
        logger.warning("pysnmp unavailable; SNMP receiver disabled: %s", exc)
        return

    snmp_engine = engine.SnmpEngine()
    config.addTransport(
        snmp_engine,
        config.SOCK_DGRAM,  # type: ignore[attr-defined]
        (host, port),
    )
    if v3_user:
        # SHA + AES128 (authPriv)
        config.addV3User(
            snmp_engine,
            v3_user,
            config.usmHMACSHAAuthProtocol,
            auth_key or "",
            config.usmAesCfb128Protocol,
            priv_key or "",
        )

    loop = asyncio.get_running_loop()

    def _cb(_engine, _state_ref, _ctx_engine_id, _ctx_name, var_binds, _cb_ctx) -> None:
        ev = build_event(list(var_binds))
        # Schedule the async persistence onto the running loop
        loop.call_soon_threadsafe(asyncio.create_task, persist(ev))

    ntfrcv.NotificationReceiver(snmp_engine, _cb)
    logger.info("Cisco SNMP trap receiver listening on %s:%s", host, port)
