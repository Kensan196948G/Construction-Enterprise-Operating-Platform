/**
 * Browser E2E — v0.14.4: ISO sidebar groups unified into one.
 *
 * The 📋 ISO 統合マネジメント group now contains all 10 items
 * (分析 / 品質 / 環境 / 安全 / 資産 / BIM / 監査 / ISMS / 事業継続 / 連携先)
 * and the redundant 🗂️ ISO 管理コンソール group is removed everywhere.
 */

import { test, expect } from "@playwright/test";

const ADMIN_CRED = "e2e-admin:e2e-secret";

test("ISO 統合マネジメント is the single group with 10 items", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  for (const path of ["/iso-app", "/dashboard"]) {
    await page.goto(path);
    await page.waitForTimeout(500);
    // The console group is gone.
    await expect(
      page.locator('.nav-group__summary:has-text("ISO 管理コンソール")'),
      `no console group on ${path}`,
    ).toHaveCount(0);
    // The unified group has 10 items (9 standards + integrations).
    const isoGroup = page
      .locator('details.nav-group:has(summary:has-text("ISO 統合マネジメント"))')
      .first();
    await expect(isoGroup.locator("a.nav-item"), `10 items on ${path}`).toHaveCount(10);
    await expect(isoGroup).toContainText("連携先システム");
    await expect(isoGroup).toContainText("品質");
    await expect(isoGroup).toContainText("事業継続");
  }
  await context.close();
});

test("unified ISO group switches tabs on the ISO console", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/iso-app");
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("分析");

  // 連携先システム tab (was only in the removed console group).
  await page.locator('.iso-tab[data-tab="integrations"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("連携先システム");
  await expect(page.locator("#integrationsSection")).toBeVisible();

  // 品質 tab.
  await page.locator('.iso-tab[data-tab="quality"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("品質");
  await expect(page.locator("#recordsSection")).toBeVisible();
  await context.close();
});
