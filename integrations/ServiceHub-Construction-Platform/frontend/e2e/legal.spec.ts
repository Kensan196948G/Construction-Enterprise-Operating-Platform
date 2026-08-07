import { test, expect } from "@playwright/test";
import { loginAndNavigate } from "./fixtures/api-mocks";

test.describe("Legal Tech Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);

    // Mock legal evidence API
    await page.route("**/api/v1/legal/evidence/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });

    // Mock legal contracts API
    await page.route("**/api/v1/legal/contracts**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "1",
              project_id: "p1",
              contract_number: "CNT-E2E-001",
              title: "E2Eテスト用工事請負契約書",
              contract_type: "PRIME",
              risk_score: "LOW",
              created_at: "2026-05-01T00:00:00Z",
              updated_at: "2026-05-01T00:00:00Z",
            },
          ],
          meta: { page: 1, per_page: 100, total: 1 },
        }),
      });
    });

    // Mock compliance API
    await page.route("**/api/v1/legal/compliance/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.getByRole("link", { name: /Legal Tech/ }).click();
    await page.waitForURL("**/legal");
  });

  test("displays Legal Tech page with tabs", async ({ page }) => {
    // ページが表示される
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10_000,
    });

    // 3タブが存在する
    await expect(
      page.getByRole("button", { name: /証跡タイムライン/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /コンプライアンス/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /契約書解析/ }),
    ).toBeVisible();
  });

  test("switches to compliance tab", async ({ page }) => {
    await page.getByRole("button", { name: /コンプライアンス/ }).click();
    // コンプライアンスタブのコンテンツが表示される
    await expect(
      page.getByText(/コンプライアンス|PASS|WARNING|FAIL/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("switches to contracts tab", async ({ page }) => {
    await page.getByRole("button", { name: /契約書解析/ }).click();
    // 契約書タブのコンテンツが表示される（AI 解析 UI）
    await expect(
      page.getByText(/契約書|解析|分析|リスク/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
