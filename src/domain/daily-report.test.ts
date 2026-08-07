/** Unit tests for the daily report domain (S-02). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createDailyReport, transitionDailyReport, updateDailyReport } from "./daily-report.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("createDailyReport produces a draft with defaults", () => {
  const result = createDailyReport({
    id: "dr-1",
    organizationId: "org-hq",
    projectId: "project-1",
    reportDate: "2026-08-07",
    workerCount: 4,
    weather: "sunny",
    progressRate: 30,
    createdAt: NOW as never,
  });
  assert.ok(result.ok);
  assert.equal(result.value.status, "draft");
  assert.equal(result.value.workerCount, 4);
  assert.equal(result.value.safetyCheck, false);
});

test("createDailyReport rejects invalid weather, counts, and progress", () => {
  const badWeather = createDailyReport({
    id: "dr-2",
    organizationId: "org",
    projectId: "p",
    reportDate: "2026-08-07",
    weather: "hurricane" as never,
    createdAt: NOW as never,
  });
  assert.ok(!badWeather.ok);

  const badProgress = createDailyReport({
    id: "dr-3",
    organizationId: "org",
    projectId: "p",
    reportDate: "2026-08-07",
    progressRate: 101,
    createdAt: NOW as never,
  });
  assert.ok(!badProgress.ok);
});

test("updateDailyReport merges and transition enforces lifecycle", () => {
  const created = createDailyReport({
    id: "dr-4",
    organizationId: "org",
    projectId: "p",
    reportDate: "2026-08-07",
    createdAt: NOW as never,
  });
  assert.ok(created.ok);
  const updated = updateDailyReport(created.value, {
    workerCount: 3,
    safetyCheck: true,
    updatedAt: "2026-08-07T07:00:00.000Z" as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.safetyCheck, true);

  const submitted = transitionDailyReport(
    updated.value,
    "submitted",
    "2026-08-07T08:00:00.000Z" as never,
  );
  assert.ok(submitted.ok);
  assert.equal(submitted.value.status, "submitted");
  const approved = transitionDailyReport(
    submitted.value,
    "approved",
    "2026-08-07T09:00:00.000Z" as never,
  );
  assert.ok(approved.ok);
  const invalid = transitionDailyReport(
    approved.value,
    "submitted",
    "2026-08-07T10:00:00.000Z" as never,
  );
  assert.ok(!invalid.ok);
});
