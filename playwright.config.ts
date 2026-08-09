import { defineConfig } from "@playwright/test";

/**
 * Browser E2E for the CEOP SSR console.
 *
 * The web server runs in development mode with demo data and a stable E2E
 * credential injected via `CEOP_E2E_API_KEY_ID` / `CEOP_E2E_API_KEY_SECRET`
 * (see src/app.ts). This hook is non-production only.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3210",
    channel: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node --experimental-strip-types scripts/start.ts",
    url: "http://127.0.0.1:3210/health",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: "3210",
      NODE_ENV: "development",
      CEOP_SEED_DEMO: "true",
      CEOP_E2E_API_KEY_ID: "e2e-admin",
      CEOP_E2E_API_KEY_SECRET: "e2e-secret",
    },
  },
});
