#!/usr/bin/env node

/**
 * Git Ignore Audit Script for DesignPrompts Chrome Extension
 *
 * This script analyzes the repository to identify files and directories that should
 * be excluded from version control, especially for Chrome Web Store preparation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

/**
 * Files and patterns that should typically be ignored
 */
const SHOULD_BE_IGNORED = {
  // Build outputs and generated files
  buildOutputs: [
    'dist/',
    'build/',
    'css-min/',
    'css-minified/',
    'css-purged/',
    'icons-optimized/',
    'package.json.optimized',
  ],

  // Reports and audit results
  reports: [
    '*-report.json',
    '*-report.md',
    '*-audit-results.json',
    '*-results.json',
    'benchmark-report.json',
    'performance-report.json',
    'security-audit-results.json',
    'xss-audit-results*.json',
    'csp-audit-results.json',
    'data-security-audit-results.json',
  ],

  // Dependencies and packages
  dependencies: [
    'node_modules/',
    'functions/node_modules/',
    'package-lock.json', // Debatable - some projects include it
  ],

  // System and IDE files
  system: [
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '.vscode/',
    '.idea/',
    '.cursor/',
    '.idx/',
    '*.tmp',
    '*.temp',
  ],

  // Firebase and cloud specific
  firebase: [
    '.firebase/',
    'firestore-debug.log',
    'firebase-debug.log',
    'ui-debug.log',
    '.firebaserc', // If it contains sensitive info
  ],

  // Environment and secrets
  environment: ['.env', '.env.*', '!.env.example', '*.key', '*.pem', 'secrets.json'],

  // Test coverage and outputs
  testing: ['coverage/', 'test-results/', '*.lcov'],

  // Chrome extension specific
  chromeExtension: ['*.crx', '*.zip', 'extension.zip'],
};

/**
 * Main audit function
 */
async function auditGitignore() {
  console.log('🔍 Auditing .gitignore for DesignPrompts Chrome Extension...\n');

  const results = {
    currentIgnores: [],
    shouldIgnore: [],
    missingIgnores: [],
    unnecessaryIgnores: [],
    recommendations: [],
  };

  // Read current .gitignore
  const gitignorePath = path.join(projectRoot, '.gitignore');
  let currentIgnores = [];

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    currentIgnores = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    results.currentIgnores = currentIgnores;
  }

  // Analyze what should be ignored
  const allShouldIgnore = getAllPatternsToIgnore();
  results.shouldIgnore = allShouldIgnore;

  // Check what files exist in the repo
  const existingFiles = getRepositoryFiles();

  // Find missing ignores
  results.missingIgnores = findMissingIgnores(currentIgnores, allShouldIgnore, existingFiles);

  // Find potentially unnecessary ignores
  results.unnecessaryIgnores = findUnnecessaryIgnores(currentIgnores, existingFiles);

  // Generate recommendations
  results.recommendations = generateRecommendations(results);

  // Display results
  displayAuditResults(results);

  // Generate improved .gitignore
  generateImprovedGitignore(results);

  return results;
}

/**
 * Get all patterns that should be ignored
 */
function getAllPatternsToIgnore() {
  const patterns = [];
  Object.values(SHOULD_BE_IGNORED).forEach(category => {
    patterns.push(...category);
  });
  return patterns;
}

/**
 * Get all files in the repository
 */
function getRepositoryFiles() {
  const files = [];

  function scan(dir, relativePath = '') {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativeItemPath = path.join(relativePath, item);

        // Skip .git directory
        if (item === '.git') continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          files.push(relativeItemPath + '/');
          // Don't recurse into node_modules for performance
          if (item !== 'node_modules') {
            scan(fullPath, relativeItemPath);
          }
        } else {
          files.push(relativeItemPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  scan(projectRoot);
  return files;
}

/**
 * Find patterns that should be ignored but aren't
 */
function findMissingIgnores(currentIgnores, shouldIgnore, existingFiles) {
  const missing = [];

  for (const pattern of shouldIgnore) {
    // Check if pattern is already covered by current ignores
    if (!isPatternCovered(pattern, currentIgnores)) {
      // Check if files matching this pattern exist
      if (patternHasMatches(pattern, existingFiles)) {
        missing.push(pattern);
      }
    }
  }

  return missing;
}

/**
 * Find ignores that might not be necessary
 */
function findUnnecessaryIgnores(currentIgnores, existingFiles) {
  const unnecessary = [];

  for (const ignore of currentIgnores) {
    // Skip comments and negation patterns
    if (ignore.startsWith('#') || ignore.startsWith('!')) continue;

    // Check if this pattern matches any existing files
    if (!patternHasMatches(ignore, existingFiles)) {
      unnecessary.push(ignore);
    }
  }

  return unnecessary;
}

/**
 * Check if a pattern is covered by existing ignores
 */
function isPatternCovered(pattern, currentIgnores) {
  return currentIgnores.some(ignore => {
    return (
      ignore === pattern ||
      (ignore.endsWith('*') && pattern.startsWith(ignore.slice(0, -1))) ||
      (pattern.includes('/') &&
        ignore.includes('/') &&
        (pattern.startsWith(ignore) || ignore.startsWith(pattern)))
    );
  });
}

/**
 * Check if a pattern has matches in existing files
 */
function patternHasMatches(pattern, existingFiles) {
  const regexPattern = convertGlobToRegex(pattern);
  return existingFiles.some(file => regexPattern.test(file));
}

/**
 * Convert glob pattern to regex
 */
function convertGlobToRegex(pattern) {
  let regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*') // Convert * to .*
    .replace(/\?/g, '.'); // Convert ? to .

  // Handle directory patterns
  if (pattern.endsWith('/')) {
    regex = '^' + regex + '.*';
  } else {
    regex = '^' + regex + '$';
  }

  return new RegExp(regex);
}

/**
 * Generate recommendations
 */
function generateRecommendations(results) {
  const recommendations = [];

  if (results.missingIgnores.length > 0) {
    recommendations.push({
      type: 'critical',
      message: `Add ${results.missingIgnores.length} missing ignore patterns to prevent committing generated files`,
    });
  }

  if (results.unnecessaryIgnores.length > 0) {
    recommendations.push({
      type: 'cleanup',
      message: `Consider removing ${results.unnecessaryIgnores.length} unnecessary ignore patterns`,
    });
  }

  // Chrome Web Store specific recommendations
  const hasReportFiles = results.missingIgnores.some(p => p.includes('report'));
  if (hasReportFiles) {
    recommendations.push({
      type: 'chrome-store',
      message:
        'Exclude audit reports and optimization outputs for cleaner Chrome Web Store package',
    });
  }

  return recommendations;
}

/**
 * Display audit results
 */
function displayAuditResults(results) {
  console.log('🎯 GITIGNORE AUDIT RESULTS');
  console.log('='.repeat(50));

  console.log(`\n📊 SUMMARY:`);
  console.log(`  Current ignore patterns: ${results.currentIgnores.length}`);
  console.log(`  Recommended patterns: ${results.shouldIgnore.length}`);
  console.log(`  Missing critical ignores: ${results.missingIgnores.length}`);
  console.log(`  Potentially unnecessary: ${results.unnecessaryIgnores.length}`);

  if (results.missingIgnores.length > 0) {
    console.log(`\n❌ MISSING IGNORES (${results.missingIgnores.length}):`);
    results.missingIgnores.forEach(pattern => {
      console.log(`  - ${pattern}`);
    });
  }

  if (results.unnecessaryIgnores.length > 0) {
    console.log(`\n⚠️  POTENTIALLY UNNECESSARY (${results.unnecessaryIgnores.length}):`);
    results.unnecessaryIgnores.forEach(pattern => {
      console.log(`  - ${pattern}`);
    });
  }

  if (results.recommendations.length > 0) {
    console.log(`\n💡 RECOMMENDATIONS:`);
    results.recommendations.forEach(rec => {
      const icon = rec.type === 'critical' ? '🚨' : rec.type === 'chrome-store' ? '🏪' : '🧹';
      console.log(`  ${icon} ${rec.message}`);
    });
  }

  console.log('\n📁 Improved .gitignore will be generated as .gitignore.recommended');
}

/**
 * Generate improved .gitignore file
 */
function generateImprovedGitignore(results) {
  const sections = {
    Dependencies: SHOULD_BE_IGNORED.dependencies,
    'Build outputs': SHOULD_BE_IGNORED.buildOutputs,
    'Reports and audit results': SHOULD_BE_IGNORED.reports,
    'System files': SHOULD_BE_IGNORED.system,
    Firebase: SHOULD_BE_IGNORED.firebase,
    'Environment files': SHOULD_BE_IGNORED.environment,
    Testing: SHOULD_BE_IGNORED.testing,
    'Chrome Extension': SHOULD_BE_IGNORED.chromeExtension,
  };

  let content = '# DesignPrompts Chrome Extension - .gitignore\n';
  content += '# Generated by gitignore audit script\n\n';

  Object.entries(sections).forEach(([sectionName, patterns]) => {
    content += `# ${sectionName}\n`;
    patterns.forEach(pattern => {
      content += `${pattern}\n`;
    });
    content += '\n';
  });

  // Add any existing patterns that weren't covered
  const additionalPatterns = results.currentIgnores.filter(
    ignore => !getAllPatternsToIgnore().includes(ignore) && !ignore.startsWith('#') && ignore.trim()
  );

  if (additionalPatterns.length > 0) {
    content += '# Additional patterns from existing .gitignore\n';
    additionalPatterns.forEach(pattern => {
      content += `${pattern}\n`;
    });
    content += '\n';
  }

  // Save recommended .gitignore
  fs.writeFileSync(path.join(projectRoot, '.gitignore.recommended'), content);

  console.log('✅ Recommended .gitignore saved as .gitignore.recommended');
}

// Run audit if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  auditGitignore()
    .then(() => {
      console.log('\n✅ Gitignore audit completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Gitignore audit failed:', error);
      process.exit(1);
    });
}

export { auditGitignore };
