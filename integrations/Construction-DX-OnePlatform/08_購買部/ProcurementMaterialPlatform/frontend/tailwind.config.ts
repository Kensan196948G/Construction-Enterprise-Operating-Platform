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
        proc: {
          primary: '#0f766e',     // teal
          accent: '#0891b2',      // cyan
          warn: '#d97706',
          danger: '#dc2626',
          ok: '#16a34a',
        },
        rank: {
          S: '#7c3aed',
          A: '#16a34a',
          B: '#0891b2',
          C: '#d97706',
          D: '#9ca3af',
        },
      },
    },
  },
  plugins: [],
};

export default config;
