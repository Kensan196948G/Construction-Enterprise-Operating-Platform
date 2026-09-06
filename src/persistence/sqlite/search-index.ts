/**
 * SQLite FTS5 cross-domain search index (Issue #86).
 *
 * `setupSearchIndex()` creates one FTS5 virtual table (`search_fts`) that is
 * kept in sync with the `daily_reports`, `legal_contracts`, `documents`, and
 * `inspections` tables via `AFTER INSERT/UPDATE/DELETE` triggers. The FTS row
 * is fully denormalized (domain, id, org/project scope, title, body), so a
 * search query needs no join back to the source tables.
 *
 * Tokenizer: `trigram` (built into SQLite ≥ 3.34, enabled in Node's bundled
 * SQLite). Unlike the default `unicode61` tokenizer — which segments on
 * whitespace/punctuation and therefore cannot usefully index Japanese text
 * with no word boundaries — `trigram` indexes overlapping 3-character
 * sequences, which supports substring search over CJK text. The trade-off is
 * that queries shorter than 3 characters cannot match (SQLite's own
 * limitation of the trigram tokenizer); callers should expect no results for
 * 1-2 character queries against the SQLite backend.
 *
 * `save()` on the base repositories uses `INSERT ... ON CONFLICT DO UPDATE`;
 * SQLite fires exactly one of the AFTER INSERT / AFTER UPDATE triggers for an
 * upsert (never both), so each write updates the index exactly once.
 */

import type { DatabaseSync } from "node:sqlite";
import {
  SEARCH_DOMAINS,
  type SearchDomain,
  type SearchQuery,
  type SearchResultItem,
  type SearchService,
} from "../../domain/search.ts";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface DomainTableSpec {
  readonly table: string;
  readonly domain: SearchDomain;
  /** SQL expression (references NEW.*) producing the result title. */
  readonly titleExpr: string;
  /** SQL expression (references NEW.*) producing the searchable body text. */
  readonly bodyExpr: string;
}

const DOMAIN_TABLES: readonly DomainTableSpec[] = [
  {
    table: "daily_reports",
    domain: "daily-report",
    titleExpr: `'日報 ' || NEW.report_date`,
    bodyExpr: `TRIM(
      COALESCE(json_extract(NEW.data, '$.workContent'), '') || ' ' ||
      COALESCE(json_extract(NEW.data, '$.safetyNotes'), '') || ' ' ||
      COALESCE(json_extract(NEW.data, '$.issues'), '')
    )`,
  },
  {
    table: "legal_contracts",
    domain: "contract",
    titleExpr: `COALESCE(json_extract(NEW.data, '$.title'), NEW.contract_number)`,
    bodyExpr: `TRIM(
      COALESCE(json_extract(NEW.data, '$.description'), '') || ' ' ||
      COALESCE(json_extract(NEW.data, '$.party'), '') || ' ' ||
      NEW.contract_number
    )`,
  },
  {
    table: "documents",
    domain: "document",
    titleExpr: `json_extract(NEW.data, '$.title')`,
    bodyExpr: `COALESCE(
      (SELECT group_concat(value, ' ') FROM json_each(NEW.data, '$.tags')),
      ''
    )`,
  },
  {
    table: "inspections",
    domain: "inspection",
    titleExpr: `json_extract(NEW.data, '$.title')`,
    bodyExpr: `TRIM(
      COALESCE(json_extract(NEW.data, '$.description'), '') || ' ' ||
      COALESCE(
        (SELECT group_concat(json_extract(value, '$.label'), ' ') FROM json_each(NEW.data, '$.checklistItems')),
        ''
      )
    )`,
  },
];

/**
 * Create the `search_fts` virtual table (if absent) and wire up sync
 * triggers on every indexed domain table. Idempotent — safe to call every
 * time `createSqliteRepositories()` opens a database.
 *
 * Must run after the source tables (`daily_reports`, `legal_contracts`,
 * `documents`, `inspections`) already exist, since the triggers reference
 * them directly.
 */
export function setupSearchIndex(db: DatabaseSync): void {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
      domain UNINDEXED,
      entity_id UNINDEXED,
      org_id UNINDEXED,
      project_id UNINDEXED,
      title,
      body,
      tokenize = 'trigram'
    )
  `);

  for (const spec of DOMAIN_TABLES) {
    for (const event of ["INSERT", "UPDATE"] as const) {
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_${spec.table}_search_${event.toLowerCase()}
        AFTER ${event} ON ${spec.table}
        BEGIN
          DELETE FROM search_fts WHERE domain = '${spec.domain}' AND entity_id = NEW.id;
          INSERT INTO search_fts (domain, entity_id, org_id, project_id, title, body)
          VALUES ('${spec.domain}', NEW.id, NEW.org_id, NEW.project_id, ${spec.titleExpr}, ${spec.bodyExpr});
        END
      `);
    }
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_${spec.table}_search_delete
      AFTER DELETE ON ${spec.table}
      BEGIN
        DELETE FROM search_fts WHERE domain = '${spec.domain}' AND entity_id = OLD.id;
      END
    `);
  }
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit) || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

interface SearchFtsRow {
  readonly domain: string;
  readonly entity_id: string;
  readonly org_id: string;
  readonly project_id: string | null;
  readonly title: string;
  readonly body: string;
  readonly rank: number;
}

/**
 * Build a {@link SearchService} backed by the `search_fts` FTS5 table.
 * The query text is wrapped as a single quoted FTS5 phrase (embedded quotes
 * doubled) so free-form user input is always treated as a literal phrase,
 * never parsed as FTS5 query-syntax operators (AND/OR/NOT/column filters).
 */
export function createSqliteSearchService(db: DatabaseSync): SearchService {
  return {
    async search(query: SearchQuery): Promise<readonly SearchResultItem[]> {
      const q = query.q.trim();
      if (q === "") return [];
      const domains: readonly SearchDomain[] = query.domains ?? SEARCH_DOMAINS;
      if (domains.length === 0) return [];
      const limit = clampLimit(query.limit);

      const matchExpr = `"${q.replace(/"/g, '""')}"`;
      const domainPlaceholders = domains.map(() => "?").join(", ");
      const clauses = ["search_fts MATCH ?", `domain IN (${domainPlaceholders})`];
      const params: (string | number)[] = [matchExpr, ...domains];
      if (query.organizationId !== undefined) {
        clauses.push("org_id = ?");
        params.push(query.organizationId);
      }
      params.push(limit);

      const stmt = db.prepare(`
        SELECT domain, entity_id, org_id, project_id, title, body, rank
        FROM search_fts
        WHERE ${clauses.join(" AND ")}
        ORDER BY rank
        LIMIT ?
      `);
      const rows = stmt.all(...params) as unknown as SearchFtsRow[];
      return rows.map((r) => ({
        domain: r.domain as SearchDomain,
        id: r.entity_id,
        title: r.title,
        ...(r.body.trim() !== "" ? { summary: r.body } : {}),
        score: r.rank,
        organizationId: r.org_id,
        ...(r.project_id !== null ? { projectId: r.project_id } : {}),
      }));
    },
  };
}
