#!/usr/bin/env node

/**
 * Git Ignore Verification Script for PromptFinder Chrome Extension
 *
 * This script verifies that the .gitignore file is properly excluding
 * files that should not be in the repository for Chrome Web Store submission.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

/**
 * Verify .gitignore effectiveness
 */
async function verifyGitignore() {
  console.log('🔍 Verifying .gitignore effectiveness for Chrome Web Store preparation...\n');

  const results = {
    ignoredCorrectly: [],
    shouldBeIgnored: [],
    unnecessarylyTracked: [],
    totalIgnored: 0,
    totalTracked: 0,
  };

  // Get list of files that exist but are ignored
  const allFiles = getAllFiles(projectRoot);
  const gitIgnoredFiles = getGitIgnoredFiles();
  const gitTrackedFiles = getGitTrackedFiles();

  // Categorize files
  for (const file of allFiles) {
    const relativePath = path.relative(projectRoot, file);

    if (gitIgnoredFiles.includes(relativePath)) {
      if (shouldBeIgnored(relativePath)) {
        results.ignoredCorrectly.push(relativePath);
      }
      results.totalIgnored++;
    } else if (gitTrackedFiles.includes(relativePath)) {
      if (shouldBeIgnored(relativePath)) {
        results.shouldBeIgnored.push(relativePath);
      }
      results.totalTracked++;
    }
  }

  // Display results
  displayVerificationResults(results);

  // Generate Chrome Web Store readiness report
  generateChromeStoreReadinessReport(results);

  return results;
}

/**
 * Get all files in the project
 */
function getAllFiles(dir) {
  const files = [];

  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);

        // Skip .git directory
        if (item === '.git') continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath);
        } else {
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

/**
 * Get files that are ignored by git
 */
function getGitIgnoredFiles() {
  try {
    const output = execSync('git ls-files --others --ignored --exclude-standard', {
      cwd: projectRoot,
      encoding: 'utf-8',
    });
    return output
      .trim()
      .split('\n')
      .filter(f => f);
  } catch (error) {
    console.warn('⚠️  Could not get git ignored files');
    return [];
  }
}

/**
 * Get files that are tracked by git
 */
function getGitTrackedFiles() {
  try {
    const output = execSync('git ls-files', {
      cwd: projectRoot,
      encoding: 'utf-8',
    });
    return output
      .trim()
      .split('\n')
      .filter(f => f);
  } catch (error) {
    console.warn('⚠️  Could not get git tracked files');
    return [];
  }
}

/**
 * Check if a file should be ignored for Chrome Web Store
 */
function shouldBeIgnored(filePath) {
  const patterns = [
    // Build outputs
    /^dist\//,
    /^css-min\//,
    /^css-minified\//,
    /^icons-optimized\//,
    /package\.json\.optimized$/,

    // Reports and audit results
    /-report\.json$/,
    /-report\.md$/,
    /-audit-results\.json$/,
    /-results\.json$/,
    /benchmark-report\.json$/,
    /performance-report\.json$/,

    // System files
    /\.DS_Store$/,
    /\.log$/,

    // IDE files
    /^\.vscode\//,
    /^\.cursor\//,
    /^\.idx\//,

    // Dependencies
    /^node_modules\//,
    /package-lock\.json$/,

    // Chrome extension packages
    /\.crx$/,
    /\.zip$/,

    // Temporary files
    /\.tmp$/,
    /\.temp$/,
  ];

  return patterns.some(pattern => pattern.test(filePath));
}

/**
 * Display verification results
 */
function displayVerificationResults(results) {
  console.log('🎯 GITIGNORE VERIFICATION RESULTS');
  console.log('='.repeat(50));

  console.log(`\n📊 SUMMARY:`);
  console.log(`  Total files ignored: ${results.totalIgnored}`);
  console.log(`  Total files tracked: ${results.totalTracked}`);
  console.log(`  Correctly ignored: ${results.ignoredCorrectly.length}`);
  console.log(`  Should be ignored: ${results.shouldBeIgnored.length}`);

  if (results.shouldBeIgnored.length > 0) {
    console.log(`\n❌ FILES THAT SHOULD BE IGNORED (${results.shouldBeIgnored.length}):`);
    results.shouldBeIgnored.slice(0, 10).forEach(file => {
      console.log(`  - ${file}`);
    });
    if (results.shouldBeIgnored.length > 10) {
      console.log(`  ... and ${results.shouldBeIgnored.length - 10} more`);
    }
  } else {
    console.log(`\n✅ All files that should be ignored are properly excluded!`);
  }

  // Chrome Web Store specific checks
  console.log(`\n🏪 CHROME WEB STORE READINESS:`);

  const hasReportFiles = results.shouldBeIgnored.some(f => f.includes('report'));
  const hasBuildOutputs = results.shouldBeIgnored.some(f =>
    f.match(/^(dist|css-min|icons-optimized)\//)
  );
  const hasSystemFiles = results.shouldBeIgnored.some(
    f => f.includes('.DS_Store') || f.includes('.log')
  );

  console.log(`  Report files excluded: ${hasReportFiles ? '❌' : '✅'}`);
  console.log(`  Build outputs excluded: ${hasBuildOutputs ? '❌' : '✅'}`);
  console.log(`  System files excluded: ${hasSystemFiles ? '❌' : '✅'}`);

  const chromeStoreReady = !hasReportFiles && !hasBuildOutputs && !hasSystemFiles;
  console.log(`  Overall status: ${chromeStoreReady ? '✅ READY' : '❌ NEEDS ATTENTION'}`);

  // Show some correctly ignored files as examples
  if (results.ignoredCorrectly.length > 0) {
    console.log(`\n✅ EXAMPLES OF CORRECTLY IGNORED FILES:`);
    results.ignoredCorrectly.slice(0, 5).forEach(file => {
      console.log(`  ✓ ${file}`);
    });
    if (results.ignoredCorrectly.length > 5) {
      console.log(`  ... and ${results.ignoredCorrectly.length - 5} more correctly ignored`);
    }
  }
}

/**
 * Generate Chrome Web Store readiness report
 */
function generateChromeStoreReadinessReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    gitignoreStatus: {
      totalFilesIgnored: results.totalIgnored,
      totalFilesTracked: results.totalTracked,
      correctlyIgnored: results.ignoredCorrectly.length,
      shouldBeIgnored: results.shouldBeIgnored.length,
    },
    chromeWebStoreReadiness: {
      ready: results.shouldBeIgnored.length === 0,
      issues: results.shouldBeIgnored.length,
      problematicFiles: results.shouldBeIgnored,
    },
    recommendations: generateRecommendations(results),
    categories: {
      buildOutputs: results.ignoredCorrectly.filter(f =>
        f.match(/^(dist|css-min|icons-optimized)\//)
      ).length,
      reports: results.ignoredCorrectly.filter(f => f.includes('report')).length,
      systemFiles: results.ignoredCorrectly.filter(
        f => f.includes('.DS_Store') || f.includes('.log')
      ).length,
      dependencies: results.ignoredCorrectly.filter(f => f.includes('node_modules')).length,
    },
  };

  fs.writeFileSync(
    path.join(projectRoot, 'gitignore-verification-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n📝 Detailed verification report saved to: gitignore-verification-report.json');
}

/**
 * Generate recommendations
 */
function generateRecommendations(results) {
  const recommendations = [];

  if (results.shouldBeIgnored.length === 0) {
    recommendations.push('✅ .gitignore is properly configured for Chrome Web Store submission');
    recommendations.push('✅ All generated files and reports are excluded from version control');
    recommendations.push('✅ Repository is clean and ready for production builds');
  } else {
    recommendations.push(
      `❌ ${results.shouldBeIgnored.length} files should be added to .gitignore`
    );
    recommendations.push('🔧 Run `git rm --cached <file>` for files already tracked');
    recommendations.push('📝 Update .gitignore patterns to exclude these file types');
  }

  if (results.ignoredCorrectly.length > 50) {
    recommendations.push('🧹 Consider cleaning up old generated files periodically');
  }

  return recommendations;
}

// Run verification if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyGitignore()
    .then(() => {
      console.log('\n✅ Gitignore verification completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Gitignore verification failed:', error);
      process.exit(1);
    });
}

export { verifyGitignore };
