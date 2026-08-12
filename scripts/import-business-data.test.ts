/** Unit tests for the business data import helper. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createSqliteRepositories } from "../src/persistence/sqlite/index.ts";
import { importBusinessData } from "./import-business-data.ts";

test("importBusinessData persists all supported types in FK order", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-import-"));
  const dbPath = join(dir, "ceop.db");
  try {
    const repositories = createSqliteRepositories(dbPath);
    const result = await importBusinessData(
      {
        projects: [
          {
            id: "project-p-001",
            organizationId: "org-1",
            projectCode: "P-2026-001",
            name: "橋梁補修工事",
            status: "in_progress",
          },
        ],
        dailyReports: [
          {
            organizationId: "org-1",
            projectId: "project-p-001",
            reportDate: "2026-08-12",
            weather: "cloudy",
            workerCount: 6,
            safetyCheck: true,
          },
        ],
        safetyChecks: [
          {
            organizationId: "org-1",
            projectId: "project-p-001",
            checkDate: "2026-08-12",
            checkType: "daily",
            itemsTotal: 5,
            itemsOk: 5,
            itemsNg: 0,
            overallResult: "ok",
          },
        ],
        qualityInspections: [
          {
            organizationId: "org-1",
            projectId: "project-p-001",
            inspectionDate: "2026-08-12",
            inspectionType: "concrete",
            targetItem: "橋台コンクリート",
            result: "pass",
          },
        ],
        costRecords: [
          {
            organizationId: "org-1",
            projectId: "project-p-001",
            recordDate: "2026-08-12",
            category: "material",
            description: "生コンクリート",
            actualAmount: 50000,
          },
        ],
        workHours: [
          {
            organizationId: "org-1",
            projectId: "project-p-001",
            workDate: "2026-08-12",
            hours: 8,
          },
        ],
        purchaseOrders: [
          {
            organizationId: "org-1",
            projectId: "project-p-001",
            orderNumber: "PO-2026-001",
            supplier: "テスト建材",
            item: "型枠材",
            quantity: 10,
            unitPrice: 2000,
          },
        ],
        contracts: [
          {
            organizationId: "org-1",
            projectId: "project-p-001",
            contractNumber: "C-2026-001",
            title: "橋梁補修工事（下請）",
            amount: 12000000,
          },
        ],
      },
      repositories,
    );
    assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
    assert.equal(result.imported, 8);
    assert.equal((await repositories.projects.findAll()).length, 1);
    assert.equal(
      (await repositories.dailyReports.findByProject("project-p-001" as never)).length,
      1,
    );
    assert.equal(
      (await repositories.safetyChecks.findByProject("project-p-001" as never)).length,
      1,
    );
    assert.equal(
      (await repositories.qualityInspections.findByProject("project-p-001" as never)).length,
      1,
    );
    assert.equal(
      (await repositories.costRecords.findByProject("project-p-001" as never)).length,
      1,
    );
    assert.equal((await repositories.workHours.findByProject("project-p-001" as never)).length, 1);
    assert.equal(
      (await repositories.purchaseOrders.findByProject("project-p-001" as never)).length,
      1,
    );
    assert.equal((await repositories.contracts.findByProject("project-p-001" as never)).length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("importBusinessData reports invalid records without partial persistence", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-import-"));
  const dbPath = join(dir, "ceop.db");
  try {
    const repositories = createSqliteRepositories(dbPath);
    const result = await importBusinessData(
      {
        projects: [
          { organizationId: "org-1", projectCode: "", name: "不正" },
          { organizationId: "org-1", projectCode: "P-2026-002", name: "正常" },
        ],
      },
      repositories,
    );
    assert.equal(result.imported, 1);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0] ?? "", /project\[0\]/);
    assert.equal((await repositories.projects.findAll()).length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("importBusinessData rejects a re-run of the same bundle (natural-key guard)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-import-"));
  const dbPath = join(dir, "ceop.db");
  try {
    const repositories = createSqliteRepositories(dbPath);
    const bundle = {
      projects: [
        {
          id: "project-p-002",
          organizationId: "org-1",
          projectCode: "P-2026-002",
          name: "再実行テスト",
        },
      ],
      dailyReports: [
        {
          organizationId: "org-1",
          projectId: "project-p-002",
          reportDate: "2026-08-12",
          workerCount: 3,
        },
      ],
    };
    const first = await importBusinessData(bundle, repositories);
    assert.equal(first.imported, 2);
    assert.equal(first.errors.length, 0);

    const second = await importBusinessData(bundle, repositories);
    assert.equal(second.imported, 0);
    assert.equal(second.errors.length, 2);
    assert.match(second.errors[0] ?? "", /projectCode "P-2026-002" already exists/);
    assert.match(second.errors[1] ?? "", /projectId\+reportDate/);
    assert.equal((await repositories.projects.findAll()).length, 1);
    assert.equal((await repositories.dailyReports.findAll()).length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
