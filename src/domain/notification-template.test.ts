/** Unit tests for notification template domain (Enterprise-OS E-11). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createNotificationTemplate } from "./notification-template.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("notification template domain creates a template with all required fields", () => {
  const ok = createNotificationTemplate({
    id: "nt-1",
    templateKey: "daily-report.submitted",
    subject: "日報提出通知",
    body: "日報が提出されました。確認してください。",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.templateKey, "daily-report.submitted");
  assert.equal(ok.value.subject, "日報提出通知");
  assert.equal(ok.value.body, "日報が提出されました。確認してください。");
  assert.equal(ok.value.channel, "email");
});

test("notification template domain accepts all valid channels", () => {
  for (const ch of ["email", "slack", "webhook"] as const) {
    const r = createNotificationTemplate({
      id: `nt-${ch}`,
      templateKey: `key-${ch}`,
      subject: "S",
      body: "B",
      channel: ch,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `channel ${ch} should be valid`);
    assert.equal(r.value.channel, ch);
  }
});

test("notification template domain rejects invalid channel", () => {
  const bad = createNotificationTemplate({
    id: "nt-bad",
    templateKey: "k",
    subject: "s",
    body: "b",
    channel: "sms" as never,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("notification template domain rejects empty required fields", () => {
  assert.ok(
    !createNotificationTemplate({
      id: "",
      templateKey: "k",
      subject: "s",
      body: "b",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createNotificationTemplate({
      id: "nt",
      templateKey: "",
      subject: "s",
      body: "b",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createNotificationTemplate({
      id: "nt",
      templateKey: "k",
      subject: "",
      body: "b",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createNotificationTemplate({
      id: "nt",
      templateKey: "k",
      subject: "s",
      body: "",
      createdAt: NOW as never,
    }).ok,
  );
});

test("notification template domain accepts optional organizationId", () => {
  const without = createNotificationTemplate({
    id: "nt-noorg",
    templateKey: "key",
    subject: "S",
    body: "B",
    createdAt: NOW as never,
  });
  assert.ok(without.ok);
  assert.equal(without.value.organizationId, undefined);

  const withOrg = createNotificationTemplate({
    id: "nt-org",
    organizationId: "org-hq",
    templateKey: "key2",
    subject: "S",
    body: "B",
    createdAt: NOW as never,
  });
  assert.ok(withOrg.ok);
  assert.equal(withOrg.value.organizationId, "org-hq");
});

test("notification template domain sets updatedAt to createdAt", () => {
  const r = createNotificationTemplate({
    id: "nt-ts",
    templateKey: "key",
    subject: "S",
    body: "B",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.updatedAt, NOW);
});
