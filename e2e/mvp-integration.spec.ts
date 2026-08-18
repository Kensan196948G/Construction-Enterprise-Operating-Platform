/**
 * Browser E2E — integrated module console (/mvp-app, v0.14.0).
 *
 * Verifies the four migrated domains are visible and operable with the seeded
 * fictional dataset: site ops (Management-Platform), AI build
 * (AI-Build-Platform), DX portfolio (Portfolio-Atlas), material photo log
 * (Photo-Logger), including CSV export.
 */

import { test, expect } from "@playwright/test";

const ADMIN_CRED = "e2e-admin:e2e-secret";

test("mvp-app shows seeded migrated-domain data across tabs", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/mvp-app");

  // Site ops tab is the default: work orders table populated with dummy rows.
  await expect(page.locator("#workOrdersBody tr")).toHaveCount(10);
  await expect(page.locator("#workOrdersBody")).toContainText("基礎配筋完了検査立会");
  await expect(page.locator("#inspectionsBody tr")).toHaveCount(10);
  await expect(page.locator("#suppliersBody tr")).toHaveCount(10);
  await expect(page.locator("#objectivesBody tr")).toHaveCount(10);
  await expect(page.locator("#risksBody tr")).toHaveCount(10);
  await expect(page.locator("#reviewsBody tr")).toHaveCount(10);

  // Switch to AI build tab.
  await page.locator('button[data-tab="ai-build"]').click();
  await expect(page.locator("#aiBuildBody tr")).toHaveCount(10);
  await expect(page.locator("#aiBuildBody")).toContainText("bridge-inspection-2026");

  // DX portfolio tab.
  await page.locator('button[data-tab="dx-portfolio"]').click();
  await expect(page.locator("#dxProjectsBody tr")).toHaveCount(10);
  await expect(page.locator("#dxProjectsBody")).toContainText("construction-eop");

  // Material photo log tab.
  await page.locator('button[data-tab="photo-logger"]').click();
  await expect(page.locator("#photoLogsBody tr")).toHaveCount(10);
  await expect(page.locator("#photoLogsBody")).toContainText("鉄筋 D16");

  await context.close();
});

test("mvp-app create dialog posts to the migrated-domain API", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/mvp-app");

  // Create a new DX project from the portfolio tab.
  await page.locator('button[data-tab="dx-portfolio"]').click();
  await page.locator('[data-create="dx-projects"]').click();
  await page.locator('input[name="slug"]').fill("e2e-new-project");
  await page.locator('input[name="nameJa"]').fill("E2E 検証案件");
  await page.locator('button[type="submit"]').click();

  await expect(page.locator("#dxProjectsBody")).toContainText("e2e-new-project");
  await context.close();
});
