/** Unit tests for the AI build project domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AI_BUILD_PROJECT_STATUSES,
  createAiBuildProject,
  updateAiBuildProject,
} from "./ai-build-project.ts";

const NOW = "2026-08-10T08:00:00.000Z";

test("ai build project creates with defaults", () => {
  const r = createAiBuildProject({
    id: "ab-1",
    organizationId: "org",
    name: "bridge-inspection",
    theme: "橋梁点検の DX",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.status, "generated");
  assert.equal(r.value.templateVersion, "1.0.0");
  assert.equal(r.value.placeholderChecked, false);
  assert.equal(r.value.generatedAt, NOW);
});

test("ai build project accepts all statuses", () => {
  for (const status of AI_BUILD_PROJECT_STATUSES) {
    const r = createAiBuildProject({
      id: `ab-${status}`,
      organizationId: "org",
      name: "x",
      theme: "t",
      status,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${status} should be valid`);
  }
});

test("ai build project validates required fields and version", () => {
  assert.ok(
    !createAiBuildProject({
      id: "",
      organizationId: "org",
      name: "x",
      theme: "t",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createAiBuildProject({
      id: "a",
      organizationId: "org",
      name: "",
      theme: "t",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createAiBuildProject({
      id: "a",
      organizationId: "org",
      name: "x",
      theme: "",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createAiBuildProject({
      id: "a",
      organizationId: "org",
      name: "x",
      theme: "t",
      templateVersion: "bad version!",
      createdAt: NOW as never,
    }).ok,
  );
});

test("ai build project keeps optional fields", () => {
  const r = createAiBuildProject({
    id: "ab-2",
    organizationId: "org",
    projectId: "p-1",
    name: "asphalt",
    theme: "舗装 DX",
    purpose: "PoC",
    scope: "記録",
    targetUsers: "監督",
    templateVersion: "1.1.0",
    status: "archived",
    placeholderChecked: true,
    generatedAt: "2026-08-11T09:00:00.000Z" as never,
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.projectId, "p-1");
  assert.equal(r.value.status, "archived");
  assert.equal(r.value.placeholderChecked, true);
});

test("ai build project update merges", () => {
  const base = createAiBuildProject({
    id: "ab-1",
    organizationId: "org",
    name: "bridge",
    theme: "t",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateAiBuildProject(base.value, {
    status: "restored",
    placeholderChecked: true,
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.status, "restored");
  assert.equal(updated.value.placeholderChecked, true);
});

test("ai build project update rejects invalid", () => {
  const base = createAiBuildProject({
    id: "ab-1",
    organizationId: "org",
    name: "x",
    theme: "t",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(
    !updateAiBuildProject(base.value, { status: "bogus" as never, updatedAt: NOW as never }).ok,
  );
  assert.ok(!updateAiBuildProject(base.value, { name: "", updatedAt: NOW as never }).ok);
});
