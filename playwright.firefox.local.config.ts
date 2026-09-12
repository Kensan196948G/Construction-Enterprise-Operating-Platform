/**
 * LOCAL-ONLY E2E configuration (not used by CI, not part of the default suite).
 *
 * Some developer machines cannot launch the bundled Chromium (SIGTRAP on
 * startup, e.g. after a glibc update). This config runs the FULL spec suite
 * on Firefox so the browser flows can still be verified locally.
 *
 * This is independent of the `firefox` project defined in the main
 * `playwright.config.ts` (#90): that one is CI-focused and only runs a small
 * smoke subset (via `grep`) across every engine. Use this file instead when
 * you need the complete suite on Firefox, e.g. as a Chromium workaround.
 */

import { defineConfig } from "@playwright/test";

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
    browserName: "firefox",
    trace: "retain-on-failure",
  },
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
