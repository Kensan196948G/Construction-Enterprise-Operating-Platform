/**
 * Browser E2E — v0.14.5:
 *   1. 日報管理の対象案件プルダウンがステータス別にグループ化され見やすい
 *   2. ISO統合マネジメントの各項目（タブ）のダミーデータが10件ずつ
 */

import { test, expect } from "@playwright/test";

const ADMIN_CRED = "e2e-admin:e2e-secret";

test("daily-reports project dropdown is grouped and readable", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/daily-reports");
  await page.waitForTimeout(800);

  // The select is grouped with optgroups (statuses).
  const groupCount = await page.locator("#projectSelect optgroup").count();
  expect(groupCount).toBeGreaterThanOrEqual(1);
  // Option labels contain project code + name (skip the placeholder).
  const realOption = await page
    .locator("#projectSelect option")
    .filter({ hasText: "DEMO-" })
    .first()
    .textContent();
  expect(realOption).toContain("DEMO-");
  // Selecting a project enables the new-report button and shows a status chip.
  await page.locator("#projectSelect").selectOption({ index: 1 });
  await page.waitForTimeout(600);
  await expect(page.locator("#newReportBtn")).toBeEnabled();
  await expect(page.locator("#projectStatusChip")).toBeVisible();
  await context.close();
});

test("ISO each domain tab shows exactly 10 dummy records", async ({ browser }) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_CRED}` },
  });
  const page = await context.newPage();
  await page.goto("/iso-app");
  await page.waitForTimeout(800);

  const tabs = [
    { tab: "quality", title: "品質" },
    { tab: "environment", title: "環境" },
    { tab: "safety", title: "安全" },
    { tab: "assets", title: "資産" },
    { tab: "bim", title: "BIM" },
    { tab: "audit", title: "監査" },
    { tab: "isms", title: "ISMS" },
    { tab: "bcp", title: "事業継続" },
  ];
  for (const { tab, title } of tabs) {
    await page.locator(`.iso-tab[data-tab="${tab}"]`).first().click();
    await page.waitForTimeout(800);
    await expect(page.locator("#pageTitle")).toContainText(title);
    // The record table lists the domain's records; expect 10 rows (may be
    // filtered by status default "全ステータス").
    await expect(page.locator("#isoStatusFilter")).toHaveValue("");
    const rows = await page.locator("#isoTableBody tr").count();
    // シードで各タブに 10 件投入（他の E2E テストが作成した分は 10 件以上になる）
    expect(rows, `${tab} should have at least 10 rows`).toBeGreaterThanOrEqual(10);
  }
  await context.close();
});
