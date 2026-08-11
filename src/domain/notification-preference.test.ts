/** Unit tests for notification preference domain (Enterprise-OS E-11 / ServiceHub S-09). */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createNotificationPreference,
  updateNotificationPreference,
} from "./notification-preference.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("notification preference domain creates a preference with defaults", () => {
  const ok = createNotificationPreference({
    id: "np-1",
    userId: "user-1",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.userId, "user-1");
  assert.equal(ok.value.emailEnabled, true);
  assert.equal(ok.value.slackEnabled, false);
  assert.deepEqual(ok.value.events, {});
});

test("notification preference domain validates slackWebhookUrl starts with https", () => {
  const ok = createNotificationPreference({
    id: "np-2",
    userId: "user-2",
    slackEnabled: true,
    slackWebhookUrl: "https://hooks.slack.com/services/TEST",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.slackWebhookUrl, "https://hooks.slack.com/services/TEST");

  const bad = createNotificationPreference({
    id: "np-3",
    userId: "user-3",
    slackWebhookUrl: "http://example.com",
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("notification preference domain rejects empty id and userId", () => {
  assert.ok(
    !createNotificationPreference({ id: "", userId: "user-1", createdAt: NOW as never }).ok,
  );
  assert.ok(!createNotificationPreference({ id: "np", userId: "", createdAt: NOW as never }).ok);
});

test("notification preference domain stores event flags", () => {
  const r = createNotificationPreference({
    id: "np-events",
    userId: "user-1",
    events: { "daily-report.submitted": true, "incident.created": false },
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.events["daily-report.submitted"], true);
  assert.equal(r.value.events["incident.created"], false);
});

test("updateNotificationPreference merges fields into existing preference", () => {
  const existing = createNotificationPreference({
    id: "np-upd",
    userId: "user-1",
    emailEnabled: true,
    slackEnabled: false,
    createdAt: NOW as never,
  });
  assert.ok(existing.ok);

  const updated = updateNotificationPreference(existing.value, {
    emailEnabled: false,
    slackEnabled: true,
    slackWebhookUrl: "https://hooks.slack.com/services/XYZ",
    events: { "incident.created": true },
    updatedAt: "2026-08-08T00:00:00.000Z" as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.emailEnabled, false);
  assert.equal(updated.value.slackEnabled, true);
  assert.equal(updated.value.slackWebhookUrl, "https://hooks.slack.com/services/XYZ");
  assert.equal(updated.value.events["incident.created"], true);
  assert.equal(updated.value.updatedAt, "2026-08-08T00:00:00.000Z" as never);
  // unchanged fields preserved
  assert.equal(updated.value.userId, "user-1");
});

test("updateNotificationPreference validates slackWebhookUrl", () => {
  const existing = createNotificationPreference({
    id: "np-v",
    userId: "user-1",
    createdAt: NOW as never,
  });
  assert.ok(existing.ok);

  const bad = updateNotificationPreference(existing.value, {
    slackWebhookUrl: "ftp://bad.url",
    updatedAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("updateNotificationPreference partial update preserves other fields", () => {
  const existing = createNotificationPreference({
    id: "np-partial",
    userId: "user-1",
    emailEnabled: true,
    slackEnabled: false,
    events: { "daily-report.submitted": true },
    createdAt: NOW as never,
  });
  assert.ok(existing.ok);

  const updated = updateNotificationPreference(existing.value, {
    slackEnabled: true,
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.emailEnabled, true); // preserved
  assert.equal(updated.value.slackEnabled, true); // updated
  assert.equal(updated.value.events["daily-report.submitted"], true); // preserved
});
