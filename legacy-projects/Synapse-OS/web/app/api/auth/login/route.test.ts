import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Create the cookies spy before vi.mock factories run
const { mockCookiesSet } = vi.hoisted(() => ({
  mockCookiesSet: vi.fn(),
}));

// Mock next/server: return plain objects so we can inspect .body and .status
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      cookies: { set: mockCookiesSet },
    }),
  },
}));

vi.mock("@/lib/api", () => ({ AUTH_API: "http://test-auth:8001" }));

vi.mock("@/lib/session", () => ({
  SESSION_COOKIE: "synapse_session",
  cookieOptions: { httpOnly: true, sameSite: "strict" as const, maxAge: 900 },
}));

import { POST } from "./route";

const AUTH_BASE = "http://test-auth:8001";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function okTokenRes(token = "test-jwt"): Response {
  return {
    ok: true,
    json: async () => ({ access_token: token, token_type: "bearer" }),
  } as unknown as Response;
}

function okMeRes(
  user = { username: "admin", tenant_id: "t1", role: "admin" },
): Response {
  return { ok: true, json: async () => user } as unknown as Response;
}

describe("POST /api/auth/login", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    mockCookiesSet.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200: sets session cookie and returns user on valid credentials", async () => {
    mockFetch
      .mockResolvedValueOnce(okTokenRes())
      .mockResolvedValueOnce(okMeRes());

    const res = await POST(
      makeRequest({ username: "admin", password: "secret" }),
    );

    expect(res.status).toBe(200);
    expect((res as any).body).toEqual({
      ok: true,
      user: { username: "admin", tenant_id: "t1", role: "admin" },
    });
    expect(mockCookiesSet).toHaveBeenCalledWith(
      "synapse_session",
      "test-jwt",
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("calls /auth/token with form-encoded credentials", async () => {
    mockFetch
      .mockResolvedValueOnce(okTokenRes())
      .mockResolvedValueOnce(okMeRes());

    await POST(makeRequest({ username: "alice", password: "pw123" }));

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `${AUTH_BASE}/auth/token`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "username=alice&password=pw123",
      }),
    );
  });

  it("400: missing username", async () => {
    const res = await POST(makeRequest({ password: "secret" }));
    expect(res.status).toBe(400);
    expect((res as any).body).toMatchObject({
      error: expect.stringContaining("required"),
    });
  });

  it("400: missing password", async () => {
    const res = await POST(makeRequest({ username: "admin" }));
    expect(res.status).toBe(400);
    expect((res as any).body).toMatchObject({
      error: expect.stringContaining("required"),
    });
  });

  it("400: invalid JSON body", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((res as any).body).toMatchObject({ error: "Invalid request body" });
  });

  it("401: upstream rejects credentials", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    const res = await POST(makeRequest({ username: "admin", password: "bad" }));
    expect(res.status).toBe(401);
    expect((res as any).body).toMatchObject({ error: "Invalid credentials" });
  });

  it("503: auth service unreachable (fetch throws)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const res = await POST(
      makeRequest({ username: "admin", password: "secret" }),
    );
    expect(res.status).toBe(503);
    expect((res as any).body).toMatchObject({
      error: "Auth service unreachable",
    });
  });

  it("200 with null user when /auth/me fails (non-critical path)", async () => {
    mockFetch
      .mockResolvedValueOnce(okTokenRes("tok-xyz"))
      .mockRejectedValueOnce(new Error("me endpoint down"));

    const res = await POST(
      makeRequest({ username: "admin", password: "secret" }),
    );
    expect(res.status).toBe(200);
    expect((res as any).body).toMatchObject({ ok: true, user: null });
    // Cookie must still be set even if /auth/me fails
    expect(mockCookiesSet).toHaveBeenCalledWith(
      "synapse_session",
      "tok-xyz",
      expect.anything(),
    );
  });

  it("200 with null user when /auth/me responds non-OK without throwing", async () => {
    mockFetch
      .mockResolvedValueOnce(okTokenRes("tok-nonok"))
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response);

    const res = await POST(
      makeRequest({ username: "admin", password: "secret" }),
    );
    expect(res.status).toBe(200);
    expect((res as any).body).toMatchObject({ ok: true, user: null });
    expect(mockCookiesSet).toHaveBeenCalledWith(
      "synapse_session",
      "tok-nonok",
      expect.anything(),
    );
  });
});
