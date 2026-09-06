/**
 * Tests for the SQLite FTS5 cross-domain search index (Issue #86).
 *
 * Uses `createSqliteRepositories(":memory:")` so every assertion exercises
 * the real trigger-based sync path (INSERT / UPDATE / DELETE) rather than a
 * hand-rolled stub of `search_fts`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { createSqliteRepositories } from "./index.ts";
import { createDailyReport } from "../../domain/daily-report.ts";
import { createContract } from "../../domain/contract.ts";
import { createDocument } from "../../domain/document.ts";
import { createInspection } from "../../domain/inspection.ts";
import { createProject } from "../../domain/project.ts";
import { createOrganization } from "../../domain/organization.ts";
import type { Result } from "../../domain/common.ts";
import type { IsoTimestamp } from "../../domain/common.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

/** Build a fresh :memory: repository set with one org + one project seeded. */
async function memReposWithProject() {
  const repos = createSqliteRepositories(":memory:");
  const org = unwrap(
    createOrganization({
      id: "org-1",
      name: "Org One",
      type: "headquarters",
      status: "active",
      createdAt: nowTs(),
    }),
  );
  await repos.organizations.save(org);
  const project = unwrap(
    createProject({
      id: "project-1",
      organizationId: "org-1",
      projectCode: "P-1",
      name: "橋梁工事",
      status: "in_progress",
      createdAt: nowTs(),
    }),
  );
  await repos.projects.save(project);
  return repos;
}

test("sqlite search: wires an FTS5-backed search service by default", async () => {
  const repos = createSqliteRepositories(":memory:");
  assert.ok(repos.search !== undefined);
});

test("sqlite search: finds matches across all four indexed domains", async () => {
  const repos = await memReposWithProject();

  await repos.dailyReports.save(
    unwrap(
      createDailyReport({
        id: "dr-1",
        organizationId: "org-1",
        projectId: "project-1",
        reportDate: "2026-01-01",
        workContent: "配筋検査を実施した",
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
        title: "配筋工事請負契約",
        description: "配筋検査に関する条項を含む",
        createdAt: nowTs(),
      }),
    ),
  );
  await repos.documents.save(
    unwrap(
      createDocument({
        id: "doc-1",
        organizationId: "org-1",
        title: "配筋検査要領書",
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
        title: "配筋検査",
        createdAt: nowTs(),
      }),
    ),
  );

  const results = await repos.search?.search({ q: "配筋検査" });
  assert.ok(results !== undefined);
  const domains = new Set(results.map((r) => r.domain));
  assert.deepEqual(domains, new Set(["daily-report", "contract", "document", "inspection"]));
  for (const r of results) {
    assert.equal(r.organizationId, "org-1");
  }
});

test("sqlite search: ?domains= restricts the result set", async () => {
  const repos = await memReposWithProject();
  // Query text must be >= 3 characters: the trigram tokenizer indexes
  // overlapping 3-char windows, so shorter queries never match anything.
  await repos.documents.save(
    unwrap(
      createDocument({
        id: "doc-1",
        organizationId: "org-1",
        title: "安全教育資料",
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
        title: "安全教育の実施記録",
        createdAt: nowTs(),
      }),
    ),
  );

  const results = await repos.search?.search({ q: "安全教育", domains: ["document"] });
  assert.ok(results !== undefined);
  assert.equal(results.length, 1);
  assert.equal(results[0]?.domain, "document");
});

test("sqlite search: scopes results by organizationId", async () => {
  const repos = await memReposWithProject();
  const org2 = unwrap(
    createOrganization({
      id: "org-2",
      name: "Org Two",
      type: "headquarters",
      status: "active",
      createdAt: nowTs(),
    }),
  );
  await repos.organizations.save(org2);
  const project2 = unwrap(
    createProject({
      id: "project-2",
      organizationId: "org-2",
      projectCode: "P-2",
      name: "別現場",
      status: "in_progress",
      createdAt: nowTs(),
    }),
  );
  await repos.projects.save(project2);

  await repos.inspections.save(
    unwrap(
      createInspection({
        id: "insp-org1",
        organizationId: "org-1",
        projectId: "project-1",
        title: "地盤調査",
        createdAt: nowTs(),
      }),
    ),
  );
  await repos.inspections.save(
    unwrap(
      createInspection({
        id: "insp-org2",
        organizationId: "org-2",
        projectId: "project-2",
        title: "地盤調査",
        createdAt: nowTs(),
      }),
    ),
  );

  const scoped = await repos.search?.search({ q: "地盤調査", organizationId: "org-1" });
  assert.ok(scoped !== undefined);
  assert.equal(scoped.length, 1);
  assert.equal(scoped[0]?.id, "insp-org1");

  const unscoped = await repos.search?.search({ q: "地盤調査" });
  assert.ok(unscoped !== undefined);
  assert.equal(unscoped.length, 2);
});

test("sqlite search: index follows update and delete (trigger sync)", async () => {
  const repos = await memReposWithProject();
  const original = unwrap(
    createContract({
      id: "ct-1",
      organizationId: "org-1",
      projectId: "project-1",
      contractNumber: "C-1",
      title: "旧タイトル契約",
      createdAt: nowTs(),
    }),
  );
  await repos.contracts.save(original);

  let results = await repos.search?.search({ q: "旧タイトル" });
  assert.equal(results?.length, 1);

  const updated = { ...original, title: "新タイトル契約" };
  await repos.contracts.save(updated);

  results = await repos.search?.search({ q: "旧タイトル" });
  assert.equal(results?.length, 0);
  results = await repos.search?.search({ q: "新タイトル" });
  assert.equal(results?.length, 1);

  await repos.contracts.delete(updated.id);
  results = await repos.search?.search({ q: "新タイトル" });
  assert.equal(results?.length, 0);
});

test("sqlite search: empty query returns no results", async () => {
  const repos = createSqliteRepositories(":memory:");
  const results = await repos.search?.search({ q: "" });
  assert.deepEqual(results, []);
});
