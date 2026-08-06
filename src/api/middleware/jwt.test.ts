/**
 * Unit tests for the HS256 JWT issuer/verifier.
 */

import { createHmac } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createJwtIssuer, generateJwtSecret } from "./jwt.ts";
import type { Permission } from "../../domain/role.ts";

const PERMS: readonly Permission[] = ["application:read" as Permission, "device:read" as Permission];

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test("jwt: issue produces a 3-part base64url token", () => {
  const issuer = createJwtIssuer({ secret: generateJwtSecret() });
  const token = issuer.issue("user-1", PERMS);
  const parts = token.split(".");
  assert.equal(parts.length, 3);
  // Each part must be non-empty base64url characters only.
  const b64url = /^[A-Za-z0-9_-]+$/;
  for (const p of parts) {
    assert.ok(b64url.test(p), `part "${p}" not base64url`);
  }
});

test("jwt: verify returns ok=true for a freshly issued token", () => {
  const secret = generateJwtSecret();
  const issuer = createJwtIssuer({ secret });
  const token = issuer.issue("user-alice", PERMS);
  const result = issuer.verify(token);
  assert.ok(result.ok);
  assert.equal(result.payload.sub, "user-alice");
  assert.deepEqual(result.payload.permissions, [...PERMS]);
});

test("jwt: payload contains iat, exp, jti claims", () => {
  const issuer = createJwtIssuer({ secret: generateJwtSecret(), ttlSeconds: 300 });
  const before = Math.floor(Date.now() / 1000);
  const token = issuer.issue("u", PERMS);
  const after = Math.floor(Date.now() / 1000);
  const result = issuer.verify(token);
  assert.ok(result.ok);
  const { iat, exp, jti } = result.payload;
  assert.ok(iat >= before && iat <= after, "iat should be current time");
  assert.equal(exp, iat + 300, "exp should be iat + ttlSeconds");
  assert.equal(typeof jti, "string");
  assert.ok(jti.length > 0);
});

test("jwt: two tokens issued for the same subject have different jti", () => {
  const issuer = createJwtIssuer({ secret: generateJwtSecret() });
  const t1 = issuer.issue("u", PERMS);
  const t2 = issuer.issue("u", PERMS);
  const r1 = issuer.verify(t1);
  const r2 = issuer.verify(t2);
  assert.ok(r1.ok && r2.ok);
  assert.notEqual(r1.payload.jti, r2.payload.jti);
});

// ---------------------------------------------------------------------------
// Negative cases
// ---------------------------------------------------------------------------

test("jwt: verify rejects token signed with wrong secret", () => {
  const issuer = createJwtIssuer({ secret: generateJwtSecret() });
  const other = createJwtIssuer({ secret: generateJwtSecret() });
  const token = issuer.issue("u", PERMS);
  const result = other.verify(token);
  assert.ok(!result.ok);
  assert.equal(result.reason, "invalid");
});

test("jwt: verify rejects expired token", () => {
  // Manually craft a well-signed JWT with a past exp — avoids ttlSeconds=0 which is now rejected.
  const secret = generateJwtSecret();
  const issuer = createJwtIssuer({ secret, ttlSeconds: 3600 });
  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "u", permissions: [], iat: nowSec - 7200, exp: nowSec - 3600, jti: "test-expired" }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  const result = issuer.verify(`${header}.${payload}.${sig}`);
  assert.ok(!result.ok);
  assert.equal(result.reason, "expired");
});

test("jwt: verify rejects malformed token (2 parts)", () => {
  const issuer = createJwtIssuer({ secret: generateJwtSecret() });
  const result = issuer.verify("header.payload");
  assert.ok(!result.ok);
  assert.equal(result.reason, "malformed");
});

test("jwt: verify rejects tampered payload", () => {
  const secret = generateJwtSecret();
  const issuer = createJwtIssuer({ secret });
  const token = issuer.issue("user-alice", PERMS);
  const [header, , sig] = token.split(".");
  // Replace payload with one claiming admin subject.
  const fakePay = Buffer.from(
    JSON.stringify({ sub: "user-admin", permissions: ["*:*"], iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, jti: "fake" }),
  ).toString("base64url");
  const tampered = `${header}.${fakePay}.${sig}`;
  const result = issuer.verify(tampered);
  assert.ok(!result.ok);
  assert.equal(result.reason, "invalid");
});

test("jwt: verify rejects token where iat >= exp", () => {
  const secret = generateJwtSecret();
  const issuer = createJwtIssuer({ secret, ttlSeconds: 3600 });
  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "u",
      permissions: [],
      iat: nowSec + 3600,
      exp: nowSec,
      jti: "test-iat-gte-exp",
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  const result = issuer.verify(`${header}.${payload}.${sig}`);
  assert.ok(!result.ok);
  assert.equal(result.reason, "malformed");
});

test("jwt: verify rejects empty string", () => {
  const issuer = createJwtIssuer({ secret: generateJwtSecret() });
  const result = issuer.verify("");
  assert.ok(!result.ok);
  assert.equal(result.reason, "malformed");
});

// ---------------------------------------------------------------------------
// generateJwtSecret
// ---------------------------------------------------------------------------

test("generateJwtSecret: returns a 96-character hex string (48 bytes)", () => {
  const secret = generateJwtSecret();
  assert.equal(typeof secret, "string");
  assert.equal(secret.length, 96);
  assert.match(secret, /^[0-9a-f]+$/);
});

test("generateJwtSecret: each call produces a unique secret", () => {
  const s1 = generateJwtSecret();
  const s2 = generateJwtSecret();
  assert.notEqual(s1, s2);
});
