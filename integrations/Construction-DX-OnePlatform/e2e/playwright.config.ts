import { defineConfig, devices } from '@playwright/test';

/**
 * Construction DX One Platform — Playwright E2E config
 *
 * baseURL は docker compose 起動済みを前提に api-gateway / 各 frontend ポートを束ねる。
 * CI では `e2e/skip-if-broken` ガードを使い、サービス未起動時はスイートをスキップする。
 */

const SITE_URL = process.env.E2E_SITE_URL ?? 'http://localhost:3000';
const SQ_URL = process.env.E2E_SQ_URL ?? 'http://localhost:3001';
const ITSM_URL = process.env.E2E_ITSM_URL ?? 'http://localhost:3002';
const GATEWAY_URL = process.env.E2E_GATEWAY_URL ?? 'http://localhost:8080';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: SITE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  metadata: {
    site: SITE_URL,
    sq: SQ_URL,
    itsm: ITSM_URL,
    gateway: GATEWAY_URL,
  },
});
