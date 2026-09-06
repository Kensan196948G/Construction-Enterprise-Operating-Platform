/**
 * Tests for the substring-scan fallback search used by the in-memory and
 * file persistence tiers (Issue #86).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { createInMemoryRepositories } from "./in-memory/index.ts";
import { createDailyReport } from "../domain/daily-report.ts";
import { createContract } from "../domain/contract.ts";
import { createDocument } from "../domain/document.ts";
import { createInspection } from "../domain/inspection.ts";
import type { Result } from "../domain/common.ts";
import type { IsoTimestamp } from "../domain/common.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

test("fallback search: is wired for the in-memory tier", () => {
  const repos = createInMemoryRepositories();
  assert.ok(repos.search !== undefined);
});

test("fallback search: finds matches across all four domains (case-insensitive)", async () => {
  const repos = createInMemoryRepositories();

  await repos.dailyReports.save(
    unwrap(
      createDailyReport({
        id: "dr-1",
        organizationId: "org-1",
        projectId: "project-1",
        reportDate: "2026-01-01",
        workContent: "Concrete Pour work completed",
        createdAt: nowTs(),
      }),
    ),
  );
  await repos.contracts.save(
    unwrap(
      createContract({
        id: "ct-1",
        organizationId: "org-1",
        projectId: "project-1",
        contractNumber: "C-1",
        title: "Concrete supply contract",
        createdAt: nowTs(),
      }),
    ),
  );
  await repos.documents.save(
    unwrap(
      createDocument({
        id: "doc-1",
        organizationId: "org-1",
        title: "Concrete mix design",
        createdAt: nowTs(),
      }),
    ),
  );
  await repos.inspections.save(
    unwrap(
      createInspection({
        id: "insp-1",
        organizationId: "org-1",
        projectId: "project-1",
        title: "Concrete strength inspection",
        createdAt: nowTs(),
      }),
    ),
  );

  const results = await repos.search?.search({ q: "CONCRETE" });
  assert.ok(results !== undefined);
  const domains = new Set(results.map((r) => r.domain));
  assert.deepEqual(domains, new Set(["daily-report", "contract", "document", "inspection"]));
});

test("fallback search: domains filter restricts the result set", async () => {
  const repos = createInMemoryRepositories();
  await repos.documents.save(
    unwrap(
      createDocument({
        id: "doc-1",
        organizationId: "org-1",
        title: "Safety manual",
        createdAt: nowTs(),
      }),
    ),
  );
  await repos.inspections.save(
    unwrap(
      createInspection({
        id: "insp-1",
        organizationId: "org-1",
        projectId: "project-1",
        title: "Safety patrol",
        createdAt: nowTs(),
      }),
    ),
  );

  const results = await repos.search?.search({ q: "safety", domains: ["document"] });
  assert.ok(results !== undefined);
  assert.equal(results.length, 1);
  assert.equal(results[0]?.domain, "document");
});

test("fallback search: scopes results by organizationId", async () => {
  const repos = createInMemoryRepositories();
  await repos.documents.save(
    unwrap(
      createDocument({
        id: "doc-org1",
        organizationId: "org-1",
        title: "Site plan",
        createdAt: nowTs(),
      }),
    ),
  );
  await repos.documents.save(
    unwrap(
      createDocument({
        id: "doc-org2",
        organizationId: "org-2",
        title: "Site plan",
        createdAt: nowTs(),
      }),
    ),
  );

  const scoped = await repos.search?.search({ q: "site plan", organizationId: "org-1" });
  assert.ok(scoped !== undefined);
  assert.equal(scoped.length, 1);
  assert.equal(scoped[0]?.id, "doc-org1");
});

test("fallback search: empty query returns no results", async () => {
  const repos = createInMemoryRepositories();
  const results = await repos.search?.search({ q: "   " });
  assert.deepEqual(results, []);
});

test("fallback search: respects the limit option", async () => {
  const repos = createInMemoryRepositories();
  for (let i = 0; i < 5; i++) {
    await repos.documents.save(
      unwrap(
        createDocument({
          id: `doc-${i}`,
          organizationId: "org-1",
          title: `Bridge inspection report ${i}`,
          createdAt: nowTs(),
        }),
      ),
    );
  }

  const results = await repos.search?.search({ q: "bridge", limit: 2 });
  assert.ok(results !== undefined);
  assert.equal(results.length, 2);
});
