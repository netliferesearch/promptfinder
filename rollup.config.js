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
    isProd &&
      terser({
        compress: {
          drop_console: false, // Keep console.log for analytics but remove debug
          drop_debugger: true,
          pure_funcs: ['console.debug', 'console.trace', 'console.table'],
          // Fix Chrome extension compatibility
          unsafe: false,
          unsafe_comps: false,
          unsafe_Function: false,
          unsafe_math: false,
          unsafe_symbols: false,
          unsafe_methods: false,
          unsafe_proto: false,
          unsafe_regexp: false,
          unsafe_undefined: false,
        },
        mangle: {
          // Disable mangling for Chrome extension compatibility
          reserved: ['import', 'export', 'require', 'module', 'exports'],
        },
        format: {
          comments: false,
          // Ensure ES5 compatibility for Chrome extensions
          ecma: 2018, // Changed from 5 to 2018 to support dynamic imports
        },
      }),
  ].filter(Boolean);

const entryPoints = [
  {
    input: 'js/firebase-init.js',
    output: {
      file: 'dist/js/firebase-init.js',
      format: 'iife',
      name: 'FirebaseInit',
      sourcemap: !isProduction,
    },
  },
  {
    input: 'app.js',
    output: {
      file: 'dist/js/app.js',
      format: 'iife',
      sourcemap: !isProduction,
      // Preserve dynamic imports for Chrome extension environment
      inlineDynamicImports: false,
    },
  },
  // Removed add-prompt.js entry as the file has been deleted and functionality integrated into main UI
  // Removed edit-prompt.js entry as the file has been deleted
];

export default entryPoints.map(entry => ({
  input: entry.input,
  output: entry.output,
  plugins: commonPlugins(isProduction),
  external: id => {
    // For app.js, preserve dynamic imports as external to avoid bundling issues
    if (entry.input === 'app.js') {
      // Keep dynamic imports external to preserve them in the output
      if (id.startsWith('./js/')) {
        return true;
      }
    }
    // Bundle prismjs instead of keeping it external
    if (id.includes('prismjs')) {
      return false;
    }
    return false;
  },
  watch: {
    clearScreen: false,
  },
}));
