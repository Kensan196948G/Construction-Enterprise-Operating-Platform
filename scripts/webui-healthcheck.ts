// WebUI health probe: exits 0 when the given URL answers 2xx, 1 otherwise.
//
// Usage:
//   node --experimental-strip-types scripts/webui-healthcheck.ts <url>

import { request } from "node:http";

const url = process.argv[2];
if (url === undefined) {
  console.error("usage: node scripts/webui-healthcheck.ts <url>");
  process.exit(1);
}

const req = request(url, { method: "GET", timeout: 5000 }, (res) => {
  if (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) {
    res.resume();
    process.exit(0);
  }
  console.error(`health check failed: HTTP ${res.statusCode}`);
  process.exit(1);
});
req.on("timeout", () => {
  console.error("health check timeout");
  req.destroy();
  process.exit(1);
});
req.on("error", (e) => {
  console.error(`health check error: ${e.message}`);
  process.exit(1);
});
req.end();
