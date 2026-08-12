/**
 * Browser E2E — 日報管理コンソール（/daily-reports）。
 *
 * 案件選択 → 日報作成 → 一覧反映 → 提出 → 承認 の主要フローと、
 * 権限のない viewer への 403 をブラウザ実操作で固定する。
 */

import { test, expect } from "@playwright/test";

const ADMIN_CRED = "e2e-admin:e2e-secret";
const VIEWER_CRED = "e2e-viewer:e2e-viewer-secret";

test("daily reports console rejects the viewer credential", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${VIEWER_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/daily-reports");
  await expect(page.locator("body")).toContainText(/Forbidden|403/);
  await context.close();
});

test("daily reports create, submit and approve flow works", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();

  await page.goto("/daily-reports");
  await expect(page.locator("#pageTitle")).toHaveText("日報管理");

  // 案件選択（シードのデモ案件が読み込まれる）
  await page.selectOption("#projectSelect", "project-demo-1");
  await expect(page.locator("#reportsSection")).toBeVisible();

  // 新規日報の作成
  await page.click("#newReportBtn");
  await expect(page.locator("#reportDialog")).toBeVisible();
  const today = new Date().toISOString().slice(0, 10);
  await page.fill("#reportDate", today);
  await page.selectOption("#reportWeather", "cloudy");
  await page.fill("#reportWorkerCount", "8");
  await page.fill("#reportProgressRate", "45");
  await page.fill("#reportWorkContent", "E2E 日報: 橋台コンクリート打設");
  await page.check("#reportSafetyCheck");
  await page.click("#reportForm button[type=submit]");
  const row = page.locator("#reportsTableBody tr", { hasText: "E2E 日報" }).first();
  await expect(row).toContainText("下書き");

  // 提出 → 承認
  await row.locator('[data-action="submit"]').click();
  await expect(row).toContainText("提出済み");
  await row.locator('[data-action="approve"]').click();
  await expect(row).toContainText("承認済み");
  await expect(row.locator("[data-action]")).toHaveCount(0);

  await context.close();
});
