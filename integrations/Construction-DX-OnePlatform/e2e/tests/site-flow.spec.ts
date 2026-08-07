import { test, expect } from './_fixtures';

const SITE_URL = process.env.E2E_SITE_URL ?? 'http://localhost:3000';

test.describe('施工管理 (04) E2E', () => {
  test.beforeEach(async ({ page, serviceUp }) => {
    if (!(await serviceUp(SITE_URL))) {
      test.skip(true, `site frontend not reachable at ${SITE_URL}`);
    }

    // ログイン (auth-flow と共通)
    await page.goto('/login');
    await page.getByLabel(/メール|email/i).fill('e2e@example.com');
    await page.getByLabel(/パスワード|password/i).fill('dev-password');
    await page.getByRole('button', { name: /ログイン|sign\s*in/i }).click();
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('プロジェクト一覧 → 工程登録 → ガント表示', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /プロジェクト/ })).toBeVisible();

    // 1件目のプロジェクトを開く
    const firstRow = page.getByRole('row').nth(1);
    await firstRow.click();

    // 工程 (Schedule) タブ
    await page.getByRole('tab', { name: /工程|schedule/i }).click();
    await page.getByRole('button', { name: /工程追加|新規/ }).click();
    await page.getByLabel(/タスク名/).fill('E2E 工程 1');
    await page.getByLabel(/開始日/).fill('2026-05-22');
    await page.getByLabel(/終了日/).fill('2026-05-30');
    await page.getByRole('button', { name: /保存|登録/ }).click();

    // ガントチャート描画 (canvas もしくは svg)
    await expect(page.locator('canvas, svg.gantt')).toBeVisible();
  });
});
