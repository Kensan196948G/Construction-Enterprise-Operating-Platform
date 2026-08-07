/**
 * Behavioural tests for the WebUI static server: routing, caching, security
 * headers, traversal defence, and access-log integration — all against a
 * temporary document root on an ephemeral port.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { createWebuiServer } from "./server.ts";
import { buildInsert, createNeonAccessLogger, type AccessLogEntry } from "./access-log.ts";

let rootDir: string;
let outsideFile: string;
let server: Server;
let baseUrl: string;
const logged: AccessLogEntry[] = [];

before(async () => {
  const parent = mkdtempSync(join(tmpdir(), "ceop-webui-srv-"));
  rootDir = join(parent, "dist");
  mkdirSync(join(rootDir, "assets"), { recursive: true });
  writeFileSync(join(rootDir, "index.html"), "<!doctype html><title>CEOP</title>");
  writeFileSync(join(rootDir, "assets", "app.js"), "console.log(1);");
  writeFileSync(join(rootDir, "assets", "font.woff2"), Buffer.from([1, 2, 3]));
  // A sibling of the document root: must be unreachable via traversal.
  outsideFile = join(parent, "outside.txt");
  writeFileSync(outsideFile, "top secret");

  server = createWebuiServer({
    rootDir,
    accessLogger: { log: (e) => logged.push(e), flush: () => Promise.resolve() },
  });
  await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", () => resolveListen()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  rmSync(join(rootDir, ".."), { recursive: true, force: true });
});

test("serves index.html at / with no-cache and security headers", async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/html/);
  assert.equal(res.headers.get("cache-control"), "no-cache");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.match(res.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(await res.text(), /CEOP/);
});

test("serves assets with correct MIME and immutable caching", async () => {
  const js = await fetch(`${baseUrl}/assets/app.js`);
  assert.equal(js.status, 200);
  assert.match(js.headers.get("content-type") ?? "", /application\/javascript/);
  assert.equal(js.headers.get("cache-control"), "public, max-age=31536000, immutable");

  const font = await fetch(`${baseUrl}/assets/font.woff2`);
  assert.equal(font.headers.get("content-type"), "font/woff2");
  assert.equal((await font.arrayBuffer()).byteLength, 3);
});

test("blocks path traversal outside the document root", async () => {
  for (const path of [
    "/../outside.txt",
    "/assets/../../outside.txt",
    "/%2e%2e/outside.txt",
    "/..%2foutside.txt",
  ]) {
    const res = await fetch(`${baseUrl}${path}`);
    assert.notEqual(res.status, 200, `${path} must not be served`);
    assert.doesNotMatch(await res.text(), /top secret/, `${path} must not leak content`);
  }
});

test("extension-less paths fall back to the SPA shell; missing files 404", async () => {
  const spa = await fetch(`${baseUrl}/governance`);
  assert.equal(spa.status, 200);
  assert.match(await spa.text(), /CEOP/);

  const missing = await fetch(`${baseUrl}/assets/nope.js`);
  assert.equal(missing.status, 404);
});

test("healthz reports service identity without caching", async () => {
  const res = await fetch(`${baseUrl}/healthz`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string; service: string; version: string };
  assert.equal(body.status, "ok");
  assert.equal(body.service, "ceop-webui");
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("favicon.svg is served with SVG MIME and caching", async () => {
  const res = await fetch(`${baseUrl}/favicon.svg`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /image\/svg\+xml/);
  assert.equal(res.headers.get("cache-control"), "public, max-age=86400");
  const body = await res.text();
  assert.match(body, /<svg/);
  assert.match(body, /d97757/);
});

test("favicon.ico is served as a multi-size ICO", async () => {
  const res = await fetch(`${baseUrl}/favicon.ico`, { redirect: "manual" });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/x-icon");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  const buf = Buffer.from(await res.arrayBuffer());
  // ICO magic: reserved(0) + type(1)
  assert.deepEqual([...buf.subarray(0, 4)], [0, 0, 1, 0]);
});

test("HEAD returns headers with empty body; non-GET methods get 405", async () => {
  const headRes = await fetch(`${baseUrl}/`, { method: "HEAD" });
  assert.equal(headRes.status, 200);
  assert.equal((await headRes.arrayBuffer()).byteLength, 0);

  const post = await fetch(`${baseUrl}/`, { method: "POST" });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
});

test("rejects null bytes and malformed percent-encoding", async () => {
  const nul = await fetch(`${baseUrl}/%00index.html`);
  assert.equal(nul.status, 400);
  const bad = await fetch(`${baseUrl}/%zz`);
  assert.equal(bad.status, 400);
});

test("access logger sees page requests but not asset requests", async () => {
  logged.length = 0;
  await fetch(`${baseUrl}/`);
  await fetch(`${baseUrl}/assets/app.js`);
  await fetch(`${baseUrl}/healthz`);
  // finish events fire asynchronously after the response body is consumed.
  await new Promise((r) => setTimeout(r, 50));
  const paths = logged.map((e) => e.path);
  assert.ok(paths.includes("/"), "page hit should be logged");
  assert.ok(paths.includes("/healthz"), "health hit should be logged");
  assert.ok(!paths.some((p) => p.startsWith("/assets/")), "asset hits must be skipped");
  const first = logged[0];
  assert.ok(first !== undefined && first.statusCode === 200 && first.durationMs >= 0);
});

test("buildInsert packs multi-row parameterised VALUES", () => {
  const { query, params } = buildInsert(
    [
      { method: "GET", path: "/", statusCode: 200, durationMs: 3 },
      { method: "GET", path: "/healthz", statusCode: 200, durationMs: 1, remoteAddr: "10.0.0.1" },
    ],
    "test-instance",
  );
  assert.match(
    query,
    /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7\), \(\$8, \$9, \$10, \$11, \$12, \$13, \$14\)$/,
  );
  assert.equal(params.length, 14);
  assert.equal(params[6], "test-instance");
  assert.equal(params[11], "10.0.0.1");
});

test("Neon logger batches and posts via injected fetch", async () => {
  const calls: { url: string; body: string; headers: Record<string, string> }[] = [];
  const fetchImpl = ((url: string | URL, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: String(init?.body),
      headers: (init?.headers ?? {}) as Record<string, string>,
    });
    return Promise.resolve(new Response("{}", { status: 200 }));
  }) as typeof fetch;

  const logger = createNeonAccessLogger(
    "postgresql://user:example-password@ep-example.aws.neon.tech/neondb?sslmode=require",
    { fetchImpl, batchSize: 100, flushIntervalMs: 60_000, instance: "test" },
  );
  logger.log({ method: "GET", path: "/", statusCode: 200, durationMs: 2 });
  logger.log({ method: "GET", path: "/healthz", statusCode: 200, durationMs: 1 });
  assert.equal(calls.length, 0, "below batch size nothing is sent yet");
  await logger.flush();
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "https://ep-example.aws.neon.tech/sql");
  const payload = JSON.parse(calls[0]?.body ?? "{}") as { query: string; params: unknown[] };
  assert.match(payload.query, /INSERT INTO webui_access_log/);
  assert.equal(payload.params.length, 14);
  await logger.flush();
  assert.equal(calls.length, 1, "empty queue flush must not POST");
});
