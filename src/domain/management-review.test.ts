/** Unit tests for the management review domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MANAGEMENT_REVIEW_STATUSES,
  createManagementReview,
  updateManagementReview,
} from "./management-review.ts";

const NOW = "2026-08-10T08:00:00.000Z";

test("management review creates with defaults", () => {
  const r = createManagementReview({
    id: "mr-1",
    organizationId: "org",
    title: "Q1 レビュー",
    reviewDate: "2026-07-10",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.status, "scheduled");
});

test("management review accepts all statuses", () => {
  for (const status of MANAGEMENT_REVIEW_STATUSES) {
    const r = createManagementReview({
      id: `mr-${status}`,
      organizationId: "org",
      title: "x",
      status,
      reviewDate: "2026-07-10",
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${status} should be valid`);
  }
});

test("management review validates required fields and dates", () => {
  assert.ok(
    !createManagementReview({
      id: "",
      organizationId: "org",
      title: "x",
      reviewDate: "2026-07-10",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createManagementReview({
      id: "m",
      organizationId: "org",
      title: "",
      reviewDate: "2026-07-10",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createManagementReview({
      id: "m",
      organizationId: "org",
      title: "x",
      reviewDate: "",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createManagementReview({
      id: "m",
      organizationId: "org",
      title: "x",
      reviewDate: "2026/07/10",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createManagementReview({
      id: "m",
      organizationId: "org",
      title: "x",
      reviewDate: "2026-07-10",
      nextReviewDate: "bad",
      createdAt: NOW as never,
    }).ok,
  );
});

test("management review keeps optional fields", () => {
  const r = createManagementReview({
    id: "mr-2",
    organizationId: "org",
    title: "レビュー",
    status: "completed",
    reviewDate: "2026-07-10",
    nextReviewDate: "2026-10-10",
    agenda: "議題",
    outcomes: "結論",
    isoClause: "9.3",
    facilitatorId: "user-1",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.outcomes, "結論");
  assert.equal(r.value.nextReviewDate, "2026-10-10");
});

test("management review update merges", () => {
  const base = createManagementReview({
    id: "mr-1",
    organizationId: "org",
    title: "Q1 レビュー",
    reviewDate: "2026-07-10",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateManagementReview(base.value, {
    status: "completed",
    outcomes: "決定事項",
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.status, "completed");
  assert.equal(updated.value.outcomes, "決定事項");
});

test("management review update rejects invalid", () => {
  const base = createManagementReview({
    id: "mr-1",
    organizationId: "org",
    title: "x",
    reviewDate: "2026-07-10",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(
    !updateManagementReview(base.value, { status: "bogus" as never, updatedAt: NOW as never }).ok,
  );
  assert.ok(!updateManagementReview(base.value, { reviewDate: "bad", updatedAt: NOW as never }).ok);
});
