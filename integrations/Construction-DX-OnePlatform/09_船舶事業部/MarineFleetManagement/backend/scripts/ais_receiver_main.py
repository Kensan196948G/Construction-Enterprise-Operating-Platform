"""AIS UDP 受信プロセス (常駐).

UDP ポート (既定 4001) で AIVDM/AIVDO センテンスを受信し、
`marine_api.services.ais_receiver.parse_aivdm` で解析して
`t_marine_vessel_position` テーブルへ非同期 bulk insert する。

メイン API とは独立したプロセスとして起動する想定:

    python -m scripts.ais_receiver_main --port 4001

バッチ条件:
- バッファが `--batch-size` (既定 500) 件以上溜まった
- 直近 flush から `--flush-interval` (既定 1.0s) 以上経過
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import os
from typing import Any

from scripts.ais_persist import AISPositionBuffer
from marine_api.services.ais_receiver import parse_aivdm

LOG = logging.getLogger("ais_receiver")

DEFAULT_PORT = 4001
DEFAULT_BATCH_SIZE = 500
DEFAULT_FLUSH_INTERVAL_S = 1.0


class AISDatagramProtocol(asyncio.DatagramProtocol):
    """AIS UDP データグラム受信プロトコル.

    各データグラムは 1 行以上の AIVDM/AIVDO センテンス (CRLF/LF 区切り)。
    multipart sentence (fragments > 1) は本実装ではサポートせず drop。
    """

    def __init__(self, buffer: AISPositionBuffer) -> None:
        self._buffer = buffer

    def datagram_received(self, data: bytes, addr: tuple[Any, ...]) -> None:
        try:
            text = data.decode("ascii", errors="replace")
        except Exception:
            LOG.debug("undecodable datagram from %s", addr)
            return

        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line or not line.startswith(("!AIVDM", "!AIVDO")):
                continue
            fields = line.split(",")
            if len(fields) >= 3:
                try:
                    fragments = int(fields[1] or "1")
                except ValueError:
                    fragments = 1
                if fragments > 1:
                    LOG.debug("multipart sentence ignored: %s", line[:40])
                    continue
            try:
                pos = parse_aivdm(line)
            except ValueError as e:
                LOG.debug("parse error: %s (%s)", e, line[:40])
                continue
            self._buffer.add_from_ais(pos)

    def error_received(self, exc: Exception) -> None:
        LOG.warning("UDP error: %s", exc)


async def run_receiver(
    *,
    port: int = DEFAULT_PORT,
    batch_size: int = DEFAULT_BATCH_SIZE,
    flush_interval_s: float = DEFAULT_FLUSH_INTERVAL_S,
    buffer: AISPositionBuffer | None = None,
    stop_event: asyncio.Event | None = None,
    host: str = "0.0.0.0",
) -> None:
    """UDP 受信ループを開始する.

    `stop_event` がセットされたら graceful shutdown。
    `buffer` を外部から渡せばテストでフックできる。
    """
    loop = asyncio.get_running_loop()
    buf = buffer or AISPositionBuffer(batch_size=batch_size)

    transport, _ = await loop.create_datagram_endpoint(
        lambda: AISDatagramProtocol(buf),
        local_addr=(host, port),
    )
    LOG.info("AIS UDP receiver listening on %s:%d", host, port)

    try:
        while True:
            if stop_event is not None and stop_event.is_set():
                break
            await asyncio.sleep(flush_interval_s)
            await buf.flush_if_needed(force=True)
    finally:
        await buf.flush_if_needed(force=True)
        transport.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="AIS UDP receiver")
    parser.add_argument("--port", type=int, default=int(os.getenv("AIS_UDP_PORT", DEFAULT_PORT)))
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--flush-interval", type=float, default=DEFAULT_FLUSH_INTERVAL_S)
    parser.add_argument("--log-level", default=os.getenv("LOG_LEVEL", "INFO"))
    args = parser.parse_args()

    logging.basicConfig(
        level=args.log_level.upper(),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

    asyncio.run(
        run_receiver(
            port=args.port,
            batch_size=args.batch_size,
            flush_interval_s=args.flush_interval,
        )
    )


__all__ = ["AISDatagramProtocol", "run_receiver", "main"]


if __name__ == "__main__":
    main()
