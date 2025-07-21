import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

const isProduction = process.env.NODE_ENV === 'production';

const commonPlugins = isProd =>
  [
    resolve({
      browser: true,
      preferBuiltins: false,
      // Completely exclude ALL Firebase Auth modules to prevent remote script loading
      ignore: [
        // Block all Firebase Auth modules - we use Cloud Functions instead
        'firebase/auth',
        'firebase/auth/web-extension',
        'firebase/auth/cordova',
        'firebase/auth/react-native',
        '@firebase/auth',
        '@firebase/auth/**',
        // Block specific modules that contain loadJS functions for external scripts
        '@firebase/auth/dist/esm2017/src/platform_browser/recaptcha/recaptcha_loader',
        '@firebase/auth/dist/esm2017/src/platform_browser/load_js',
        '@firebase/auth/dist/esm2017/src/core/util/delay',
        '@firebase/auth/dist/esm2017/src/platform_browser/recaptcha',
        '@firebase/util/dist/index.esm2017.js',
      ],
    }),
    commonjs(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      'process.env.DEBUG': JSON.stringify(false),
      // Replace Firebase Auth reCAPTCHA-related code with no-ops
      loadJS: 'function() { return Promise.resolve(); }',
      gapiScript: '""',
      recaptchaV2Script: '""',
      recaptchaEnterpriseScript: '""',
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [['@babel/preset-env', { modules: false }]],
    }),
    isProd &&
      terser({
        compress: {
          drop_console: false, // Keep console logs for debugging
          drop_debugger: true,
          pure_funcs: ['console.debug'],
          // Remove unused reCAPTCHA code
          dead_code: true,
          unused: true,
        },
        mangle: {
          // Don't mangle these important identifiers
          reserved: ['textManager', 'getText', 'TEXT_CONSTANTS'],
        },
        format: {
          comments: false,
        },
      }),
  ].filter(Boolean);

// Special configs for main app and firebase-init
const specialConfigs = [
  {
    input: 'app.js',
    output: {
      file: 'dist/js/app.js',
      format: 'iife',
      name: 'PromptFinderApp',
      sourcemap: !isProduction,
      inlineDynamicImports: true,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
  {
    input: 'js/firebase-init.js',
    output: {
      file: 'dist/js/firebase-init.js',
      format: 'iife',
      name: 'FirebaseInit',
      sourcemap: !isProduction,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
];

// All other JS modules (add new files here as needed)
const jsModules = [
  // Main modules
  { input: 'js/ui.js', output: 'dist/js/js/ui.js' },
  { input: 'js/promptData.js', output: 'dist/js/js/promptData.js' },
  { input: 'js/utils.js', output: 'dist/js/js/utils.js' },
  { input: 'js/text-constants.js', output: 'dist/js/js/text-constants.js' },
  {
    input: 'js/firebase-connection-handler.js',
    output: 'dist/js/js/firebase-connection-handler.js',
  },
  { input: 'config/oauth-config.js', output: 'dist/js/js/oauth-config.js' },
  { input: 'js/categories.js', output: 'dist/js/js/categories.js' },

  // Analytics modules
  { input: 'js/analytics/analytics.js', output: 'dist/js/js/analytics/analytics.js' },
  {
    input: 'js/analytics/analytics-service.js',
    output: 'dist/js/js/analytics/analytics-service.js',
  },
  { input: 'js/analytics/client-manager.js', output: 'dist/js/js/analytics/client-manager.js' },
  { input: 'js/analytics/config.js', output: 'dist/js/js/analytics/config.js' },
  { input: 'js/analytics/consent-dialog.js', output: 'dist/js/js/analytics/consent-dialog.js' },
  { input: 'js/analytics/event-filter.js', output: 'dist/js/js/analytics/event-filter.js' },
  { input: 'js/analytics/event-schema.js', output: 'dist/js/js/analytics/event-schema.js' },
  { input: 'js/analytics/event-tracker.js', output: 'dist/js/js/analytics/event-tracker.js' },
  { input: 'js/analytics/gtag-integration.js', output: 'dist/js/js/analytics/gtag-integration.js' },
  { input: 'js/analytics/page-tracker.js', output: 'dist/js/js/analytics/page-tracker.js' },
  { input: 'js/analytics/popup-analytics.js', output: 'dist/js/js/analytics/popup-analytics.js' },
  {
    input: 'js/analytics/promise-rejection-tracker.js',
    output: 'dist/js/js/analytics/promise-rejection-tracker.js',
  },
  {
    input: 'js/analytics/realtime-validator.js',
    output: 'dist/js/js/analytics/realtime-validator.js',
  },
  {
    input: 'js/analytics/service-worker-analytics.js',
    output: 'dist/js/js/analytics/service-worker-analytics.js',
  },
  { input: 'js/analytics/session-manager.js', output: 'dist/js/js/analytics/session-manager.js' },
  // Skip testing utilities in production builds
  ...(isProduction
    ? []
    : [
        {
          input: 'js/analytics/testing-utilities.js',
          output: 'dist/js/js/analytics/testing-utilities.js',
        },
      ]),
  {
    input: 'js/analytics/user-property-manager.js',
    output: 'dist/js/js/analytics/user-property-manager.js',
  },

  // Vendor (skip .min.js)
  { input: 'js/vendor/prism.js', output: 'dist/js/js/vendor/prism.js' },
];

const moduleConfigs = jsModules.map(({ input, output }) => ({
  input,
  output: {
    file: output,
    format: 'es',
    sourcemap: !isProduction,
  },
  plugins: commonPlugins(isProduction),
  external: [],
}));

export default [...specialConfigs, ...moduleConfigs];
