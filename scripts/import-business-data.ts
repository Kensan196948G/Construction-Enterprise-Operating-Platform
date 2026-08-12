/**
 * CEOP business data import — one-time migration helper for real workloads.
 *
 * Usage:
 *   node --experimental-strip-types scripts/import-business-data.ts <bundle.json> [--db /data/ceop.db]
 *
 * Input: JSON object with typed arrays (each optional):
 *   {
 *     "projects": [ { organizationId, projectCode, name, status?, ... } ],
 *     "dailyReports": [ { organizationId, projectId, reportDate, ... } ],
 *     "safetyChecks": [...],
 *     "qualityInspections": [...],
 *     "costRecords": [...],
 *     "workHours": [...],
 *     "purchaseOrders": [...],
 *     "contracts": [...]
 *   }
 *
 * Every record passes CEOP domain validation before persistence. Projects are
 * inserted first (FK ordering), then dependent records. Invalid records are
 * reported and the command exits non-zero — nothing is committed partially
 * silently (fail-closed). Run against a migrated SQLite DB after
 * `scripts/migrate.ts`.
 */

import { readFile } from "node:fs/promises";
import { createProject } from "../src/domain/project.ts";
import { createDailyReport } from "../src/domain/daily-report.ts";
import { createSafetyCheck, createQualityInspection } from "../src/domain/safety.ts";
import { createCostRecord, createWorkHour } from "../src/domain/cost.ts";
import { createPurchaseOrder } from "../src/domain/purchase-order.ts";
import { createContract } from "../src/domain/contract.ts";
import { createSqliteRepositories } from "../src/persistence/sqlite/index.ts";
import type { Repositories } from "../src/persistence/ports.ts";
import type { IsoTimestamp } from "../src/domain/common.ts";

export interface ImportBundle {
  readonly projects?: readonly unknown[];
  readonly dailyReports?: readonly unknown[];
  readonly safetyChecks?: readonly unknown[];
  readonly qualityInspections?: readonly unknown[];
  readonly costRecords?: readonly unknown[];
  readonly workHours?: readonly unknown[];
  readonly purchaseOrders?: readonly unknown[];
  readonly contracts?: readonly unknown[];
}

export interface ImportResult {
  readonly imported: number;
  readonly errors: readonly string[];
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

/** Parse and persist one typed batch; appends errors without throwing. */
async function importBatch<T>(
  type: string,
  rows: readonly unknown[] | undefined,
  build: (
    row: Record<string, unknown>,
    generatedId: string,
  ) => { ok: true; value: T } | { ok: false; error: unknown },
  save: (entity: T) => Promise<void>,
  errors: string[],
  checkDuplicate?: (row: Record<string, unknown>) => Promise<string | null>,
): Promise<number> {
  if (rows === undefined) return 0;
  let imported = 0;
  for (const [index, raw] of rows.entries()) {
    const row = asRecord(raw);
    const generatedId = `${type}-import-${index}-${Date.now()}`;
    if (checkDuplicate !== undefined) {
      const duplicate = await checkDuplicate(row);
      if (duplicate !== null) {
        errors.push(`${type}[${index}]: ${duplicate}`);
        continue;
      }
    }
    const result = build(row, generatedId);
    if (!result.ok) {
      errors.push(`${type}[${index}]: ${JSON.stringify(result.error)}`);
      continue;
    }
    await save(result.value);
    imported++;
  }
  return imported;
}

export async function importBusinessData(
  bundle: ImportBundle,
  repositories: Repositories,
): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;

  // Natural-key duplicate guard: re-running the same bundle (or a bundle that
  // overlaps existing data) must fail loudly instead of silently duplicating
  // rows that have no DB-level unique index.
  const seenKeys = new Set<string>();
  const key = (kind: string, parts: readonly string[]): string => `${kind}:${parts.join("|")}`;
  const register = async <E extends { id: string }>(
    kind: string,
    findAll: () => Promise<readonly E[]>,
    makeKey: (entity: E) => string,
  ): Promise<void> => {
    for (const entity of await findAll()) {
      seenKeys.add(key(kind, makeKey(entity).split("|")));
    }
  };

  const duplicateError = (label: string, value: string): string =>
    `${label} "${value}" already exists — re-import rejected`;

  await register(
    "project",
    () => repositories.projects.findAll(),
    (p) => p.projectCode,
  );
  await register(
    "daily-report",
    () => repositories.dailyReports.findAll(),
    (d) => `${d.projectId}|${d.reportDate}`,
  );
  await register(
    "safety-check",
    () => repositories.safetyChecks.findAll(),
    (s) => `${s.projectId}|${s.checkDate}|${s.checkType}`,
  );
  await register(
    "quality-inspection",
    () => repositories.qualityInspections.findAll(),
    (q) => `${q.projectId}|${q.inspectionDate}|${q.inspectionType}|${q.targetItem}`,
  );
  await register(
    "cost-record",
    () => repositories.costRecords.findAll(),
    (c) => `${c.projectId}|${c.recordDate}|${c.category}|${c.description}`,
  );
  await register(
    "work-hour",
    () => repositories.workHours.findAll(),
    (w) => `${w.projectId}|${w.workDate}|${w.workerId ?? ""}`,
  );
  await register(
    "purchase-order",
    () => repositories.purchaseOrders.findAll(),
    (p) => p.orderNumber,
  );
  await register(
    "contract",
    () => repositories.contracts.findAll(),
    (c) => c.contractNumber,
  );

  // ── Projects first (FK ordering) ─────────────────────────────────────────
  imported += await importBatch(
    "project",
    bundle.projects,
    (row, generatedId) =>
      createProject({
        id: asString(row.id) ?? generatedId,
        organizationId: asString(row.organizationId) ?? "",
        projectCode: asString(row.projectCode) ?? "",
        name: asString(row.name) ?? "",
        ...(asString(row.description) !== undefined
          ? { description: asString(row.description) }
          : {}),
        ...(asString(row.clientName) !== undefined ? { clientName: asString(row.clientName) } : {}),
        ...(asString(row.siteAddress) !== undefined
          ? { siteAddress: asString(row.siteAddress) }
          : {}),
        ...(asString(row.status) !== undefined ? { status: asString(row.status) as never } : {}),
        ...(asString(row.startDate) !== undefined ? { startDate: asString(row.startDate) } : {}),
        ...(asString(row.endDate) !== undefined ? { endDate: asString(row.endDate) } : {}),
        ...(asNumber(row.budget) !== undefined ? { budget: asNumber(row.budget) } : {}),
        ...(asString(row.managerId) !== undefined ? { managerId: asString(row.managerId) } : {}),
        createdAt: (asString(row.createdAt) as IsoTimestamp | undefined) ?? nowTs(),
      }),
    (entity) => repositories.projects.save(entity),
    errors,
    async (row) => {
      const code = asString(row.projectCode);
      if (code === undefined) return null;
      const natural = key("project", [code]);
      if (seenKeys.has(natural)) return duplicateError("projectCode", code);
      seenKeys.add(natural);
      return null;
    },
  );

  imported += await importBatch(
    "dailyReport",
    bundle.dailyReports,
    (row, generatedId) =>
      createDailyReport({
        id: asString(row.id) ?? generatedId,
        organizationId: asString(row.organizationId) ?? "",
        projectId: asString(row.projectId) ?? "",
        reportDate: asString(row.reportDate) ?? "",
        ...(asString(row.weather) !== undefined ? { weather: asString(row.weather) as never } : {}),
        ...(asNumber(row.temperature) !== undefined
          ? { temperature: asNumber(row.temperature) }
          : {}),
        ...(asNumber(row.workerCount) !== undefined
          ? { workerCount: asNumber(row.workerCount) }
          : {}),
        ...(asString(row.workContent) !== undefined
          ? { workContent: asString(row.workContent) }
          : {}),
        ...(asBool(row.safetyCheck) !== undefined ? { safetyCheck: asBool(row.safetyCheck) } : {}),
        ...(asString(row.safetyNotes) !== undefined
          ? { safetyNotes: asString(row.safetyNotes) }
          : {}),
        ...(asNumber(row.progressRate) !== undefined
          ? { progressRate: asNumber(row.progressRate) }
          : {}),
        ...(asString(row.issues) !== undefined ? { issues: asString(row.issues) } : {}),
        createdAt: (asString(row.createdAt) as IsoTimestamp | undefined) ?? nowTs(),
      }),
    (entity) => repositories.dailyReports.save(entity),
    errors,
    async (row) => {
      const projectId = asString(row.projectId);
      const reportDate = asString(row.reportDate);
      if (projectId === undefined || reportDate === undefined) return null;
      const natural = key("daily-report", [projectId, reportDate]);
      if (seenKeys.has(natural))
        return duplicateError("projectId+reportDate", `${projectId}|${reportDate}`);
      seenKeys.add(natural);
      return null;
    },
  );

  imported += await importBatch(
    "safetyCheck",
    bundle.safetyChecks,
    (row, generatedId) =>
      createSafetyCheck({
        id: asString(row.id) ?? generatedId,
        organizationId: asString(row.organizationId) ?? "",
        projectId: asString(row.projectId) ?? "",
        checkDate: asString(row.checkDate) ?? "",
        ...(asString(row.checkType) !== undefined
          ? { checkType: asString(row.checkType) as never }
          : {}),
        ...(asNumber(row.itemsTotal) !== undefined ? { itemsTotal: asNumber(row.itemsTotal) } : {}),
        ...(asNumber(row.itemsOk) !== undefined ? { itemsOk: asNumber(row.itemsOk) } : {}),
        ...(asNumber(row.itemsNg) !== undefined ? { itemsNg: asNumber(row.itemsNg) } : {}),
        ...(asString(row.overallResult) !== undefined
          ? { overallResult: asString(row.overallResult) as never }
          : {}),
        ...(asString(row.notes) !== undefined ? { notes: asString(row.notes) } : {}),
        ...(asString(row.inspectorId) !== undefined
          ? { inspectorId: asString(row.inspectorId) }
          : {}),
        createdAt: (asString(row.createdAt) as IsoTimestamp | undefined) ?? nowTs(),
      }),
    (entity) => repositories.safetyChecks.save(entity),
    errors,
    async (row) => {
      const projectId = asString(row.projectId);
      const checkDate = asString(row.checkDate);
      const checkType = asString(row.checkType) ?? "daily";
      if (projectId === undefined || checkDate === undefined) return null;
      const natural = key("safety-check", [projectId, checkDate, checkType]);
      if (seenKeys.has(natural))
        return duplicateError(
          "projectId+checkDate+checkType",
          `${projectId}|${checkDate}|${checkType}`,
        );
      seenKeys.add(natural);
      return null;
    },
  );

  imported += await importBatch(
    "qualityInspection",
    bundle.qualityInspections,
    (row, generatedId) =>
      createQualityInspection({
        id: asString(row.id) ?? generatedId,
        organizationId: asString(row.organizationId) ?? "",
        projectId: asString(row.projectId) ?? "",
        inspectionDate: asString(row.inspectionDate) ?? "",
        inspectionType: asString(row.inspectionType) ?? "",
        targetItem: asString(row.targetItem) ?? "",
        ...(asString(row.standardValue) !== undefined
          ? { standardValue: asString(row.standardValue) }
          : {}),
        ...(asString(row.measuredValue) !== undefined
          ? { measuredValue: asString(row.measuredValue) }
          : {}),
        ...(asString(row.result) !== undefined ? { result: asString(row.result) as never } : {}),
        ...(asString(row.notes) !== undefined ? { notes: asString(row.notes) } : {}),
        ...(asString(row.inspectorId) !== undefined
          ? { inspectorId: asString(row.inspectorId) }
          : {}),
        createdAt: (asString(row.createdAt) as IsoTimestamp | undefined) ?? nowTs(),
      }),
    (entity) => repositories.qualityInspections.save(entity),
    errors,
    async (row) => {
      const projectId = asString(row.projectId);
      const inspectionDate = asString(row.inspectionDate);
      const inspectionType = asString(row.inspectionType);
      const targetItem = asString(row.targetItem);
      if (
        projectId === undefined ||
        inspectionDate === undefined ||
        inspectionType === undefined ||
        targetItem === undefined
      )
        return null;
      const natural = key("quality-inspection", [
        projectId,
        inspectionDate,
        inspectionType,
        targetItem,
      ]);
      if (seenKeys.has(natural))
        return duplicateError(
          "projectId+inspectionDate+type+target",
          `${projectId}|${inspectionDate}|${inspectionType}|${targetItem}`,
        );
      seenKeys.add(natural);
      return null;
    },
  );

  imported += await importBatch(
    "costRecord",
    bundle.costRecords,
    (row, generatedId) =>
      createCostRecord({
        id: asString(row.id) ?? generatedId,
        organizationId: asString(row.organizationId) ?? "",
        projectId: asString(row.projectId) ?? "",
        recordDate: asString(row.recordDate) ?? "",
        category: asString(row.category) ?? "",
        description: asString(row.description) ?? "",
        ...(asNumber(row.budgetedAmount) !== undefined
          ? { budgetedAmount: asNumber(row.budgetedAmount) }
          : {}),
        ...(asNumber(row.actualAmount) !== undefined
          ? { actualAmount: asNumber(row.actualAmount) }
          : {}),
        ...(asString(row.vendorName) !== undefined ? { vendorName: asString(row.vendorName) } : {}),
        ...(asString(row.invoiceNumber) !== undefined
          ? { invoiceNumber: asString(row.invoiceNumber) }
          : {}),
        ...(asString(row.notes) !== undefined ? { notes: asString(row.notes) } : {}),
        createdAt: (asString(row.createdAt) as IsoTimestamp | undefined) ?? nowTs(),
      }),
    (entity) => repositories.costRecords.save(entity),
    errors,
    async (row) => {
      const projectId = asString(row.projectId);
      const recordDate = asString(row.recordDate);
      const category = asString(row.category);
      const description = asString(row.description);
      if (
        projectId === undefined ||
        recordDate === undefined ||
        category === undefined ||
        description === undefined
      )
        return null;
      const natural = key("cost-record", [projectId, recordDate, category, description]);
      if (seenKeys.has(natural))
        return duplicateError(
          "projectId+recordDate+category+description",
          `${projectId}|${recordDate}|${category}|${description}`,
        );
      seenKeys.add(natural);
      return null;
    },
  );

  imported += await importBatch(
    "workHour",
    bundle.workHours,
    (row, generatedId) =>
      createWorkHour({
        id: asString(row.id) ?? generatedId,
        organizationId: asString(row.organizationId) ?? "",
        projectId: asString(row.projectId) ?? "",
        ...(asString(row.workerId) !== undefined ? { workerId: asString(row.workerId) } : {}),
        workDate: asString(row.workDate) ?? "",
        hours: asNumber(row.hours) ?? 0,
        ...(asString(row.workType) !== undefined ? { workType: asString(row.workType) } : {}),
        ...(asString(row.notes) !== undefined ? { notes: asString(row.notes) } : {}),
        createdAt: (asString(row.createdAt) as IsoTimestamp | undefined) ?? nowTs(),
      }),
    (entity) => repositories.workHours.save(entity),
    errors,
    async (row) => {
      const projectId = asString(row.projectId);
      const workDate = asString(row.workDate);
      if (projectId === undefined || workDate === undefined) return null;
      const workerId = asString(row.workerId) ?? "";
      const natural = key("work-hour", [projectId, workDate, workerId]);
      if (seenKeys.has(natural))
        return duplicateError(
          "projectId+workDate+workerId",
          `${projectId}|${workDate}|${workerId}`,
        );
      seenKeys.add(natural);
      return null;
    },
  );

  imported += await importBatch(
    "purchaseOrder",
    bundle.purchaseOrders,
    (row, generatedId) =>
      createPurchaseOrder({
        id: asString(row.id) ?? generatedId,
        organizationId: asString(row.organizationId) ?? "",
        projectId: asString(row.projectId) ?? "",
        orderNumber: asString(row.orderNumber) ?? "",
        supplier: asString(row.supplier) ?? "",
        item: asString(row.item) ?? "",
        quantity: asNumber(row.quantity) ?? 0,
        unitPrice: asNumber(row.unitPrice) ?? 0,
        ...(asString(row.status) !== undefined ? { status: asString(row.status) as never } : {}),
        ...(asString(row.notes) !== undefined ? { notes: asString(row.notes) } : {}),
        createdAt: (asString(row.createdAt) as IsoTimestamp | undefined) ?? nowTs(),
      }),
    (entity) => repositories.purchaseOrders.save(entity),
    errors,
    async (row) => {
      const number = asString(row.orderNumber);
      if (number === undefined) return null;
      const natural = key("purchase-order", [number]);
      if (seenKeys.has(natural)) return duplicateError("orderNumber", number);
      seenKeys.add(natural);
      return null;
    },
  );

  imported += await importBatch(
    "contract",
    bundle.contracts,
    (row, generatedId) =>
      createContract({
        id: asString(row.id) ?? generatedId,
        organizationId: asString(row.organizationId) ?? "",
        projectId: asString(row.projectId) ?? "",
        ...(asString(row.contractType) !== undefined
          ? { contractType: asString(row.contractType) as never }
          : {}),
        contractNumber: asString(row.contractNumber) ?? "",
        title: asString(row.title) ?? "",
        ...(asString(row.party) !== undefined ? { party: asString(row.party) } : {}),
        ...(asString(row.periodStart) !== undefined
          ? { periodStart: asString(row.periodStart) }
          : {}),
        ...(asString(row.periodEnd) !== undefined ? { periodEnd: asString(row.periodEnd) } : {}),
        ...(asNumber(row.amount) !== undefined ? { amount: asNumber(row.amount) } : {}),
        ...(asString(row.description) !== undefined
          ? { description: asString(row.description) }
          : {}),
        ...(asString(row.documentUrl) !== undefined
          ? { documentUrl: asString(row.documentUrl) }
          : {}),
        ...(asString(row.aiRiskScore) !== undefined
          ? { aiRiskScore: asString(row.aiRiskScore) as never }
          : {}),
        ...(asString(row.status) !== undefined ? { status: asString(row.status) as never } : {}),
        createdAt: (asString(row.createdAt) as IsoTimestamp | undefined) ?? nowTs(),
      }),
    (entity) => repositories.contracts.save(entity),
    errors,
    async (row) => {
      const number = asString(row.contractNumber);
      if (number === undefined) return null;
      const natural = key("contract", [number]);
      if (seenKeys.has(natural)) return duplicateError("contractNumber", number);
      seenKeys.add(natural);
      return null;
    },
  );

  return { imported, errors };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filePath = args[0];
  if (filePath === undefined) {
    console.error("usage: import-business-data.ts <bundle.json> [--db <path>]");
    process.exit(1);
  }
  const dbIndex = args.indexOf("--db");
  const dbPath = dbIndex >= 0 ? args[dbIndex + 1] : undefined;
  if (dbIndex >= 0 && dbPath === undefined) {
    console.error("--db requires a path");
    process.exit(1);
  }
  const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    console.error("input must be a JSON object with typed arrays");
    process.exit(1);
  }
  const repositories = createSqliteRepositories(
    dbPath ?? process.env["CEOP_SQLITE_FILE"] ?? "/data/ceop.db",
  );
  const result = await importBusinessData(parsed as ImportBundle, repositories);
  console.error(
    `[import-business-data] imported=${result.imported} errors=${result.errors.length}`,
  );
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  if (result.errors.length > 0) {
    console.error(
      "[import-business-data] FAILED: invalid records found (nothing committed for them)",
    );
    process.exit(2);
  }
  console.error("[import-business-data] OK");
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === new URL(process.argv[1], import.meta.url).href
) {
  main().catch((e) => {
    console.error("[import-business-data] FAILED:", e);
    process.exit(2);
  });
}
