// Construction DX One Platform — ESLint v9 flat config (Loop #29 / Issue #9)
//
// Root config consumed by all frontend workspaces. Each workspace `npm run lint`
// resolves this file via the package boundary (default ESLint v9 lookup).
//
// Design choices:
// - `recommended` baseline only; stylistic rules are delegated to Prettier.
// - Generated artefacts (`dist`, `build`, `storybook-static`) and config files
//   are globally ignored.
// - React 17+ JSX transform: `react-in-jsx-scope` / `jsx-uses-react` are off.
// - Type-aware lint (parserOptions.project) is intentionally NOT enabled to
//   keep the first migration tractable; can be opted in per-workspace later.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/storybook-static/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/.vite/**",
      "**/*.config.{js,ts,mjs,cjs}",
      "**/vite.config.*",
      "**/tsup.config.*",
      "**/vitest.config.*",
      "**/playwright.config.*",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node, ...globals.es2022 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-vars": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Allow legacy patterns during migration; tighten in a follow-up loop.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: [
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
      "**/tests/**/*",
    ],
    languageOptions: {
      globals: { ...globals.jest, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      // test files commonly assert behaviour with intentional constant operands
      // (e.g. `cn('a', false && 'c', 'b')` to verify falsy filtering); avoid
      // false positives from `no-constant-binary-expression` in this layer.
      "no-constant-binary-expression": "off",
    },
  },
];
