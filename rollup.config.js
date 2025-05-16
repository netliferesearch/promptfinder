import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser'; // Corrected import
import replace from '@rollup/plugin-replace';

const isProduction = process.env.NODE_ENV === 'production';

// Define a common set of plugins
const commonPlugins = isProd =>
  [
    resolve({
      browser: true, // Important for some Firebase sub-dependencies
    }),
    commonjs(), // For CommonJS modules that Firebase might use internally
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      // Firebase uses this, and it's good practice for React/other libs too
      'process.env.DEBUG': JSON.stringify(false), // Example: ensure DEBUG is false
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**', // Only transpile our source code
      presets: [['@babel/preset-env', { modules: false }]], // Ensure Babel doesn't transform to CommonJS
    }),
    isProd && terser(), // Minify in production
  ].filter(Boolean); // Filter out falsy values (like terser when not in prod)

// Define configurations for each entry point
const entryPoints = [
  {
    input: 'js/firebase-init.js',
    output: {
      file: 'dist/js/firebase-init.js',
      format: 'iife',
      sourcemap: !isProduction,
    },
  },
  {
    input: 'app.js', // Corrected path to root app.js
    output: {
      file: 'dist/js/app.js', // Output to dist/js for consistency
      format: 'iife',
      sourcemap: !isProduction,
    },
  },
  {
    input: 'pages/offscreen.js',
    output: {
      file: 'dist/pages/offscreen.js',
      format: 'iife',
      sourcemap: !isProduction,
    },
  },
  {
    input: 'pages/add-prompt.js',
    output: {
      file: 'dist/pages/add-prompt.js',
      format: 'iife',
      sourcemap: !isProduction,
    },
  },
  {
    input: 'pages/edit-prompt.js',
    output: {
      file: 'dist/pages/edit-prompt.js',
      format: 'iife',
      sourcemap: !isProduction,
    },
  },
];

export default entryPoints.map(entry => ({
  input: entry.input,
  output: entry.output,
  plugins: commonPlugins(isProduction),
  watch: {
    clearScreen: false,
  },
}));
