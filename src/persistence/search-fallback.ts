/**
 * Naive substring-match cross-domain search (Issue #86).
 *
 * Used by the in-memory and file persistence tiers, neither of which has a
 * full-text index. Scans each domain's full collection client-side via
 * `Repository#findAll()` and filters with a case-insensitive `includes()` —
 * acceptable for the small/demo datasets those tiers target. SQLite installs
 * use `persistence/sqlite/search-index.ts` (FTS5) instead.
 */

import {
  SEARCH_DOMAINS,
  type SearchDomain,
  type SearchQuery,
  type SearchResultItem,
  type SearchService,
} from "../domain/search.ts";
import type { Repositories } from "./ports.ts";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** True if any of `haystack` (case-insensitive) contains `needle`. */
function matchesAny(haystack: readonly (string | undefined)[], needle: string): boolean {
  return haystack.some((h) => h !== undefined && h.toLowerCase().includes(needle));
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit) || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

export function createFallbackSearchService(repositories: Repositories): SearchService {
  return {
    async search(query: SearchQuery): Promise<readonly SearchResultItem[]> {
      const needle = query.q.trim().toLowerCase();
      if (needle === "") return [];
      const domains: readonly SearchDomain[] = query.domains ?? SEARCH_DOMAINS;
      const limit = clampLimit(query.limit);
      const results: SearchResultItem[] = [];

      if (domains.includes("daily-report")) {
        const all = await repositories.dailyReports.findAll();
        for (const r of all) {
          if (query.organizationId !== undefined && r.organizationId !== query.organizationId) {
            continue;
          }
          if (!matchesAny([r.workContent, r.safetyNotes, r.issues, r.reportDate], needle)) continue;
          results.push({
            domain: "daily-report",
            id: r.id as string,
            title: `日報 ${r.reportDate}`,
            ...(r.workContent !== undefined || r.issues !== undefined
              ? { summary: r.workContent ?? r.issues }
              : {}),
            organizationId: r.organizationId,
            projectId: r.projectId as string,
          });
        }
      }

      if (domains.includes("contract")) {
        const all = await repositories.contracts.findAll();
        for (const c of all) {
          if (query.organizationId !== undefined && c.organizationId !== query.organizationId) {
            continue;
          }
          if (!matchesAny([c.title, c.description, c.party, c.contractNumber], needle)) continue;
          results.push({
            domain: "contract",
            id: c.id as string,
            title: c.title,
            ...(c.description !== undefined ? { summary: c.description } : {}),
            organizationId: c.organizationId,
            projectId: c.projectId as string,
          });
        }
      }

      if (domains.includes("document")) {
        const all = await repositories.documents.findAll();
        for (const d of all) {
          if (query.organizationId !== undefined && d.organizationId !== query.organizationId) {
            continue;
          }
          if (!matchesAny([d.title, ...d.tags], needle)) continue;
          results.push({
            domain: "document",
            id: d.id as string,
            title: d.title,
            ...(d.tags.length > 0 ? { summary: d.tags.join(", ") } : {}),
            organizationId: d.organizationId,
            ...(d.projectId !== undefined ? { projectId: d.projectId as string } : {}),
          });
        }
      }

      if (domains.includes("inspection")) {
        const all = await repositories.inspections.findAll();
        for (const i of all) {
          if (query.organizationId !== undefined && i.organizationId !== query.organizationId) {
            continue;
          }
          const labels = i.checklistItems.map((c) => c.label);
          if (!matchesAny([i.title, i.description, ...labels], needle)) continue;
          results.push({
            domain: "inspection",
            id: i.id as string,
            title: i.title,
            ...(i.description !== undefined ? { summary: i.description } : {}),
            organizationId: i.organizationId,
            projectId: i.projectId as string,
          });
        }
      }

      return results.slice(0, limit);
    },
  };
}
