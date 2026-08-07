import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.js' : '.cjs',
    };
  },
  loader: {
    '.css': 'copy',
  },
  injectStyle: false,
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
