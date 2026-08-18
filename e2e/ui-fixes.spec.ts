/**
 * Browser E2E — v0.14.1 UI fixes:
 *   1. /portal uses the left-sidebar + right-content layout (was card-only page)
 *   2. ISO sidebar links (/iso-app#quality etc.) switch the right-hand tab
 *   3. Every screen's sidebar has the ⚙️ システム設定 group
 */

import { test, expect } from "@playwright/test";

const ADMIN_CRED = "e2e-admin:e2e-secret";

test("portal has sidebar + main layout with module cards", async ({ page }) => {
  await page.goto("/portal");
  // Sidebar with the standard groups
  await expect(page.locator("nav.sidebar")).toBeVisible();
  await expect(page.locator(".nav-group__summary")).toContainText(["🏠 メインメニュー"]);
  await expect(page.locator(".nav-group__summary")).toContainText(["⚙️ システム設定"]);
  // Right-hand content: module cards
  await expect(page.locator(".portal-grid")).toBeVisible();
  await expect(page.locator(".portal-card")).toHaveCount(8);
  await expect(page.locator("main.main")).toContainText("モジュール一覧");
  // Cards link to modules
  await expect(page.locator('.portal-card[href="/dashboard"]')).toBeVisible();
  await expect(page.locator('.portal-card[href="/mvp-app"]')).toBeVisible();
  await expect(page.locator('.portal-card[href="/system"]')).toBeVisible();
});

test("ISO 統合マネジメント sidebar links switch the right-hand tab", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/iso-app");
  await page.waitForTimeout(600);
  // Default tab is analytics.
  await expect(page.locator("#pageTitle")).toContainText("分析");

  // The 📋 ISO 統合マネジメント group is open by default; click 品質 (ISO 9001).
  await page.locator('a[href="/iso-app#quality"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("品質");
  await expect(page.locator("#recordsSection")).toBeVisible();

  // Click 安全 (ISO 45001).
  await page.locator('a[href="/iso-app#safety"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("安全");

  // Click 分析 to return.
  await page.locator('a[href="/iso-app#analytics"]').first().click();
  await page.waitForTimeout(600);
  await expect(page.locator("#pageTitle")).toContainText("分析");
  await context.close();
});

test("system settings group is present and opens on every screen", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  for (const path of ["/dashboard", "/governance", "/daily-reports", "/iso-app", "/mvp-app"]) {
    await page.goto(path);
    await page.waitForTimeout(400);
    await expect(
      page.locator('.nav-group__summary:has-text("システム設定")'),
      `system settings group on ${path}`,
    ).toBeVisible();
    // Open the group and confirm the system-settings link is reachable.
    await page.locator('.nav-group__summary:has-text("システム設定")').first().click();
    await expect(
      page.locator('.nav-group__body a[href="/system#info"]'),
      `system link on ${path}`,
    ).toBeVisible();
  }
  await context.close();
});
