/**
 * Browser E2E — Portal 入口・ダッシュボード・権限ゲート。
 *
 * Portal は認証不要の公開入口、ダッシュボードは認証必須、ISO コンソールは
 * iso:read 権限が無い viewer には 403 を返すことをブラウザ実操作で固定する。
 */

import { test, expect } from "@playwright/test";

const ADMIN_CRED = "e2e-admin:e2e-secret";
const VIEWER_CRED = "e2e-viewer:e2e-viewer-secret";

test("portal is public and lists every module", async ({ page }) => {
  await page.goto("/portal");
  await expect(page.locator("body")).toContainText("Construction Enterprise Operating Platform");
  await expect(page.locator("body")).toContainText("ダッシュボード");
  await expect(page.locator("body")).toContainText("ガバナンス");
  await expect(page.locator("body")).toContainText("ISO 統合マネジメント");
  await expect(page.locator("body")).toContainText("Prometheus メトリクス");
});

test("dashboard rejects anonymous access", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.locator("body")).toContainText(/Unauthorized|401/);
});

test("dashboard renders KPI cards and app grid for authenticated admin", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/dashboard");
  await expect(page.locator("#statTotalUsers")).toHaveText(/^\d+$/);
  await expect(page.locator("#statApps")).toHaveText(/^\d+$/);
  await expect(page.locator("#appGrid")).toBeVisible();
  await expect(page.locator("#audit")).toBeVisible();
  await context.close();
});

test("viewer credential cannot open the ISO console", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${VIEWER_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/iso-app");
  await expect(page.locator("body")).toContainText(/Forbidden|403/);
  await context.close();
});
