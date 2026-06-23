import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests for security-critical pure logic (open-redirect, CSRF, route
// access) and JWT verification. Node environment is enough — no DOM needed.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Focus on security-critical modules that have corresponding unit tests.
      // Integration-tested endpoints (logout, health) and config-only files
      // (api.ts) are excluded to avoid misleading low-line-coverage alerts.
      include: [
        "lib/csrf.ts",
        "lib/url-safety.ts",
        "lib/session.ts",
        "lib/route-access.ts",
        "app/api/auth/login/route.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
      thresholds: {
        branches: 90,
        functions: 85,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
