/** Unit tests for photo/document metadata domain (ServiceHub S-03). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createPhoto } from "./photo.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("photo domain creates metadata with objectKey default and category default", () => {
  const ok = createPhoto({
    id: "ph-1",
    organizationId: "org",
    projectId: "p-1",
    fileName: "site.jpg",
    originalName: "IMG_001.jpg",
    contentType: "image/jpeg",
    fileSize: 1024,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.objectKey, "photos/ph-1");
  assert.equal(ok.value.category, "general");
  assert.equal(ok.value.fileName, "site.jpg");
  assert.equal(ok.value.originalName, "IMG_001.jpg");
  assert.equal(ok.value.contentType, "image/jpeg");
  assert.equal(ok.value.fileSize, 1024);
});

test("photo domain accepts all categories", () => {
  for (const c of ["general", "progress", "safety", "quality", "handover"] as const) {
    const r = createPhoto({
      id: `ph-cat-${c}`,
      organizationId: "org",
      projectId: "p-1",
      fileName: "f.jpg",
      originalName: "o.jpg",
      contentType: "image/jpeg",
      fileSize: 100,
      category: c,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `category ${c} should be valid`);
    assert.equal(r.value.category, c);
  }
});

test("photo domain validates fileSize as non-negative safe integer", () => {
  assert.ok(
    !createPhoto({
      id: "ph-bad-size",
      organizationId: "org",
      projectId: "p-1",
      fileName: "f.jpg",
      originalName: "o.jpg",
      contentType: "image/jpeg",
      fileSize: -1,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createPhoto({
      id: "ph-float-size",
      organizationId: "org",
      projectId: "p-1",
      fileName: "f.jpg",
      originalName: "o.jpg",
      contentType: "image/jpeg",
      fileSize: 1.5,
      createdAt: NOW as never,
    }).ok,
  );
});

test("photo domain rejects invalid category", () => {
  const bad = createPhoto({
    id: "ph-bad-cat",
    organizationId: "org",
    projectId: "p-1",
    fileName: "f.jpg",
    originalName: "o.jpg",
    contentType: "image/jpeg",
    fileSize: 100,
    category: "panorama" as never,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("photo domain rejects empty required string fields", () => {
  assert.ok(
    !createPhoto({
      id: "",
      organizationId: "org",
      projectId: "p-1",
      fileName: "f.jpg",
      originalName: "o.jpg",
      contentType: "image/jpeg",
      fileSize: 100,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createPhoto({
      id: "ph",
      organizationId: "org",
      projectId: "p-1",
      fileName: "",
      originalName: "o.jpg",
      contentType: "image/jpeg",
      fileSize: 100,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createPhoto({
      id: "ph",
      organizationId: "org",
      projectId: "p-1",
      fileName: "f.jpg",
      originalName: "",
      contentType: "image/jpeg",
      fileSize: 100,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createPhoto({
      id: "ph",
      organizationId: "org",
      projectId: "p-1",
      fileName: "f.jpg",
      originalName: "o.jpg",
      contentType: "",
      fileSize: 100,
      createdAt: NOW as never,
    }).ok,
  );
});

test("photo domain stores optional caption, takenAt, and custom objectKey", () => {
  const r = createPhoto({
    id: "ph-full",
    organizationId: "org",
    projectId: "p-1",
    fileName: "progress.jpg",
    originalName: "IMG_20260807_0900.jpg",
    contentType: "image/jpeg",
    fileSize: 5120,
    objectKey: "uploads/2026/08/ph-full.jpg",
    category: "progress",
    caption: "基礎工事進捗（北側）",
    takenAt: "2026-08-07T09:00:00.000Z",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.objectKey, "uploads/2026/08/ph-full.jpg");
  assert.equal(r.value.caption, "基礎工事進捗（北側）");
  assert.equal(r.value.takenAt, "2026-08-07T09:00:00.000Z");
  assert.equal(r.value.updatedAt, NOW);
});

test("photo domain accepts 0 as valid fileSize", () => {
  const ok = createPhoto({
    id: "ph-zero",
    organizationId: "org",
    projectId: "p-1",
    fileName: "empty.jpg",
    originalName: "empty.jpg",
    contentType: "image/jpeg",
    fileSize: 0,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.fileSize, 0);
});
