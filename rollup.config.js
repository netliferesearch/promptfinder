import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss'; // Added postcss

const isProduction = process.env.NODE_ENV === 'production';

const commonPlugins = isProd =>
  [
    resolve({
      browser: true,
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
    postcss({
      // Added postcss plugin configuration
      extract: false, // Set to true to extract to a file, e.g., 'dist/css/style.css'
      inject: true, // Injects CSS into <head> if extract is false
      extensions: ['.css'],
    }),
    isProd && terser(),
  ].filter(Boolean);

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
    input: 'app.js',
    output: {
      file: 'dist/js/app.js',
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
