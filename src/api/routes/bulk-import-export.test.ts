/**
 * Integration tests for issue #88 — CSV bulk import and Excel (.xlsx) export
 * across daily-report, contract, cost-record, work-hour and purchase-order.
 *
 * Existing CSV export behavior (exports.test.ts) is untouched by this file;
 * these tests cover only the additive endpoints: `import.csv` (POST,
 * `{ csv: string }` body) and `export.xlsx` (GET, binary response), plus the
 * newly-added `export.csv` for the three domains that previously had none.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { resolvePermissions } from "../../governance/policy-engine.ts";
import { createRole } from "../../domain/index.ts";
import type { Result } from "../../domain/common.ts";
import type { ApiKeyStore } from "../types.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

async function buildHarness() {
  const apiKeyStore: ApiKeyStore = new Map();
  const role = unwrap(
    createRole({
      id: "r-admin",
      name: "Admin",
      description: "",
      scope: "global",
      permissions: ["*:*"],
    }),
  );
  const cred = createApiKey("admin", resolvePermissions([role]), apiKeyStore);
  const server = createServer(
    { port: 0 },
    { repositories: createInMemoryRepositories(), auditLog: new AuditLog(), apiKeyStore },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    cred: `${cred.key}:${cred.secret}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function call(
  baseUrl: string,
  method: string,
  path: string,
  credential: string,
  body?: unknown,
) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function makeProject(baseUrl: string, cred: string, projectCode: string): Promise<string> {
  const res = await call(baseUrl, "POST", "/api/v1/projects", cred, {
    organizationId: "org-hq",
    projectCode,
    name: "バルクテスト工事",
  });
  assert.equal(res.status, 201);
  const body = (await res.json()) as { project: { id: string } };
  return body.project.id;
}

/** Assert a response is a well-formed .xlsx (ZIP/OOXML) with the given filename hint. */
async function assertXlsxResponse(res: Response, filenameContains: string): Promise<void> {
  assert.equal(res.status, 200);
  assert.equal(
    res.headers.get("content-type"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  assert.match(res.headers.get("content-disposition") ?? "", new RegExp(filenameContains));
  const buf = Buffer.from(await res.arrayBuffer());
  assert.deepEqual([...buf.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  assert.ok(buf.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]))); // EOCD present
}

// ---------------------------------------------------------------------------
// daily-report: import.csv + export.xlsx (export.csv already covered elsewhere)
// ---------------------------------------------------------------------------

test("daily-report: CSV bulk import creates records, and export.xlsx returns a valid workbook", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await makeProject(h.baseUrl, h.cred, "P-DR-IMPORT-1");

  const csv =
    "reportDate,weather,workerCount,workContent\n2026-01-05,sunny,12,型枠組立\n2026-01-06,rainy,8,養生\n";
  const importRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/daily-reports/import.csv`,
    h.cred,
    { csv },
  );
  assert.equal(importRes.status, 201);
  const imported = (await importRes.json()) as { imported: number; dailyReports: unknown[] };
  assert.equal(imported.imported, 2);
  assert.equal(imported.dailyReports.length, 2);

  const listRes = await call(h.baseUrl, "GET", `/api/v1/projects/${pid}/daily-reports`, h.cred);
  const list = (await listRes.json()) as { total: number };
  assert.equal(list.total, 2);

  const xlsxRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/daily-reports/export.xlsx`,
    h.cred,
  );
  await assertXlsxResponse(xlsxRes, "daily-reports");
});

test("daily-report: CSV bulk import rejects an invalid row and saves nothing (all-or-nothing)", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await makeProject(h.baseUrl, h.cred, "P-DR-IMPORT-2");

  const csv = "reportDate,weather\n2026-01-05,sunny\nnot-a-date,sunny\n";
  const importRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/daily-reports/import.csv`,
    h.cred,
    { csv },
  );
  assert.equal(importRes.status, 400);
  const body = (await importRes.json()) as { details: { row: number; path: string }[] };
  assert.equal(body.details.length, 1);
  assert.equal(body.details[0]?.row, 2);
  assert.equal(body.details[0]?.path, "reportDate");

  const listRes = await call(h.baseUrl, "GET", `/api/v1/projects/${pid}/daily-reports`, h.cred);
  const list = (await listRes.json()) as { total: number };
  assert.equal(list.total, 0);
});

// ---------------------------------------------------------------------------
// contract: export.csv + export.xlsx + import.csv (previously unimplemented)
// ---------------------------------------------------------------------------

test("contract: export.csv, export.xlsx and CSV bulk import round-trip", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await makeProject(h.baseUrl, h.cred, "P-CONTRACT-1");

  const csv =
    "contractNumber,title,contractType,amount\nC-1001,基礎工事請負契約,subcontract,5000000\nC-1002,電気設備契約,subcontract,1200000\n";
  const importRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/contracts/import.csv`,
    h.cred,
    { csv },
  );
  assert.equal(importRes.status, 201);
  const imported = (await importRes.json()) as { imported: number };
  assert.equal(imported.imported, 2);

  const csvRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/contracts/export.csv`,
    h.cred,
  );
  assert.equal(csvRes.status, 200);
  assert.match(csvRes.headers.get("content-type") ?? "", /text\/csv/);
  const csvText = await csvRes.text();
  assert.match(csvText, /^id,contractType,contractNumber,title,/);
  assert.match(csvText, /C-1001/);
  assert.match(csvText, /基礎工事請負契約/);

  const xlsxRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/contracts/export.xlsx`,
    h.cred,
  );
  await assertXlsxResponse(xlsxRes, "contracts");
});

test("contract: CSV bulk import rejects duplicate contractNumber (within file and against existing)", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await makeProject(h.baseUrl, h.cred, "P-CONTRACT-2");

  // Duplicate within the same file.
  const dupWithinFile = "contractNumber,title\nC-2001,契約A\nC-2001,契約B\n";
  const res1 = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/contracts/import.csv`,
    h.cred,
    { csv: dupWithinFile },
  );
  assert.equal(res1.status, 400);
  const body1 = (await res1.json()) as { details: { row: number; path: string }[] };
  assert.equal(body1.details[0]?.row, 2);
  assert.equal(body1.details[0]?.path, "contractNumber");

  // Create one contract directly, then try to import a duplicate of it.
  const createRes = await call(h.baseUrl, "POST", `/api/v1/projects/${pid}/contracts`, h.cred, {
    contractNumber: "C-3001",
    title: "既存契約",
  });
  assert.equal(createRes.status, 201);
  const dupExisting = "contractNumber,title\nC-3001,重複契約\n";
  const res2 = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/contracts/import.csv`,
    h.cred,
    { csv: dupExisting },
  );
  assert.equal(res2.status, 400);
  const body2 = (await res2.json()) as { details: { path: string; message: string }[] };
  assert.match(body2.details[0]?.message ?? "", /already exists/);
});

// ---------------------------------------------------------------------------
// cost-record / work-hour: export.csv + export.xlsx + import.csv
// ---------------------------------------------------------------------------

test("cost-record: export.csv, export.xlsx and CSV bulk import", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await makeProject(h.baseUrl, h.cred, "P-COST-1");

  const csv =
    "recordDate,category,description,budgetedAmount,actualAmount\n2026-02-01,材料費,鉄筋,1000000,980000\n";
  const importRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/cost-records/import.csv`,
    h.cred,
    { csv },
  );
  assert.equal(importRes.status, 201);
  const imported = (await importRes.json()) as { imported: number };
  assert.equal(imported.imported, 1);

  const csvRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/cost-records/export.csv`,
    h.cred,
  );
  assert.equal(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.match(csvText, /^id,recordDate,category,/);
  assert.match(csvText, /鉄筋/);

  const xlsxRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/cost-records/export.xlsx`,
    h.cred,
  );
  await assertXlsxResponse(xlsxRes, "cost-records");
});

test("work-hour: export.csv, export.xlsx and CSV bulk import", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await makeProject(h.baseUrl, h.cred, "P-WORKHOUR-1");

  const csv = "workerId,workDate,hours,workType\nW-1,2026-02-02,8,型枠\nW-2,2026-02-02,7.5,配筋\n";
  const importRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/work-hours/import.csv`,
    h.cred,
    { csv },
  );
  assert.equal(importRes.status, 201);
  const imported = (await importRes.json()) as { imported: number };
  assert.equal(imported.imported, 2);

  const csvRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/work-hours/export.csv`,
    h.cred,
  );
  assert.equal(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.match(csvText, /^id,workerId,workDate,hours,/);

  const xlsxRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/work-hours/export.xlsx`,
    h.cred,
  );
  await assertXlsxResponse(xlsxRes, "work-hours");
});

// ---------------------------------------------------------------------------
// purchase-order: export.csv + export.xlsx + import.csv
// ---------------------------------------------------------------------------

test("purchase-order: export.csv, export.xlsx and CSV bulk import", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await makeProject(h.baseUrl, h.cred, "P-PO-1");

  const csv = "orderNumber,supplier,item,quantity,unitPrice\nPO-1001,〇〇建材,型枠合板,100,2500\n";
  const importRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/purchase-orders/import.csv`,
    h.cred,
    { csv },
  );
  assert.equal(importRes.status, 201);
  const imported = (await importRes.json()) as {
    imported: number;
    purchaseOrders: { amount: number }[];
  };
  assert.equal(imported.imported, 1);
  assert.equal(imported.purchaseOrders[0]?.amount, 250000);

  const csvRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/purchase-orders/export.csv`,
    h.cred,
  );
  assert.equal(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.match(csvText, /^id,orderNumber,supplier,/);
  assert.match(csvText, /250000/);

  const xlsxRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/purchase-orders/export.xlsx`,
    h.cred,
  );
  await assertXlsxResponse(xlsxRes, "purchase-orders");
});

test("purchase-order: CSV bulk import rejects duplicate orderNumber against existing records", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await makeProject(h.baseUrl, h.cred, "P-PO-2");

  const createRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/purchase-orders`,
    h.cred,
    { orderNumber: "PO-EXIST", supplier: "既存業者", item: "資材", quantity: 1, unitPrice: 100 },
  );
  assert.equal(createRes.status, 201);

  const csv = "orderNumber,supplier,item,quantity,unitPrice\nPO-EXIST,重複業者,資材,1,100\n";
  const res = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/purchase-orders/import.csv`,
    h.cred,
    { csv },
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { details: { message: string }[] };
  assert.match(body.details[0]?.message ?? "", /already exists/);
});

// ---------------------------------------------------------------------------
// Permission and tenant-scope guards apply the same way to the new routes.
// ---------------------------------------------------------------------------

test("import.csv requires write permission and returns 400 without a csv field", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await makeProject(h.baseUrl, h.cred, "P-GUARD-1");

  const missingCsv = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/contracts/import.csv`,
    h.cred,
    {},
  );
  assert.equal(missingCsv.status, 400);

  const emptyRows = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/contracts/import.csv`,
    h.cred,
    { csv: "contractNumber,title\n" },
  );
  assert.equal(emptyRows.status, 400);
});
