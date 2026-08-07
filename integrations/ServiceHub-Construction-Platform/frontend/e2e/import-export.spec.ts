import { test, expect } from "@playwright/test";
import { loginAndNavigate } from "./fixtures/api-mocks";

// E2E smoke tests for /import and /export pages (PR: feat/import-export).
// Verifies page headings render correctly after authentication.
test.describe("インポート/エクスポートページ", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test("/import が h1 「データインポート」 で読み込まれる", async ({ page }) => {
    await page.goto("/import");
    await expect(
      page.getByRole("heading", { level: 1, name: "データインポート" }),
    ).toBeVisible();
  });

  test("/import にインポート対象選択ボタンが表示される", async ({ page }) => {
    await page.goto("/import");
    // exact: true でテンプレートダウンロードボタンと区別する
    await expect(page.getByRole("button", { name: "工事案件", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "日報", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "安全確認", exact: true })).toBeVisible();
  });

  test("/import のファイルアップロードエリアが表示される", async ({ page }) => {
    await page.goto("/import");
    await expect(page.getByText(/ここにファイルをドロップ/)).toBeVisible();
  });

  test("/export が h1 「データエクスポート」 で読み込まれる", async ({ page }) => {
    await page.goto("/export");
    await expect(
      page.getByRole("heading", { level: 1, name: "データエクスポート" }),
    ).toBeVisible();
  });

  test("/export に出力形式選択が表示される", async ({ page }) => {
    await page.goto("/export");
    // description の一意テキストでボタンを特定（ページ内の複数 PDF/HTML テキストと区別）
    await expect(page.getByRole("button", { name: /印刷.*PDF 形式/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /ブラウザで表示/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /スプレッドシート/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /汎用 CSV/ })).toBeVisible();
  });

  test("/export にエクスポートボタンが表示される", async ({ page }) => {
    await page.goto("/export");
    await expect(page.getByRole("button", { name: /PDF でエクスポート/ })).toBeVisible();
  });

  test("サイドバーの「データ管理」グループが表示される", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("データ管理")).toBeVisible();
  });

  test("サイドバーからインポートページへ遷移できる", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "インポート" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "データインポート" }),
    ).toBeVisible();
  });

  test("サイドバーからエクスポートページへ遷移できる", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "エクスポート" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "データエクスポート" }),
    ).toBeVisible();
  });
});
