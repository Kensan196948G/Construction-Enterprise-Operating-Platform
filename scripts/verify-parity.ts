/**
 * P5 parity verification — checks FEATURE_INVENTORY against the running CEOP
 * API and fails when a planned core domain (📦) is still unimplemented (⬜).
 *
 * Usage: node --experimental-strip-types scripts/verify-parity.ts
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "../src/api/server.ts";
import { createApiKey } from "../src/api/middleware/auth.ts";
import { createInMemoryRepositories } from "../src/persistence/in-memory/index.ts";
import { AuditLog } from "../src/governance/audit-log.ts";
import { resolvePermissions } from "../src/governance/policy-engine.ts";
import { createRole } from "../src/domain/index.ts";
import type { ApiKeyStore } from "../src/api/types.ts";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const INVENTORY = join(ROOT, "docs", "integration", "FEATURE_INVENTORY.md");

export interface InventoryRow {
  readonly id: string;
  readonly feature: string;
  readonly ceop: string;
  readonly status: string;
}

/** Parse FEATURE_INVENTORY.md table rows into structured records. */
export function parseInventory(markdown: string): InventoryRow[] {
  const rows: InventoryRow[] = [];
  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    // "| ID | 機能 | 内容 | CEOP対応 | 状態 |" → cells: ["", id, feature, desc, ceop, status, ""]
    if (cells.length < 6) continue;
    const id = cells[1] ?? "";
    if (!/^[A-Z]-\d{2}$/.test(id)) continue;
    rows.push({
      id,
      feature: cells[2] ?? "",
      ceop: cells[4] ?? "",
      status: cells[5] ?? "",
    });
  }
  return rows;
}

/**
 * Planned core domains still in the backlog (documented in FEATURE_INVENTORY
 * as 次期バックログ). They do not fail parity, but any OTHER 📦/⬜ row is a
 * regression and fails the gate.
 */
export const KNOWN_BACKLOG_IDS = new Set([
  "O-04", // sales モジュール
  "O-06", // procurement モジュール
  "O-08", // hr/finance モジュール
  "O-09", // dashboard 拡張 + ESG/AI 予測
  "D-04", // シリアルスキャン
  "D-07", // 管理 UI 移植
  "D-09", // cdx-agent オフライン spool/sync
]);

/** Fail when a planned core domain (📦) is still ⬜ and not a known backlog. */
export function findMissingCoreDomains(rows: InventoryRow[]): InventoryRow[] {
  return rows.filter(
    (row) =>
      row.ceop.includes("📦") &&
      (row.status === "⬜" || row.status === "") &&
      !KNOWN_BACKLOG_IDS.has(row.id),
  );
}

export async function verifyParity(): Promise<{
  total: number;
  done: number;
  pending: number;
  missing: InventoryRow[];
  probes: { path: string; status: number; expected: number }[];
}> {
  const markdown = await readFile(INVENTORY, "utf-8");
  const rows = parseInventory(markdown);
  const missing = findMissingCoreDomains(rows);
  const done = rows.filter((r) => r.status === "✅").length;
  const pending = rows.length - done;

  // ── API probe sweep ───────────────────────────────────────────────────────
  const apiKeyStore: ApiKeyStore = new Map();
  const adminRole = createRole({
    id: "r-admin",
    name: "Admin",
    description: "",
    scope: "global",
    permissions: ["*:*"],
  });
  if (!adminRole.ok) throw new Error("admin role failed");
  const cred = createApiKey("parity-admin", resolvePermissions([adminRole.value]), apiKeyStore);
  const server = createServer(
    { port: 0 },
    {
      repositories: createInMemoryRepositories(),
      auditLog: new AuditLog(),
      apiKeyStore,
    },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  const base = `http://127.0.0.1:${address.port}`;
  const auth = { Authorization: `Bearer ${cred.key}:${cred.secret}` };

  const probes: { path: string; status: number; expected: number }[] = [];
  const probe = async (path: string, method = "GET", expected = 200, body?: unknown) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...auth,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    probes.push({ path, status: res.status, expected });
    return res;
  };

  try {
    // Public endpoints.
    await probe("/health", "GET", 200);
    await probe("/metrics", "GET", 200);
    await probe("/portal", "GET", 200);
    // Core domain lists.
    await probe("/api/v1/projects", "GET", 200);
    const projectRes = await probe("/api/v1/projects", "POST", 201, {
      organizationId: "org-hq",
      projectCode: "PARITY-1",
      name: "parity",
    });
    const project = (await projectRes.json()) as { project: { id: string } };
    const pid = project.project.id;
    const contractRes = await probe(`/api/v1/projects/${pid}/contracts`, "POST", 201, {
      contractNumber: "PARITY-C1",
      title: "contract",
    });
    const contract = (await contractRes.json()) as { contract: { id: string } };
    const cid = contract.contract.id;
    await probe(`/api/v1/projects/${pid}/daily-reports`, "GET", 200);
    await probe(`/api/v1/projects/${pid}/photos`, "GET", 200);
    await probe(`/api/v1/projects/${pid}/safety-checks`, "GET", 200);
    await probe(`/api/v1/projects/${pid}/quality-inspections`, "GET", 200);
    await probe(`/api/v1/projects/${pid}/cost-records`, "GET", 200);
    await probe(`/api/v1/projects/${pid}/work-hours`, "GET", 200);
    await probe(`/api/v1/projects/${pid}/work-schedules`, "GET", 200);
    await probe(`/api/v1/projects/${pid}/purchase-orders`, "GET", 200);
    await probe(`/api/v1/projects/${pid}/compliance-checks`, "GET", 200);
    await probe(`/api/v1/contracts/${cid}/legal-evidence`, "GET", 200);
    await probe("/api/v1/knowledge", "GET", 200);
    await probe("/api/v1/documents", "GET", 200);
    await probe("/api/v1/ai-actions", "GET", 200);
    await probe("/api/v1/workflow-instances", "GET", 200);
    await probe("/api/v1/notifications", "GET", 200);
    await probe("/api/v1/notifications/unread-count", "GET", 200);
    await probe("/api/v1/notification-templates", "GET", 200);
    await probe("/api/v1/itsm/incidents", "GET", 200);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  const failedProbes = probes.filter((p) => p.status !== p.expected);
  const allProbesPass = failedProbes.length === 0;
  const ok = missing.length === 0 && allProbesPass;
  if (!ok) {
    throw new Error(
      `parity failed: missingCoreDomains=${missing.length} probeFailures=${failedProbes.length}\n` +
        JSON.stringify({ missing, failedProbes }, null, 2),
    );
  }
  return { total: rows.length, done, pending, missing, probes };
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = await verifyParity();
  console.error(
    `[parity] inventory ${result.done}/${result.total} done (${result.pending} pending: integrations/out-of-scope)`,
  );
  console.error(`[parity] API probes ${result.probes.length}/${result.probes.length} PASS`);
  console.error("[parity] ✅ FEATURE_INVENTORY parity verified");
}
