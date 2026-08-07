/**
 * Client IP resolution behind a trusted reverse proxy.
 *
 * The API is bound to loopback and only Cloudflare Tunnel (running on the
 * same host) can reach it, so `socket.remoteAddress` is always 127.0.0.1.
 * Rate limiting and access logs that key on that address treat every visitor
 * as one bucket. Cloudflare sets `CF-Connecting-IP` to the real client IP,
 * and we trust that header **only** when the TCP peer is loopback — a remote
 * attacker cannot reach the socket directly, and a forged header from a
 * non-loopback peer is ignored.
 */

import { isIP } from "node:net";
import type { IncomingMessage } from "node:http";

/** TCP addresses that represent the local proxy peer. */
export function isLoopbackAddress(address: string | undefined): boolean {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

/**
 * Resolve the effective client IP.
 *
 * Returns the socket address unless the peer is loopback AND a syntactically
 * valid `CF-Connecting-IP` is present. Malformed or absent headers fall back
 * to the socket address so a broken proxy cannot silence rate limiting.
 */
export function resolveClientIp(
  remoteAddress: string | undefined,
  cfConnectingIp: string | undefined,
): string {
  const remote = remoteAddress ?? "";
  if (!isLoopbackAddress(remote)) {
    return remote;
  }
  if (cfConnectingIp !== undefined) {
    const candidate = cfConnectingIp.split(",")[0]?.trim();
    if (candidate !== undefined && isIP(candidate) !== 0) {
      return candidate;
    }
  }
  return remote;
}

/** Convenience wrapper for an `IncomingMessage`. */
export function clientIpFromRequest(req: Pick<IncomingMessage, "socket" | "headers">): string {
  return resolveClientIp(
    req.socket?.remoteAddress,
    firstHeaderValue(req.headers["cf-connecting-ip"]),
  );
}
