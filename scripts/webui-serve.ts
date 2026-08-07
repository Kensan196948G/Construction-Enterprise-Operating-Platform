/**
 * WebUI static server entrypoint (systemd unit `ceop-webui` runs this).
 *
 * Environment (typically from /home/kensan/.ceop/webui.env via systemd):
 *   CEOP_WEBUI_HOST      — listen address (default 127.0.0.1; Cloudflare Tunnel
 *                          reaches it on loopback, so the LAN is not exposed)
 *   CEOP_WEBUI_PORT      — listen port (default 3130)
 *   CEOP_WEBUI_ROOT      — unpacked bundle directory (default webui/dist)
 *   CEOP_WEBUI_NEON_URL  — optional Neon connection string enabling access
 *                          logging over Neon's SQL-over-HTTP endpoint
 */

import { statSync } from "node:fs";

import { createWebuiServer } from "../src/webui/server.ts";
import { createNeonAccessLogger, nullAccessLogger } from "../src/webui/access-log.ts";

const host = process.env["CEOP_WEBUI_HOST"] ?? "127.0.0.1";
const port = Number(process.env["CEOP_WEBUI_PORT"] ?? "3130");
const rootDir = process.env["CEOP_WEBUI_ROOT"] ?? "webui/dist";
const neonUrl = process.env["CEOP_WEBUI_NEON_URL"];

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`[webui] invalid CEOP_WEBUI_PORT: ${process.env["CEOP_WEBUI_PORT"]}`);
  process.exit(1);
}
try {
  statSync(`${rootDir}/index.html`);
} catch {
  console.error(`[webui] ${rootDir}/index.html not found — run scripts/webui-unpack.ts first`);
  process.exit(1);
}

const accessLogger =
  neonUrl !== undefined && neonUrl !== ""
    ? createNeonAccessLogger(neonUrl)
    : nullAccessLogger;
if (accessLogger === nullAccessLogger) {
  console.error("[webui] CEOP_WEBUI_NEON_URL not set — access logging disabled");
}

const server = createWebuiServer({ rootDir, accessLogger });
server.listen(port, host, () => {
  console.error(`[webui] serving ${rootDir} on http://${host}:${port}/ (health: /healthz)`);
});

let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.error(`[webui] ${signal} received, shutting down`);
  server.close(() => {
    // Push any buffered access-log rows before the process exits.
    void accessLogger.flush().finally(() => process.exit(0));
  });
  // Hard stop if lingering keep-alive sockets block close().
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
