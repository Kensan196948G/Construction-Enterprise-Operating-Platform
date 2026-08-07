import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // モバイルファースト breakpoint (建設現場のスマホ前提)
    screens: {
      xs: "375px", // iPhone SE / 小型 Android
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        cdx: { safety: "#dc2626", quality: "#0ea5e9", env: "#16a34a" },
      },
      minHeight: {
        // タップターゲットは WCAG 2.1 AA = 最低 44x44px
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
      spacing: {
        // フッターナビゲーション分の safe-area
        "footer-nav": "64px",
      },
    },
  },
  plugins: [],
};
export default config;
