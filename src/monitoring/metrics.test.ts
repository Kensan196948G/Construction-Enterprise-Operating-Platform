/** Unit tests for the Prometheus metrics registry (P4). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { incrementCounter, recordRequest, renderMetrics, setGauge } from "./metrics.ts";

test("recordRequest increments labeled counters", () => {
  recordRequest("GET", "/health", 200);
  recordRequest("GET", "/health", 200);
  recordRequest("GET", "/api/v1/projects", 401);
  const text = renderMetrics();
  assert.match(text, /ceop_http_requests_total\{method="GET",route="\/health",status="200"\} 2/);
  assert.match(
    text,
    /ceop_http_requests_total\{method="GET",route="\/api\/v1\/projects",status="401"\} 1/,
  );
});

test("gauges render with HELP/TYPE lines", () => {
  setGauge("ceop_audit_log_size", 42);
  const text = renderMetrics({ ceop_notifications_pending: 3 });
  assert.match(text, /# HELP ceop_audit_log_size /);
  assert.match(text, /^ceop_audit_log_size 42$/m);
  assert.match(text, /^ceop_notifications_pending 3$/m);
});

test("incrementCounter merges duplicate labels", () => {
  incrementCounter("ceop_test_counter", { a: "1" });
  incrementCounter("ceop_test_counter", { a: "1" });
  assert.match(renderMetrics(), /ceop_test_counter\{a="1"\} 2/);
});
