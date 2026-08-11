/** Unit tests for drawing/document domain (Enterprise-OS E-03). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createDocument } from "./document.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("document domain creates a drawing with defaults", () => {
  const ok = createDocument({
    id: "d-1",
    organizationId: "org",
    title: "構造図面 A-1",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.documentType, "other");
  assert.equal(ok.value.revision, 0);
  assert.equal(ok.value.status, "draft");
  assert.deepEqual(ok.value.tags, []);
});

test("document domain accepts all document types", () => {
  for (const t of ["drawing", "contract", "safety", "quality", "other"] as const) {
    const r = createDocument({
      id: `d-t-${t}`,
      organizationId: "org",
      title: "test",
      documentType: t,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `type ${t} should be valid`);
    assert.equal(r.value.documentType, t);
  }
});

test("document domain accepts all statuses", () => {
  for (const s of ["draft", "review", "approved", "issued", "archived"] as const) {
    const r = createDocument({
      id: `d-s-${s}`,
      organizationId: "org",
      title: "test",
      status: s,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `status ${s} should be valid`);
    assert.equal(r.value.status, s);
  }
});

test("document domain validates revision is non-negative integer", () => {
  const ok = createDocument({
    id: "d-rev-ok",
    organizationId: "org",
    title: "v2",
    revision: 2,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.revision, 2);

  const bad = createDocument({
    id: "d-rev-bad",
    organizationId: "org",
    title: "bad",
    revision: -1,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);

  const fractional = createDocument({
    id: "d-rev-frac",
    organizationId: "org",
    title: "bad",
    revision: 1.5,
    createdAt: NOW as never,
  });
  assert.ok(!fractional.ok);
});

test("document domain validates fileSize is non-negative safe integer", () => {
  const ok = createDocument({
    id: "d-fs-ok",
    organizationId: "org",
    title: "test",
    fileSize: 1024,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.fileSize, 1024);

  const bad = createDocument({
    id: "d-fs-bad",
    organizationId: "org",
    title: "bad",
    fileSize: -1,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("document domain rejects empty id, organizationId, title", () => {
  assert.ok(
    !createDocument({ id: "", organizationId: "org", title: "t", createdAt: NOW as never }).ok,
  );
  assert.ok(
    !createDocument({ id: "d", organizationId: "", title: "t", createdAt: NOW as never }).ok,
  );
  assert.ok(
    !createDocument({ id: "d", organizationId: "org", title: "", createdAt: NOW as never }).ok,
  );
});

test("document domain rejects invalid documentType", () => {
  const bad = createDocument({
    id: "d-bad",
    organizationId: "org",
    title: "test",
    documentType: "blueprint" as never,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("document domain trims title and preserves optional fields", () => {
  const r = createDocument({
    id: "d-full",
    organizationId: "org",
    projectId: "p-1",
    title: " 図面 A ",
    documentType: "drawing",
    revision: 1,
    status: "review",
    fileUrl: "s3://bucket/d-1.pdf",
    fileSize: 2048,
    tags: ["structure", "A-block"],
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.title, "図面 A");
  assert.equal(r.value.documentType, "drawing");
  assert.equal(r.value.revision, 1);
  assert.equal(r.value.status, "review");
  assert.equal(r.value.fileUrl, "s3://bucket/d-1.pdf");
  assert.deepEqual(r.value.tags, ["structure", "A-block"]);
  assert.ok(r.value.projectId);
  assert.equal(r.value.updatedAt, NOW);
});
