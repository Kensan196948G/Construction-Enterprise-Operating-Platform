/**
 * ローカル検証専用の一時設定 — CI では使用しない。
 *
 * この実行環境の Chromium バイナリが起動直後に core dump するため、
 * Playwright が同梱する Firefox で E2E を実行する。設定内容は既定
 * playwright.config.ts と同一で、ブラウザのみ差し替える。
 */

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3210",
    browserName: "firefox",
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
      CEOP_E2E_VIEWER_API_KEY_ID: "e2e-viewer",
      CEOP_E2E_VIEWER_API_KEY_SECRET: "e2e-viewer-secret",
    },
  },
});
