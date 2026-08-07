import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1F6FEB",
          dark: "#0B3FA0"
        }
      }
    }
  },
  plugins: []
};

export default config;
