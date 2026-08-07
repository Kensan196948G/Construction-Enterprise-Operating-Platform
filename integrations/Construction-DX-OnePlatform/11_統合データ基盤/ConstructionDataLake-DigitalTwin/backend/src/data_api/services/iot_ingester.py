"""IoT ingestion: MQTT subscriber stub + HTTP receive helpers.

The MQTT subscriber is a thin wrapper around `paho-mqtt`. The actual broker
loop runs in a background process in production; here we expose only the
parser + handler hooks so they can be unit tested without a broker.
"""
from __future__ import annotations

import json
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

logger = logging.getLogger(__name__)


@dataclass
class TelemetryRecord:
    device_id: UUID
    metric_kind: str
    time: datetime
    payload: dict[str, Any]


PersistFn = Callable[[TelemetryRecord], Awaitable[None]]


def parse_mqtt_message(topic: str, raw_payload: bytes | str) -> TelemetryRecord:
    """Parse an MQTT message into a TelemetryRecord.

    Topic convention: ``cdx/iot/<device_uuid>/<metric_kind>``
    Payload: JSON object. Optional `time` field overrides timestamp.
    """
    parts = topic.split("/")
    if len(parts) < 4:
        raise ValueError(f"unexpected topic shape: {topic!r}")
    device_id = UUID(parts[-2])
    metric_kind = parts[-1]
    text = raw_payload.decode("utf-8") if isinstance(raw_payload, (bytes, bytearray)) else raw_payload
    body = json.loads(text)
    if not isinstance(body, dict):
        raise ValueError("payload must be a JSON object")
    ts_raw = body.pop("time", None)
    if ts_raw:
        ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00")) if isinstance(ts_raw, str) else ts_raw
    else:
        ts = datetime.now(UTC)
    return TelemetryRecord(device_id=device_id, metric_kind=metric_kind, time=ts, payload=body)


def record_to_row(rec: TelemetryRecord) -> dict[str, Any]:
    """Convert to a DB row for the t_iot_telemetry hypertable."""
    return {
        "time": rec.time,
        "device_id": str(rec.device_id),
        "metric_kind": rec.metric_kind,
        "payload": rec.payload,
    }


class MqttSubscriberStub:
    """Stand-in for the production paho-mqtt loop.

    Real implementation::

        import paho.mqtt.client as mqtt
        client = mqtt.Client()
        client.on_message = lambda c, u, msg: persist(parse_mqtt_message(msg.topic, msg.payload))
        client.connect(host, port); client.loop_forever()
    """

    def __init__(self, persist: PersistFn | None = None) -> None:
        self.persist = persist
        self.received: list[TelemetryRecord] = []

    async def on_message(self, topic: str, payload: bytes | str) -> TelemetryRecord:
        rec = parse_mqtt_message(topic, payload)
        self.received.append(rec)
        if self.persist:
            await self.persist(rec)
        return rec
