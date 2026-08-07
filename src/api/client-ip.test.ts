import { test } from "node:test";
import assert from "node:assert/strict";

import { isLoopbackAddress, resolveClientIp } from "./client-ip.ts";

test("client-ip: loopback addresses are recognised (IPv4 and IPv6 mapped)", () => {
  assert.equal(isLoopbackAddress("127.0.0.1"), true);
  assert.equal(isLoopbackAddress("::1"), true);
  assert.equal(isLoopbackAddress("::ffff:127.0.0.1"), true);
  assert.equal(isLoopbackAddress("192.168.0.1"), false);
  assert.equal(isLoopbackAddress(undefined), false);
});

test("client-ip: trusts CF-Connecting-IP only when the TCP peer is loopback", () => {
  assert.equal(resolveClientIp("127.0.0.1", "203.0.113.9"), "203.0.113.9");
  assert.equal(resolveClientIp("::ffff:127.0.0.1", "203.0.113.9"), "203.0.113.9");
  // A forged header from a non-loopback peer must be ignored.
  assert.equal(resolveClientIp("192.168.0.5", "203.0.113.9"), "192.168.0.5");
});

test("client-ip: malformed or missing proxy headers fall back to the socket address", () => {
  assert.equal(resolveClientIp("127.0.0.1", undefined), "127.0.0.1");
  assert.equal(resolveClientIp("127.0.0.1", "not-an-ip"), "127.0.0.1");
  assert.equal(resolveClientIp("127.0.0.1", ""), "127.0.0.1");
});

test("client-ip: handles comma-separated proxy chains by taking the first entry", () => {
  assert.equal(resolveClientIp("127.0.0.1", "203.0.113.9, 10.0.0.1"), "203.0.113.9");
});
