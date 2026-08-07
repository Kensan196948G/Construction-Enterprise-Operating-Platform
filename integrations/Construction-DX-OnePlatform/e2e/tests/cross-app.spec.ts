import { test, expect } from './_fixtures';

const GATEWAY_URL = process.env.E2E_GATEWAY_URL ?? 'http://localhost:8080';

/**
 * api-gateway を経由した 部門横断アクセスの疎通確認。
 * 認証は dev token を Authorization: Bearer で渡す前提 (shared-auth dev mode)。
 */
test.describe('Cross-app integration via api-gateway', () => {
  const headers = { Authorization: 'Bearer dev-token' };

  test.beforeAll(async ({ request: req }) => {
    let ok = false;
    try {
      const res = await req.get(`${GATEWAY_URL}/health`, { timeout: 3000 });
      ok = res.ok();
    } catch {
      ok = false;
    }
    test.skip(!ok, `api-gateway not reachable at ${GATEWAY_URL}`);
  });

  test('04 施工: /api/site/projects に応答する', async ({ request }) => {
    const res = await request.get(`${GATEWAY_URL}/api/site/projects`, { headers });
    expect([200, 401, 403]).toContain(res.status());
  });

  test('06 安全品質: /api/sq/patrols に応答する', async ({ request }) => {
    const res = await request.get(`${GATEWAY_URL}/api/sq/patrols`, { headers });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test('10 ITSM: /api/itsm/tickets に応答する', async ({ request }) => {
    const res = await request.get(`${GATEWAY_URL}/api/itsm/tickets`, { headers });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test('未知ルートは 404 を返す', async ({ request }) => {
    const res = await request.get(`${GATEWAY_URL}/api/unknown/route`, { headers });
    expect(res.status()).toBe(404);
  });
});
