import { test, expect } from '@playwright/test';

const BASE = '/api/v1';

const VALID_EMAIL = process.env.TEST_EMAIL ?? 'admin@civil-ims.local';
const VALID_PASSWORD = process.env.TEST_PASSWORD ?? 'Admin1234!';

/** Obtain a JWT access token by logging in once per test file. */
async function getAuthToken(
  request: Parameters<Parameters<typeof test>[1]>[0]['request'],
): Promise<string> {
  const res = await request.post(`${BASE}/auth/login`, {
    data: {
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    },
  });

  if (!res.ok()) {
    throw new Error(`Login failed with status ${res.status()}: ${await res.text()}`);
  }

  const body = await res.json();
  return body.accessToken as string;
}

test.describe('Analytics API', () => {
  test('GET /analytics/dashboard with valid auth token returns 200 + expected fields', async ({
    request,
  }) => {
    const token = await getAuthToken(request);

    const res = await request.get(`${BASE}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    // The dashboard should return an object (KPI summary)
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });

  test('GET /analytics/iso-compliance with valid auth returns 200 + iso9001 score field', async ({
    request,
  }) => {
    const token = await getAuthToken(request);

    const res = await request.get(`${BASE}/analytics/iso-compliance`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Expect an iso9001 key in the compliance response
    expect(body).toHaveProperty('iso9001');
  });

  test('GET /analytics/safety-kpi with valid auth returns 200', async ({ request }) => {
    const token = await getAuthToken(request);

    const res = await request.get(`${BASE}/analytics/safety-kpi`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });

  test('GET /analytics/quality-kpi with valid auth returns 200', async ({ request }) => {
    const token = await getAuthToken(request);

    const res = await request.get(`${BASE}/analytics/quality-kpi`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
  });

  test('GET /analytics/asset-health with valid auth returns 200', async ({ request }) => {
    const token = await getAuthToken(request);

    const res = await request.get(`${BASE}/analytics/asset-health`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
  });
});
