import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      three: path.resolve(
        __dirname,
        "../../../node_modules/three/build/three.module.js",
      ),
    },
  },
  optimizeDeps: {
    exclude: ["web-ifc", "web-ifc-three"],
  },
  build: {
    rollupOptions: {
      treeshake: false,
      maxParallelFileOps: 1,
    },
  },
  server: {
    port: 5184,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8005",
        changeOrigin: true,
      },
    },
  },
});
