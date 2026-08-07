/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: { browser: true, es2022: true, node: true },
  extends: ['eslint:recommended', 'prettier'],
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
  rules: {
    'no-unused-vars': 'off',
  },
};
