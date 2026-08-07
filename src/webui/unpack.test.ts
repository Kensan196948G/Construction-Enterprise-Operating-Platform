/**
 * Unit tests for the design-bundle unpacker using a small synthetic bundle,
 * so the suite never depends on the 8.7 MB design deliverable.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { unpackBundle, writeUnpackedBundle } from "./unpack.ts";

const UUID_JS = "11111111-1111-4111-8111-111111111111";
const UUID_FONT = "22222222-2222-4222-8222-222222222222";
const UUID_TEXT = "33333333-3333-4333-8333-333333333333";

function syntheticBundle(extResources?: unknown): string {
  const jsSource = 'console.log("hello");';
  const fontBytes = Buffer.from([0x77, 0x4f, 0x46, 0x32, 0x00, 0x01]);
  const manifest = {
    [UUID_JS]: {
      mime: "application/javascript",
      compressed: true,
      data: gzipSync(Buffer.from(jsSource, "utf-8")).toString("base64"),
    },
    [UUID_FONT]: {
      mime: "font/woff2",
      data: fontBytes.toString("base64"),
    },
    [UUID_TEXT]: {
      mime: "text/css",
      data: "/* plain text entry */ body { margin: 0; }",
    },
  };
  const template = `<html><head><link href="${UUID_TEXT}"></head><body><script src="${UUID_JS}"></script><style>@font-face{src:url(${UUID_FONT})}</style></body></html>`;
  // Escape "</" as "<\/" (a valid JSON escape) exactly like the real bundler
  // does, so embedded </script> tags cannot terminate the section early.
  const embed = (value: unknown): string => JSON.stringify(value).split("</").join("<\\/");
  return [
    "<!doctype html><html><body>",
    `<script type="__bundler/manifest">${embed(manifest)}</script>`,
    `<script type="__bundler/template">${embed(template)}</script>`,
    ...(extResources === undefined
      ? []
      : [`<script type="__bundler/ext_resources">${embed(extResources)}</script>`]),
    "</body></html>",
  ].join("\n");
}

test("unpackBundle decodes gzip, base64 and plain-text assets", () => {
  const result = unpackBundle(syntheticBundle());
  assert.ok(result.ok, "unpack should succeed");
  const { indexHtml, assets } = result.value;

  assert.equal(assets.length, 3);
  const byPath = new Map(assets.map((a) => [a.path, a]));

  const js = byPath.get(`assets/${UUID_JS}.js`);
  assert.ok(js, "gzip asset should get .js extension");
  assert.equal(Buffer.from(js.bytes).toString("utf-8"), 'console.log("hello");');

  const font = byPath.get(`assets/${UUID_FONT}.woff2`);
  assert.ok(font, "base64 asset should get .woff2 extension");
  assert.deepEqual([...font.bytes], [0x77, 0x4f, 0x46, 0x32, 0x00, 0x01]);

  const css = byPath.get(`assets/${UUID_TEXT}.css`);
  assert.ok(css, "plain-text asset should get .css extension");
  assert.match(Buffer.from(css.bytes).toString("utf-8"), /margin: 0/);

  // Every UUID reference must be rewritten to an asset path — no bare UUID
  // immediately after an attribute quote or url( delimiter may remain.
  assert.doesNotMatch(indexHtml, /["(][0-9a-f]{8}-/);
  assert.match(indexHtml, /src="assets\/11111111-1111-4111-8111-111111111111\.js"/);
  assert.match(indexHtml, /url\(assets\/22222222-2222-4222-8222-222222222222\.woff2\)/);
});

test("unpackBundle injects window.__resources for ext_resources entries", () => {
  const cdnUrl = "https://unpkg.com/react@18.3.1/umd/react.production.min.js";
  const result = unpackBundle(syntheticBundle([{ id: cdnUrl, uuid: UUID_JS }]));
  assert.ok(result.ok, "unpack should succeed");
  const { indexHtml } = result.value;

  // The map must land immediately after <head> and point the CDN URL at the
  // already-unpacked local asset so the runtime never leaves script-src 'self'.
  const injected =
    `<head><script>window.__resources = {"${cdnUrl}":"assets/${UUID_JS}.js"};</` + `script>`;
  assert.ok(indexHtml.includes(injected), `expected injected map in:\n${indexHtml}`);
});

test("unpackBundle omits window.__resources without ext_resources section", () => {
  const result = unpackBundle(syntheticBundle());
  assert.ok(result.ok);
  assert.doesNotMatch(result.value.indexHtml, /window\.__resources/);
});

test("unpackBundle rejects ext_resources referencing an unknown asset", () => {
  const missing = "99999999-9999-4999-8999-999999999999";
  const result = unpackBundle(syntheticBundle([{ id: "https://example.com/x.js", uuid: missing }]));
  assert.ok(!result.ok);
  assert.match(result.error, /unknown asset/);
});

test("unpackBundle rejects HTML without bundler sections", () => {
  const result = unpackBundle("<!doctype html><html><body>plain page</body></html>");
  assert.ok(!result.ok);
  assert.match(result.error, /__bundler\/manifest/);
});

test("unpackBundle rejects malformed manifest JSON", () => {
  const html =
    '<script type="__bundler/manifest">{not json</script>' +
    '<script type="__bundler/template">"<html></html>"</script>';
  const result = unpackBundle(html);
  assert.ok(!result.ok);
  assert.match(result.error, /JSON parse failed/);
});

test("writeUnpackedBundle materialises index.html and assets on disk", () => {
  const result = unpackBundle(syntheticBundle());
  assert.ok(result.ok);
  const outDir = mkdtempSync(join(tmpdir(), "ceop-webui-unpack-"));
  try {
    writeUnpackedBundle(result.value, outDir);
    const index = readFileSync(join(outDir, "index.html"), "utf-8");
    assert.match(index, /assets\/11111111-1111-4111-8111-111111111111\.js/);
    const font = readFileSync(join(outDir, "assets", `${UUID_FONT}.woff2`));
    assert.equal(font.length, 6);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
