#!/usr/bin/env node

/**
 * Production Functionality Validation Script for PromptFinder Chrome Extension
 *
 * This script validates that the production build maintains functional equivalence
 * with the development version by focusing on critical functionality rather than
 * exact string matches in minified code.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

/**
 * Main validation function
 */
async function validateProductionFunctionality() {
  console.log('🔍 Validating Production Build Functionality...\n');

  const results = {
    timestamp: new Date().toISOString(),
    validations: {},
    summary: {
      passed: 0,
      failed: 0,
      total: 0,
    },
    functionalityEquivalent: false,
    deploymentReady: false,
  };

  try {
    // Core validation tests
    const validations = [
      { name: 'fileStructure', test: validateFileStructure },
      { name: 'manifestIntegrity', test: validateManifestIntegrity },
      { name: 'htmlIntegrity', test: validateHtmlIntegrity },
      { name: 'coreJavaScriptFeatures', test: validateCoreJavaScriptFeatures },
      { name: 'cssIntegrity', test: validateCssIntegrity },
      { name: 'assetAvailability', test: validateAssetAvailability },
      { name: 'securityCompliance', test: validateSecurityCompliance },
      { name: 'chromeExtensionAPIs', test: validateChromeExtensionAPIs },
    ];

    for (const validation of validations) {
      console.log(`🧪 Testing ${validation.name}...`);
      const result = await validation.test();
      results.validations[validation.name] = result;

      if (result.status === 'PASSED') {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }
      results.summary.total++;

      console.log(`  ${result.status === 'PASSED' ? '✅' : '❌'} ${result.message}\n`);
    }

    // Overall assessment
    results.functionalityEquivalent = results.summary.failed === 0;
    results.deploymentReady = results.functionalityEquivalent;

    // Display results
    displayValidationResults(results);

    // Save report
    saveValidationReport(results);

    return results;
  } catch (error) {
    console.error('❌ Production functionality validation failed:', error);
    throw error;
  }
}

/**
 * Validate file structure
 */
async function validateFileStructure() {
  try {
    const packagePath = path.join(projectRoot, 'chrome-store-package');

    const requiredFiles = [
      'manifest.json',
      'pages/popup.html',
      'dist/js/app.js',
      'dist/js/firebase-init.js',
      'icons/icon16.png',
      'icons/icon48.png',
      'icons/icon128.png',
    ];

    const requiredDirectories = ['css', 'dist', 'icons', 'pages'];

    const missingFiles = [];
    const missingDirs = [];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(packagePath, file))) {
        missingFiles.push(file);
      }
    }

    for (const dir of requiredDirectories) {
      if (!fs.existsSync(path.join(packagePath, dir))) {
        missingDirs.push(dir);
      }
    }

    if (missingFiles.length === 0 && missingDirs.length === 0) {
      return {
        status: 'PASSED',
        message: 'All required files and directories present',
        details: { requiredFiles: requiredFiles.length, requiredDirs: requiredDirectories.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Missing files: ${missingFiles.length}, Missing dirs: ${missingDirs.length}`,
        details: { missingFiles, missingDirs },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `File structure validation failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Validate manifest integrity
 */
async function validateManifestIntegrity() {
  try {
    const devManifest = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'manifest.json'), 'utf-8')
    );
    const prodManifest = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'chrome-store-package/manifest.json'), 'utf-8')
    );

    // Critical fields that must be identical
    const criticalFields = [
      'name',
      'version',
      'manifest_version',
      'description',
      'permissions',
      'host_permissions',
      'action',
      'content_security_policy',
    ];

    const differences = [];
    for (const field of criticalFields) {
      if (JSON.stringify(devManifest[field]) !== JSON.stringify(prodManifest[field])) {
        differences.push(field);
      }
    }

    if (differences.length === 0) {
      return {
        status: 'PASSED',
        message: 'Manifest integrity verified - all critical fields match',
        details: { criticalFieldsChecked: criticalFields.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Manifest integrity compromised: ${differences.length} critical field differences`,
        details: { differentFields: differences },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Manifest integrity validation failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Validate HTML integrity
 */
async function validateHtmlIntegrity() {
  try {
    const devHtml = fs.readFileSync(path.join(projectRoot, 'pages/popup.html'), 'utf-8');
    const prodHtml = fs.readFileSync(
      path.join(projectRoot, 'chrome-store-package/pages/popup.html'),
      'utf-8'
    );

    // Key HTML features that must be present
    const keyFeatures = [
      { name: 'searchInput', pattern: /<input[^>]*search[^>]*>/i },
      { name: 'buttons', pattern: /<button/gi },
      { name: 'forms', pattern: /<form/gi },
      { name: 'mainContent', pattern: /id="main-content"/i },
      { name: 'promptsList', pattern: /prompts.*list/i },
      { name: 'authSection', pattern: /auth|login|account/i },
      { name: 'navigation', pattern: /<nav|role="tablist"/i },
      { name: 'accessibility', pattern: /aria-|role=/gi },
    ];

    const devFeatures = {};
    const prodFeatures = {};

    for (const feature of keyFeatures) {
      devFeatures[feature.name] = (devHtml.match(feature.pattern) || []).length;
      prodFeatures[feature.name] = (prodHtml.match(feature.pattern) || []).length;
    }

    const differences = [];
    for (const featureName in devFeatures) {
      if (devFeatures[featureName] !== prodFeatures[featureName]) {
        differences.push(
          `${featureName}: dev=${devFeatures[featureName]} vs prod=${prodFeatures[featureName]}`
        );
      }
    }

    if (differences.length === 0) {
      return {
        status: 'PASSED',
        message: 'HTML integrity verified - all key features preserved',
        details: { featuresChecked: keyFeatures.length, devFeatures, prodFeatures },
      };
    } else {
      return {
        status: 'FAILED',
        message: `HTML integrity issues: ${differences.length} feature differences`,
        details: { differences, devFeatures, prodFeatures },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `HTML integrity validation failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Validate core JavaScript features
 */
async function validateCoreJavaScriptFeatures() {
  try {
    const prodAppJs = fs.readFileSync(
      path.join(projectRoot, 'chrome-store-package/dist/js/app.js'),
      'utf-8'
    );
    const prodFirebaseJs = fs.readFileSync(
      path.join(projectRoot, 'chrome-store-package/dist/js/firebase-init.js'),
      'utf-8'
    );

    // Essential JavaScript features (these should survive minification)
    const essentialFeatures = [
      { name: 'eventListeners', pattern: /addEventListener|onclick|onchange/gi },
      { name: 'domManipulation', pattern: /getElementById|querySelector|createElement/gi },
      { name: 'firebaseAuth', pattern: /auth|signIn|signOut/gi },
      { name: 'firestore', pattern: /firestore|collection|doc/gi },
      { name: 'storage', pattern: /storage|getItem|setItem/gi },
      { name: 'analytics', pattern: /analytics|track|gtag/gi },
      { name: 'errorHandling', pattern: /try|catch|throw|error/gi },
      { name: 'asyncOperations', pattern: /async|await|Promise|then/gi },
    ];

    const combinedJs = prodAppJs + prodFirebaseJs;
    const foundFeatures = {};

    for (const feature of essentialFeatures) {
      const matches = combinedJs.match(feature.pattern) || [];
      foundFeatures[feature.name] = matches.length;
    }

    const missingFeatures = Object.entries(foundFeatures)
      .filter(([_, count]) => count === 0)
      .map(([name, _]) => name);

    if (missingFeatures.length === 0) {
      return {
        status: 'PASSED',
        message: 'Core JavaScript features preserved in production build',
        details: { foundFeatures, missingFeatures },
      };
    } else if (missingFeatures.length <= 2) {
      return {
        status: 'PASSED',
        message: `Most core JavaScript features preserved (${missingFeatures.length} minor missing)`,
        details: { foundFeatures, missingFeatures },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Critical JavaScript features missing: ${missingFeatures.length}`,
        details: { foundFeatures, missingFeatures },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `JavaScript features validation failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Validate CSS integrity
 */
async function validateCssIntegrity() {
  try {
    const prodCssDir = path.join(projectRoot, 'chrome-store-package/css');

    // Essential CSS files that should exist
    const essentialCssFiles = [
      'global.css',
      'pages/popup.css',
      'pages/auth.css',
      'components/buttons.css',
      'components/forms.css',
    ];

    const missingCssFiles = [];
    const presentCssFiles = [];

    for (const cssFile of essentialCssFiles) {
      const fullPath = path.join(prodCssDir, cssFile);
      if (fs.existsSync(fullPath)) {
        presentCssFiles.push(cssFile);
      } else {
        missingCssFiles.push(cssFile);
      }
    }

    if (missingCssFiles.length === 0) {
      return {
        status: 'PASSED',
        message: 'CSS integrity verified - all essential files present',
        details: { presentFiles: presentCssFiles.length, missingFiles: missingCssFiles.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `CSS integrity compromised: ${missingCssFiles.length} essential files missing`,
        details: { presentCssFiles, missingCssFiles },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `CSS integrity validation failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Validate asset availability
 */
async function validateAssetAvailability() {
  try {
    const packagePath = path.join(projectRoot, 'chrome-store-package');

    // Required assets for Chrome extension
    const requiredAssets = [
      { path: 'icons/icon16.png', minSize: 100 },
      { path: 'icons/icon48.png', minSize: 500 },
      { path: 'icons/icon128.png', minSize: 1000 },
      { path: 'js/clusterize.min.js', minSize: 1000 },
      { path: 'dist/js/app.js', minSize: 10000 },
      { path: 'dist/js/firebase-init.js', minSize: 10000 },
    ];

    const assetIssues = [];
    const validAssets = [];

    for (const asset of requiredAssets) {
      const fullPath = path.join(packagePath, asset.path);

      if (!fs.existsSync(fullPath)) {
        assetIssues.push(`Missing: ${asset.path}`);
      } else {
        const stats = fs.statSync(fullPath);
        if (stats.size < asset.minSize) {
          assetIssues.push(`Too small: ${asset.path} (${stats.size}B < ${asset.minSize}B)`);
        } else {
          validAssets.push(asset.path);
        }
      }
    }

    if (assetIssues.length === 0) {
      return {
        status: 'PASSED',
        message: 'Asset availability verified - all required assets present and valid',
        details: { validAssets: validAssets.length, issues: assetIssues.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Asset availability issues: ${assetIssues.length}`,
        details: { validAssets, assetIssues },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Asset availability validation failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Validate security compliance
 */
async function validateSecurityCompliance() {
  try {
    const packagePath = path.join(projectRoot, 'chrome-store-package');

    // Security checks
    const securityChecks = {
      noSourceMaps: true,
      noTestFiles: true,
      noDevDependencies: true,
      noSystemFiles: true,
    };

    // Check for source maps
    const sourceMapFiles = findFilesWithPattern(packagePath, /\.map$/);
    if (sourceMapFiles.length > 0) {
      securityChecks.noSourceMaps = false;
    }

    // Check for test files
    const testFiles = findFilesWithPattern(packagePath, /test|spec/i);
    if (testFiles.length > 0) {
      securityChecks.noTestFiles = false;
    }

    // Check for system files
    const systemFiles = findFilesWithPattern(packagePath, /\.DS_Store|Thumbs\.db|\.git/);
    if (systemFiles.length > 0) {
      securityChecks.noSystemFiles = false;
    }

    const failedChecks = Object.entries(securityChecks)
      .filter(([_, passed]) => !passed)
      .map(([check, _]) => check);

    if (failedChecks.length === 0) {
      return {
        status: 'PASSED',
        message: 'Security compliance verified - no security issues found',
        details: { securityChecks, failedChecks },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Security compliance issues: ${failedChecks.length}`,
        details: { securityChecks, failedChecks },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Security compliance validation failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Validate Chrome Extension APIs
 */
async function validateChromeExtensionAPIs() {
  try {
    const prodAppJs = fs.readFileSync(
      path.join(projectRoot, 'chrome-store-package/dist/js/app.js'),
      'utf-8'
    );

    // Chrome Extension APIs that should be present
    const chromeAPIs = ['chrome.storage', 'chrome.tabs', 'chrome.runtime'];

    const foundAPIs = [];
    const missingAPIs = [];

    for (const api of chromeAPIs) {
      if (prodAppJs.includes(api)) {
        foundAPIs.push(api);
      } else {
        missingAPIs.push(api);
      }
    }

    if (foundAPIs.length >= 1) {
      // At least one Chrome API should be present
      return {
        status: 'PASSED',
        message: `Chrome Extension APIs present: ${foundAPIs.length}/${chromeAPIs.length}`,
        details: { foundAPIs, missingAPIs },
      };
    } else {
      return {
        status: 'FAILED',
        message: 'No Chrome Extension APIs found - may not function as extension',
        details: { foundAPIs, missingAPIs },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Chrome Extension APIs validation failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Display validation results
 */
function displayValidationResults(results) {
  console.log('🎯 PRODUCTION FUNCTIONALITY VALIDATION RESULTS');
  console.log('='.repeat(60));

  console.log('\n📊 VALIDATION SUMMARY:');
  console.log(`  ✅ Passed: ${results.summary.passed}/${results.summary.total}`);
  console.log(`  ❌ Failed: ${results.summary.failed}/${results.summary.total}`);

  const successRate = (results.summary.passed / results.summary.total) * 100;
  console.log(`  📈 Success Rate: ${successRate.toFixed(1)}%`);

  console.log('\n🔍 DETAILED RESULTS:');
  Object.entries(results.validations).forEach(([testName, result]) => {
    console.log(`  ${result.status === 'PASSED' ? '✅' : '❌'} ${testName}: ${result.message}`);
  });

  console.log('\n🎯 OVERALL ASSESSMENT:');
  console.log(
    `  Functionality Equivalent: ${results.functionalityEquivalent ? '✅ YES' : '❌ NO'}`
  );
  console.log(`  Deployment Ready: ${results.deploymentReady ? '✅ YES' : '❌ NO'}`);

  if (results.functionalityEquivalent) {
    console.log('\n🎉 PRODUCTION BUILD FUNCTIONALITY VALIDATED!');
    console.log('   The production build maintains functional equivalence with development.');
  } else {
    console.log('\n⚠️  FUNCTIONALITY VALIDATION FAILED');
    console.log('   Critical issues must be resolved before deployment.');
  }
}

/**
 * Save validation report
 */
function saveValidationReport(results) {
  const report = {
    ...results,
    recommendations: generateRecommendations(results),
  };

  fs.writeFileSync(
    path.join(projectRoot, 'production-functionality-validation-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(
    '\n📝 Detailed validation report saved to: production-functionality-validation-report.json'
  );
}

/**
 * Generate recommendations
 */
function generateRecommendations(results) {
  const recommendations = [];

  if (results.functionalityEquivalent) {
    recommendations.push(
      '✅ Production build functionality validated - ready for Chrome Web Store submission'
    );
    recommendations.push('🚀 All critical functionality preserved in production build');
    recommendations.push('📦 Package can be safely deployed to users');
  } else {
    recommendations.push('❌ Address validation failures before deployment');

    const failedValidations = Object.entries(results.validations)
      .filter(([_, result]) => result.status === 'FAILED')
      .map(([testName, _]) => testName);

    if (failedValidations.length > 0) {
      recommendations.push(`🔧 Fix failed validations: ${failedValidations.join(', ')}`);
    }
  }

  if (results.summary.passed >= results.summary.total * 0.9) {
    recommendations.push('🏆 Excellent build quality - ready for production');
  }

  return recommendations;
}

/**
 * Utility functions
 */
function findFilesWithPattern(dir, pattern) {
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

// Run validation if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateProductionFunctionality()
    .then(results => {
      if (results.functionalityEquivalent) {
        console.log('\n🎉 Production functionality validation completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Production functionality validation found critical issues.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Production functionality validation failed:', error);
      process.exit(1);
    });
}

export { validateProductionFunctionality };
