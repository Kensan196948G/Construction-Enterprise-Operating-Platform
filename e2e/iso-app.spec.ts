/**
 * Browser E2E — ISO 統合マネジメントコンソール（/iso-app）。
 */

import { test, expect } from "@playwright/test";

const E2E_CRED = "e2e-admin:e2e-secret";

test("ISO console rejects anonymous access", async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("/iso-app");
  // Demo mode redirects unauthenticated browser loads to the demo login page.
  await expect(page).toHaveURL(/\/demo-login/);
  await page.close();
});

test("ISO console renders analytics, CRUD, and integration contracts", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${E2E_CRED}` },
  });
  const page = await context.newPage();

  await page.goto("/iso-app");
  await expect(page.locator("#pageTitle")).toHaveText("ISO 分析ダッシュボード");
  await expect(page.locator("#isoAnalyticsGrid .stat-card").first()).toBeVisible();

  // 品質タブで新規レコード作成（プロジェクト ID は ISO レコードの参照として使用）
  await page.click('[data-tab="quality"]');
  await expect(page.locator("#recordsSection")).toBeVisible();
  await page.click("#isoNewBtn");
  await page.selectOption("#isoFormKind", "quality-plan");
  await page.fill("#isoFormTitle", "E2E 品質計画");
  await page.fill("#isoFormProjectId", "project-e2e");
  await page.fill("#isoFormPayload", '{"planNo":"E2E-QP-1"}');
  await page.click("#isoDialogSave");
  await expect(page.locator("#isoTableBody")).toContainText("E2E 品質計画");

  // 状態遷移（レビュー提出）→ under_review
  const row = page.locator("#isoTableBody tr", { hasText: "E2E 品質計画" });
  await row.locator("[data-action]").first().click();
  await page.selectOption("#isoActionSelect", "submit-review");
  await page.click("#isoActionApply");
  await expect(row).toContainText("under_review");

  // 分析タブに件数が反映される
  await page.click('[data-tab="analytics"]');
  await expect(page.locator("#isoAnalyticsGrid")).toContainText("品質計画");

  // 連携タブに6システム契約が表示される
  await page.click('[data-tab="integrations"]');
  await expect(page.locator("#contractsBody")).toContainText("4D工程");
  await expect(page.locator("#contractsBody .cell-strong")).toHaveCount(6);

  await context.close();
});
