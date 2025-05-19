/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    browser: false,
    commonjs: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json'],
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    quotes: ['error', 'single'],
    indent: ['error', 2],
    semi: ['error', 'always'],
    'no-unused-vars': 'off',
    'no-undef': 'off', // Turn off no-undef since TypeScript handles this
    'no-console': 'off', // Allow console logs in serverless functions
    '@typescript-eslint/no-unused-vars': ['warn'],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'prettier/prettier': 'error',
  },
  ignorePatterns: ['lib/**', 'node_modules/**'],
};
