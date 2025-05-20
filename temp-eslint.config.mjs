// temp-eslint.config.mjs
import globals from 'globals';
import js from '@eslint/js';

export default [
  {
    ignores: ['**/node_modules/**', 'dist/**', 'package/**', 'functions/**', 'scripts/**'],
  },
  js.configs.recommended,
  {
    files: ['./js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        Prism: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
