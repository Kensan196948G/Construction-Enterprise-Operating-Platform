/** Integration tests for single-record PDF export endpoints (issue #71). */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { PDFArray, PDFDocument, PDFStream, decodePDFRawStream } from "pdf-lib";
import type { PDFRawStream } from "pdf-lib";
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
  const adminRole = unwrap(
    createRole({
      id: "r-admin",
      name: "Admin",
      description: "",
      scope: "global",
      permissions: ["*:*"],
    }),
  );
  const noPermRole = unwrap(
    createRole({
      id: "r-none",
      name: "NoPermissions",
      description: "",
      scope: "global",
      // Unrelated to daily-report/material-photo-log/inspection so the
      // credential below is authenticated but forbidden from these exports.
      permissions: ["organization:read"],
    }),
  );
  const cred = createApiKey("admin", resolvePermissions([adminRole]), apiKeyStore);
  const noPermCred = createApiKey("guest", resolvePermissions([noPermRole]), apiKeyStore);
  const server = createServer(
    { port: 0 },
    { repositories: createInMemoryRepositories(), auditLog: new AuditLog(), apiKeyStore },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    cred: `${cred.key}:${cred.secret}`,
    noPermCred: `${noPermCred.key}:${noPermCred.secret}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function call(
  baseUrl: string,
  method: string,
  path: string,
  credential: string | undefined,
  body?: unknown,
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(credential !== undefined ? { Authorization: `Bearer ${credential}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return res;
}

/**
 * Extract the text drawn on a `pdf-lib`-generated PDF's pages.
 *
 * `pdf-lib` encodes `Tj` string operands as PDF hex strings (`<...>`) rather
 * than literal parenthesized strings, so this walks each page's decoded
 * content stream and hex-decodes those operands back to text. It only needs
 * to understand `pdf-lib`'s own output shape — not be a general PDF text
 * extractor — since these tests only assert against PDFs this adapter wrote.
 */
async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(bytes);
  let all = "";
  for (const page of doc.getPages()) {
    const contents = page.node.Contents();
    if (contents === undefined) continue;
    const streams: PDFStream[] = [];
    if (contents instanceof PDFArray) {
      for (let i = 0; i < contents.size(); i++) {
        streams.push(doc.context.lookup(contents.get(i), PDFStream));
      }
    } else {
      streams.push(contents);
    }
    for (const stream of streams) {
      const decoded = decodePDFRawStream(stream as unknown as PDFRawStream).decode();
      const streamText = Buffer.from(decoded).toString("latin1");
      for (const match of streamText.matchAll(/<([0-9A-Fa-f]+)>/g)) {
        all += Buffer.from(match[1] ?? "", "hex").toString("latin1");
      }
    }
  }
  return all;
}

test("daily report exports as a single-record PDF", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const projectRes = await call(h.baseUrl, "POST", "/api/v1/projects", h.cred, {
    organizationId: "org-hq",
    projectCode: "P-PDF-1",
    name: "PDF Export Test Site",
  });
  assert.equal(projectRes.status, 201);
  const project = (await projectRes.json()) as { project: { id: string } };

  const reportRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${project.project.id}/daily-reports`,
    h.cred,
    {
      reportDate: "2026-08-10",
      weather: "sunny",
      workerCount: 12,
      workContent: "Slab concrete pour, section B",
      progressRate: 40,
    },
  );
  assert.equal(reportRes.status, 201);
  const report = (await reportRes.json()) as { dailyReport: { id: string } };

  const pdfRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/daily-reports/${report.dailyReport.id}/export.pdf`,
    h.cred,
  );
  assert.equal(pdfRes.status, 200);
  assert.match(pdfRes.headers.get("content-type") ?? "", /application\/pdf/);
  assert.match(pdfRes.headers.get("content-disposition") ?? "", /attachment/);
  const bytes = new Uint8Array(await pdfRes.arrayBuffer());
  assert.equal(bytes.length > 0, true);
  assert.match(Buffer.from(bytes.slice(0, 5)).toString("latin1"), /^%PDF-/);

  const text = await extractPdfText(bytes);
  assert.match(text, new RegExp(report.dailyReport.id));
  assert.match(text, /2026-08-10/);
  assert.match(text, /sunny/);
  assert.match(text, /draft/);
  assert.match(text, /Slab concrete pour, section B/);

  // Missing/insufficient permission is rejected before any PDF is rendered.
  const forbidden = await call(
    h.baseUrl,
    "GET",
    `/api/v1/daily-reports/${report.dailyReport.id}/export.pdf`,
    h.noPermCred,
  );
  assert.equal(forbidden.status, 403);
  const noAuth = await call(
    h.baseUrl,
    "GET",
    `/api/v1/daily-reports/${report.dailyReport.id}/export.pdf`,
    undefined,
  );
  assert.equal(noAuth.status, 401);
});

test("material photo log exports as a single-record PDF", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const logRes = await call(h.baseUrl, "POST", "/api/v1/material-photo-logs", h.cred, {
    organizationId: "org-hq",
    projectCode: "P-PDF-2",
    materialName: "Ready-mix concrete 24-8-25N",
    quantity: 10,
    unit: "m3",
    storagePlace: "Yard A",
    transactionType: "received",
    inspectionStatus: "passed",
  });
  assert.equal(logRes.status, 201);
  const log = (await logRes.json()) as { materialPhotoLog: { id: string } };

  const pdfRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/material-photo-logs/${log.materialPhotoLog.id}/export.pdf`,
    h.cred,
  );
  assert.equal(pdfRes.status, 200);
  assert.match(pdfRes.headers.get("content-type") ?? "", /application\/pdf/);
  const bytes = new Uint8Array(await pdfRes.arrayBuffer());
  const text = await extractPdfText(bytes);
  assert.match(text, new RegExp(log.materialPhotoLog.id));
  assert.match(text, /P-PDF-2/);
  assert.match(text, /Ready-mix concrete 24-8-25N/);
  assert.match(text, /received/);
  assert.match(text, /passed/);

  const forbidden = await call(
    h.baseUrl,
    "GET",
    `/api/v1/material-photo-logs/${log.materialPhotoLog.id}/export.pdf`,
    h.noPermCred,
  );
  assert.equal(forbidden.status, 403);
});

test("inspection exports as a single-record PDF with checklist items", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const projectRes = await call(h.baseUrl, "POST", "/api/v1/projects", h.cred, {
    organizationId: "org-hq",
    projectCode: "P-PDF-3",
    name: "Inspection PDF Test Site",
  });
  assert.equal(projectRes.status, 201);
  const project = (await projectRes.json()) as { project: { id: string } };

  const inspectionRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${project.project.id}/inspections`,
    h.cred,
    {
      title: "Rebar spacing check",
      description: "Pre-pour reinforcement inspection",
      inspectedAt: "2026-08-11",
      inspectorId: "insp-001",
      checklistItems: [
        { label: "Rebar spacing within tolerance", passed: true },
        { label: "Cover blocks placed", passed: false },
      ],
    },
  );
  assert.equal(inspectionRes.status, 201);
  const inspection = (await inspectionRes.json()) as { inspection: { id: string } };

  const pdfRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/inspections/${inspection.inspection.id}/export.pdf`,
    h.cred,
  );
  assert.equal(pdfRes.status, 200);
  assert.match(pdfRes.headers.get("content-type") ?? "", /application\/pdf/);
  const bytes = new Uint8Array(await pdfRes.arrayBuffer());
  const text = await extractPdfText(bytes);
  assert.match(text, new RegExp(inspection.inspection.id));
  assert.match(text, /Rebar spacing check/);
  assert.match(text, /fail/); // derived overall result: not all items passed
  assert.match(text, /Rebar spacing within tolerance/);
  assert.match(text, /Cover blocks placed/);
  assert.match(text, /PASS/);
  assert.match(text, /FAIL/);

  const forbidden = await call(
    h.baseUrl,
    "GET",
    `/api/v1/inspections/${inspection.inspection.id}/export.pdf`,
    h.noPermCred,
  );
  assert.equal(forbidden.status, 403);
});
