/** Integration tests for single-record PDF export endpoints (issue #71). */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { PDFArray, PDFDict, PDFDocument, PDFName, PDFStream, decodePDFRawStream } from "pdf-lib";
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
 * Build a glyph-id -> Unicode text lookup from a font's embedded `ToUnicode`
 * CMap stream. `pdf-lib`'s custom (non-standard) font embedder writes this
 * CMap as a simple `beginbfchar`/`endbfchar` block mapping each 4-hex-digit
 * glyph id to a 4-hex-digit-per-UTF-16-code-unit Unicode value (see
 * `pdf-lib`'s `core/embedders/CMap.ts`) — this only needs to understand that
 * shape, not be a general CMap parser.
 */
function parseToUnicodeCMap(cmapText: string): Map<string, string> {
  const map = new Map<string, string>();
  const blockRegex = /beginbfchar([\s\S]*?)endbfchar/g;
  for (const block of cmapText.matchAll(blockRegex)) {
    const body = block[1] ?? "";
    for (const pair of body.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const glyphId = (pair[1] ?? "").toUpperCase();
      const unicodeHex = pair[2] ?? "";
      let decoded = "";
      for (let i = 0; i + 4 <= unicodeHex.length; i += 4) {
        decoded += String.fromCharCode(parseInt(unicodeHex.slice(i, i + 4), 16));
      }
      map.set(glyphId, decoded);
    }
  }
  return map;
}

/** Read a page's `/Font` resource dictionary as `[resourceName, fontDict]` pairs. */
function pageFontDicts(doc: PDFDocument, page: ReturnType<PDFDocument["getPage"]>) {
  const resources = page.node.Resources();
  const fontDictOrRef = resources?.get(PDFName.of("Font"));
  if (fontDictOrRef === undefined) return [];
  const fontResources = doc.context.lookup(fontDictOrRef, PDFDict);
  return fontResources.entries().map(([name, ref]) => {
    const dict = doc.context.lookup(ref, PDFDict);
    return [name.decodeText(), dict] as const;
  });
}

/**
 * Extract the text drawn on a `pdf-lib`-generated PDF's pages.
 *
 * Every embedded (non-standard) font `pdf-lib` writes shows text via `Tj`
 * with glyph-id-keyed PDF hex strings (`<...>`), not character codes, so
 * recovering the original text requires following each font's embedded
 * `ToUnicode` CMap. This walks each page's decoded content stream, tracks
 * the active font from `Tf` operators, and decodes each `Tj` hex string's
 * glyph ids through that font's CMap. It only needs to understand
 * `pdf-lib`'s own output shape — not be a general PDF text extractor —
 * since these tests only assert against PDFs this adapter wrote.
 */
async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(bytes);
  let all = "";
  for (const page of doc.getPages()) {
    const cmapsByFontName = new Map<string, Map<string, string>>();
    for (const [name, fontDict] of pageFontDicts(doc, page)) {
      const toUnicodeRef = fontDict.get(PDFName.of("ToUnicode"));
      if (toUnicodeRef === undefined) continue;
      const stream = doc.context.lookup(toUnicodeRef, PDFStream);
      const decoded = decodePDFRawStream(stream as unknown as PDFRawStream).decode();
      cmapsByFontName.set(name, parseToUnicodeCMap(Buffer.from(decoded).toString("latin1")));
    }

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
      let activeCMap: Map<string, string> | undefined;
      for (const match of streamText.matchAll(
        /\/([^\s/<>[\]()]+)\s+[-\d.]+\s+Tf|<([0-9A-Fa-f]+)>\s*Tj/g,
      )) {
        const fontName = match[1];
        const hex = match[2];
        if (fontName !== undefined) {
          activeCMap = cmapsByFontName.get(fontName);
          continue;
        }
        if (hex === undefined) continue;
        if (activeCMap === undefined) {
          // No ToUnicode CMap for the active font (e.g. a standard font
          // whose single-byte codes already are the character codes).
          all += Buffer.from(hex, "hex").toString("latin1");
          continue;
        }
        for (let i = 0; i + 4 <= hex.length; i += 4) {
          all += activeCMap.get(hex.slice(i, i + 4).toUpperCase()) ?? "";
        }
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

  // Japanese field values (site notes, work content) are the normal case for
  // this document type (工事日報) — this asserts they round-trip through the
  // embedded CJK font instead of being replaced with "?" placeholders.
  const reportRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${project.project.id}/daily-reports`,
    h.cred,
    {
      reportDate: "2026-08-10",
      weather: "sunny",
      workerCount: 12,
      workContent: "Slab concrete pour, section B / 3階スラブコンクリート打設",
      safetyNotes: "作業員 山田太郎、ヘルメット着用確認済み",
      issues: "資材搬入の遅延あり、明日午前中に再手配予定",
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
  assert.match(text, /Slab concrete pour, section B \/ 3階スラブコンクリート打設/);
  assert.match(text, /作業員 山田太郎、ヘルメット着用確認済み/);
  assert.match(text, /資材搬入の遅延あり、明日午前中に再手配予定/);

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
    materialName: "生コンクリート 24-8-25N",
    quantity: 10,
    unit: "m3",
    storagePlace: "資材置き場A",
    transactionType: "received",
    inspectionStatus: "passed",
    memo: "納品書との数量差異なし、受入検査OK",
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
  assert.match(text, /生コンクリート 24-8-25N/);
  assert.match(text, /資材置き場A/);
  assert.match(text, /納品書との数量差異なし、受入検査OK/);
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
      title: "配筋検査",
      description: "コンクリート打設前の鉄筋間隔・かぶり厚確認",
      inspectedAt: "2026-08-11",
      inspectorId: "insp-001",
      checklistItems: [
        { label: "鉄筋間隔が許容範囲内であること", passed: true },
        { label: "スペーサーが適切に設置されていること", passed: false },
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
  assert.match(text, /配筋検査/);
  assert.match(text, /コンクリート打設前の鉄筋間隔・かぶり厚確認/);
  assert.match(text, /fail/); // derived overall result: not all items passed
  assert.match(text, /鉄筋間隔が許容範囲内であること/);
  assert.match(text, /スペーサーが適切に設置されていること/);
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
