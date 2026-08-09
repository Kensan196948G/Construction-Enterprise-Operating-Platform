/**
 * Civil-Construction-IMS data import — one-time migration helper.
 *
 * Usage:
 *   node --experimental-strip-types scripts/import-ims-records.ts <records.json> [--db /data/ceop.db]
 *
 * Input: JSON array of IMS-style records:
 *   [{ kind: "asset", organizationId: "org-1", projectId?: string, parentId?: string,
 *      number?: string, title: string, status?: string, payload?: object, createdBy?: string }]
 *
 * Every record passes CEOP domain validation before it is persisted; invalid
 * records are reported and the command exits non-zero (fail-closed). Run this
 * against a migrated CEOP SQLite database after `scripts/migrate.ts`.
 */

import { readFile } from "node:fs/promises";
import { createIsoRecord, isoKind } from "../src/domain/iso.ts";
import { createSqliteRepositories } from "../src/persistence/sqlite/index.ts";
import { createInMemoryRepositories } from "../src/persistence/in-memory/index.ts";
import type { Repositories } from "../src/persistence/ports.ts";

interface ImportRecord {
  readonly [key: string]: unknown;
  readonly kind?: unknown;
  readonly organizationId?: unknown;
  readonly projectId?: unknown;
  readonly parentId?: unknown;
  readonly number?: unknown;
  readonly title?: unknown;
  readonly status?: unknown;
  readonly payload?: unknown;
  readonly createdBy?: unknown;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

async function importRecords(
  records: readonly ImportRecord[],
  repositories: Repositories,
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  const errors: string[] = [];
  for (const [index, record] of records.entries()) {
    const kind = asString(record.kind);
    const organizationId = asString(record.organizationId);
    const title = asString(record.title);
    if (kind === undefined || isoKind(kind) === null || organizationId === undefined || title === undefined) {
      errors.push(`record ${index}: kind/organizationId/title are required`);
      continue;
    }
    const result = createIsoRecord({
      id: `iso-import-${index}-${Date.now()}`,
      kind: isoKind(kind) as never,
      organizationId,
      ...(asString(record.projectId) !== undefined ? { projectId: asString(record.projectId) } : {}),
      ...(asString(record.parentId) !== undefined ? { parentId: asString(record.parentId) } : {}),
      ...(asString(record.number) !== undefined ? { number: asString(record.number) } : {}),
      title,
      ...(asString(record.status) !== undefined ? { status: asString(record.status) } : {}),
      payload: {
        ...Object.fromEntries(
          Object.entries(record).filter(
            ([key]) => !["kind", "organizationId", "projectId", "parentId", "number", "title", "status", "payload", "createdBy"].includes(key),
          ),
        ),
        ...(typeof record.payload === "object" &&
        record.payload !== null &&
        !Array.isArray(record.payload)
          ? (record.payload as Record<string, unknown>)
          : {}),
      },
      createdBy: asString(record.createdBy) ?? "ims-import",
      createdAt: new Date().toISOString() as never,
    });
    if (!result.ok) {
      errors.push(`record ${index}: ${JSON.stringify(result.error)}`);
      continue;
    }
    await repositories.isoRecords.save(result.value);
    imported++;
  }
  return { imported, errors };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filePath = args[0];
  if (filePath === undefined) {
    console.error("usage: import-ims-records.ts <records.json> [--db <path>]");
    process.exit(1);
  }
  const dbIndex = args.indexOf("--db");
  const dbPath = dbIndex >= 0 ? args[dbIndex + 1] : undefined;
  if (dbIndex >= 0 && dbPath === undefined) {
    console.error("--db requires a path");
    process.exit(1);
  }
  const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));
  if (!Array.isArray(parsed)) {
    console.error("input must be a JSON array");
    process.exit(1);
  }
  const repositories =
    dbPath !== undefined ? createSqliteRepositories(dbPath) : createInMemoryRepositories();
  const result = await importRecords(parsed as ImportRecord[], repositories);
  console.error(`[import-ims] imported=${result.imported} errors=${result.errors.length}`);
  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(`[import-ims] ERROR ${error}`);
    process.exit(2);
  }
}

export { importRecords };

if (process.argv[1] !== undefined && import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  await main();
}
