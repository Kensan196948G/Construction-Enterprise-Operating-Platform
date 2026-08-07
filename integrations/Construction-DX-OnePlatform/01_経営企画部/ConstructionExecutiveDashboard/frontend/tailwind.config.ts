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
        exec: {
          primary: '#1e3a8a',
          accent: '#0ea5e9',
          warn: '#f59e0b',
          danger: '#dc2626',
          ok: '#16a34a',
          bg: '#f8fafc',
        },
      },
    },
  },
  plugins: [],
};

export default config;
