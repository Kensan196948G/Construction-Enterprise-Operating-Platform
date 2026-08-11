/** Unit tests for knowledge article domain (ServiceHub S-06). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createKnowledgeArticle } from "./knowledge.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("knowledge domain creates a general article with defaults", () => {
  const ok = createKnowledgeArticle({
    id: "k-1",
    organizationId: "org",
    title: "FAQ",
    content: "content",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.category, "general");
  assert.equal(ok.value.isPublished, false);
  assert.equal(ok.value.viewCount, 0);
  assert.equal(ok.value.aiGenerated, false);
  assert.deepEqual(ok.value.tags, []);
});

test("knowledge domain accepts all categories", () => {
  for (const c of ["general", "faq", "incident", "contract", "safety"] as const) {
    const r = createKnowledgeArticle({
      id: `k-cat-${c}`,
      organizationId: "org",
      title: "test",
      content: "test",
      category: c,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `category ${c} should be valid`);
    assert.equal(r.value.category, c);
  }
});

test("knowledge domain validates rating between 0 and 5", () => {
  assert.ok(
    createKnowledgeArticle({
      id: "k-r0",
      organizationId: "org",
      title: "t",
      content: "t",
      rating: 0,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    createKnowledgeArticle({
      id: "k-r5",
      organizationId: "org",
      title: "t",
      content: "t",
      rating: 5,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createKnowledgeArticle({
      id: "k-r6",
      organizationId: "org",
      title: "t",
      content: "t",
      rating: 6,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createKnowledgeArticle({
      id: "k-rneg",
      organizationId: "org",
      title: "t",
      content: "t",
      rating: -1,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createKnowledgeArticle({
      id: "k-rnan",
      organizationId: "org",
      title: "t",
      content: "t",
      rating: Number.NaN,
      createdAt: NOW as never,
    }).ok,
  );
});

test("knowledge domain requires aiActionId when aiGenerated is true", () => {
  const bad = createKnowledgeArticle({
    id: "k-ai-bad",
    organizationId: "org",
    title: "AI article",
    content: "content",
    aiGenerated: true,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);

  const good = createKnowledgeArticle({
    id: "k-ai-ok",
    organizationId: "org",
    title: "AI article",
    content: "content",
    aiGenerated: true,
    aiActionId: "ai-action-1",
    rating: 4,
    createdAt: NOW as never,
  });
  assert.ok(good.ok);
  assert.equal(good.value.aiGenerated, true);
  assert.equal(good.value.aiActionId, "ai-action-1");
});

test("knowledge domain rejects empty required fields", () => {
  assert.ok(
    !createKnowledgeArticle({
      id: "",
      organizationId: "org",
      title: "t",
      content: "t",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createKnowledgeArticle({
      id: "k",
      organizationId: "",
      title: "t",
      content: "t",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createKnowledgeArticle({
      id: "k",
      organizationId: "org",
      title: "",
      content: "t",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createKnowledgeArticle({
      id: "k",
      organizationId: "org",
      title: "t",
      content: "",
      createdAt: NOW as never,
    }).ok,
  );
});

test("knowledge domain stores tags and defaults isPublished to false", () => {
  const r = createKnowledgeArticle({
    id: "k-tags",
    organizationId: "org",
    title: "WiFi トラブル",
    content: "再起動してください",
    category: "faq",
    tags: ["wifi", "troubleshooting"],
    isPublished: true,
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.deepEqual(r.value.tags, ["wifi", "troubleshooting"]);
  assert.equal(r.value.isPublished, true);
  assert.equal(r.value.updatedAt, NOW);
});
