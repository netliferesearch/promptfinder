// eslint.config.mjs
import globals from 'globals';
import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

// Helper function to trim whitespace from global keys
function sanitizeGlobals(globalsSet) {
  const sanitized = {};
  if (globalsSet) {
    for (const key in globalsSet) {
      sanitized[key.trim()] = globalsSet[key];
    }
  }
  return sanitized;
}

export default [
  // Global ignores - apply to all subsequent configurations
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'scripts/',
      'purgecss.config.mjs',
      'rollup.config.js',
      'babel.config.json',
      '.vscode/',
      '.idx/',
    ],
  },

  js.configs.recommended,
  eslintPluginPrettierRecommended,

  // Configuration for main source code (extension code)
  {
    files: ['app.js', 'js/**/*.js', 'pages/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...sanitizeGlobals(globals.browser),
        ...sanitizeGlobals(globals.webextensions),
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Configuration for test files
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...sanitizeGlobals(globals.node),
        ...sanitizeGlobals(globals.jest),
        ...sanitizeGlobals(globals.browser), // Add browser globals for JSDOM
        ...sanitizeGlobals(globals.webextensions), // Add extension globals for chrome.* mocks
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Configuration for ESLint config file itself (eslint.config.mjs)
  {
    files: ['eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...sanitizeGlobals(globals.node),
      },
    },
  },
];
