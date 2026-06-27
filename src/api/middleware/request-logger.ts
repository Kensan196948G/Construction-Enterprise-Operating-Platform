/**
 * Minimal HTTP request logger.
 *
 * Writes to stderr so that structured API responses on stdout remain
 * unpolluted and safe for piping to JSON processors.
 */

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
): void {
  const timestamp = new Date().toISOString();
  // Strip query string to avoid logging tokens or sensitive parameters.
  const safePath = url.split("?")[0] ?? url;
  console.error(`[${timestamp}] ${method} ${safePath} ${statusCode} ${durationMs}ms`);
}
