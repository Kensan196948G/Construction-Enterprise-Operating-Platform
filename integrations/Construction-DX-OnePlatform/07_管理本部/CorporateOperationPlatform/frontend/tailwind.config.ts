import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cdx: {
          corp: "#7c3aed", // 管理本部メインカラー
          accounting: "#0ea5e9",
          alert: "#dc2626",
          success: "#16a34a",
        },
      },
      minHeight: { tap: "44px" },
      minWidth: { tap: "44px" },
    },
  },
  plugins: [],
};
export default config;
