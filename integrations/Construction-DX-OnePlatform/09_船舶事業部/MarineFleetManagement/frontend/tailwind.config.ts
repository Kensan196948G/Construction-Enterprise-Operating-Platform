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
        marine: {
          primary: '#0c4a6e',   // 深い海色 (sky-900)
          accent: '#0284c7',    // sky-600
          wave: '#0ea5e9',      // sky-500
          warn: '#d97706',
          danger: '#dc2626',
          ok: '#16a34a',
          deck: '#f1f5f9',
        },
        vesseltype: {
          作業船: '#0284c7',
          曳船: '#2563eb',
          起重機船: '#7c3aed',
          浚渫船: '#ca8a04',
          台船: '#475569',
        },
      },
    },
  },
  plugins: [],
};

export default config;
