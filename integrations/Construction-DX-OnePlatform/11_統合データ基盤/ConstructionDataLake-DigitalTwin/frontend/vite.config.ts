import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") }
  },
  build: {
    rollupOptions: {
      // cesium は optional 依存 (動的 import で graceful fallback)。
      // パッケージ未インストールでも Rollup が解決を試みないよう外部化する。
      external: ["cesium", /^cesium\//]
    }
  },
  optimizeDeps: {
    // dev mode で cesium を pre-bundle 対象から除外 (optional dep)
    exclude: ["cesium"]
  },
  server: {
    port: 5190,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8011",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
});
