/**
 * Integration tests for the SSR page assets.
 *
 * The public Cloudflare Tunnel ingress sends every /assets/* path to the WebUI
 * static host, so the API's SSR templates must load their CSS/JS from
 * /api/assets/* — otherwise the dashboard/governance pages are unstyled and
 * non-interactive in production. These tests pin the /api/assets routes, the
 * legacy /assets routes for direct/local deployments, and the security headers
 * both variants carry.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { createApiKey } from "../middleware/auth.ts";
import { resolvePermissions } from "../../governance/policy-engine.ts";
import { createRole } from "../../domain/index.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";
import type { Result } from "../../domain/common.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

interface Harness {
  baseUrl: string;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const container: AppContainer = {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore: new Map(),
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

test("SSR assets: /api/assets/app.css is served publicly with security headers", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/api/assets/app.css`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /^text\/css/);
  assert.equal(res.headers.get("strict-transport-security"), "max-age=63072000; includeSubDomains");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.ok(res.headers.get("x-request-id"), "X-Request-Id should be present");
  assert.ok((await res.text()).includes("--paper"));
});

test("SSR assets: /api/assets/app.js is served publicly with JS MIME type", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/api/assets/app.js`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /javascript/);
  assert.equal(res.headers.get("strict-transport-security"), "max-age=63072000; includeSubDomains");
  assert.ok((await res.text()).includes("refreshDashboard"));
});

test("SSR assets: /api/assets/iso.js is served with JS MIME type", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/api/assets/iso.js`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /javascript/);
  assert.ok((await res.text()).includes("ISO 統合マネジメントコンソール"));
});

test("SSR assets: /api/assets/demo-login.js is served with JS MIME type", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/api/assets/demo-login.js`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /javascript/);
  assert.ok((await res.text()).includes("demo-login"));
});

test("SSR assets: /api/assets/manifest.webmanifest is served with manifest MIME", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/api/assets/manifest.webmanifest`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /manifest\+json/);
  assert.match(await res.text(), /short_name/);
});

test("SSR assets: /api/assets/favicon.svg is served with SVG MIME and security headers", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/api/assets/favicon.svg`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /image\/svg\+xml/);
  assert.equal(res.headers.get("strict-transport-security"), "max-age=63072000; includeSubDomains");
  assert.ok(res.headers.get("x-request-id"), "X-Request-Id should be present");
  assert.match(await res.text(), /<svg/);
});

test("SSR assets: /api/assets/favicon.ico is served as image/x-icon", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/api/assets/favicon.ico`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/x-icon");
  assert.equal(res.headers.get("strict-transport-security"), "max-age=63072000; includeSubDomains");
  const buf = Buffer.from(await res.arrayBuffer());
  assert.deepEqual([...buf.subarray(0, 4)], [0, 0, 1, 0]);
});

test("SSR assets: PWA PNG icons referenced by the manifest are served", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  for (const size of ["16", "32", "48", "192", "512"]) {
    const res = await fetch(`${h.baseUrl}/api/assets/favicon-${size}.png`);
    assert.equal(res.status, 200, `favicon-${size}.png status`);
    assert.equal(res.headers.get("content-type"), "image/png");
    const buf = Buffer.from(await res.arrayBuffer());
    // PNG magic bytes.
    assert.deepEqual([...buf.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], `${size}px PNG magic`);
  }

  const root = await fetch(`${h.baseUrl}/favicon.ico`);
  assert.equal(root.status, 200);
  assert.equal(root.headers.get("content-type"), "image/x-icon");
});

test("SSR assets: legacy /assets/* routes still work for direct deployments", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const css = await fetch(`${h.baseUrl}/assets/app.css`);
  assert.equal(css.status, 200);
  assert.match(css.headers.get("content-type") ?? "", /^text\/css/);
  const js = await fetch(`${h.baseUrl}/assets/app.js`);
  assert.equal(js.status, 200);
  assert.match(js.headers.get("content-type") ?? "", /javascript/);
  const isoJs = await fetch(`${h.baseUrl}/assets/iso.js`);
  assert.equal(isoJs.status, 200);
  assert.match(isoJs.headers.get("content-type") ?? "", /javascript/);
  const png = await fetch(`${h.baseUrl}/assets/favicon-192.png`);
  assert.equal(png.status, 200);
  assert.equal(png.headers.get("content-type"), "image/png");
});

test("SSR assets: HEAD mirrors GET on /api/assets without a body", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const get = await fetch(`${h.baseUrl}/api/assets/app.css`);
  const head = await fetch(`${h.baseUrl}/api/assets/app.css`, { method: "HEAD" });
  assert.equal(head.status, get.status);
  assert.equal(head.headers.get("content-type"), get.headers.get("content-type"));
  assert.equal(await head.text(), "");
  assert.equal(
    head.headers.get("strict-transport-security"),
    "max-age=63072000; includeSubDomains",
  );
});

test("SSR templates reference /api/assets so the Tunnel path-split cannot shadow them", async () => {
  const [index, governance, iso] = await Promise.all([
    readFile(new URL("../../web/templates/index.html", import.meta.url), "utf-8"),
    readFile(new URL("../../web/templates/governance.html", import.meta.url), "utf-8"),
    readFile(new URL("../../web/templates/iso.html", import.meta.url), "utf-8"),
  ]);
  assert.ok(index.includes('href="/api/assets/app.css"'), "index.html CSS must use /api/assets");
  assert.ok(
    index.includes('rel="manifest" href="/api/assets/manifest.webmanifest"'),
    "index.html must reference the PWA manifest",
  );
  assert.ok(index.includes('src="/api/assets/app.js"'), "index.html JS must use /api/assets");
  assert.ok(
    index.includes('<details class="nav-group" open>'),
    "index.html sidebar must use an open main-menu accordion group",
  );
  assert.ok(
    index.includes('summary class="nav-group__summary"'),
    "index.html sidebar must expose accordion group summaries",
  );
  assert.ok(
    governance.includes('href="/api/assets/app.css"'),
    "governance.html CSS must use /api/assets",
  );
  assert.ok(
    governance.includes('src="/api/assets/app.js"'),
    "governance.html JS must use /api/assets",
  );
  assert.ok(iso.includes('href="/api/assets/app.css"'), "iso.html CSS must use /api/assets");
  assert.ok(iso.includes('src="/api/assets/iso.js"'), "iso.html JS must use /api/assets");
  assert.ok(iso.includes('role="dialog"'), "iso.html dialogs must expose role=dialog");
  assert.ok(iso.includes('aria-live="polite"'), "iso.html toasts must be announced");
});

test("public /iso redirects to the ISO console entry point", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/iso`, { redirect: "manual" });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "/iso-app");
});

test("dashboard SSR includes the users section and the right-pane API viewer", async (t) => {
  const apiKeyStore: ApiKeyStore = new Map();
  const adminRole = unwrap(
    createRole({
      id: "r-admin",
      name: "Admin",
      description: "",
      scope: "global",
      permissions: ["*:*"],
    }),
  );
  const cred = createApiKey("admin-user", resolvePermissions([adminRole]), apiKeyStore);
  const server = createServer(
    { port: 0 },
    {
      repositories: createInMemoryRepositories(),
      auditLog: new AuditLog(),
      apiKeyStore,
    },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const res = await fetch(`${baseUrl}/dashboard`, {
    headers: { Authorization: `Bearer ${cred.key}:${cred.secret}` },
  });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /id="users"/);
  assert.match(html, /id="userTableBody"/);
  assert.match(html, /id="apiViewer"/);
});

test("ISO console requires auth and renders with iso:read permission", async (t) => {
  const apiKeyStore: ApiKeyStore = new Map();
  const role = unwrap(
    createRole({
      id: "r-iso",
      name: "ISO Reader",
      description: "",
      scope: "global",
      permissions: ["iso:read"],
    }),
  );
  const cred = createApiKey("iso-user", resolvePermissions([role]), apiKeyStore);
  const server = createServer(
    { port: 0 },
    {
      repositories: createInMemoryRepositories(),
      auditLog: new AuditLog(),
      apiKeyStore,
    },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const anonymous = await fetch(`${baseUrl}/iso-app`);
  assert.equal(anonymous.status, 401);

  const authed = await fetch(`${baseUrl}/iso-app`, {
    headers: { Authorization: `Bearer ${cred.key}:${cred.secret}` },
  });
  assert.equal(authed.status, 200);
  assert.match(authed.headers.get("content-type") ?? "", /text\/html/);
  assert.ok((await authed.text()).includes("ISO 統合マネジメントコンソール"));
});
