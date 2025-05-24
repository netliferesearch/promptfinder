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
  // Removed add-prompt.js entry as the file has been deleted and functionality integrated into main UI
  // Removed edit-prompt.js entry as the file has been deleted
];

export default entryPoints.map(entry => ({
  input: entry.input,
  output: entry.output,
  plugins: commonPlugins(isProduction),
  watch: {
    clearScreen: false,
  },
}));
