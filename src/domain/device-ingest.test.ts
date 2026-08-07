/**
 * Unit tests for device heartbeat/inventory helpers (D-01..D-03).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createDevice, touchDevice, withDeviceMetadata } from "./device.ts";

const NOW = "2026-08-07T06:00:00.000Z";

function sample() {
  const result = createDevice({
    id: "device-1",
    organizationId: "org-hq",
    kind: "laptop",
    status: "provisioned",
    metadata: { os: "windows11" },
  });
  assert.ok(result.ok);
  return result.value;
}

test("touchDevice updates lastSeenAt and optional status", () => {
  const device = sample();
  const beat = touchDevice(device, NOW as never, "active");
  assert.ok(beat.ok);
  assert.equal(beat.value.lastSeenAt, NOW);
  assert.equal(beat.value.status, "active");
});

test("touchDevice rejects invalid status", () => {
  const device = sample();
  const bad = touchDevice(device, NOW as never, "exploded" as never);
  assert.ok(!bad.ok);
});

test("withDeviceMetadata merges inventory without losing existing values", () => {
  const device = sample();
  const updated = withDeviceMetadata(device, { cpu: "i7", os: "windows11-24h2" });
  assert.equal(updated.metadata?.["os"], "windows11-24h2");
  assert.equal(updated.metadata?.["cpu"], "i7");
});
