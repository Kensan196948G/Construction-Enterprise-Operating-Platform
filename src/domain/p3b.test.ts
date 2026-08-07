/** Unit tests for S-06 knowledge and S-07 contract domains. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createKnowledgeArticle } from "./knowledge.ts";
import { createContract } from "./contract.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("knowledge domain requires approved AI action for AI-generated articles", () => {
  const manual = createKnowledgeArticle({
    id: "k-1",
    organizationId: "org",
    title: "FAQ",
    content: "content",
    category: "faq",
    tags: ["faq"],
    createdAt: NOW as never,
  });
  assert.ok(manual.ok);
  assert.equal(manual.value.aiGenerated, false);

  const bad = createKnowledgeArticle({
    id: "k-2",
    organizationId: "org",
    title: "AI",
    content: "content",
    aiGenerated: true,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);

  const good = createKnowledgeArticle({
    id: "k-3",
    organizationId: "org",
    title: "AI",
    content: "content",
    aiGenerated: true,
    aiActionId: "ai-1",
    rating: 5,
    createdAt: NOW as never,
  });
  assert.ok(good.ok);

  const badRating = createKnowledgeArticle({
    id: "k-4",
    organizationId: "org",
    title: "AI",
    content: "content",
    rating: 6,
    createdAt: NOW as never,
  });
  assert.ok(!badRating.ok);
});

test("contract domain validates type, number, amount, dates", () => {
  const ok = createContract({
    id: "c-1",
    organizationId: "org",
    projectId: "p-1",
    contractType: "prime",
    contractNumber: "CN-001",
    title: "本工事請負契約",
    amount: 10_000_000,
    status: "active",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.aiRiskScore, "pending");

  const badType = createContract({
    id: "c-2",
    organizationId: "org",
    projectId: "p-1",
    contractType: "weird" as never,
    contractNumber: "CN-002",
    title: "x",
    createdAt: NOW as never,
  });
  assert.ok(!badType.ok);

  const badAmount = createContract({
    id: "c-3",
    organizationId: "org",
    projectId: "p-1",
    contractNumber: "CN-003",
    title: "x",
    amount: -1,
    createdAt: NOW as never,
  });
  assert.ok(!badAmount.ok);
});
