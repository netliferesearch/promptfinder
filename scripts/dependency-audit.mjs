#!/usr/bin/env node

/**
 * Dependency Audit Script for DesignPrompts Chrome Extension
 *
 * This script analyzes package.json dependencies and identifies:
 * - Unused dependencies that can be safely removed
 * - Development-only packages that shouldn't be in production
 * - Duplicate or conflicting dependencies
 * - Outdated packages that can be updated
 * - Size optimization opportunities
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const SCAN_DIRECTORIES = ['js', 'pages', 'tests', 'scripts', 'functions'];
const EXCLUDED_DIRECTORIES = ['node_modules', '.git', 'coverage', 'dist', 'build'];

/**
 * Main dependency audit function
 */
async function runDependencyAudit() {
  console.log('📦 Starting Dependency Audit for DesignPrompts...\n');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const allDependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  const results = {
    usage: await analyzeDependencyUsage(allDependencies),
    production: analyzeProductionDependencies(packageJson),
    duplicates: analyzeDuplicateDependencies(allDependencies),
    outdated: await analyzeOutdatedPackages(),
    size: await analyzeBundleSize(allDependencies),
  };

  const recommendations = generateRecommendations(results, packageJson);
  displayResults(results, recommendations);

  // Create optimized package.json
  if (recommendations.removals.length > 0) {
    await createOptimizedPackageJson(packageJson, recommendations);
  }

  return recommendations;
}

/**
 * Analyze usage of each dependency across the codebase
 */
async function analyzeDependencyUsage(dependencies) {
  const usage = {};
  const files = getAllFiles();

  console.log('🔍 Analyzing dependency usage across codebase...');

  for (const [depName, version] of Object.entries(dependencies)) {
    usage[depName] = {
      version,
      used: false,
      usageCount: 0,
      files: [],
      importPatterns: [],
    };

    // Create search patterns for this dependency
    const patterns = [
      new RegExp(`import.*['"\`]${depName}['"\`]`, 'g'),
      new RegExp(`require\\(['"\`]${depName}['"\`]\\)`, 'g'),
      new RegExp(`from\\s+['"\`]${depName}['"\`]`, 'g'),
      new RegExp(`import\\(.*['"\`]${depName}['"\`]`, 'g'),
    ];

    // Special patterns for specific packages
    if (depName.includes('prism')) {
      patterns.push(/Prism\./g, /prismjs/g);
    }
    if (depName.includes('firebase')) {
      patterns.push(new RegExp(`firebase/${depName.split('/')[1]}`, 'g'));
    }
    if (depName.includes('rollup') || depName.includes('babel') || depName.includes('eslint')) {
      // Check config files too
      patterns.push(new RegExp(depName.replace('@', '').replace('/', ''), 'g'));
    }

    // Scan all files for usage
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');

        for (const pattern of patterns) {
          const matches = [...content.matchAll(pattern)];
          if (matches.length > 0) {
            usage[depName].used = true;
            usage[depName].usageCount += matches.length;
            usage[depName].files.push(path.relative('.', file));
            usage[depName].importPatterns.push(...matches.map(m => m[0]));
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Check package.json scripts for usage
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const scripts = JSON.stringify(packageJson.scripts || {});
    if (scripts.includes(depName)) {
      usage[depName].used = true;
      usage[depName].usageCount++;
      usage[depName].files.push('package.json (scripts)');
    }

    // Check config files
    const configFiles = [
      'rollup.config.js',
      'babel.config.json',
      'eslint.config.mjs',
      'jest.config.js',
      '.eslintrc.js',
      'purgecss.config.mjs',
    ];

    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
        try {
          const content = fs.readFileSync(configFile, 'utf-8');
          if (
            content.includes(depName) ||
            content.includes(depName.replace('@', '').replace('/', ''))
          ) {
            usage[depName].used = true;
            usage[depName].usageCount++;
            usage[depName].files.push(configFile);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  return usage;
}

/**
 * Analyze production vs development dependencies
 */
function analyzeProductionDependencies(packageJson) {
  const prodDeps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};

  const analysis = {
    production: Object.keys(prodDeps),
    development: Object.keys(devDeps),
    misplaced: [],
  };

  // Check for misplaced dependencies
  const devOnlyPatterns = [
    '@types/',
    'eslint',
    'prettier',
    'jest',
    'babel',
    '@babel/',
    'rollup',
    '@rollup/',
    'imagemin',
    'purgecss',
    'web-ext',
  ];

  for (const dep of analysis.production) {
    if (devOnlyPatterns.some(pattern => dep.includes(pattern))) {
      analysis.misplaced.push({
        name: dep,
        issue: 'Should be in devDependencies',
        reason: 'Development tool in production dependencies',
      });
    }
  }

  return analysis;
}

/**
 * Analyze duplicate or conflicting dependencies
 */
function analyzeDuplicateDependencies(dependencies) {
  const duplicates = [];
  const packages = Object.keys(dependencies);

  // Group related packages
  const groups = {
    babel: packages.filter(p => p.includes('babel')),
    rollup: packages.filter(p => p.includes('rollup')),
    eslint: packages.filter(p => p.includes('eslint')),
    firebase: packages.filter(p => p.includes('firebase')),
    jest: packages.filter(p => p.includes('jest')),
    imagemin: packages.filter(p => p.includes('imagemin')),
  };

  // Check for potential conflicts
  for (const [groupName, groupPackages] of Object.entries(groups)) {
    if (groupPackages.length > 1) {
      duplicates.push({
        group: groupName,
        packages: groupPackages,
        note: `Multiple ${groupName} packages - verify all are needed`,
      });
    }
  }

  return duplicates;
}

/**
 * Analyze outdated packages
 */
async function analyzeOutdatedPackages() {
  try {
    const outdated = execSync('npm outdated --json', { encoding: 'utf-8' });
    return JSON.parse(outdated);
  } catch (error) {
    // npm outdated returns exit code 1 when packages are outdated
    try {
      return JSON.parse(error.stdout);
    } catch (parseError) {
      return {};
    }
  }
}

/**
 * Analyze bundle size impact
 */
async function analyzeBundleSize(dependencies) {
  const sizes = {};

  // Estimate sizes for common packages
  const sizeEstimates = {
    firebase: '500KB',
    'firebase-admin': '2MB',
    prismjs: '100KB',
    imagemin: '50KB',
    purgecss: '200KB',
    rollup: '5MB',
    jest: '10MB',
    eslint: '8MB',
    prettier: '3MB',
  };

  for (const dep of Object.keys(dependencies)) {
    sizes[dep] = sizeEstimates[dep] || 'Unknown';
  }

  return sizes;
}

/**
 * Generate removal and optimization recommendations
 */
function generateRecommendations(results, packageJson) {
  const recommendations = {
    removals: [],
    moves: [],
    updates: [],
    optimizations: [],
  };

  // Identify unused dependencies for removal
  for (const [depName, usage] of Object.entries(results.usage)) {
    if (!usage.used) {
      recommendations.removals.push({
        name: depName,
        version: usage.version,
        reason: 'Not used in codebase',
        impact: 'Safe to remove',
      });
    }
  }

  // Identify misplaced dependencies
  for (const misplaced of results.production.misplaced) {
    recommendations.moves.push({
      name: misplaced.name,
      from: 'dependencies',
      to: 'devDependencies',
      reason: misplaced.reason,
    });
  }

  // Identify packages to update
  for (const [depName, info] of Object.entries(results.outdated)) {
    recommendations.updates.push({
      name: depName,
      current: info.current,
      wanted: info.wanted,
      latest: info.latest,
    });
  }

  // Special recommendations based on project analysis

  // Firebase-admin should only be in functions
  if (packageJson.dependencies?.['firebase-admin']) {
    recommendations.moves.push({
      name: 'firebase-admin',
      from: 'root dependencies',
      to: 'functions/package.json',
      reason: 'Server-side package should be in functions directory',
    });
  }

  // @firebase/rules-unit-testing is only used in mocked tests
  if (results.usage['@firebase/rules-unit-testing']?.usageCount < 5) {
    recommendations.optimizations.push({
      type: 'Mock optimization',
      target: '@firebase/rules-unit-testing',
      suggestion: 'Consider fully mocking instead of importing the actual package',
      benefit: 'Reduces test complexity and dependency size',
    });
  }

  return recommendations;
}

/**
 * Create optimized package.json
 */
async function createOptimizedPackageJson(originalPackageJson, recommendations) {
  const optimized = JSON.parse(JSON.stringify(originalPackageJson));

  // Remove unused dependencies
  for (const removal of recommendations.removals) {
    if (optimized.dependencies?.[removal.name]) {
      delete optimized.dependencies[removal.name];
    }
    if (optimized.devDependencies?.[removal.name]) {
      delete optimized.devDependencies[removal.name];
    }
  }

  // Move misplaced dependencies
  for (const move of recommendations.moves) {
    if (move.to === 'devDependencies' && optimized.dependencies?.[move.name]) {
      optimized.devDependencies = optimized.devDependencies || {};
      optimized.devDependencies[move.name] = optimized.dependencies[move.name];
      delete optimized.dependencies[move.name];
    }
  }

  // Clean up empty sections
  if (optimized.dependencies && Object.keys(optimized.dependencies).length === 0) {
    delete optimized.dependencies;
  }

  // Save optimized package.json
  fs.writeFileSync('package.json.optimized', JSON.stringify(optimized, null, 2));
  console.log('\n📄 Optimized package.json saved as package.json.optimized');
}

/**
 * Display audit results
 */
function displayResults(results, recommendations) {
  console.log('📦 DEPENDENCY AUDIT RESULTS');
  console.log('='.repeat(50));

  // Usage summary
  const totalDeps = Object.keys(results.usage).length;
  const usedDeps = Object.values(results.usage).filter(u => u.used).length;
  const unusedDeps = totalDeps - usedDeps;

  console.log(`📊 Usage Summary:`);
  console.log(`   Total Dependencies: ${totalDeps}`);
  console.log(`   Used Dependencies: ${usedDeps}`);
  console.log(`   Unused Dependencies: ${unusedDeps}`);
  console.log();

  // Unused dependencies
  if (recommendations.removals.length > 0) {
    console.log('🗑️  UNUSED DEPENDENCIES (Safe to Remove):');
    for (const removal of recommendations.removals) {
      console.log(`   ❌ ${removal.name}@${removal.version} - ${removal.reason}`);
    }
    console.log();
  }

  // Misplaced dependencies
  if (recommendations.moves.length > 0) {
    console.log('📦 MISPLACED DEPENDENCIES:');
    for (const move of recommendations.moves) {
      console.log(`   ⚠️  ${move.name} - Move from ${move.from} to ${move.to}`);
      console.log(`      Reason: ${move.reason}`);
    }
    console.log();
  }

  // Heavy dependencies
  console.log('📏 DEPENDENCY SIZES:');
  const heavyDeps = Object.entries(results.size)
    .filter(([_, size]) => size !== 'Unknown')
    .sort(([, a], [, b]) => parseSize(b) - parseSize(a))
    .slice(0, 5);

  for (const [dep, size] of heavyDeps) {
    const used = results.usage[dep]?.used ? '✅' : '❌';
    console.log(`   ${used} ${dep}: ${size}`);
  }
  console.log();

  // Optimization recommendations
  if (recommendations.optimizations.length > 0) {
    console.log('🚀 OPTIMIZATION OPPORTUNITIES:');
    for (const opt of recommendations.optimizations) {
      console.log(`   💡 ${opt.type}: ${opt.target}`);
      console.log(`      ${opt.suggestion}`);
      console.log(`      Benefit: ${opt.benefit}`);
    }
    console.log();
  }

  // Summary and actions
  console.log('🎯 RECOMMENDED ACTIONS:');
  console.log(`   1. Remove ${recommendations.removals.length} unused dependencies`);
  console.log(`   2. Move ${recommendations.moves.length} misplaced dependencies`);
  console.log(`   3. Consider ${recommendations.optimizations.length} optimization opportunities`);

  if (recommendations.removals.length > 0) {
    console.log('\n🚀 To apply removals, run:');
    const removeCmd = `npm uninstall ${recommendations.removals.map(r => r.name).join(' ')}`;
    console.log(`   ${removeCmd}`);
  }
}

/**
 * Utility functions
 */
function getAllFiles() {
  const files = [];

  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !EXCLUDED_DIRECTORIES.includes(item)) {
          if (SCAN_DIRECTORIES.includes(item) || dir !== '.') {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (['.js', '.mjs', '.json', '.ts'].includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  scanDirectory('.');
  return files;
}

function parseSize(sizeStr) {
  if (typeof sizeStr !== 'string') return 0;
  const num = parseFloat(sizeStr);
  if (sizeStr.includes('MB')) return num * 1000;
  if (sizeStr.includes('KB')) return num;
  return 0;
}

// Run the audit
if (import.meta.url === `file://${process.argv[1]}`) {
  runDependencyAudit()
    .then(recommendations => {
      process.exit(recommendations.removals.length > 10 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Dependency audit failed:', error);
      process.exit(1);
    });
}

export { runDependencyAudit };
