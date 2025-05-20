// eslint.config.mjs
import globals from 'globals';
import js from '@eslint/js';

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
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'scripts/**',
      'functions/**',
      'package/**',
      'purgecss.config.mjs',
      'purgecss.config.new.mjs',
      'rollup.config.js',
      'babel.config.json',
      '.vscode/**',
      '.idx/**',
      '.firebase/**',
      'temp-eslint.config.mjs', // Ignoring the temporary config file
      '.eslintrc.js', // Ignoring the temporary traditional config file
    ],
  },

  js.configs.recommended,

  // Configuration for main source code (extension code)
  {
    files: ['./app.js', './js/**/*.js', './pages/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...sanitizeGlobals(globals.browser),
        ...sanitizeGlobals(globals.webextensions),
        Prism: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      // Add any prettier rules manually if needed, or rely on a separate prettier run
      'prettier/prettier': 'off', // Explicitly turn off prettier rule if it was added by recommended
    },
  },

  // Configuration for test files
  {
    files: ['./tests/**/*.js'],
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
      'prettier/prettier': 'off', // Explicitly turn off prettier rule
    },
  },

  // Configuration for ESLint config file itself (eslint.config.mjs)
  {
    files: ['./eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...sanitizeGlobals(globals.node),
      },
    },
    rules: {
      'prettier/prettier': 'off', // Explicitly turn off prettier rule
    },
  },
];
