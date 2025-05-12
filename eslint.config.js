// ESLint configuration compatible with ESLint v8
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    webextensions: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    chrome: 'readonly',
    document: 'readonly',
    window: 'readonly',
    navigator: 'readonly',
  },
  plugins: [
    'prettier'
  ],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prettier/prettier': 'warn'
  },
  overrides: [
    {
      // Test files
      files: ['**/tests/**/*.js'],
      env: {
        jest: true
      },
      globals: {
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      },
      rules: {
        'no-console': 'off' // Allow console in tests
      }
    }
  ]
};
];
