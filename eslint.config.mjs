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
      'functions/',
      'chrome-store-package/',
      'css-minified/',
      'purgecss.config.mjs',
      'rollup.config.js',
      'babel.config.json',
      'js/clusterize.min.js',
      'js/vendor/',
      '.vscode/',
      '.idx/',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/dist/**/*.js',
      '**/build/**/*.js',
    ],
  },

  js.configs.recommended,
  eslintPluginPrettierRecommended,

  // Configuration for main source code (extension code)
  {
    files: ['app.js', 'js/**/*.js', 'pages/**/*.js'],
    ignores: ['js/analytics/**/*.js'], // Analytics files handled separately
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...sanitizeGlobals(globals.browser),
        ...sanitizeGlobals(globals.webextensions),
        Prism: 'readonly', // Added Prism global
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Configuration for analytics files (need process global for environment detection)
  {
    files: ['js/analytics/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...sanitizeGlobals(globals.browser),
        ...sanitizeGlobals(globals.webextensions),
        process: 'readonly', // Allow access to process.env.NODE_ENV
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
        ...sanitizeGlobals(globals.browser),
        ...sanitizeGlobals(globals.webextensions),
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
