/** Unit tests for notification delivery domain (ServiceHub S-09). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createNotificationDelivery } from "./notification.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("notification domain creates a pending delivery with defaults", () => {
  const ok = createNotificationDelivery({
    id: "n-1",
    userId: "user-1",
    eventKey: "daily-report.submitted",
    channel: "email",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.userId, "user-1");
  assert.equal(ok.value.eventKey, "daily-report.submitted");
  assert.equal(ok.value.channel, "email");
  assert.equal(ok.value.status, "pending");
  assert.equal(ok.value.attempts, 0);
});

test("notification domain accepts all valid channels", () => {
  for (const ch of ["email", "slack", "webhook"] as const) {
    const r = createNotificationDelivery({
      id: `n-ch-${ch}`,
      userId: "user-1",
      eventKey: "test",
      channel: ch,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `channel ${ch} should be valid`);
    assert.equal(r.value.channel, ch);
  }
});

test("notification domain rejects invalid channel", () => {
  const bad = createNotificationDelivery({
    id: "n-bad",
    userId: "user-1",
    eventKey: "test",
    channel: "sms" as never,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("notification domain rejects empty id, userId, eventKey", () => {
  assert.ok(
    !createNotificationDelivery({
      id: "",
      userId: "user-1",
      eventKey: "test",
      channel: "email",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createNotificationDelivery({
      id: "n",
      userId: "",
      eventKey: "test",
      channel: "email",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createNotificationDelivery({
      id: "n",
      userId: "user-1",
      eventKey: "",
      channel: "email",
      createdAt: NOW as never,
    }).ok,
  );
});

test("notification domain stores optional subject and bodyPreview", () => {
  const r = createNotificationDelivery({
    id: "n-full",
    userId: "user-1",
    eventKey: "incident.created",
    channel: "slack",
    subject: "インシデント発生通知",
    bodyPreview: "重大インシデントが発生しました。",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.subject, "インシデント発生通知");
  assert.equal(r.value.bodyPreview, "重大インシデントが発生しました。");
  assert.equal(r.value.updatedAt, NOW);
});

test("notification domain validates organizationId is non-empty when present", () => {
  const ok = createNotificationDelivery({
    id: "n-org",
    organizationId: "org-hq",
    userId: "user-1",
    eventKey: "test",
    channel: "email",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.organizationId, "org-hq");

  const bad = createNotificationDelivery({
    id: "n-bad-org",
    organizationId: "   ",
    userId: "user-1",
    eventKey: "test",
    channel: "email",
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("notification domain starts with attempts=0 and pending status", () => {
  const r = createNotificationDelivery({
    id: "n-pending",
    userId: "user-1",
    eventKey: "test",
    channel: "webhook",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.status, "pending");
  assert.equal(r.value.attempts, 0);
  assert.equal(r.value.sentAt, undefined);
  assert.equal(r.value.readAt, undefined);
  assert.equal(r.value.errorDetail, undefined);
  assert.equal(r.value.failureKind, undefined);
});
