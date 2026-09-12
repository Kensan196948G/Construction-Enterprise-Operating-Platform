import assert from "node:assert/strict";
import { test } from "node:test";
import { scanStaticSecurity } from "../../scripts/static-security-scan.ts";

test("QA-SEC-001: production TypeScript contains no prohibited dangerous primitives", () => {
  assert.deepEqual(scanStaticSecurity(process.cwd()), []);
});
