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
        crm: {
          primary: '#0f766e',
          accent: '#f59e0b',
          danger: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};

export default config;
