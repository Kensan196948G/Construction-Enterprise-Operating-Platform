import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { PLATFORM_VERSION } from "./version.ts";

test("PLATFORM_VERSION matches package.json version", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { version: string };
  assert.equal(PLATFORM_VERSION, pkg.version);
  assert.match(PLATFORM_VERSION, /^\d+\.\d+\.\d+$/);
});
