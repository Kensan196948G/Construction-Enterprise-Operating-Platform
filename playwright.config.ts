import { defineConfig, devices } from "@playwright/test";

/**
 * Browser E2E for the CEOP SSR console.
 *
 * The web server runs in development mode with demo data and a stable E2E
 * credential injected via `CEOP_E2E_API_KEY_ID` / `CEOP_E2E_API_KEY_SECRET`
 * (see src/app.ts). This hook is non-production only.
 *
 * Cross-browser / viewport coverage (#90):
 * - `chromium` runs the full suite (unchanged, matches the historical CI job).
 * - `firefox`, `webkit`, `mobile-chrome`, `mobile-safari` run a small smoke
 *   subset only (login + dashboard rendering + access control), selected via
 *   `grep` so CI time stays bounded. Widen the pattern once more specs are
 *   confirmed stable across engines.
 */
const SMOKE_TEST_TITLES =
  /browser login flow authenticates and opens the dashboard|dashboard renders KPI cards and app grid for authenticated admin|dashboard rejects anonymous access/;
const E2E_PORT = process.env["CEOP_E2E_PORT"] ?? "3210";
const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      grep: SMOKE_TEST_TITLES,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      grep: SMOKE_TEST_TITLES,
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      grep: SMOKE_TEST_TITLES,
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
      grep: SMOKE_TEST_TITLES,
    },
  ],
  webServer: {
    command: "node --experimental-strip-types scripts/start.ts",
    url: `${E2E_BASE_URL}/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: E2E_PORT,
      NODE_ENV: "development",
      CEOP_SEED_DEMO: "true",
      CEOP_SEED_RICH_DEMO: "true",
      CEOP_E2E_API_KEY_ID: "e2e-admin",
      CEOP_E2E_API_KEY_SECRET: "e2e-secret",
      CEOP_E2E_VIEWER_API_KEY_ID: "e2e-viewer",
      CEOP_E2E_VIEWER_API_KEY_SECRET: "e2e-viewer-secret",
    },
  },
});
