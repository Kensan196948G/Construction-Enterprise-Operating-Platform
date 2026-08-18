/** Unit tests for the DX project portfolio domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DX_LIFECYCLE_STATES,
  DX_PORTFOLIO_TYPES,
  createDxProject,
  updateDxProject,
} from "./dx-project.ts";

const NOW = "2026-08-10T08:00:00.000Z";

test("dx project creates with defaults", () => {
  const r = createDxProject({
    id: "dx-1",
    organizationId: "org",
    slug: "construction-eop",
    nameJa: "建設企業基盤",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.portfolioType, "unclassified");
  assert.equal(r.value.companyAssetUse, "review");
  assert.equal(r.value.lifecycleState, "planning");
  assert.equal(r.value.importance, 3);
});

test("dx project accepts all lifecycle states and portfolio types", () => {
  for (const state of DX_LIFECYCLE_STATES) {
    const r = createDxProject({
      id: `dx-s-${state}`,
      organizationId: "org",
      slug: `slug-${state.replace(/_/g, "-")}`,
      nameJa: "x",
      lifecycleState: state,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${state} should be valid`);
  }
  for (const type of DX_PORTFOLIO_TYPES) {
    const r = createDxProject({
      id: `dx-t-${type}`,
      organizationId: "org",
      slug: `slug-${type}`,
      nameJa: "x",
      portfolioType: type,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${type} should be valid`);
  }
});

test("dx project validates slug, importance, progress", () => {
  assert.ok(
    !createDxProject({
      id: "d",
      organizationId: "org",
      slug: "Bad Slug!",
      nameJa: "x",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createDxProject({
      id: "d",
      organizationId: "org",
      slug: "ok",
      nameJa: "",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createDxProject({
      id: "d",
      organizationId: "org",
      slug: "ok",
      nameJa: "x",
      importance: 0,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createDxProject({
      id: "d",
      organizationId: "org",
      slug: "ok",
      nameJa: "x",
      importance: 6,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createDxProject({
      id: "d",
      organizationId: "org",
      slug: "ok",
      nameJa: "x",
      approvedProgress: 101,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createDxProject({
      id: "d",
      organizationId: "org",
      slug: "ok",
      nameJa: "x",
      nextReviewAt: "bad",
      createdAt: NOW as never,
    }).ok,
  );
});

test("dx project keeps optional fields", () => {
  const r = createDxProject({
    id: "dx-2",
    organizationId: "org",
    slug: "atlas",
    nameJa: "DX アトラス",
    nameEn: "DX Atlas",
    shortName: "Atlas",
    summary: "台帳",
    portfolioType: "internal",
    companyAssetUse: "yes",
    domainCode: "portfolio",
    lifecycleState: "production",
    importance: 5,
    ownerTeam: "IT-DX",
    approvedProgress: 90,
    progressMilestone: "v0.6",
    progressEvidenceUrl: "https://example.com",
    nextReviewAt: "2026-10-31",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.ownerTeam, "IT-DX");
  assert.equal(r.value.approvedProgress, 90);
});

test("dx project update merges", () => {
  const base = createDxProject({
    id: "dx-1",
    organizationId: "org",
    slug: "construction-eop",
    nameJa: "基盤",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateDxProject(base.value, {
    lifecycleState: "production",
    approvedProgress: 95,
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.lifecycleState, "production");
  assert.equal(updated.value.approvedProgress, 95);
});

test("dx project update rejects invalid", () => {
  const base = createDxProject({
    id: "dx-1",
    organizationId: "org",
    slug: "ok",
    nameJa: "x",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(
    !updateDxProject(base.value, { lifecycleState: "bogus" as never, updatedAt: NOW as never }).ok,
  );
  assert.ok(!updateDxProject(base.value, { importance: 9, updatedAt: NOW as never }).ok);
});
