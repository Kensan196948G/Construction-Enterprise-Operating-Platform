/**
 * Build script for cdx admin-spa.
 *
 * Transforms JSX → JS (no bundling — files share a global scope at runtime)
 * then concatenates them in load order, matching the original <script> sequence.
 *
 * Output: dist/bundle.js   — concatenated, transpiled JS
 *         vendor/react.min.js, vendor/react-dom.min.js — self-hosted UMD builds
 */

import { transform } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const JSX_FILES = [
  'proto-data.jsx',
  'proto-page-dashboard.jsx',
  'proto-page-devices.jsx',
  'proto-page-iso.jsx',
  'proto-page-deployment.jsx',
  'proto-page-register.jsx',
  'proto-page-apps.jsx',
  'proto-page-rings.jsx',
  'proto-page-pxe.jsx',
  'proto-page-security.jsx',
  'proto-page-others.jsx',
  'proto-page-settings.jsx',
  'proto-app.jsx',
];

mkdirSync(join(__dir, 'dist'), { recursive: true });
mkdirSync(join(__dir, 'vendor'), { recursive: true });

// Copy self-hosted React UMD builds from npm package.
const reactPkg   = join(__dir, 'node_modules/react/umd/react.production.min.js');
const reactDomPkg = join(__dir, 'node_modules/react-dom/umd/react-dom.production.min.js');
copyFileSync(reactPkg,    join(__dir, 'vendor/react.min.js'));
copyFileSync(reactDomPkg, join(__dir, 'vendor/react-dom.min.js'));
console.log('✓ vendor/react.min.js');
console.log('✓ vendor/react-dom.min.js');

// Transform each JSX file (JSX syntax → JS; no module bundling).
const chunks = [];
for (const file of JSX_FILES) {
  const src = readFileSync(join(__dir, file), 'utf8');
  const result = await transform(src, { loader: 'jsx', target: 'es2017' });
  chunks.push(`/* === ${file} === */\n${result.code}`);
  console.log(`✓ ${file}`);
}

writeFileSync(join(__dir, 'dist/bundle.js'), chunks.join('\n'));
console.log('✓ dist/bundle.js');
