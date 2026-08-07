import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests for security-critical pure logic (open-redirect, CSRF, route
// access) and JWT verification. Node environment is enough — no DOM needed.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
