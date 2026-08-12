/**
 * Leveled HTTP request logger (stderr).
 *
 * Writes to stderr so that structured API responses on stdout remain
 * unpolluted and safe for piping to JSON processors. Honours the shared
 * LOG_LEVEL setting (default: info).
 */

import { createLogger } from "../../obs/logger.ts";

const requestLogger = createLogger("request");

/**
 * Emit a one-line access log entry for a completed HTTP request.
 *
 * @param method     - HTTP verb (GET, POST, …)
 * @param url        - Request URL path (+ query)
 * @param statusCode - Response status code sent to the client
 * @param durationMs - Round-trip time from request start to response end
 */
export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  durationMs: number,
  requestId?: string,
): void {
  // Strip query string to avoid logging tokens or sensitive parameters.
  const safePath = url.split("?")[0] ?? url;
  const id = requestId === undefined ? "" : ` ${requestId}`;
  requestLogger.info(`${id} ${method} ${safePath} ${statusCode} ${durationMs}ms`);
}
