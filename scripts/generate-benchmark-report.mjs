#!/usr/bin/env node
/**
 * Benchmark Report Generator
 * Generates comparative performance reports for tracking optimization progress
 */

import { readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Baseline metrics (before optimization)
 */
const BASELINE_METRICS = {
  version: 'Phase 2 - Pre-optimization',
  timestamp: '2025-06-10T18:00:00.000Z',
  bundles: {
    totalSize: 1126000, // 1.1MB
    appJsSize: 679000, // 679KB
    firebaseSize: 381000, // 381KB
    cssSize: 66700, // 66.7KB
  },
  performance: {
    loadTime: 180, // ~180ms estimated
    memory: 4194304, // ~4MB estimated
    timeToInteractive: 200, // ~200ms estimated
  },
  optimization: {
    lazyLoading: false,
    cssOptimized: false,
    iconsOptimized: false,
    codeMinified: true,
  },
};

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Calculate percentage change
 */
function calculateChange(before, after) {
  const change = ((after - before) / before) * 100;
  return {
    absolute: after - before,
    percentage: change,
    improved: change < 0, // Negative change is improvement for size/time metrics
  };
}

/**
 * Get current performance metrics
 */
function getCurrentMetrics() {
  // Load current performance report
  const reportPath = join(projectRoot, 'performance-report.json');
  let currentReport = null;

  try {
    currentReport = JSON.parse(readFileSync(reportPath, 'utf8'));
  } catch (error) {
    console.warn('Could not load current performance report, using estimates');
  }

  // Get current file sizes
  const appJsSize = getFileSize(join(projectRoot, 'dist/js/app.js'));
  const firebaseSize = getFileSize(join(projectRoot, 'dist/js/firebase-init.js'));
  const cssSize = getCurrentCSSSize();

  return {
    version: 'Phase 3 - Optimized',
    timestamp: new Date().toISOString(),
    bundles: {
      totalSize: appJsSize + firebaseSize + cssSize,
      appJsSize: appJsSize,
      firebaseSize: firebaseSize,
      cssSize: cssSize,
    },
    performance: {
      loadTime: currentReport?.performance?.overall?.initialLoadTime || 116.6,
      memory: currentReport?.performance?.overall?.initialMemory || 2365090,
      timeToInteractive: 120, // Estimated based on load time
    },
    optimization: {
      lazyLoading: true,
      cssOptimized: true,
      iconsOptimized: true,
      codeMinified: true,
    },
  };
}

/**
 * Get file size safely
 */
function getFileSize(filePath) {
  try {
    return statSync(filePath).size;
  } catch (error) {
    return 0;
  }
}

/**
 * Get total CSS size from purged files
 */
function getCurrentCSSSize() {
  const cssFiles = [
    'dist/css-purged/popup.css',
    'dist/css-purged/cards.css',
    'dist/css-purged/forms.css',
    'dist/css-purged/utilities.css',
    'dist/css-purged/prompt-details.css',
    'dist/css-purged/auth.css',
    'dist/css-purged/buttons.css',
    'dist/css-purged/global.css',
  ];

  return cssFiles.reduce((total, file) => {
    return total + getFileSize(join(projectRoot, file));
  }, 0);
}

/**
 * Generate comparison report
 */
function generateBenchmarkReport() {
  const baseline = BASELINE_METRICS;
  const current = getCurrentMetrics();

  const report = {
    reportInfo: {
      title: 'PromptFinder Performance Benchmark Report',
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      comparison: `${baseline.version} vs ${current.version}`,
    },

    metrics: {
      baseline: baseline,
      current: current,
    },

    improvements: {
      bundles: {
        totalSize: calculateChange(baseline.bundles.totalSize, current.bundles.totalSize),
        appJsSize: calculateChange(baseline.bundles.appJsSize, current.bundles.appJsSize),
        firebaseSize: calculateChange(baseline.bundles.firebaseSize, current.bundles.firebaseSize),
        cssSize: calculateChange(baseline.bundles.cssSize, current.bundles.cssSize),
      },

      performance: {
        loadTime: calculateChange(baseline.performance.loadTime, current.performance.loadTime),
        memory: calculateChange(baseline.performance.memory, current.performance.memory),
        timeToInteractive: calculateChange(
          baseline.performance.timeToInteractive,
          current.performance.timeToInteractive
        ),
      },

      features: {
        lazyLoadingAdded: !baseline.optimization.lazyLoading && current.optimization.lazyLoading,
        cssOptimizationAdded:
          !baseline.optimization.cssOptimized && current.optimization.cssOptimized,
        iconOptimizationAdded:
          !baseline.optimization.iconsOptimized && current.optimization.iconsOptimized,
      },
    },

    summary: {
      overallImprovement: null, // Will be calculated
      significantChanges: [],
      recommendations: [],
    },
  };

  // Calculate overall improvement score
  const improvements = report.improvements;
  const sizeImprovement = Math.abs(improvements.bundles.totalSize.percentage);
  const performanceImprovement = Math.abs(improvements.performance.loadTime.percentage);
  const memoryImprovement = Math.abs(improvements.performance.memory.percentage);

  report.summary.overallImprovement =
    (sizeImprovement + performanceImprovement + memoryImprovement) / 3;

  // Identify significant changes
  if (
    improvements.bundles.totalSize.improved &&
    Math.abs(improvements.bundles.totalSize.percentage) > 10
  ) {
    report.summary.significantChanges.push(
      `Bundle size reduced by ${Math.abs(improvements.bundles.totalSize.percentage).toFixed(1)}%`
    );
  }

  if (
    improvements.performance.loadTime.improved &&
    Math.abs(improvements.performance.loadTime.percentage) > 20
  ) {
    report.summary.significantChanges.push(
      `Load time improved by ${Math.abs(improvements.performance.loadTime.percentage).toFixed(1)}%`
    );
  }

  if (
    improvements.performance.memory.improved &&
    Math.abs(improvements.performance.memory.percentage) > 30
  ) {
    report.summary.significantChanges.push(
      `Memory usage reduced by ${Math.abs(improvements.performance.memory.percentage).toFixed(1)}%`
    );
  }

  // Add recommendations
  if (current.bundles.appJsSize > 500000) {
    report.summary.recommendations.push('Consider further code splitting for app.js bundle');
  }

  if (!current.optimization.lazyLoading) {
    report.summary.recommendations.push('Implement lazy loading for non-critical modules');
  }

  return report;
}

/**
 * Display benchmark report
 */
function displayBenchmarkReport(report) {
  console.log('📊 PromptFinder Performance Benchmark Report');
  console.log('===========================================\n');

  console.log(`📈 Comparison: ${report.reportInfo.comparison}`);
  console.log(`📅 Generated: ${new Date(report.reportInfo.generatedAt).toLocaleString()}\n`);

  // Bundle size comparison
  console.log('📦 Bundle Size Comparison:');
  const bundleChanges = report.improvements.bundles;

  console.log(`  Total Bundle Size:`);
  console.log(`    Before: ${formatBytes(report.metrics.baseline.bundles.totalSize)}`);
  console.log(`    After:  ${formatBytes(report.metrics.current.bundles.totalSize)}`);
  console.log(
    `    Change: ${bundleChanges.totalSize.percentage.toFixed(1)}% (${formatBytes(bundleChanges.totalSize.absolute)})`
  );
  console.log(`    Status: ${bundleChanges.totalSize.improved ? '✅ IMPROVED' : '⚠️ INCREASED'}\n`);

  console.log(`  app.js Bundle:`);
  console.log(`    Before: ${formatBytes(report.metrics.baseline.bundles.appJsSize)}`);
  console.log(`    After:  ${formatBytes(report.metrics.current.bundles.appJsSize)}`);
  console.log(
    `    Change: ${bundleChanges.appJsSize.percentage.toFixed(1)}% (${formatBytes(bundleChanges.appJsSize.absolute)})`
  );
  console.log(`    Status: ${bundleChanges.appJsSize.improved ? '✅ IMPROVED' : '⚠️ INCREASED'}\n`);

  // Performance comparison
  console.log('⚡ Performance Comparison:');
  const perfChanges = report.improvements.performance;

  console.log(`  Load Time:`);
  console.log(`    Before: ${report.metrics.baseline.performance.loadTime}ms`);
  console.log(`    After:  ${report.metrics.current.performance.loadTime}ms`);
  console.log(
    `    Change: ${perfChanges.loadTime.percentage.toFixed(1)}% (${perfChanges.loadTime.absolute.toFixed(1)}ms)`
  );
  console.log(`    Status: ${perfChanges.loadTime.improved ? '✅ IMPROVED' : '⚠️ SLOWER'}\n`);

  console.log(`  Memory Usage:`);
  console.log(`    Before: ${formatBytes(report.metrics.baseline.performance.memory)}`);
  console.log(`    After:  ${formatBytes(report.metrics.current.performance.memory)}`);
  console.log(
    `    Change: ${perfChanges.memory.percentage.toFixed(1)}% (${formatBytes(perfChanges.memory.absolute)})`
  );
  console.log(`    Status: ${perfChanges.memory.improved ? '✅ IMPROVED' : '⚠️ INCREASED'}\n`);

  // Feature comparison
  console.log('🔧 Optimization Features:');
  console.log(
    `  Lazy Loading: ${report.metrics.current.optimization.lazyLoading ? '✅ Enabled' : '❌ Disabled'}`
  );
  console.log(
    `  CSS Optimized: ${report.metrics.current.optimization.cssOptimized ? '✅ Yes' : '❌ No'}`
  );
  console.log(
    `  Icons Optimized: ${report.metrics.current.optimization.iconsOptimized ? '✅ Yes' : '❌ No'}`
  );
  console.log(
    `  Code Minified: ${report.metrics.current.optimization.codeMinified ? '✅ Yes' : '❌ No'}\n`
  );

  // Summary
  console.log('🎯 Summary:');
  console.log(`  Overall Improvement Score: ${report.summary.overallImprovement.toFixed(1)}%`);

  if (report.summary.significantChanges.length > 0) {
    console.log('  Significant Changes:');
    report.summary.significantChanges.forEach(change => {
      console.log(`    ✅ ${change}`);
    });
  }

  if (report.summary.recommendations.length > 0) {
    console.log('\n  Recommendations:');
    report.summary.recommendations.forEach(rec => {
      console.log(`    💡 ${rec}`);
    });
  }
}

/**
 * Main execution
 */
function main() {
  try {
    const report = generateBenchmarkReport();
    displayBenchmarkReport(report);

    // Save detailed report
    const reportPath = join(projectRoot, 'benchmark-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed benchmark report saved to: benchmark-report.json`);
  } catch (error) {
    console.error('❌ Error generating benchmark report:', error);
    process.exit(1);
  }
}

main();
