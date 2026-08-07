import { describe, it, expect } from "vitest";
import { isExemptPath, isPublicPath } from "@/lib/route-access";

describe("isExemptPath (framework/asset bypass)", () => {
  it("exempts static assets and the health probe", () => {
    expect(isExemptPath("/_next/static/chunk.js")).toBe(true);
    expect(isExemptPath("/favicon.ico")).toBe(true);
    expect(isExemptPath("/api/health")).toBe(true);
  });

  it("does NOT exempt protected application paths", () => {
    expect(isExemptPath("/")).toBe(false);
    expect(isExemptPath("/dashboard")).toBe(false);
    expect(isExemptPath("/api/auth/me")).toBe(false);
  });
});

describe("isPublicPath (unauthenticated app paths)", () => {
  it("treats login + auth endpoints as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login?next=/x")).toBe(true);
    expect(isPublicPath("/api/auth/login")).toBe(true);
    expect(isPublicPath("/api/auth/logout")).toBe(true);
  });

  it("treats everything else as protected (no auth bypass)", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/issues")).toBe(false);
    expect(isPublicPath("/api/auth/me")).toBe(false);
    expect(isPublicPath("/federation")).toBe(false);
  });
});
