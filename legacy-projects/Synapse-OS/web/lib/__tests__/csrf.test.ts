import { describe, it, expect } from "vitest";
import { isSameOrigin } from "@/lib/csrf";

const EXPECTED = "https://app.synapse.local";

describe("isSameOrigin (CSRF same-origin gate)", () => {
  it("accepts a matching Origin header", () => {
    expect(isSameOrigin(EXPECTED, null, EXPECTED)).toBe(true);
  });

  it("rejects a mismatched Origin header", () => {
    expect(isSameOrigin("https://evil.com", null, EXPECTED)).toBe(false);
  });

  it("prefers Origin over Referer (mismatched Origin loses even with good Referer)", () => {
    expect(isSameOrigin("https://evil.com", `${EXPECTED}/x`, EXPECTED)).toBe(
      false,
    );
  });

  it("falls back to Referer origin when Origin is absent", () => {
    expect(isSameOrigin(null, `${EXPECTED}/some/path`, EXPECTED)).toBe(true);
    expect(isSameOrigin(null, "https://evil.com/x", EXPECTED)).toBe(false);
  });

  it("rejects a malformed Referer rather than failing open", () => {
    expect(isSameOrigin(null, "not-a-url", EXPECTED)).toBe(false);
  });

  it("fails closed when neither Origin nor Referer is present", () => {
    expect(isSameOrigin(null, null, EXPECTED)).toBe(false);
  });
});
