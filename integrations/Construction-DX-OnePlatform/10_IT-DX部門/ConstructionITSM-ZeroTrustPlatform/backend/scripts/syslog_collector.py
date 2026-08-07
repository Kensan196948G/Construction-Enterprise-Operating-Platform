"""Standalone FortiGate Syslog collector.

Runs as a separate OS process from the main API. Reads UDP syslog frames,
parses FortiGate key=value records and inserts them into ``t_fortigate_log``
in batches. Configuration comes from environment variables via
``itsm_api.config``.

Usage::

    python -m scripts.syslog_collector
"""
from __future__ import annotations

import asyncio
import logging
import signal
from collections.abc import Sequence

from itsm_api.config import get_settings
from itsm_api.db.session import SessionLocal
from itsm_api.models.fortigate_log import FortigateLog
from itsm_api.services.syslog_receiver import (
    SyslogRecord,
    record_to_row,
    start_udp,
)
from sqlalchemy import insert

logger = logging.getLogger(__name__)


async def persist_batch(records: Sequence[SyslogRecord]) -> None:
    if not records:
        return
    rows = [record_to_row(r) for r in records]
    # Use a short-lived sync session in a thread to avoid blocking the loop
    def _do() -> None:
        with SessionLocal() as db:
            db.execute(insert(FortigateLog), rows)
            db.commit()

    await asyncio.to_thread(_do)


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    settings = get_settings()
    transport, buffer = await start_udp(
        settings.syslog_host,
        settings.syslog_port,
        persist_batch,
        batch_size=settings.syslog_batch_size,
        interval_sec=settings.syslog_batch_interval_sec,
    )
    logger.info(
        "Syslog collector started on %s:%s (batch=%d, interval=%ss)",
        settings.syslog_host,
        settings.syslog_port,
        settings.syslog_batch_size,
        settings.syslog_batch_interval_sec,
    )

    stop_event = asyncio.Event()

    def _stop(*_a: object) -> None:
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _stop)
        except NotImplementedError:  # Windows
            signal.signal(sig, lambda *_: _stop())

    await stop_event.wait()
    transport.close()
    await buffer.stop()
    logger.info("Syslog collector stopped")


if __name__ == "__main__":
    asyncio.run(main())
