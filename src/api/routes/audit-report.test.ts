/**
 * Integration tests for the quarterly audit summary PDF endpoint (issue #85).
 *
 * `GET /api/v1/governance/audit-report.pdf` aggregates the audit log,
 * compliance checks, and management reviews for one calendar quarter and
 * renders the result as a PDF. Aggregation correctness (counts matching the
 * source records) is pinned at the unit level in
 * `src/adapters/audit-report-adapter.test.ts`; this file covers the HTTP
 * surface: auth, permission gating, tenant scoping across all three record
 * types at once, and that the response is a well-formed PDF download.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { PDFArray, PDFDict, PDFDocument, PDFName, PDFStream, decodePDFRawStream } from "pdf-lib";
import type { PDFRawStream } from "pdf-lib";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { createOrganization } from "../../domain/index.ts";
import type { Repositories } from "../../persistence/ports.ts";
import type { IsoTimestamp, Result } from "../../domain/common.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

const ROUTE = "/api/v1/governance/audit-report.pdf";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

interface Harness {
  baseUrl: string;
  auditLog: AuditLog;
  /** org-a, has audit:export */
  exporterCred: string;
  /** org-a, has audit:read but NOT audit:export */
  readerCred: string;
  /** global scope, has audit:export */
  adminCred: string;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const repositories: Repositories = createInMemoryRepositories();
  const now = new Date().toISOString() as IsoTimestamp;

  for (const id of ["org-a", "org-b"]) {
    await repositories.organizations.save(
      unwrap(
        createOrganization({
          id,
          name: id.toUpperCase(),
          type: "headquarters",
          status: "active",
          createdAt: now,
        }),
      ),
    );
  }

  const basePerms = [
    "project:read",
    "project:write",
    "compliance:read",
    "compliance:write",
    "management-review:read",
    "management-review:write",
  ] as Permission[];
  const exporter = createApiKey(
    "user-exporter",
    [...basePerms, "audit:read", "audit:export"] as Permission[],
    apiKeyStore,
    "org-a",
  );
  const reader = createApiKey(
    "user-reader",
    [...basePerms, "audit:read"] as Permission[],
    apiKeyStore,
    "org-a",
  );
  const admin = createApiKey("admin", ["*:*"] as Permission[], apiKeyStore);

  const auditLog = new AuditLog();
  const container: AppContainer = { repositories, auditLog, apiKeyStore };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    auditLog,
    exporterCred: `${exporter.key}:${exporter.secret}`,
    readerCred: `${reader.key}:${reader.secret}`,
    adminCred: `${admin.key}:${admin.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function call(
  baseUrl: string,
  method: string,
  path: string,
  cred: string | undefined,
  body?: unknown,
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(cred !== undefined ? { Authorization: `Bearer ${cred}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

/** Seed a project, a compliance check, and a management review for one org. */
async function seedOrgEvidence(
  baseUrl: string,
  cred: string,
  organizationId: string,
  label: string,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const projectRes = await call(baseUrl, "POST", "/api/v1/projects", cred, {
    organizationId,
    projectCode: `P-${label}`,
    name: `${label} Site`,
  });
  if (projectRes.status !== 201) {
    throw new Error(`project seed failed: ${await projectRes.text()}`);
  }
  const project = (await projectRes.json()) as { project: { id: string } };

  const complianceRes = await call(
    baseUrl,
    "POST",
    `/api/v1/projects/${project.project.id}/compliance-checks`,
    cred,
    {
      standard: "iso-9001",
      item: `Compliance item for ${label}`,
      result: "pass",
      checkedAt: today,
    },
  );
  if (complianceRes.status !== 201) {
    throw new Error(`compliance seed failed: ${await complianceRes.text()}`);
  }

  const reviewRes = await call(baseUrl, "POST", "/api/v1/management-reviews", cred, {
    organizationId,
    title: `Management review for ${label}`,
    status: "completed",
    reviewDate: today,
  });
  if (reviewRes.status !== 201) {
    throw new Error(`review seed failed: ${await reviewRes.text()}`);
  }
}

// ---------------------------------------------------------------------------
// PDF text extraction (adapted from pdf-exports.test.ts, issue #71 — this
// endpoint's PDF is produced by the same `pdf-writer.ts` embedded-font
// machinery, so the same ToUnicode-CMap-based extraction applies).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("audit-report.pdf: requires authentication", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", ROUTE, undefined);
  assert.equal(res.status, 401);
});

test("audit-report.pdf: audit:read alone does not grant report generation", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", ROUTE, h.readerCred);
  assert.equal(res.status, 403);
  const body = (await res.json()) as { message: string };
  assert.match(body.message, /audit:export/);
});

test("audit-report.pdf: a denied report generation is itself recorded", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const before = h.auditLog.entries.length;
  const res = await call(h.baseUrl, "GET", ROUTE, h.readerCred);
  assert.equal(res.status, 403);
  const added = h.auditLog.entries.slice(before);
  const denial = added.find((e) => e.event.action === "audit-report:generate");
  assert.ok(denial, "the refused report attempt must appear in the trail");
  assert.equal(denial.event.outcome, "denied");
});

test("audit-report.pdf: an invalid period is rejected with 400", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", `${ROUTE}?period=not-a-period`, h.exporterCred);
  assert.equal(res.status, 400);
});

test("audit-report.pdf: generates a downloadable PDF for the current quarter by default", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  await seedOrgEvidence(h.baseUrl, h.exporterCred, "org-a", "Alpha");

  const res = await call(h.baseUrl, "GET", ROUTE, h.exporterCred);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "application/pdf");
  assert.match(
    res.headers.get("content-disposition") ?? "",
    /^attachment; filename="audit-report-\d{4}-Q[1-4]\.pdf"$/,
  );
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.equal(bytes.length > 0, true);
  assert.match(Buffer.from(bytes.slice(0, 5)).toString("latin1"), /^%PDF-/);
});

test("audit-report.pdf: a successful generation is recorded but excluded from its own count", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  await seedOrgEvidence(h.baseUrl, h.exporterCred, "org-a", "Bravo");

  const res = await call(h.baseUrl, "GET", ROUTE, h.exporterCred);
  assert.equal(res.status, 200);

  const recorded = h.auditLog.entries.filter(
    (e) => e.event.action === "audit-report:generate" && e.event.outcome === "success",
  );
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0]?.event.metadata["complianceCheckCount"], "1");
  assert.equal(recorded[0]?.event.metadata["managementReviewCount"], "1");
});

test("audit-report.pdf: tenant scoping holds across audit log, compliance, and management review data", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  await seedOrgEvidence(h.baseUrl, h.exporterCred, "org-a", "Charlie");
  // Seeded by an admin credential (global scope) into org-b, so an org-a
  // scoped credential must never see it reflected in its report.
  await seedOrgEvidence(h.baseUrl, h.adminCred, "org-b", "Delta");

  const res = await call(h.baseUrl, "GET", ROUTE, h.exporterCred);
  assert.equal(res.status, 200);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const text = await extractPdfText(bytes);

  // Compliance checks are only reflected as counts (not individual item
  // text) in the rendered summary, so scoping is asserted on the count:
  // org-b's check must not be folded into org-a's total.
  assert.match(text, /Organization:org-a/);
  assert.match(text, /Total Checks:1/);
  assert.match(text, /Management review for Charlie/);
  assert.doesNotMatch(text, /Management review for Delta/);
});

test("audit-report.pdf: a global credential's report covers every tenant", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  await seedOrgEvidence(h.baseUrl, h.exporterCred, "org-a", "Echo");
  await seedOrgEvidence(h.baseUrl, h.adminCred, "org-b", "Foxtrot");

  const res = await call(h.baseUrl, "GET", ROUTE, h.adminCred);
  assert.equal(res.status, 200);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const text = await extractPdfText(bytes);

  assert.match(text, /Organization:\(all\)/);
  assert.match(text, /Total Checks:2/);
  assert.match(text, /Management review for Echo/);
  assert.match(text, /Management review for Foxtrot/);
});

test("audit-report.pdf: an explicit period query parameter is honored in the response", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", `${ROUTE}?period=2020-Q1`, h.exporterCred);
  assert.equal(res.status, 200);
  assert.match(
    res.headers.get("content-disposition") ?? "",
    /^attachment; filename="audit-report-2020-Q1\.pdf"$/,
  );
  const bytes = new Uint8Array(await res.arrayBuffer());
  const text = await extractPdfText(bytes);
  assert.match(text, /Period:2020-Q1/);
  // Nothing was seeded in 2020, so every count must read zero.
  assert.match(text, /Total Events:0/);
  assert.match(text, /Total Checks:0/);
  assert.match(text, /Total Reviews:0/);
});
