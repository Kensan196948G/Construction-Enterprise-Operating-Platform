/** Unit tests for legal contract domain (ServiceHub S-07). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createContract } from "./contract.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("contract domain creates a contract with all required fields", () => {
  const ok = createContract({
    id: "c-1",
    organizationId: "org",
    projectId: "p-1",
    contractType: "prime",
    contractNumber: "CN-2026-001",
    title: "本工事請負契約",
    amount: 100_000_000,
    status: "active",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.contractNumber, "CN-2026-001");
  assert.equal(ok.value.contractType, "prime");
  assert.equal(ok.value.amount, 100_000_000);
  assert.equal(ok.value.status, "active");
  assert.equal(ok.value.aiRiskScore, "pending");
});

test("contract domain accepts all contract types", () => {
  for (const t of ["prime", "subcontract", "other"] as const) {
    const r = createContract({
      id: `c-${t}`,
      organizationId: "org",
      projectId: "p-1",
      contractType: t,
      contractNumber: `CN-${t}`,
      title: "test",
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `type ${t} should be valid`);
    assert.equal(r.value.contractType, t);
  }
});

test("contract domain accepts all statuses", () => {
  for (const s of ["draft", "active", "completed", "terminated"] as const) {
    const r = createContract({
      id: `c-${s}`,
      organizationId: "org",
      projectId: "p-1",
      contractNumber: `CN-${s}`,
      title: "test",
      status: s,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `status ${s} should be valid`);
    assert.equal(r.value.status, s);
  }
});

test("contract domain accepts all aiRiskScores", () => {
  for (const score of ["pending", "low", "medium", "high"] as const) {
    const r = createContract({
      id: `c-risk-${score}`,
      organizationId: "org",
      projectId: "p-1",
      contractNumber: `CN-risk-${score}`,
      title: "test",
      aiRiskScore: score,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `aiRiskScore ${score} should be valid`);
    assert.equal(r.value.aiRiskScore, score);
  }
});

test("contract domain rejects invalid contract type and aiRiskScore", () => {
  assert.ok(
    !createContract({
      id: "c-bad-type",
      organizationId: "org",
      projectId: "p-1",
      contractType: "lease" as never,
      contractNumber: "CN-bad",
      title: "test",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createContract({
      id: "c-bad-risk",
      organizationId: "org",
      projectId: "p-1",
      contractNumber: "CN-bad2",
      title: "test",
      aiRiskScore: "extreme" as never,
      createdAt: NOW as never,
    }).ok,
  );
});

test("contract domain validates amount is non-negative finite", () => {
  assert.ok(
    !createContract({
      id: "c-bad-amt",
      organizationId: "org",
      projectId: "p-1",
      contractNumber: "CN-bad",
      title: "test",
      amount: -1,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createContract({
      id: "c-nan",
      organizationId: "org",
      projectId: "p-1",
      contractNumber: "CN-nan",
      title: "test",
      amount: Number.NaN,
      createdAt: NOW as never,
    }).ok,
  );
});

test("contract domain validates date fields as YYYY-MM-DD", () => {
  // periodStart/End are optional but must be valid if present
  const ok = createContract({
    id: "c-dates",
    organizationId: "org",
    projectId: "p-1",
    contractNumber: "CN-dates",
    title: "test",
    periodStart: "2026-04-01",
    periodEnd: "2027-03-31",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);

  const badStart = createContract({
    id: "c-bad-start",
    organizationId: "org",
    projectId: "p-1",
    contractNumber: "CN-bad-start",
    title: "test",
    periodStart: "2026/04/01",
    createdAt: NOW as never,
  });
  assert.ok(!badStart.ok);

  const badEnd = createContract({
    id: "c-bad-end",
    organizationId: "org",
    projectId: "p-1",
    contractNumber: "CN-bad-end",
    title: "test",
    periodEnd: "invalid",
    createdAt: NOW as never,
  });
  assert.ok(!badEnd.ok);
});

test("contract domain rejects empty id, organizationId, projectId, contractNumber, title", () => {
  const base = {
    id: "c",
    organizationId: "org",
    projectId: "p-1",
    contractNumber: "CN-001",
    title: "t",
    createdAt: NOW as never,
  };
  assert.ok(!createContract({ ...base, id: "" }).ok);
  assert.ok(!createContract({ ...base, organizationId: "" }).ok);
  assert.ok(!createContract({ ...base, projectId: "" }).ok);
  assert.ok(!createContract({ ...base, contractNumber: "" }).ok);
  assert.ok(!createContract({ ...base, title: "" }).ok);
});

test("contract domain stores optional fields (party, description, documentUrl)", () => {
  const r = createContract({
    id: "c-full",
    organizationId: "org",
    projectId: "p-1",
    contractNumber: "CN-full",
    title: "本契約",
    party: "株式会社建設",
    periodStart: "2026-04-01",
    periodEnd: "2027-03-31",
    amount: 50_000_000,
    description: "鉄骨工事一式",
    documentUrl: "https://docs.example.com/contract.pdf",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.party, "株式会社建設");
  assert.equal(r.value.description, "鉄骨工事一式");
  assert.equal(r.value.documentUrl, "https://docs.example.com/contract.pdf");
  assert.equal(r.value.updatedAt, NOW);
});

test("contract domain trims title", () => {
  const r = createContract({
    id: "c-trim",
    organizationId: "org",
    projectId: "p-1",
    contractNumber: "CN-trim",
    title: " 工事請負契約書 ",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.title, "工事請負契約書");
});
