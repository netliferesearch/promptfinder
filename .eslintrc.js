// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    Prism: 'readonly',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'package/**',
    'functions/**',
    'scripts/**',
    'coverage/**',
    '.vscode/**',
    '.firebase/**',
  ],
};
