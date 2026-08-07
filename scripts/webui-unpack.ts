/**
 * Unpack the WebUI design bundle into static files for hosting.
 *
 * Usage:
 *   node --experimental-strip-types scripts/webui-unpack.ts [srcHtml] [outDir]
 *
 * Defaults: srcHtml = "webui/CEOP Platform.html", outDir = "webui/dist".
 * The output directory is gitignored (dist/); regenerate it at deploy time.
 */

import { readFileSync } from "node:fs";

import { unpackBundle, writeUnpackedBundle } from "../src/webui/unpack.ts";

const [srcArg, outArg] = process.argv.slice(2);
const srcHtml = srcArg ?? "webui/CEOP Platform.html";
const outDir = outArg ?? "webui/dist";

let html: string;
try {
  html = readFileSync(srcHtml, "utf-8");
} catch (e) {
  console.error(`[webui-unpack] cannot read ${srcHtml}: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}

const result = unpackBundle(html);
if (!result.ok) {
  console.error(`[webui-unpack] ${result.error}`);
  process.exit(2);
}

writeUnpackedBundle(result.value, outDir);

const totalBytes = result.value.assets.reduce((sum, a) => sum + a.bytes.length, 0);
console.error(
  `[webui-unpack] wrote ${result.value.assets.length} assets (${(totalBytes / 1024 / 1024).toFixed(1)} MiB) + index.html to ${outDir}`,
);
