import { test, expect } from '@playwright/test';

const BASE = '/api/v1';

// Credentials from seed.ts (admin@civil-ims.local / Admin1234!)
// Also accepts admin@civil-ims.example / AdminPass123! if seeded with that email
const VALID_EMAIL = process.env.TEST_EMAIL ?? 'admin@civil-ims.local';
const VALID_PASSWORD = process.env.TEST_PASSWORD ?? 'Admin1234!';

test.describe('Auth API', () => {
  test('POST /auth/login with valid credentials returns 200 + accessToken', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, {
      data: {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);
  });

  test('POST /auth/login with invalid credentials returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, {
      data: {
        email: 'nonexistent@example.com',
        password: 'WrongPassword999!',
      },
    });

    expect(res.status()).toBe(401);
  });

  test('POST /auth/login with wrong password returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, {
      data: {
        email: VALID_EMAIL,
        password: 'WrongPassword000!',
      },
    });

    expect(res.status()).toBe(401);
  });

  test('GET /health returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/health`);

    expect(res.status()).toBe(200);
  });
});
