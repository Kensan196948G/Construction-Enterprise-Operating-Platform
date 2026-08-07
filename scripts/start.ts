/**
 * Production start script.
 *
 * Run with:
 *   node --experimental-strip-types scripts/start.ts
 *
 * Environment variables (see .env.example for full list):
 *   PORT             — TCP port to listen on (default: 3000)
 *   NODE_ENV         — "development" | "production" (default: "production")
 *   LOG_LEVEL        — "debug" | "info" | "warn" | "error" (default: "info")
 *   PLATFORM_NAME    — Override displayed platform name
 */

import { start } from "../src/app.ts";

// ── Environment ───────────────────────────────────────────────────────────────

const rawPort = Number(process.env["PORT"] ?? "3000");
if (!Number.isInteger(rawPort) || rawPort < 1 || rawPort > 65535) {
  console.error(
    `[start] Invalid PORT: "${process.env["PORT"]}" — must be an integer between 1 and 65535`,
  );
  process.exit(1);
}
const port = rawPort;
const env = process.env["NODE_ENV"] ?? "production";
const logLevel = process.env["LOG_LEVEL"] ?? "info";
const platformName = process.env["PLATFORM_NAME"] ?? "Construction Enterprise Operating Platform";

// ── Startup log ───────────────────────────────────────────────────────────────

console.error(`[start] ${platformName}`);
console.error(`[start] NODE_ENV=${env}  PORT=${port}  LOG_LEVEL=${logLevel}`);
console.error(`[start] Node.js ${process.version}`);

// ── Launch ────────────────────────────────────────────────────────────────────
// start() wires repositories, seeds demo data, creates the HTTP server, and
// registers SIGTERM / SIGINT handlers for graceful shutdown.

start(port).catch((err: unknown) => {
  console.error("[startup] Fatal error during initialisation:", err);
  process.exit(1);
});
