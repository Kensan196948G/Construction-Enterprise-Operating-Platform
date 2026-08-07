/**
 * Unit tests for the gateway proxy path sanitizer.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeProxyPath } from "./proxy.ts";

test("sanitizeProxyPath accepts normal relative paths", () => {
  assert.equal(sanitizeProxyPath("projects"), "projects");
  assert.equal(sanitizeProxyPath("projects/123/detail"), "projects/123/detail");
  assert.equal(sanitizeProxyPath(""), "");
  assert.equal(sanitizeProxyPath("/"), "");
});

test("sanitizeProxyPath rejects traversal and control characters", () => {
  assert.equal(sanitizeProxyPath("../secret"), null);
  assert.equal(sanitizeProxyPath("a/../../b"), null);
  assert.equal(sanitizeProxyPath("./a"), null);
  assert.equal(sanitizeProxyPath("a\0b"), null);
  assert.equal(sanitizeProxyPath("a\\b"), null);
  assert.equal(sanitizeProxyPath("a%2eb"), null);
});
