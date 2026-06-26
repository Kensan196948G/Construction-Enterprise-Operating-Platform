/**
 * Generic SQLite-backed repository using node:sqlite (Node.js v22.5+).
 *
 * Entities are stored as JSON strings in a `data TEXT` column with the entity's
 * `id` as the primary key. This keeps the schema migration surface minimal while
 * domain models evolve. Subclasses add domain-specific query columns and indexes.
 *
 * All public methods are `async` to satisfy the Repository<T, Id> port contract;
 * internally the DatabaseSync API is synchronous (no event loop contention).
 */

import { createRequire } from "node:module";
import type { Repository } from "../ports.ts";

// node:sqlite ships without bundled TypeScript types in Node.js v22/v25.
// createRequire bridges the untyped built-in into our ESM module graph.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseSync = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StatementSync = any;

// Module-level require handle — initialized once, reused per openDatabase() call.
const _require = createRequire(import.meta.url);
const _sqlite = _require("node:sqlite") as { DatabaseSync: new (path: string) => DatabaseSync };

// ---------------------------------------------------------------------------
// Column / index helpers
// ---------------------------------------------------------------------------

export type ColumnDef = string; // e.g. "email TEXT", "org_id TEXT"

export interface IndexDef {
  readonly name: string;
  readonly columns: readonly string[];
  readonly unique?: boolean;
}

// ---------------------------------------------------------------------------
// Base class
// ---------------------------------------------------------------------------

export class BaseSqliteRepository<T extends { id: string }>
  implements Repository<T, string>
{
  protected readonly db: DatabaseSync;
  readonly #table: string;
  readonly #extraColNames: readonly string[];

  constructor(
    db: DatabaseSync,
    table: string,
    extraColumns: readonly ColumnDef[] = [],
    indexes: readonly IndexDef[] = [],
    extraColNames: readonly string[] = [],
  ) {
    this.db = db;
    this.#table = table;
    this.#extraColNames = extraColNames;
    this.#initSchema(extraColumns, indexes);
  }

  #initSchema(extraColumns: readonly ColumnDef[], indexes: readonly IndexDef[]): void {
    const extra = extraColumns.length > 0 ? `,\n  ${extraColumns.join(",\n  ")}` : "";
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.#table} (
        id   TEXT PRIMARY KEY,
        data TEXT NOT NULL${extra}
      )
    `);
    for (const idx of indexes) {
      const unique = idx.unique === true ? "UNIQUE " : "";
      this.db.exec(
        `CREATE ${unique}INDEX IF NOT EXISTS ${idx.name} ON ${this.#table} (${idx.columns.join(", ")})`,
      );
    }
  }

  /** Subclasses override to supply extra column values for indexed fields. */
  protected extraValues(_entity: T): readonly unknown[] {
    return [];
  }

  #upsertStmt(): StatementSync {
    if (this.#extraColNames.length === 0) {
      return this.db.prepare(
        `INSERT INTO ${this.#table} (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
      );
    }
    const cols = ["id", "data", ...this.#extraColNames].join(", ");
    const placeholders = Array.from({ length: 2 + this.#extraColNames.length }, () => "?").join(
      ", ",
    );
    // Target only the primary key (id) to avoid silently deleting rows when a
    // secondary UNIQUE index (email, role name, app_key, …) conflicts.
    const updates = ["data", ...this.#extraColNames].map((c) => `${c} = excluded.${c}`).join(", ");
    return this.db.prepare(
      `INSERT INTO ${this.#table} (${cols}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`,
    );
  }

  async findById(id: string): Promise<T | null> {
    const stmt: StatementSync = this.db.prepare(
      `SELECT data FROM ${this.#table} WHERE id = ?`,
    );
    const row = stmt.get(id) as { data: string } | undefined;
    return row !== undefined ? (JSON.parse(row.data) as T) : null;
  }

  async findAll(): Promise<readonly T[]> {
    const stmt: StatementSync = this.db.prepare(`SELECT data FROM ${this.#table}`);
    const rows = stmt.all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as T);
  }

  async save(entity: T): Promise<void> {
    const stmt = this.#upsertStmt();
    stmt.run(entity.id, JSON.stringify(entity), ...this.extraValues(entity));
  }

  async delete(id: string): Promise<void> {
    const stmt: StatementSync = this.db.prepare(
      `DELETE FROM ${this.#table} WHERE id = ?`,
    );
    stmt.run(id);
  }
}

// ---------------------------------------------------------------------------
// Database factory
// ---------------------------------------------------------------------------

/**
 * Open (or create) a SQLite database at the given file path.
 * Enables WAL journal mode and foreign key enforcement.
 * Returns a `DatabaseSync` instance (node:sqlite experimental API).
 */
export function openDatabase(filePath: string): DatabaseSync {
  const db = new _sqlite.DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}
