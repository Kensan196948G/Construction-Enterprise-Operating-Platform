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
        site: {
          primary: '#1f6feb',
          warn: '#d97706',
          danger: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};

export default config;
