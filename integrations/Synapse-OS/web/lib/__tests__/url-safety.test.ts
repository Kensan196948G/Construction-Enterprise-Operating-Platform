import { describe, it, expect } from "vitest";
import { safeNextPath } from "@/lib/url-safety";

describe("safeNextPath (open-redirect defense)", () => {
  it("returns '/' for null/empty input", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it("passes through legitimate same-origin relative paths", () => {
    expect(safeNextPath("/")).toBe("/");
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/issues?status=open")).toBe("/issues?status=open");
    expect(safeNextPath("/a/b/c")).toBe("/a/b/c");
  });

  it("rejects protocol-relative URLs (//host)", () => {
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("//evil.com/path")).toBe("/");
  });

  it("rejects backslash tricks (/\\host)", () => {
    expect(safeNextPath("/\\evil.com")).toBe("/");
  });

  it("rejects absolute URLs and dangerous schemes", () => {
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("http://evil.com")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
    expect(safeNextPath("data:text/html,x")).toBe("/");
  });

  it("rejects bare relative paths that do not start with '/'", () => {
    expect(safeNextPath("dashboard")).toBe("/");
    expect(safeNextPath("../etc")).toBe("/");
  });
});
