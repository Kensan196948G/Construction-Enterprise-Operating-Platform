/** Unit tests for the business data import helper. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import { createSqliteRepositories } from "../src/persistence/sqlite/index.ts";
import { importBusinessData, parseCsv, csvRowsToObjects } from "./import-business-data.ts";

const CLI = fileURLToPath(new URL("./import-business-data.ts", import.meta.url));

test("parseCsv handles quotes, escaped quotes and CRLF", () => {
  const rows = parseCsv('a,b,c\r\n"x,y","he said ""hi""",z\r\n1,2,3');
  assert.deepEqual(rows, [
    ["a", "b", "c"],
    ["x,y", 'he said "hi"', "z"],
    ["1", "2", "3"],
  ]);
});

test("csvRowsToObjects skips empty cells and uses the header row", () => {
  const records = csvRowsToObjects(
    parseCsv("organizationId,projectId,workerCount,workContent\norg-1,p-1,8,テスト"),
  );
  assert.deepEqual(records, [
    { organizationId: "org-1", projectId: "p-1", workerCount: "8", workContent: "テスト" },
  ]);
});

test("CSV-style records import numeric strings through domain validation", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-import-"));
  const dbPath = join(dir, "ceop.db");
  try {
    const repositories = createSqliteRepositories(dbPath);
    const bundle = {
      projects: csvRowsToObjects(
        parseCsv("id,organizationId,projectCode,name\nproject-csv-1,org-1,P-CSV-001,CSV案件"),
      ),
      dailyReports: csvRowsToObjects(
        parseCsv(
          "organizationId,projectId,reportDate,weather,workerCount,progressRate,safetyCheck\n" +
            "org-1,project-csv-1,2026-08-12,cloudy,8,45,true",
        ),
      ),
    };
    const result = await importBusinessData(bundle, repositories);
    assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
    assert.equal(result.imported, 2);
    const reports = await repositories.dailyReports.findAll();
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.workerCount, 8);
    assert.equal(reports[0]?.progressRate, 45);
    assert.equal(reports[0]?.safetyCheck, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

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

test("CLI accepts --csv <type> <file.csv> together with --db", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-import-cli-"));
  const dbPath = join(dir, "ceop.db");
  const csvPath = join(dir, "projects.csv");
  try {
    writeFileSync(
      csvPath,
      "id,organizationId,projectCode,name\nproject-cli-1,org-1,P-CLI-001,CLI案件",
    );
    await new Promise<void>((resolve, reject) => {
      execFile(
        process.execPath,
        ["--experimental-strip-types", CLI, "--csv", "project", csvPath, "--db", dbPath],
        (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(`${error.message}: ${stderr}`));
            return;
          }
          assert.match(stderr, /imported=1 errors=0/);
          resolve();
        },
      );
    });
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const row = db.prepare("SELECT COUNT(*) AS c FROM projects").get() as { c: number };
    db.close();
    assert.equal(row.c, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
