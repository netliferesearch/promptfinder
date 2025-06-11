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
    }),
    commonjs(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      'process.env.DEBUG': JSON.stringify(false),
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

export default [
  // Main app bundle - inline all dynamic imports to avoid external references
  {
    input: 'app.js',
    output: {
      file: 'dist/js/app.js',
      format: 'iife',
      name: 'PromptFinderApp',
      sourcemap: !isProduction,
      inlineDynamicImports: true, // This will bundle all dynamic imports inline
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
  // Firebase init bundle
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
  // Individual JS modules for dynamic imports - use ES format
  {
    input: 'js/ui.js',
    output: {
      file: 'dist/js/js/ui.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
  {
    input: 'js/promptData.js',
    output: {
      file: 'dist/js/js/promptData.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
  {
    input: 'js/utils.js',
    output: {
      file: 'dist/js/js/utils.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
  {
    input: 'js/text-constants.js',
    output: {
      file: 'dist/js/js/text-constants.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
  {
    input: 'js/firebase-connection-handler.js',
    output: {
      file: 'dist/js/js/firebase-connection-handler.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
  // Analytics modules
  {
    input: 'js/analytics/analytics.js',
    output: {
      file: 'dist/js/js/analytics/analytics.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
  {
    input: 'js/analytics/page-tracker.js',
    output: {
      file: 'dist/js/js/analytics/page-tracker.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
  // Vendor modules
  {
    input: 'js/vendor/prism.js',
    output: {
      file: 'dist/js/js/vendor/prism.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: commonPlugins(isProduction),
    external: [],
  },
];
