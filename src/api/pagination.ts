// FILE: src/api/pagination.ts
/**
 * Shared pagination helper for list endpoints.
 *
 * Parses `limit` and `offset` from a URL query object and applies them to an
 * already-fetched array. This layer-7 slicing works correctly for in-memory and
 * SQLite repositories (which both return all rows via findAll); a future
 * push-down optimisation can move limit/offset into the repository interface
 * without changing any route handler.
 */

const LIMIT_DEFAULT = 20;
const LIMIT_MAX = 200;

// Matches non-negative integers without leading zeros (rejects "1.5", "1abc", "01").
const NON_NEG_INT_RE = /^(0|[1-9]\d*)$/;

export interface Pagination {
  readonly limit: number;
  readonly offset: number;
}

/** Parse `?limit=&offset=` from a query record, applying sensible defaults. */
export function parsePagination(query: Readonly<Record<string, string>>): Pagination {
  const rawLimit = query["limit"];
  const rawOffset = query["offset"];

  const parsedLimit =
    rawLimit !== undefined && NON_NEG_INT_RE.test(rawLimit) ? Number(rawLimit) : undefined;
  const parsedOffset =
    rawOffset !== undefined && NON_NEG_INT_RE.test(rawOffset) ? Number(rawOffset) : undefined;

  const limit =
    parsedLimit === undefined || parsedLimit < 1 ? LIMIT_DEFAULT : Math.min(parsedLimit, LIMIT_MAX);
  const offset = parsedOffset === undefined ? 0 : parsedOffset;

  return { limit, offset };
}

/** Apply limit/offset to an array and build the standard paginated response envelope. */
export function paginate<T>(
  items: readonly T[],
  pagination: Pagination,
): { readonly items: readonly T[]; readonly total: number; readonly limit: number; readonly offset: number; readonly count: number } {
  const page = items.slice(pagination.offset, pagination.offset + pagination.limit);
  return {
    items: page,
    total: items.length,
    limit: pagination.limit,
    offset: pagination.offset,
    count: page.length,
  };
}
