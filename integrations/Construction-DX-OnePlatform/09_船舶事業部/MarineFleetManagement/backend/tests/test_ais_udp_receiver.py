"""AIS UDP 受信プロセス テスト.

モック UDP socket で sentence を投入し、バッファに保存されるか検証する。
DB は使わず、persist フックを差し替えて確認。
"""
from __future__ import annotations

import asyncio

import pytest

from scripts.ais_persist import AISPositionBuffer, BufferedRow
from scripts.ais_receiver_main import run_receiver


@pytest.mark.asyncio
async def test_udp_receive_and_buffer_two_sentences() -> None:
    """UDP に 2 件投入 → buffer 経由で persist_fn に 2 件渡される."""
    captured: list[BufferedRow] = []

    async def fake_persist(rows: list[BufferedRow]) -> int:
        captured.extend(rows)
        return len(rows)

    buffer = AISPositionBuffer(batch_size=10, persist_fn=fake_persist)
    stop_event = asyncio.Event()

    # 動的にポート確保 (0 不可なので 14001 を使う)
    port = 14001

    task = asyncio.create_task(
        run_receiver(
            port=port,
            batch_size=10,
            flush_interval_s=0.05,
            buffer=buffer,
            stop_event=stop_event,
            host="127.0.0.1",
        )
    )

    # UDP socket でセンテンスを送る
    loop = asyncio.get_running_loop()
    transport, _ = await loop.create_datagram_endpoint(
        lambda: asyncio.DatagramProtocol(),
        remote_addr=("127.0.0.1", port),
    )
    try:
        # 標準 AIVDM Type 1 サンプル
        s1 = b"!AIVDM,1,1,,A,13aGt0PP00Oh<:tEEHO0?wvL2HHU,0*39\r\n"
        s2 = b"!AIVDM,1,1,,B,35MC>W@01g0`q5BEhEi`OwwR2<11,0*3F\r\n"
        # サーバが listen を始めるまで一瞬待つ
        await asyncio.sleep(0.1)
        transport.sendto(s1)
        transport.sendto(s2)
        # 受信 + flush を待つ
        await asyncio.sleep(0.3)
    finally:
        transport.close()
        stop_event.set()
        await asyncio.wait_for(task, timeout=2.0)

    assert len(captured) == 2
    # 解析後 MMSI が数値文字列で入っているか
    assert all(r.mmsi.isdigit() for r in captured)


@pytest.mark.asyncio
async def test_invalid_sentence_is_dropped() -> None:
    """不正な行は drop される (バッファに入らない)."""
    captured: list[BufferedRow] = []

    async def fake_persist(rows: list[BufferedRow]) -> int:
        captured.extend(rows)
        return len(rows)

    buffer = AISPositionBuffer(batch_size=10, persist_fn=fake_persist)
    stop_event = asyncio.Event()

    port = 14002
    task = asyncio.create_task(
        run_receiver(
            port=port,
            batch_size=10,
            flush_interval_s=0.05,
            buffer=buffer,
            stop_event=stop_event,
            host="127.0.0.1",
        )
    )

    loop = asyncio.get_running_loop()
    transport, _ = await loop.create_datagram_endpoint(
        lambda: asyncio.DatagramProtocol(),
        remote_addr=("127.0.0.1", port),
    )
    try:
        await asyncio.sleep(0.1)
        # 1 つは不正 (GPGGA), 1 つは正常 AIVDM
        transport.sendto(b"$GPGGA,123519,xxx*47\r\n")
        transport.sendto(b"!AIVDM,1,1,,A,13aGt0PP00Oh<:tEEHO0?wvL2HHU,0*39\r\n")
        await asyncio.sleep(0.3)
    finally:
        transport.close()
        stop_event.set()
        await asyncio.wait_for(task, timeout=2.0)

    assert len(captured) == 1
