/**
 * Browser E2E — v0.14.3 fixes:
 *   1. ISO 統合マネジメント sidebar clicks always switch the right-hand tab
 *   2. System settings (/system) renders readable content (no raw JSON/403)
 *   3. Each migrated domain shows 10 dummy records
 */

import { test, expect } from "@playwright/test";

const ADMIN_CRED = "e2e-admin:e2e-secret";

test("ISO 統合マネジメント sidebar items switch the right-hand tab", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/iso-app");
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("分析");

  // Click 品質 from the 📋 ISO 統合マネジメント group.
  await page.locator('a[href="/iso-app#quality"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("品質");
  await expect(page.locator("#recordsSection")).toBeVisible();

  // Click 環境.
  await page.locator('a[href="/iso-app#environment"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("環境");

  // Click 分析 back.
  await page.locator('a[href="/iso-app#analytics"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("分析");
  await context.close();
});

test("system settings page renders readable content instead of raw API", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/system");
  await page.waitForTimeout(800);
  // Platform info section visible with version.
  await expect(page.locator("#infoSection")).toBeVisible();
  await expect(page.locator("#infoBody")).toContainText("construction-eop");
  await expect(page.locator("#infoBody")).toContainText("0.14.3");

  // API keys tab: org-scoped admin sees a readable notice (not a 403 JSON dump).
  await page.locator('a[href="#keys"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#keysSection")).toBeVisible();
  await expect(page.locator("#keysBody")).toContainText(/プラットフォームレベル|API キー/);

  // Metrics tab renders a preview.
  await page.locator('a[href="#metrics"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#metricsSection")).toBeVisible();
  await expect(page.locator("#metricsPreview")).toBeVisible();
  await context.close();
});

test("migrated domains each show 10 dummy records in the console", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/mvp-app");
  await page.waitForTimeout(800);
  const count_workOrdersBody = await page.locator("#workOrdersBody tr").count();
  expect(count_workOrdersBody).toBeGreaterThanOrEqual(10);
  const count_inspectionsBody = await page.locator("#inspectionsBody tr").count();
  expect(count_inspectionsBody).toBeGreaterThanOrEqual(10);
  const count_suppliersBody = await page.locator("#suppliersBody tr").count();
  expect(count_suppliersBody).toBeGreaterThanOrEqual(10);
  const count_objectivesBody = await page.locator("#objectivesBody tr").count();
  expect(count_objectivesBody).toBeGreaterThanOrEqual(10);
  const count_risksBody = await page.locator("#risksBody tr").count();
  expect(count_risksBody).toBeGreaterThanOrEqual(10);
  const count_reviewsBody = await page.locator("#reviewsBody tr").count();
  expect(count_reviewsBody).toBeGreaterThanOrEqual(10);

  await page.locator('button[data-tab="ai-build"]').click();
  const count_aiBuildBody = await page.locator("#aiBuildBody tr").count();
  expect(count_aiBuildBody).toBeGreaterThanOrEqual(10);

  await page.locator('button[data-tab="dx-portfolio"]').click();
  const count_dxProjectsBody = await page.locator("#dxProjectsBody tr").count();
  expect(count_dxProjectsBody).toBeGreaterThanOrEqual(10);

  await page.locator('button[data-tab="photo-logger"]').click();
  const count_photoLogsBody = await page.locator("#photoLogsBody tr").count();
  expect(count_photoLogsBody).toBeGreaterThanOrEqual(10);
  await context.close();
});
