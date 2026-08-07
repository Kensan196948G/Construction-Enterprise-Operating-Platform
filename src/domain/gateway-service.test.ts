/**
 * Unit tests for gateway service domain validation.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createGatewayService, permissionsForMethod } from "./gateway-service.ts";

const VALID = {
  id: "servicehub",
  name: "ServiceHub",
  baseUrl: "http://127.0.0.1:8080",
  pathPrefix: "/api/v1/integrations/servicehub",
  readPermissions: ["integration:read"],
  writePermissions: ["integration:write"],
};

test("valid service gets defaults", () => {
  const result = createGatewayService(VALID);
  assert.ok(result.ok);
  assert.equal(result.value.timeoutMs, 10_000);
  assert.equal(result.value.enabled, true);
  assert.equal(result.value.baseUrl, "http://127.0.0.1:8080");
});

test("invalid id is rejected", () => {
  const result = createGatewayService({ ...VALID, id: "Bad ID!" });
  assert.ok(!result.ok);
  assert.ok(result.error.some((issue) => issue.path === "id"));
});

test("baseUrl with credentials or query is rejected", () => {
  const withCreds = createGatewayService({ ...VALID, baseUrl: "http://user:pass@host:1" });
  assert.ok(!withCreds.ok);
  const withQuery = createGatewayService({ ...VALID, baseUrl: "http://host:1?x=1" });
  assert.ok(!withQuery.ok);
});

test("pathPrefix must be /-segmented and not end with slash", () => {
  const bad = createGatewayService({ ...VALID, pathPrefix: "/api/v1/integrations/servicehub/" });
  assert.ok(!bad.ok);
  const withTrailing = createGatewayService({ ...VALID, pathPrefix: "api/v1" });
  assert.ok(!withTrailing.ok);
});

test("empty permissions are rejected", () => {
  const result = createGatewayService({
    ...VALID,
    readPermissions: [],
    writePermissions: [],
  });
  assert.ok(!result.ok);
  assert.ok(result.error.some((issue) => issue.path === "readPermissions"));
});

test("invalid permission strings are rejected", () => {
  const result = createGatewayService({
    ...VALID,
    readPermissions: ["not a permission"],
  });
  assert.ok(!result.ok);
  assert.ok(result.error.some((issue) => issue.path === "readPermissions"));
});

test("timeout bounds are enforced", () => {
  const zero = createGatewayService({ ...VALID, timeoutMs: 0 });
  assert.ok(!zero.ok);
  const huge = createGatewayService({ ...VALID, timeoutMs: 60_001 });
  assert.ok(!huge.ok);
  const fine = createGatewayService({ ...VALID, timeoutMs: 250 });
  assert.ok(fine.ok);
  assert.equal(fine.value.timeoutMs, 250);
});

test("upstreamTokenEnv must be an env-var-shaped name", () => {
  const okCase = createGatewayService({
    ...VALID,
    upstreamTokenEnv: "CEOP_GATEWAY_SERVICEHUB_TOKEN",
  });
  assert.ok(okCase.ok);
  const bad = createGatewayService({ ...VALID, upstreamTokenEnv: "lower-case" });
  assert.ok(!bad.ok);
});

test("permissionsForMethod selects read vs write", () => {
  const result = createGatewayService(VALID);
  assert.ok(result.ok);
  assert.deepEqual(permissionsForMethod(result.value, "GET"), ["integration:read"]);
  assert.deepEqual(permissionsForMethod(result.value, "HEAD"), ["integration:read"]);
  assert.deepEqual(permissionsForMethod(result.value, "POST"), ["integration:write"]);
  assert.deepEqual(permissionsForMethod(result.value, "DELETE"), ["integration:write"]);
});
