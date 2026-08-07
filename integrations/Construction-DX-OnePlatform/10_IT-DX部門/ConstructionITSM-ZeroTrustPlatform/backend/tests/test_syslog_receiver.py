"""Tests for FortiGate syslog parser + batch buffer."""
from __future__ import annotations

import asyncio

import pytest
from itsm_api.services.syslog_receiver import (
    BatchBuffer,
    aggregate,
    parse_fortigate,
    record_to_row,
)

SAMPLES = [
    (
        'date=2026-05-22 time=10:15:23 devname="FG-100F" devid="FGT-1" '
        'srcip=10.0.0.5 dstip=8.8.8.8 srcport=51234 dstport=53 '
        'action=allow policyid=12 level=notice msg="DNS query"'
    ),
    (
        '<189>date=2026-05-22 time=10:16:45 devname="FG-100F" '
        'srcip=192.168.10.20 dstip=203.0.113.10 srcport=44321 dstport=443 '
        'action=deny attack="SQL.Injection" level=critical policyid=999 msg="IPS blocked"'
    ),
    (
        'date=2026-05-22 time=10:17:01 devname="FG-200" srcip=10.0.0.6 '
        'dstip=10.0.0.7 srcport=22 dstport=22 action=allow level=warning'
    ),
]


def test_parse_fortigate_basic_fields() -> None:
    r = parse_fortigate(SAMPLES[0])
    assert r.device == "FG-100F"
    assert r.src_ip == "10.0.0.5"
    assert r.dst_ip == "8.8.8.8"
    assert r.src_port == 51234
    assert r.dst_port == 53
    assert r.action == "allow"
    assert r.severity == "notice"
    assert r.policy_id == "12"
    assert r.message == "DNS query"


def test_parse_fortigate_threat_and_pri() -> None:
    r = parse_fortigate(SAMPLES[1])
    assert r.action == "deny"
    assert r.threat == "SQL.Injection"
    assert r.severity == "critical"
    assert r.device == "FG-100F"


def test_aggregate_counts() -> None:
    recs = [parse_fortigate(s) for s in SAMPLES]
    agg = aggregate(recs)
    assert agg["by_action"]["allow"] == 2
    assert agg["by_action"]["deny"] == 1
    assert agg["by_threat"]["SQL.Injection"] == 1


def test_record_to_row_keys() -> None:
    row = record_to_row(parse_fortigate(SAMPLES[0]))
    assert {"time", "device_name", "src_ip", "dst_ip", "action", "raw"}.issubset(row.keys())
    assert row["device_name"] == "FG-100F"


@pytest.mark.asyncio
async def test_batch_buffer_size_flush() -> None:
    flushed: list[list] = []

    async def persist(batch):
        flushed.append(list(batch))

    buf = BatchBuffer(persist, max_size=2, interval_sec=10.0)
    await buf.add(parse_fortigate(SAMPLES[0]))
    assert flushed == []
    await buf.add(parse_fortigate(SAMPLES[1]))
    assert len(flushed) == 1
    assert len(flushed[0]) == 2


@pytest.mark.asyncio
async def test_batch_buffer_time_flush() -> None:
    flushed: list[list] = []

    async def persist(batch):
        flushed.append(list(batch))

    buf = BatchBuffer(persist, max_size=1000, interval_sec=0.05)
    buf.start()
    await buf.add(parse_fortigate(SAMPLES[2]))
    await asyncio.sleep(0.15)
    await buf.stop()
    assert sum(len(b) for b in flushed) == 1
