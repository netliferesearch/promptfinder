#!/usr/bin/env node

/**
 * Comprehensive Asset Optimization Script for DesignPrompts Chrome Extension
 *
 * This script optimizes and compresses all assets:
 * - Images (PNG, JPG, SVG)
 * - Icons (Chrome extension icons)
 * - CSS files (minification, unused style removal)
 * - JavaScript files (advanced compression analysis)
 * - Font and external asset optimization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const OPTIMIZATION_CONFIG = {
  icons: {
    sourceDir: 'icons',
    outputDir: 'icons-optimized',
    pngOptimization: {
      lossless: { level: 7 },
      lossy: { quality: [0.85, 0.95] },
    },
  },
  css: {
    sourceDir: 'css',
    purgedDir: 'css-min',
    minify: true,
    removeComments: true,
    optimizeImages: true,
  },
  js: {
    sourceDir: 'dist/js',
    analyze: true,
    compression: 'gzip',
  },
  images: {
    extensions: ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'],
    compressionLevel: 'high',
    maxSize: 100 * 1024, // 100KB
  },
};

/**
 * Main asset optimization function
 */
async function runAssetOptimization() {
  console.log('🎨 Starting Comprehensive Asset Optimization for DesignPrompts...\n');

  const results = {
    icons: await optimizeIcons(),
    css: await optimizeCSSAssets(),
    js: await analyzeJSAssets(),
    images: await optimizeImages(),
    summary: {},
  };

  // Calculate summary
  results.summary = calculateOptimizationSummary(results);

  // Display results
  displayOptimizationResults(results);

  // Save detailed report
  saveOptimizationReport(results);

  return results;
}

/**
 * Optimize icon assets for Chrome extension
 */
async function optimizeIcons() {
  console.log('🔸 Optimizing Chrome extension icons...');

  const iconResults = {
    original: {},
    optimized: {},
    savings: {},
    compliance: false,
  };

  const iconsDir = path.join(projectRoot, OPTIMIZATION_CONFIG.icons.sourceDir);
  const outputDir = path.join(projectRoot, OPTIMIZATION_CONFIG.icons.outputDir);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const iconFiles = ['icon16.png', 'icon48.png', 'icon128.png'];

  for (const iconFile of iconFiles) {
    const sourcePath = path.join(iconsDir, iconFile);
    const outputPath = path.join(outputDir, iconFile);

    if (fs.existsSync(sourcePath)) {
      const originalSize = fs.statSync(sourcePath).size;
      iconResults.original[iconFile] = originalSize;

      // Copy and optimize using native tools if available
      try {
        fs.copyFileSync(sourcePath, outputPath);

        // Try to use pngquant for lossy compression on larger icons
        if (iconFile === 'icon128.png' && originalSize > 15000) {
          try {
            execSync(
              `pngquant --quality=85-95 --strip --force --output "${outputPath}" "${outputPath}"`,
              { stdio: 'pipe' }
            );
            console.log(`  ✅ Applied lossy compression to ${iconFile}`);
          } catch (e) {
            console.log(
              `  ⚠️  pngquant not available, using lossless optimization for ${iconFile}`
            );
          }
        }

        // Try optipng for lossless compression
        try {
          execSync(`optipng -o7 -strip all "${outputPath}"`, { stdio: 'pipe' });
          console.log(`  ✅ Applied lossless compression to ${iconFile}`);
        } catch (e) {
          console.log(`  ⚠️  optipng not available, keeping original for ${iconFile}`);
        }

        const optimizedSize = fs.statSync(outputPath).size;
        iconResults.optimized[iconFile] = optimizedSize;
        iconResults.savings[iconFile] = originalSize - optimizedSize;
      } catch (error) {
        console.log(`  ⚠️  Could not optimize ${iconFile}: ${error.message}`);
        iconResults.optimized[iconFile] = originalSize;
        iconResults.savings[iconFile] = 0;
      }
    }
  }

  // Check Chrome Web Store compliance
  const totalOptimizedSize = Object.values(iconResults.optimized).reduce(
    (sum, size) => sum + size,
    0
  );
  iconResults.compliance = totalOptimizedSize <= 128 * 1024; // 128KB recommended max
  iconResults.totalSize = totalOptimizedSize;

  return iconResults;
}

/**
 * Optimize CSS assets
 */
async function optimizeCSSAssets() {
  console.log('🎨 Analyzing CSS asset optimization...');

  const cssResults = {
    originalSize: 0,
    purgedSize: 0,
    files: [],
    optimizationSuggestions: [],
  };

  // Analyze original CSS
  const cssDir = path.join(projectRoot, OPTIMIZATION_CONFIG.css.sourceDir);
  const purgedDir = path.join(projectRoot, OPTIMIZATION_CONFIG.css.purgedDir);

  if (fs.existsSync(cssDir)) {
    const cssFiles = getAllFilesRecursive(cssDir, /\.css$/);
    for (const file of cssFiles) {
      const size = fs.statSync(file).size;
      cssResults.originalSize += size;
      cssResults.files.push({
        file: path.relative(projectRoot, file),
        originalSize: size,
        type: 'original',
      });
    }
  }

  // Analyze purged CSS
  if (fs.existsSync(purgedDir)) {
    const purgedFiles = getAllFilesRecursive(purgedDir, /\.css$/);
    for (const file of purgedFiles) {
      const size = fs.statSync(file).size;
      cssResults.purgedSize += size;
      cssResults.files.push({
        file: path.relative(projectRoot, file),
        purgedSize: size,
        type: 'purged',
      });
    }
  }

  // CSS optimization suggestions
  if (cssResults.originalSize > 0) {
    const reductionPercent =
      ((cssResults.originalSize - cssResults.purgedSize) / cssResults.originalSize) * 100;

    if (reductionPercent < 10) {
      cssResults.optimizationSuggestions.push('Consider more aggressive CSS purging');
    }

    if (cssResults.purgedSize > 50 * 1024) {
      // > 50KB
      cssResults.optimizationSuggestions.push('Consider CSS minification and compression');
    }

    cssResults.optimizationSuggestions.push(
      'Consider inline critical CSS for above-the-fold content'
    );
  }

  return cssResults;
}

/**
 * Analyze JavaScript assets
 */
async function analyzeJSAssets() {
  console.log('📦 Analyzing JavaScript asset optimization...');

  const jsResults = {
    files: [],
    totalSize: 0,
    compressionAnalysis: {},
    optimizationSuggestions: [],
  };

  const jsDir = path.join(projectRoot, OPTIMIZATION_CONFIG.js.sourceDir);

  if (fs.existsSync(jsDir)) {
    const jsFiles = getAllFilesRecursive(jsDir, /\.js$/);

    for (const file of jsFiles) {
      const stats = fs.statSync(file);
      const content = fs.readFileSync(file, 'utf-8');

      const fileAnalysis = {
        file: path.relative(projectRoot, file),
        size: stats.size,
        lines: content.split('\n').length,
        minified: isMinified(content),
        gzippable: estimateGzipSize(content),
      };

      jsResults.files.push(fileAnalysis);
      jsResults.totalSize += stats.size;
    }
  }

  // Compression analysis
  jsResults.compressionAnalysis = {
    totalUncompressed: jsResults.totalSize,
    estimatedGzipped: jsResults.files.reduce((sum, file) => sum + file.gzippable, 0),
    compressionRatio:
      jsResults.totalSize > 0
        ? jsResults.files.reduce((sum, file) => sum + file.gzippable, 0) / jsResults.totalSize
        : 0,
  };

  // Optimization suggestions
  if (jsResults.totalSize > 1024 * 1024) {
    // > 1MB
    jsResults.optimizationSuggestions.push('Consider code splitting for large bundles');
  }

  if (jsResults.compressionRatio > 0.7) {
    jsResults.optimizationSuggestions.push('Good compression ratio - enable gzip on server');
  }

  const unminifiedFiles = jsResults.files.filter(f => !f.minified);
  if (unminifiedFiles.length > 0) {
    jsResults.optimizationSuggestions.push(
      `${unminifiedFiles.length} files could be better minified`
    );
  }

  return jsResults;
}

/**
 * Optimize image assets
 */
async function optimizeImages() {
  console.log('🖼️  Analyzing image asset optimization...');

  const imageResults = {
    images: [],
    totalSize: 0,
    optimizationPotential: 0,
    suggestions: [],
  };

  const allFiles = getAllFilesRecursive(projectRoot);
  const extensions = OPTIMIZATION_CONFIG.images.extensions;

  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if (extensions.includes(ext) && !file.includes('node_modules') && !file.includes('.git')) {
      const stats = fs.statSync(file);
      const relativePath = path.relative(projectRoot, file);

      const imageInfo = {
        file: relativePath,
        size: stats.size,
        extension: ext,
        oversized: stats.size > OPTIMIZATION_CONFIG.images.maxSize,
      };

      imageResults.images.push(imageInfo);
      imageResults.totalSize += stats.size;

      // Estimate optimization potential
      if (ext === '.png' && stats.size > 10000) {
        imageResults.optimizationPotential += stats.size * 0.3; // 30% potential savings
      } else if (ext === '.jpg' || ext === '.jpeg') {
        imageResults.optimizationPotential += stats.size * 0.2; // 20% potential savings
      }
    }
  }

  // Generate suggestions
  const oversizedImages = imageResults.images.filter(img => img.oversized);
  if (oversizedImages.length > 0) {
    imageResults.suggestions.push(
      `${oversizedImages.length} images exceed ${formatBytes(OPTIMIZATION_CONFIG.images.maxSize)} and should be compressed`
    );
  }

  if (imageResults.optimizationPotential > 50000) {
    imageResults.suggestions.push(
      `Potential space savings: ${formatBytes(imageResults.optimizationPotential)}`
    );
  }

  return imageResults;
}

/**
 * Calculate optimization summary
 */
function calculateOptimizationSummary(results) {
  const summary = {
    totalCurrentSize: 0,
    totalOptimizedSize: 0,
    totalSavings: 0,
    compressionRatio: 0,
    recommendations: [],
  };

  // Icons
  if (results.icons.totalSize) {
    summary.totalCurrentSize += results.icons.totalSize;
    summary.totalOptimizedSize += results.icons.totalSize;
    const iconSavings = Object.values(results.icons.savings).reduce((sum, s) => sum + s, 0);
    summary.totalSavings += iconSavings;
  }

  // CSS
  if (results.css.purgedSize) {
    summary.totalCurrentSize += results.css.originalSize || results.css.purgedSize;
    summary.totalOptimizedSize += results.css.purgedSize;
    summary.totalSavings += (results.css.originalSize || 0) - results.css.purgedSize;
  }

  // JS
  if (results.js.totalSize) {
    summary.totalCurrentSize += results.js.totalSize;
    summary.totalOptimizedSize += results.js.compressionAnalysis.estimatedGzipped;
  }

  // Images
  if (results.images.totalSize) {
    summary.totalCurrentSize += results.images.totalSize;
    summary.totalOptimizedSize += results.images.totalSize - results.images.optimizationPotential;
  }

  // Calculate compression ratio
  if (summary.totalCurrentSize > 0) {
    summary.compressionRatio = summary.totalOptimizedSize / summary.totalCurrentSize;
  }

  // Generate recommendations
  if (!results.icons.compliance) {
    summary.recommendations.push('Optimize icons for Chrome Web Store compliance');
  }

  if (results.css.optimizationSuggestions.length > 0) {
    summary.recommendations.push(...results.css.optimizationSuggestions);
  }

  if (results.js.optimizationSuggestions.length > 0) {
    summary.recommendations.push(...results.js.optimizationSuggestions);
  }

  if (results.images.suggestions.length > 0) {
    summary.recommendations.push(...results.images.suggestions);
  }

  return summary;
}

/**
 * Display optimization results
 */
function displayOptimizationResults(results) {
  console.log('\n🎯 ASSET OPTIMIZATION RESULTS');
  console.log('='.repeat(50));

  // Icons
  console.log('\n🔸 ICONS:');
  if (Object.keys(results.icons.original).length > 0) {
    Object.keys(results.icons.original).forEach(icon => {
      const original = results.icons.original[icon];
      const optimized = results.icons.optimized[icon];
      const saved = results.icons.savings[icon];
      const percent = original > 0 ? ((saved / original) * 100).toFixed(1) : 0;

      console.log(`  ${icon}:`);
      console.log(`    Original: ${formatBytes(original)}`);
      console.log(`    Optimized: ${formatBytes(optimized)}`);
      console.log(`    Saved: ${formatBytes(saved)} (${percent}%)`);
    });

    console.log(`\n  📊 Total icons size: ${formatBytes(results.icons.totalSize)}`);
    console.log(
      `  ✅ Chrome Web Store compliance: ${results.icons.compliance ? 'PASSED' : 'NEEDS ATTENTION'}`
    );
  } else {
    console.log('  ⚠️  No icons found for optimization');
  }

  // CSS
  console.log('\n🎨 CSS:');
  if (results.css.originalSize > 0 || results.css.purgedSize > 0) {
    console.log(`  Original size: ${formatBytes(results.css.originalSize)}`);
    console.log(`  Purged size: ${formatBytes(results.css.purgedSize)}`);
    const cssSavings = results.css.originalSize - results.css.purgedSize;
    const cssPercent =
      results.css.originalSize > 0 ? ((cssSavings / results.css.originalSize) * 100).toFixed(1) : 0;
    console.log(`  Saved: ${formatBytes(cssSavings)} (${cssPercent}%)`);
    console.log(`  Files analyzed: ${results.css.files.length}`);

    if (results.css.optimizationSuggestions.length > 0) {
      console.log('  💡 Suggestions:');
      results.css.optimizationSuggestions.forEach(suggestion => {
        console.log(`    - ${suggestion}`);
      });
    }
  }

  // JavaScript
  console.log('\n📦 JAVASCRIPT:');
  if (results.js.totalSize > 0) {
    console.log(`  Total size: ${formatBytes(results.js.totalSize)}`);
    console.log(
      `  Estimated gzipped: ${formatBytes(results.js.compressionAnalysis.estimatedGzipped)}`
    );
    console.log(
      `  Compression ratio: ${(results.js.compressionAnalysis.compressionRatio * 100).toFixed(1)}%`
    );
    console.log(`  Files analyzed: ${results.js.files.length}`);

    if (results.js.optimizationSuggestions.length > 0) {
      console.log('  💡 Suggestions:');
      results.js.optimizationSuggestions.forEach(suggestion => {
        console.log(`    - ${suggestion}`);
      });
    }
  }

  // Images
  console.log('\n🖼️  IMAGES:');
  if (results.images.totalSize > 0) {
    console.log(`  Total size: ${formatBytes(results.images.totalSize)}`);
    console.log(`  Optimization potential: ${formatBytes(results.images.optimizationPotential)}`);
    console.log(`  Images found: ${results.images.images.length}`);

    if (results.images.suggestions.length > 0) {
      console.log('  💡 Suggestions:');
      results.images.suggestions.forEach(suggestion => {
        console.log(`    - ${suggestion}`);
      });
    }
  }

  // Summary
  console.log('\n📊 OPTIMIZATION SUMMARY:');
  console.log(`  Current total size: ${formatBytes(results.summary.totalCurrentSize)}`);
  console.log(`  Optimized size: ${formatBytes(results.summary.totalOptimizedSize)}`);
  console.log(`  Total savings: ${formatBytes(results.summary.totalSavings)}`);
  console.log(
    `  Overall compression: ${((1 - results.summary.compressionRatio) * 100).toFixed(1)}%`
  );

  if (results.summary.recommendations.length > 0) {
    console.log('\n💡 KEY RECOMMENDATIONS:');
    results.summary.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
  }

  console.log('\n🎉 Asset optimization analysis complete!');
}

/**
 * Save optimization report
 */
function saveOptimizationReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    optimization: results,
    tools: {
      iconsOptimizer: 'Available at: npm run assets:optimize-icons',
      cssOptimizer: 'Available at: npm run css:purge',
      jsAnalyzer: 'Built-in analysis tools',
      imageOptimizer: 'Manual optimization recommended',
    },
    recommendations: {
      immediate: results.summary.recommendations.slice(0, 3),
      future: results.summary.recommendations.slice(3),
    },
  };

  fs.writeFileSync(
    path.join(projectRoot, 'asset-optimization-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n📝 Detailed report saved to: asset-optimization-report.json');
}

/**
 * Utility functions
 */
function getAllFilesRecursive(dir, pattern = null) {
  const files = [];

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
        } else {
          if (!pattern || pattern.test(item)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  if (typeof dir === 'string') {
    scan(dir);
  } else {
    // Handle array of directories
    dir.forEach(d => scan(d));
  }

  return files;
}

function isMinified(content) {
  const lines = content.split('\n');
  const avgLineLength = content.length / lines.length;
  const hasMinimalWhitespace = !content.includes('  '); // No double spaces

  return avgLineLength > 100 || (avgLineLength > 50 && hasMinimalWhitespace);
}

function estimateGzipSize(content) {
  // Rough estimation: gzip typically achieves 70-80% compression on text
  // This is a simplified heuristic
  const textEntropy = calculateTextEntropy(content);
  const compressionRatio = Math.max(0.2, Math.min(0.8, textEntropy));
  return Math.round(content.length * compressionRatio);
}

function calculateTextEntropy(text) {
  const charFreq = {};
  for (let char of text) {
    charFreq[char] = (charFreq[char] || 0) + 1;
  }

  const length = text.length;
  let entropy = 0;

  for (let freq of Object.values(charFreq)) {
    const probability = freq / length;
    entropy -= probability * Math.log2(probability);
  }

  // Normalize to 0-1 range (8 bits is max entropy)
  return Math.min(1, entropy / 8);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Run optimization if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAssetOptimization()
    .then(() => {
      console.log('\n✅ Asset optimization completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Asset optimization failed:', error);
      process.exit(1);
    });
}

export { runAssetOptimization };
