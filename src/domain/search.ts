/**
 * Cross-domain full-text search (Issue #86).
 *
 * A single `GET /api/v1/search` endpoint fans out across the domains listed
 * in {@link SEARCH_DOMAINS}. Two implementations exist:
 *   - SQLite tier: `persistence/sqlite/search-index.ts` — an FTS5 virtual
 *     table kept in sync via triggers on each source table.
 *   - in-memory / file tiers: `persistence/search-fallback.ts` — a naive
 *     substring scan over `Repository#findAll()`.
 *
 * Both implement the same {@link SearchService} port so route code never
 * branches on storage backend.
 */

/** Domains indexed by cross-domain search. */
export const SEARCH_DOMAINS = ["daily-report", "contract", "document", "inspection"] as const;
export type SearchDomain = (typeof SEARCH_DOMAINS)[number];

/** Type guard used to validate the `?type=` query parameter. */
export function isSearchDomain(value: string): value is SearchDomain {
  return (SEARCH_DOMAINS as readonly string[]).includes(value);
}

/** One search hit, normalized across every domain. */
export interface SearchResultItem {
  readonly domain: SearchDomain;
  readonly id: string;
  readonly title: string;
  readonly summary?: string;
  /** Relevance score (lower = more relevant, FTS5 bm25 convention). Absent for the fallback scan. */
  readonly score?: number;
  readonly organizationId: string;
  readonly projectId?: string;
}

export interface SearchQuery {
  /** Raw search text (required, non-empty). */
  readonly q: string;
  /** Restrict the search to these domains; defaults to all of {@link SEARCH_DOMAINS}. */
  readonly domains?: readonly SearchDomain[];
  /** Tenant scope — when set, only rows belonging to this organization are returned. */
  readonly organizationId?: string;
  /** Maximum number of results to return. */
  readonly limit?: number;
}

/** Backend-agnostic cross-domain search port. */
export interface SearchService {
  search(query: SearchQuery): Promise<readonly SearchResultItem[]>;
}
