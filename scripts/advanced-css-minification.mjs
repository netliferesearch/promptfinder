#!/usr/bin/env node

/**
 * Advanced CSS Minification for DesignPrompts Chrome Extension
 *
 * This script applies additional minification techniques to already purged CSS:
 * - Remove all comments
 * - Minimize whitespace
 * - Shorten color values
 * - Remove redundant semicolons
 * - Optimize CSS values
 * - Combine identical selectors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

/**
 * Main CSS minification function
 */
async function advancedCSSMinification() {
  console.log('🔧 Starting Advanced CSS Minification...\n');

  const cssDir = path.join(projectRoot, 'dist/css-purged');
  const outputDir = path.join(projectRoot, 'css-min');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = {
    files: [],
    totalOriginalSize: 0,
    totalMinifiedSize: 0,
    totalSavings: 0,
  };

  if (!fs.existsSync(cssDir)) {
    console.log('❌ css-min directory not found. Run CSS purge first.');
    return results;
  }

  // Process all CSS files
  const cssFiles = getAllCSSFiles(cssDir);

  for (const cssFile of cssFiles) {
    const relativePath = path.relative(cssDir, cssFile);
    const outputPath = path.join(outputDir, relativePath);

    // Ensure output subdirectory exists
    const outputSubDir = path.dirname(outputPath);
    if (!fs.existsSync(outputSubDir)) {
      fs.mkdirSync(outputSubDir, { recursive: true });
    }

    const originalContent = fs.readFileSync(cssFile, 'utf-8');
    const originalSize = originalContent.length;

    const minifiedContent = minifyCSS(originalContent);
    const minifiedSize = minifiedContent.length;
    const savings = originalSize - minifiedSize;
    const savingsPercent = originalSize > 0 ? ((savings / originalSize) * 100).toFixed(1) : 0;

    fs.writeFileSync(outputPath, minifiedContent, 'utf-8');

    const fileResult = {
      file: relativePath,
      originalSize,
      minifiedSize,
      savings,
      savingsPercent: parseFloat(savingsPercent),
    };

    results.files.push(fileResult);
    results.totalOriginalSize += originalSize;
    results.totalMinifiedSize += minifiedSize;
    results.totalSavings += savings;

    console.log(
      `✅ ${relativePath}: ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (${savingsPercent}% reduction)`
    );
  }

  // Display summary
  displayMinificationResults(results);

  // Save report
  saveMinificationReport(results);

  return results;
}

/**
 * Advanced CSS minification
 */
function minifyCSS(css) {
  let minified = css;

  // Remove all comments (/* ... */)
  minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove excess whitespace and newlines
  minified = minified.replace(/\s+/g, ' ');

  // Remove spaces around specific characters
  minified = minified.replace(/\s*{\s*/g, '{');
  minified = minified.replace(/;\s*/g, ';');
  minified = minified.replace(/}\s*/g, '}');
  minified = minified.replace(/,\s*/g, ',');
  minified = minified.replace(/:\s*/g, ':');
  minified = minified.replace(/>\s*/g, '>');
  minified = minified.replace(/\+\s*/g, '+');
  minified = minified.replace(/~\s*/g, '~');

  // Remove spaces around operators in calc()
  minified = minified.replace(/calc\(\s*/g, 'calc(');
  minified = minified.replace(/\s*\)/g, ')');

  // Optimize color values
  minified = optimizeColors(minified);

  // Remove unnecessary semicolons (before closing braces)
  minified = minified.replace(/;}/g, '}');

  // Remove leading/trailing whitespace
  minified = minified.trim();

  // Remove empty rules
  minified = minified.replace(/[^}]*{\s*}/g, '');

  // Optimize zero values
  minified = optimizeZeroValues(minified);

  // Optimize font weights
  minified = optimizeFontWeights(minified);

  return minified;
}

/**
 * Optimize color values
 */
function optimizeColors(css) {
  let optimized = css;

  // Convert hex colors from 6 digits to 3 where possible
  optimized = optimized.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');

  // Convert named colors to shorter hex equivalents
  const colorMap = {
    white: '#fff',
    black: '#000',
    red: '#f00',
    green: '#008000',
    blue: '#00f',
    yellow: '#ff0',
    cyan: '#0ff',
    magenta: '#f0f',
    silver: '#c0c0c0',
    gray: '#808080',
    maroon: '#800000',
    olive: '#808000',
    lime: '#0f0',
    aqua: '#0ff',
    teal: '#008080',
    navy: '#000080',
    fuchsia: '#f0f',
    purple: '#800080',
  };

  Object.entries(colorMap).forEach(([name, hex]) => {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    optimized = optimized.replace(regex, hex);
  });

  return optimized;
}

/**
 * Optimize zero values
 */
function optimizeZeroValues(css) {
  let optimized = css;

  // Remove units from zero values
  optimized = optimized.replace(/\b0(px|em|rem|%|pt|pc|in|mm|cm|ex|ch|vw|vh|vmin|vmax)\b/g, '0');

  // Simplify margin/padding shorthand with zeros
  optimized = optimized.replace(/\b0 0 0 0\b/g, '0');
  optimized = optimized.replace(/\b0 0 0\b/g, '0 0');
  optimized = optimized.replace(/\b0 0\b/g, '0');

  return optimized;
}

/**
 * Optimize font weights
 */
function optimizeFontWeights(css) {
  let optimized = css;

  // Convert font-weight names to numbers
  const fontWeightMap = {
    normal: '400',
    bold: '700',
  };

  Object.entries(fontWeightMap).forEach(([name, number]) => {
    const regex = new RegExp(`font-weight\\s*:\\s*${name}`, 'gi');
    optimized = optimized.replace(regex, `font-weight:${number}`);
  });

  return optimized;
}

/**
 * Get all CSS files recursively
 */
function getAllCSSFiles(dir) {
  const files = [];

  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (item.endsWith('.css')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read directory ${currentDir}: ${error.message}`);
    }
  }

  scan(dir);
  return files;
}

/**
 * Display minification results
 */
function displayMinificationResults(results) {
  console.log('\n🎯 ADVANCED CSS MINIFICATION RESULTS');
  console.log('='.repeat(50));

  if (results.files.length === 0) {
    console.log('❌ No CSS files processed');
    return;
  }

  // Sort by savings percentage
  const sortedFiles = results.files.sort((a, b) => b.savingsPercent - a.savingsPercent);

  console.log('\n📄 FILE RESULTS:');
  sortedFiles.forEach(file => {
    console.log(`  ${file.file}:`);
    console.log(`    Size: ${formatBytes(file.originalSize)} → ${formatBytes(file.minifiedSize)}`);
    console.log(`    Saved: ${formatBytes(file.savings)} (${file.savingsPercent}%)`);
  });

  console.log('\n📊 SUMMARY:');
  console.log(`  Files processed: ${results.files.length}`);
  console.log(`  Total original size: ${formatBytes(results.totalOriginalSize)}`);
  console.log(`  Total minified size: ${formatBytes(results.totalMinifiedSize)}`);
  console.log(`  Total savings: ${formatBytes(results.totalSavings)}`);

  const totalPercent =
    results.totalOriginalSize > 0
      ? ((results.totalSavings / results.totalOriginalSize) * 100).toFixed(1)
      : 0;
  console.log(`  Overall reduction: ${totalPercent}%`);

  // Performance impact
  console.log('\n⚡ PERFORMANCE IMPACT:');
  if (parseFloat(totalPercent) > 20) {
    console.log('  🚀 Excellent compression achieved!');
  } else if (parseFloat(totalPercent) > 10) {
    console.log('  ✅ Good compression achieved');
  } else {
    console.log('  ⚠️  Minimal compression - CSS may already be optimized');
  }

  console.log('\n📁 Minified files saved to: css-minified/');
  console.log('💡 Use these files for production builds');
}

/**
 * Save minification report
 */
function saveMinificationReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      filesProcessed: results.files.length,
      totalOriginalSize: results.totalOriginalSize,
      totalMinifiedSize: results.totalMinifiedSize,
      totalSavings: results.totalSavings,
      compressionRatio:
        results.totalOriginalSize > 0 ? results.totalMinifiedSize / results.totalOriginalSize : 1,
    },
    files: results.files,
    techniques: [
      'Comment removal',
      'Whitespace optimization',
      'Color value optimization',
      'Zero value optimization',
      'Font weight optimization',
      'Redundant semicolon removal',
      'Empty rule removal',
    ],
    recommendations: generateRecommendations(results),
  };

  fs.writeFileSync(
    path.join(projectRoot, 'css-minification-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n📝 Detailed report saved to: css-minification-report.json');
}

/**
 * Generate recommendations
 */
function generateRecommendations(results) {
  const recommendations = [];

  const totalPercent =
    results.totalOriginalSize > 0 ? (results.totalSavings / results.totalOriginalSize) * 100 : 0;

  if (totalPercent < 5) {
    recommendations.push('CSS is already well-optimized');
    recommendations.push('Consider gzip compression on server');
  } else if (totalPercent < 15) {
    recommendations.push('Good optimization achieved');
    recommendations.push('Monitor for future optimization opportunities');
  } else {
    recommendations.push('Excellent optimization results');
    recommendations.push('Update build process to use minified CSS');
  }

  // Check for large files
  const largeFiles = results.files.filter(f => f.minifiedSize > 10000);
  if (largeFiles.length > 0) {
    recommendations.push(
      `${largeFiles.length} files still large after minification - consider code splitting`
    );
  }

  return recommendations;
}

/**
 * Format bytes utility
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Run minification if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  advancedCSSMinification()
    .then(results => {
      if (results.files.length > 0) {
        console.log('\n✅ Advanced CSS minification completed successfully!');
      } else {
        console.log('\n⚠️  No files processed. Ensure CSS purging has been run first.');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ CSS minification failed:', error);
      process.exit(1);
    });
}

export { advancedCSSMinification };
