"""Standalone Cisco SNMPv3 trap collector.

Usage::

    python -m scripts.snmp_trap_collector
"""
from __future__ import annotations

import asyncio
import logging
import signal

from itsm_api.config import get_settings
from itsm_api.db.session import SessionLocal
from itsm_api.models.cisco_event import CiscoEvent
from itsm_api.services.snmp_collector import TrapEvent, event_to_row, start_trap_receiver
from sqlalchemy import insert

logger = logging.getLogger(__name__)


async def persist(event: TrapEvent) -> None:
    row = event_to_row(event)

    def _do() -> None:
        with SessionLocal() as db:
            db.execute(insert(CiscoEvent), [row])
            db.commit()

    await asyncio.to_thread(_do)


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    settings = get_settings()
    await start_trap_receiver(
        settings.snmp_trap_host,
        settings.snmp_trap_port,
        persist,
        v3_user=settings.snmp_v3_user,
        auth_key=settings.snmp_v3_auth_key,
        priv_key=settings.snmp_v3_priv_key,
    )
    logger.info(
        "SNMP trap collector started on %s:%s (user=%s)",
        settings.snmp_trap_host,
        settings.snmp_trap_port,
        settings.snmp_v3_user or "(none)",
    )

    stop_event = asyncio.Event()

    def _stop(*_a: object) -> None:
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _stop)
        except NotImplementedError:
            signal.signal(sig, lambda *_: _stop())

    await stop_event.wait()
    logger.info("SNMP trap collector stopped")


if __name__ == "__main__":
    asyncio.run(main())
