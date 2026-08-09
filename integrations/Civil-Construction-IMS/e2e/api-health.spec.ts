import { test, expect } from '@playwright/test';

const BASE = '/api/v1';

const VALID_EMAIL = process.env.TEST_EMAIL ?? 'admin@civil-ims.local';
const VALID_PASSWORD = process.env.TEST_PASSWORD ?? 'Admin1234!';

test.describe('API Health Checks', () => {
  test('GET /health (liveness) returns {status: "ok"}', async ({ request }) => {
    const res = await request.get(`${BASE}/health`);

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('status', 'ok');
  });

  test('GET /health/ready (readiness) returns either ready or not_ready without error', async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/health/ready`);

    // Accept either 200 (ready or not_ready) — no assertion on the status value
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(['ready', 'not_ready']).toContain(body.status);
  });

  test('GET /analytics/dashboard without auth token returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/analytics/dashboard`);

    expect(res.status()).toBe(401);
  });

  test('GET /analytics/iso-compliance without auth token returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/analytics/iso-compliance`);

    expect(res.status()).toBe(401);
  });

  test('GET /analytics/safety-kpi without auth token returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/analytics/safety-kpi`);

    expect(res.status()).toBe(401);
  });

  test('POST /auth/login with missing fields returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, {
      data: {},
    });

    // NestJS ValidationPipe returns 400 for missing required fields
    expect(res.status()).toBe(400);
  });

  test('Full auth flow: login → use token → logout succeeds', async ({ request }) => {
    // Step 1: Login
    const loginRes = await request.post(`${BASE}/auth/login`, {
      data: {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      },
    });
    expect(loginRes.status()).toBe(200);

    const { accessToken, refreshToken } = await loginRes.json();
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    // Step 2: Use token to access a protected endpoint
    const dashboardRes = await request.get(`${BASE}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(dashboardRes.status()).toBe(200);

    // Step 3: Logout
    const logoutRes = await request.post(`${BASE}/auth/logout`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { refreshToken },
    });
    // 204 No Content on success
    expect(logoutRes.status()).toBe(204);
  });
});
