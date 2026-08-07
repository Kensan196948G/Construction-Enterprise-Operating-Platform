import { test, expect } from './_fixtures';

const SITE_URL = process.env.E2E_SITE_URL ?? 'http://localhost:3000';
const GATEWAY_URL = process.env.E2E_GATEWAY_URL ?? 'http://localhost:8080';

test.describe('Auth Flow (cross-cutting)', () => {
  test('ログイン → ホーム表示', async ({ page, serviceUp }) => {
    if (!(await serviceUp(SITE_URL))) {
      test.skip(true, `site frontend not reachable at ${SITE_URL}`);
    }

    await page.goto('/login');
    // 認証スタブを通す想定 (shared-auth の dev mode)
    await page.getByLabel(/メール|email/i).fill('e2e@example.com');
    await page.getByLabel(/パスワード|password/i).fill('dev-password');
    await page.getByRole('button', { name: /ログイン|sign\s*in/i }).click();

    await expect(page).toHaveURL(/\/(home|dashboard|projects)/);
  });

  test('未認証アクセスは /login にリダイレクト', async ({ page, serviceUp }) => {
    if (!(await serviceUp(SITE_URL))) {
      test.skip(true, `site frontend not reachable at ${SITE_URL}`);
    }

    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });

  test('api-gateway /health が 200 を返す', async ({ request, serviceUp }) => {
    if (!(await serviceUp(`${GATEWAY_URL}/health`))) {
      test.skip(true, `api-gateway not reachable at ${GATEWAY_URL}`);
    }
    const res = await request.get(`${GATEWAY_URL}/health`);
    expect(res.ok()).toBeTruthy();
  });
});
