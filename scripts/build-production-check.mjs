#!/usr/bin/env node

/**
 * Production Build Check for DesignPrompts Chrome Extension
 *
 * Simplified check focusing on critical production issues:
 * - Source maps excluded in production
 * - System files excluded
 * - Required files present
 * - No test files in build output
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Production Build Check for DesignPrompts...\n');

const issues = [];
const checks = [];

// Check 1: No source maps in production build
console.log('1. Checking for source maps...');
const distDir = 'dist';
if (fs.existsSync(distDir)) {
  const mapFiles = findFiles(distDir, /\.map$/);
  if (mapFiles.length > 0) {
    issues.push(`❌ Source maps found in production build: ${mapFiles.join(', ')}`);
  } else {
    checks.push('✅ No source maps in production build');
  }
} else {
  issues.push('❌ dist directory not found - run build first');
}

// Check 2: No system files
console.log('2. Checking for system files...');
const systemFiles = findFiles('.', /\.DS_Store$/);
const buildSystemFiles = systemFiles.filter(f => f.includes('dist/') || f.includes('css-min/'));
if (buildSystemFiles.length > 0) {
  issues.push(`❌ System files found in build: ${buildSystemFiles.join(', ')}`);
} else {
  checks.push('✅ No system files in build directories');
}

// Check 3: Required files present
console.log('3. Checking required files...');
const requiredFiles = [
  'manifest.json',
  'pages/popup.html',
  'dist/js/app.js',
  'dist/js/firebase-init.js',
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    checks.push(`✅ ${file} present`);
  } else {
    issues.push(`❌ Required file missing: ${file}`);
  }
}

// Check 4: Test files excluded from build
console.log('4. Checking for test files in build...');
const testFiles = findFiles('dist', /test|spec/i);
if (testFiles.length > 0) {
  issues.push(`❌ Test files found in build: ${testFiles.join(', ')}`);
} else {
  checks.push('✅ No test files in build output');
}

// Check 5: JS files are minified
console.log('5. Checking JS minification...');
if (fs.existsSync('dist/js/app.js')) {
  const content = fs.readFileSync('dist/js/app.js', 'utf-8');
  // Check if it starts with minified pattern
  const isMinified =
    content.startsWith('!function()') ||
    content.startsWith('(function()') ||
    (content.length > 1000 && content.split('\n').length < 20);

  if (isMinified) {
    checks.push('✅ JS files are minified');
  } else {
    issues.push('❌ JS files do not appear to be minified');
  }
}

// Check 6: CSS files are optimized
console.log('6. Checking CSS optimization...');
const cssFiles = findFiles('css-min', /\.css$/);
if (cssFiles.length > 0) {
  checks.push(`✅ CSS files optimized (${cssFiles.length} files)`);
} else {
  issues.push('❌ No optimized CSS files found');
}

// Results
console.log('\n🎯 PRODUCTION BUILD CHECK RESULTS');
console.log('='.repeat(50));

if (checks.length > 0) {
  console.log('\n✅ PASSED CHECKS:');
  checks.forEach(check => console.log(`   ${check}`));
}

if (issues.length > 0) {
  console.log('\n❌ ISSUES FOUND:');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n🔧 RECOMMENDED ACTIONS:');

  if (issues.some(i => i.includes('Source maps'))) {
    console.log('   - Ensure NODE_ENV=production for build');
    console.log('   - Check rollup.config.js sourcemap setting');
  }

  if (issues.some(i => i.includes('System files'))) {
    console.log('   - Run: find . -name ".DS_Store" -delete');
    console.log('   - Add .DS_Store to .gitignore');
  }

  if (issues.some(i => i.includes('minified'))) {
    console.log('   - Check terser plugin configuration');
    console.log('   - Verify production build process');
  }

  console.log('\n❌ BUILD NOT READY FOR PRODUCTION');
  process.exit(1);
} else {
  console.log('\n🎉 ALL CHECKS PASSED - BUILD READY FOR PRODUCTION!');
  process.exit(0);
}

// Utility function
function findFiles(dir, pattern) {
  const files = [];

  if (!fs.existsSync(dir)) return files;

  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules') {
            scan(fullPath);
          }
        } else if (pattern.test(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  scan(dir);
  return files;
}
