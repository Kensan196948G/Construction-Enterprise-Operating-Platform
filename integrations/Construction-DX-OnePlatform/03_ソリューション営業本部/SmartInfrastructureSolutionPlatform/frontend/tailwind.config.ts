import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './node_modules/@cdx/shared-ui/dist/**/*.{js,cjs,mjs}',
  ],
  theme: {
    extend: {
      colors: {
        sol: {
          primary: '#1e3a8a',
          accent: '#0ea5e9',
          success: '#16a34a',
          warning: '#f59e0b',
          danger: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};

export default config;
