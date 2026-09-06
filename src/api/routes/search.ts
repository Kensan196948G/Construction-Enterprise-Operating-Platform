/**
 * Cross-domain full-text search API (Issue #86).
 *
 * `GET /api/v1/search?q=...&type=...` fans out across daily-report, contract,
 * document, and inspection records. The backend is abstracted behind
 * `Repositories.search` (an FTS5-backed service on SQLite, a substring-scan
 * fallback on in-memory/file) so this route never branches on storage tier.
 *
 * Per-domain read permissions are enforced: a caller only sees results from
 * domains it holds `<domain>:read` for, and results are scoped to the
 * caller's organization (same tenant-isolation convention as every other
 * list endpoint).
 */

import { SEARCH_DOMAINS, isSearchDomain, type SearchDomain } from "../../domain/search.ts";
import { parsePagination } from "../pagination.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerSearchRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/search", async (req, ctx, res) => {
    if (ctx === null) {
      writeJson(res, 401, { error: "Unauthorized", message: "authentication required" });
      return;
    }

    const q = (req.query["q"] ?? "").trim();
    if (q === "") {
      badRequest(res, [{ field: "q", message: "q is required and must be non-empty" }]);
      return;
    }

    const typeParam = req.query["type"];
    if (typeParam !== undefined && !isSearchDomain(typeParam)) {
      badRequest(res, [
        { field: "type", message: `type must be one of: ${SEARCH_DOMAINS.join(", ")}` },
      ]);
      return;
    }

    // Restrict to domains the caller can read. An explicit ?type= that the
    // caller lacks permission for is a 403; omitting ?type= silently scopes
    // the search to whatever the caller is allowed to see (never a leak).
    const readableDomains = SEARCH_DOMAINS.filter((d) => hasPermission(ctx, d, "read"));
    let domains: readonly SearchDomain[];
    if (typeParam !== undefined) {
      if (!readableDomains.includes(typeParam)) {
        writeJson(res, 403, {
          error: "Forbidden",
          message: `requires '${typeParam}:read' permission`,
        });
        return;
      }
      domains = [typeParam];
    } else {
      domains = readableDomains;
    }

    if (domains.length === 0 || repositories.search === undefined) {
      writeJson(res, 200, { results: [], count: 0, query: q });
      return;
    }

    const { limit } = parsePagination(req.query);
    const results = await repositories.search.search({
      q,
      domains,
      ...(ctx.organizationId !== undefined ? { organizationId: ctx.organizationId } : {}),
      limit,
    });

    writeJson(res, 200, {
      results,
      count: results.length,
      query: q,
      ...(typeParam !== undefined ? { type: typeParam } : {}),
    });
  });
}
