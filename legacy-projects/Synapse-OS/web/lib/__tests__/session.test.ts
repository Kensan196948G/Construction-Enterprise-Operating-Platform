import { describe, it, expect, vi } from "vitest";
import { SignJWT } from "jose";

// session.ts imports `cookies` from next/headers at module top; stub it so the
// module loads under the node test environment. These tests target verifyToken
// (pure JWT verification) and the shared cookieOptions, not cookie I/O.
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
}));

import { verifyToken, cookieOptions, SESSION_COOKIE } from "@/lib/session";

// Must match the dev default in session.ts (process.env.JWT_SECRET unset in CI).
const SECRET = new TextEncoder().encode(
  "synapse-dev-secret-change-in-production",
);

function sign(
  claims: Record<string, unknown>,
  expSecondsFromNow: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expSecondsFromNow)
    .sign(SECRET);
}

describe("verifyToken (JWT signature + expiry)", () => {
  it("returns the payload for a valid, unexpired, correctly-signed token", async () => {
    const token = await sign({ sub: "u1", tenant_id: "demo" }, 3600);
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("u1");
    expect(payload?.tenant_id).toBe("demo");
  });

  it("returns null for a token signed with the wrong secret", async () => {
    const wrong = new TextEncoder().encode("attacker-secret");
    const token = await new SignJWT({ sub: "u1" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(wrong);
    expect(await verifyToken(token)).toBeNull();
  });

  it("returns null for an expired token", async () => {
    const token = await sign({ sub: "u1" }, -3600);
    expect(await verifyToken(token)).toBeNull();
  });

  it("returns null for malformed / missing tokens", async () => {
    expect(await verifyToken("not.a.jwt")).toBeNull();
    expect(await verifyToken("")).toBeNull();
    expect(await verifyToken(null)).toBeNull();
    expect(await verifyToken(undefined)).toBeNull();
  });
});

describe("cookieOptions (session cookie hardening)", () => {
  it("is httpOnly, SameSite=Strict, path-scoped and short-lived", () => {
    expect(cookieOptions.httpOnly).toBe(true);
    expect(cookieOptions.sameSite).toBe("strict");
    expect(cookieOptions.path).toBe("/");
    expect(cookieOptions.maxAge).toBe(15 * 60);
  });

  it("only sets the Secure flag in production", () => {
    // NODE_ENV is "test" under vitest, so Secure must be false here.
    expect(cookieOptions.secure).toBe(false);
  });
});

describe("SESSION_COOKIE", () => {
  it("has the expected stable name", () => {
    expect(SESSION_COOKIE).toBe("synapse_session");
  });
});
