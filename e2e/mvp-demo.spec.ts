/**
 * Browser E2E — MVP/Prototype review walkthrough on the rich fictional demo.
 *
 * Verifies that the seeded dataset is actually visible and operable in the
 * dashboard, daily-report console, and ISO console.
 */

import { test, expect } from "@playwright/test";

const ADMIN_CRED = "e2e-admin:e2e-secret";

test("dashboard KPIs reflect the fictional demo dataset", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/dashboard");

  // The e2e-admin credential is organisation-scoped to org-hq (tenant
  // isolation), so the dashboard KPI reflects org-hq members rather than the
  // whole fictional company.
  const users = Number(await page.locator("#statTotalUsers").textContent());
  expect(users).toBeGreaterThanOrEqual(5);

  const unhealthy = Number(await page.locator("#statUnhealthyApps").textContent());
  expect(unhealthy).toBeGreaterThanOrEqual(1);

  await expect(page.locator("#appGrid")).toContainText("Document Service");
  await context.close();
});

test("daily-report console lists seeded reports and approval states", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/daily-reports");
  await page.selectOption("#projectSelect", "project-demo-1");

  await expect(page.locator("#reportsTableBody")).toContainText("橋台A型枠組立");
  await expect(page.locator("#reportsTableBody")).toContainText("承認済み");
  await expect(page.locator("#reportsTableBody")).toContainText("下書き");
  await context.close();
});

test("ISO console shows seeded records across quality and analytics tabs", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/iso-app");

  await expect(page.locator("#isoAnalyticsGrid")).toContainText("品質計画");
  await expect(page.locator("#isoAnalyticsGrid")).toContainText("資産台帳");

  await page.locator("details.nav-group summary", { hasText: "ISO 管理コンソール" }).click();
  await page.click('[data-tab="quality"]');
  await expect(page.locator("#isoTableBody")).toContainText("橋梁補修工事 品質計画（デモ）");
  await page.selectOption("#isoKindSelect", "nonconformity");
  await expect(page.locator("#isoTableBody")).toContainText("鉄筋かぶり厚不足（デモ）");
  await context.close();
});

test("viewer credential still cannot open protected consoles", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer e2e-viewer:e2e-viewer-secret` },
  });
  const page = await context.newPage();
  await page.goto("/daily-reports");
  await expect(page.locator("body")).toContainText(/Forbidden|403/);
  await context.close();
});

test("browser login flow authenticates and opens the dashboard", async ({ page }) => {
  await page.goto("/demo-login");
  await expect(page.locator("#demoLoginBtn")).toBeVisible();
  await page.click("#demoQuickLoginBtn");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator("#appGrid")).toBeVisible();
});

test("dashboard left menu renders the users list in the right pane", async ({ page }) => {
  await page.goto("/demo-login");
  await page.click("#demoQuickLoginBtn");
  await expect(page).toHaveURL(/\/dashboard/);
  await page.locator("details.nav-group summary", { hasText: "コンプライアンス" }).click();
  await page.click('nav a[href="/dashboard#users"]');
  await expect(page.locator("#users")).toBeVisible();
  await expect(page.locator("#userTableBody")).toContainText("システム管理者（デモ）");
});

test("dashboard API menu items render JSON in the right pane", async ({ page }) => {
  await page.goto("/demo-login");
  await page.click("#demoQuickLoginBtn");
  await expect(page).toHaveURL(/\/dashboard/);
  await page.locator("details.nav-group summary", { hasText: "🔌 API" }).click();
  await page.click('nav a[data-api="/api/v1/dashboard"]');
  await expect(page.locator("#apiViewer")).toBeVisible();
  await expect(page.locator("#apiViewerBody")).toContainText("governance");
  await page.click("#apiViewerBack");
  await expect(page.locator("#appGrid")).toBeVisible();
});

test("/iso redirects to the working ISO console", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/iso");
  await expect(page).toHaveURL(/\/iso-app/);
  await expect(page.locator("#pageTitle")).toHaveText("ISO 分析ダッシュボード");
  await context.close();
});
