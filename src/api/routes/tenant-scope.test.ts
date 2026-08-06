/**
 * Integration tests for organization-scoped authorization and
 * anti-privilege-escalation controls (v0.6.0 security findings).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { createOrganization, createRole } from "../../domain/index.ts";
import type { Repositories } from "../../persistence/ports.ts";
import type { IsoTimestamp } from "../../domain/common.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

function unwrap<T>(r: { ok: boolean; value?: T }): T {
  if (!r.ok) throw new Error("factory failed");
  return r.value as T;
}

interface Harness {
  baseUrl: string;
  scopedCred: string;
  adminCred: string;
  escalatorCred: string;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const repositories: Repositories = createInMemoryRepositories();

  const now = new Date().toISOString() as IsoTimestamp;
  const orgA = unwrap(
    createOrganization({
      id: "org-a",
      name: "Org A",
      type: "headquarters",
      status: "active",
      createdAt: now,
    }),
  );
  const orgB = unwrap(
    createOrganization({
      id: "org-b",
      name: "Org B",
      type: "headquarters",
      status: "active",
      createdAt: now,
    }),
  );
  await repositories.organizations.save(orgA);
  await repositories.organizations.save(orgB);

  const scopedRole = unwrap(
    createRole({
      id: "r-org-a",
      name: "Org A Manager",
      description: "",
      scope: "organization",
      permissions: [
        "organization:read",
        "user:read",
        "user:write",
        "device:read",
        "device:write",
        "application:read",
      ] as Permission[],
    }),
  );
  await repositories.roles.save(scopedRole);

  const globalAdmin = unwrap(
    createRole({
      id: "r-admin",
      name: "Admin",
      description: "",
      scope: "global",
      permissions: ["*:*"] as Permission[],
    }),
  );
  await repositories.roles.save(globalAdmin);

  const scopedPerms: readonly Permission[] = [...scopedRole.permissions] as Permission[];
  const scopedKV = createApiKey("user-a", scopedPerms, apiKeyStore, "org-a");
  const adminKV = createApiKey("admin", ["*:*"] as Permission[], apiKeyStore);
  const escalatorKV = createApiKey(
    "escalator",
    ["user:read", "user:write", "role:read", "role:write"] as Permission[],
    apiKeyStore,
  );

  const container: AppContainer = {
    repositories,
    auditLog: new AuditLog(),
    apiKeyStore,
    jwtIssuer: createJwtIssuer({ secret: generateJwtSecret() }),
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    scopedCred: `${scopedKV.key}:${scopedKV.secret}`,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    escalatorCred: `${escalatorKV.key}:${escalatorKV.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function req(
  method: string,
  baseUrl: string,
  path: string,
  auth: string | null,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth !== null) headers["Authorization"] = `Bearer ${auth}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

test("tenant-scope: org-scoped credential is isolated to its own organization", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  // Global admin creates a device in org-b.
  const bDevice = await req("POST", h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: "org-b",
    kind: "tablet",
    status: "active",
  });
  assert.equal(bDevice.status, 201);
  const bDeviceId = (bDevice.body as { id: string }).id;

  // Scoped key: creating in another org is forbidden.
  const cross = await req("POST", h.baseUrl, "/api/v1/devices", h.scopedCred, {
    organizationId: "org-b",
    kind: "tablet",
    status: "active",
  });
  assert.equal(cross.status, 403);

  // Scoped key: creating without org defaults to its own org.
  const own = await req("POST", h.baseUrl, "/api/v1/devices", h.scopedCred, {
    kind: "phone",
    status: "active",
  });
  assert.equal(own.status, 201);
  assert.equal((own.body as { organizationId: string }).organizationId, "org-a");

  // List is filtered to own org only.
  const list = await req("GET", h.baseUrl, "/api/v1/devices", h.scopedCred);
  const devices = (list.body as { devices: { id: string; organizationId: string }[] }).devices;
  assert.equal(devices.length, 1);
  assert.equal(devices[0]?.organizationId, "org-a");

  // Reading another org's device by id is indistinguishable from not found.
  const readOther = await req("GET", h.baseUrl, `/api/v1/devices/${bDeviceId}`, h.scopedCred);
  assert.equal(readOther.status, 404);

  // Scoped key cannot create organizations.
  const createOrg = await req("POST", h.baseUrl, "/api/v1/organizations", h.scopedCred, {
    name: "Org C",
    type: "site",
  });
  assert.equal(createOrg.status, 403);

  // User endpoints are scoped too.
  const userOther = await req("POST", h.baseUrl, "/api/v1/users", h.scopedCred, {
    organizationId: "org-b",
    email: "x@b.jp",
    displayName: "X",
    roleIds: [],
  });
  assert.equal(userOther.status, 403);
  const users = await req("GET", h.baseUrl, "/api/v1/users", h.scopedCred);
  assert.equal((users.body as { users: unknown[] }).users.length, 0);
});

test("tenant-scope: JWT carries organization scope and dashboard is filtered", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  await req("POST", h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: "org-a",
    kind: "tablet",
    status: "active",
  });
  await req("POST", h.baseUrl, "/api/v1/devices", h.adminCred, {
    organizationId: "org-b",
    kind: "kiosk",
    status: "active",
  });

  const tokenRes = await req("POST", h.baseUrl, "/api/v1/auth/token", null, {
    credential: h.scopedCred,
  });
  const token = (tokenRes.body as { token: string }).token;
  const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
  assert.equal(payload.organizationId, "org-a");

  const dash = await req("GET", h.baseUrl, "/api/v1/dashboard", token);
  const view = dash.body as {
    governance: { visibleDevices: number; totalUsers: number };
  };
  assert.equal(view.governance.visibleDevices, 1);
});

test("tenant-scope: role/user grants cannot escalate beyond grantor permissions", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  // Escalator cannot create a *:* role.
  const starRole = await req("POST", h.baseUrl, "/api/v1/roles", h.escalatorCred, {
    name: "Shadow Admin",
    permissions: ["*:*"],
  });
  assert.equal(starRole.status, 403);

  // But can create a role with permissions it holds.
  const okRole = await req("POST", h.baseUrl, "/api/v1/roles", h.escalatorCred, {
    name: "Reader",
    permissions: ["user:read"],
  });
  assert.equal(okRole.status, 201);
  const readerRoleId = (okRole.body as { id: string }).id;

  // Upgrading that role beyond grantor permissions is rejected.
  const upgrade = await req("PUT", h.baseUrl, `/api/v1/roles/${readerRoleId}`, h.escalatorCred, {
    permissions: ["user:read", "device:write"],
  });
  assert.equal(upgrade.status, 403);

  // Assigning a covered role to a user is fine.
  const user = await req("POST", h.baseUrl, "/api/v1/users", h.escalatorCred, {
    organizationId: "org-a",
    email: "escalatee@a.jp",
    displayName: "Escalatee",
    roleIds: [readerRoleId],
  });
  assert.equal(user.status, 201);

  // Global admin creates a high-privilege role; escalator cannot assign it.
  const adminRole = await req("POST", h.baseUrl, "/api/v1/roles", h.adminCred, {
    name: "Device Admin",
    permissions: ["device:write"],
  });
  const deviceRoleId = (adminRole.body as { id: string }).id;
  const userId = (user.body as { id: string }).id;
  const badAssign = await req("PUT", h.baseUrl, `/api/v1/users/${userId}`, h.escalatorCred, {
    roleIds: [readerRoleId, deviceRoleId],
  });
  assert.equal(badAssign.status, 403);
});
