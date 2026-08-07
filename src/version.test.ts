import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { PLATFORM_VERSION } from "./version.ts";

test("PLATFORM_VERSION matches package.json version", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  };
  assert.equal(PLATFORM_VERSION, pkg.version);
  assert.match(PLATFORM_VERSION, /^\d+\.\d+\.\d+$/);
});

test("PLATFORM_VERSION matches the Dockerfile image label", () => {
  // The published image carries its version as an OCI label, which is what
  // `docker inspect` and any registry UI report. It is the one copy of the
  // version that no build step derives from package.json, so without this
  // check a release can ship an image whose label disagrees with the code
  // running inside it — exactly the drift this test exists to catch.
  const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  const label = /org\.opencontainers\.image\.version="([^"]+)"/.exec(dockerfile);

  assert.ok(label, "Dockerfile must declare org.opencontainers.image.version");
  assert.equal(label[1], PLATFORM_VERSION);
});
