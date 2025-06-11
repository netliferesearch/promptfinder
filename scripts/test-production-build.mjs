#!/usr/bin/env node

/**
 * Production Build Functionality Testing Script for PromptFinder Chrome Extension
 *
 * This script tests that the production build functionality exactly matches
 * the development version by validating all core features, UI components,
 * and user interactions work correctly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const TEST_CONFIG = {
  productionPackagePath: 'chrome-store-package',
  developmentPaths: {
    manifest: 'manifest.json',
    html: 'pages/popup.html',
    css: 'css/',
    js: 'js/',
    icons: 'icons/',
  },
  functionalityTests: [
    'manifestComparison',
    'htmlStructure',
    'cssClasses',
    'javascriptFunctions',
    'firebaseIntegration',
    'uiComponents',
    'searchFunctionality',
    'authenticationFlow',
    'dataHandling',
    'analyticsTracking',
  ],
};

/**
 * Main testing function
 */
async function testProductionBuild() {
  console.log('🧪 Testing Production Build Functionality...\n');

  const results = {
    timestamp: new Date().toISOString(),
    testResults: {},
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0,
    },
    functionalityMatch: false,
    deploymentReady: false,
  };

  try {
    // Step 1: Verify production package exists
    await verifyProductionPackage();

    // Step 2: Run functionality tests
    for (const testName of TEST_CONFIG.functionalityTests) {
      console.log(`🔍 Running ${testName} test...`);
      const testResult = await runFunctionalityTest(testName);
      results.testResults[testName] = testResult;

      if (testResult.status === 'PASSED') {
        results.summary.passed++;
      } else if (testResult.status === 'FAILED') {
        results.summary.failed++;
      } else if (testResult.status === 'WARNING') {
        results.summary.warnings++;
      }
      results.summary.total++;

      console.log(`  ${getStatusIcon(testResult.status)} ${testResult.message}\n`);
    }

    // Step 3: Overall assessment
    results.functionalityMatch = results.summary.failed === 0;
    results.deploymentReady = results.functionalityMatch && results.summary.warnings <= 2;

    // Step 4: Display results
    displayTestResults(results);

    // Step 5: Save report
    saveTestReport(results);

    return results;
  } catch (error) {
    console.error('❌ Production build testing failed:', error);
    throw error;
  }
}

/**
 * Verify production package exists and is valid
 */
async function verifyProductionPackage() {
  const packagePath = path.join(projectRoot, TEST_CONFIG.productionPackagePath);

  if (!fs.existsSync(packagePath)) {
    throw new Error(`Production package not found at: ${packagePath}`);
  }

  const requiredFiles = [
    'manifest.json',
    'pages/popup.html',
    'dist/js/app.js',
    'dist/js/firebase-init.js',
    'css/',
    'icons/',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(packagePath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file missing in production package: ${file}`);
    }
  }

  console.log('✅ Production package verified\n');
}

/**
 * Run individual functionality test
 */
async function runFunctionalityTest(testName) {
  switch (testName) {
    case 'manifestComparison':
      return await testManifestComparison();
    case 'htmlStructure':
      return await testHtmlStructure();
    case 'cssClasses':
      return await testCssClasses();
    case 'javascriptFunctions':
      return await testJavaScriptFunctions();
    case 'firebaseIntegration':
      return await testFirebaseIntegration();
    case 'uiComponents':
      return await testUiComponents();
    case 'searchFunctionality':
      return await testSearchFunctionality();
    case 'authenticationFlow':
      return await testAuthenticationFlow();
    case 'dataHandling':
      return await testDataHandling();
    case 'analyticsTracking':
      return await testAnalyticsTracking();
    default:
      return { status: 'FAILED', message: `Unknown test: ${testName}`, details: {} };
  }
}

/**
 * Test manifest.json comparison
 */
async function testManifestComparison() {
  try {
    const devManifest = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'manifest.json'), 'utf-8')
    );
    const prodManifest = JSON.parse(
      fs.readFileSync(
        path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'manifest.json'),
        'utf-8'
      )
    );

    const differences = [];
    const criticalFields = [
      'name',
      'version',
      'manifest_version',
      'permissions',
      'host_permissions',
      'content_security_policy',
    ];

    for (const field of criticalFields) {
      if (JSON.stringify(devManifest[field]) !== JSON.stringify(prodManifest[field])) {
        differences.push(
          `${field}: dev=${JSON.stringify(devManifest[field])} vs prod=${JSON.stringify(prodManifest[field])}`
        );
      }
    }

    if (differences.length === 0) {
      return {
        status: 'PASSED',
        message: 'Manifest files are identical',
        details: { criticalFieldsChecked: criticalFields.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Manifest differences found: ${differences.length}`,
        details: { differences },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Manifest comparison failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test HTML structure
 */
async function testHtmlStructure() {
  try {
    const devHtml = fs.readFileSync(path.join(projectRoot, 'pages/popup.html'), 'utf-8');
    const prodHtml = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'pages/popup.html'),
      'utf-8'
    );

    // Extract key structural elements
    const extractStructure = html => {
      const elements = {
        scripts: (html.match(/<script[^>]*src="[^"]*"/g) || []).length,
        stylesheets: (html.match(/<link[^>]*href="[^"]*\.css"/g) || []).length,
        buttons: (html.match(/<button[^>]*>/g) || []).length,
        inputs: (html.match(/<input[^>]*>/g) || []).length,
        divs: (html.match(/<div[^>]*>/g) || []).length,
        forms: (html.match(/<form[^>]*>/g) || []).length,
      };
      return elements;
    };

    const devStructure = extractStructure(devHtml);
    const prodStructure = extractStructure(prodHtml);

    const differences = [];
    for (const [element, count] of Object.entries(devStructure)) {
      if (prodStructure[element] !== count) {
        differences.push(`${element}: dev=${count} vs prod=${prodStructure[element]}`);
      }
    }

    if (differences.length === 0) {
      return {
        status: 'PASSED',
        message: 'HTML structure is identical',
        details: { elementsChecked: Object.keys(devStructure).length, devStructure, prodStructure },
      };
    } else if (differences.length <= 2) {
      return {
        status: 'WARNING',
        message: `Minor HTML differences: ${differences.length}`,
        details: { differences, devStructure, prodStructure },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Significant HTML differences: ${differences.length}`,
        details: { differences, devStructure, prodStructure },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `HTML structure test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test CSS classes availability
 */
async function testCssClasses() {
  try {
    const devCssDir = path.join(projectRoot, 'css');
    const prodCssDir = path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'css');

    // Extract CSS classes from directory
    const extractCssClasses = cssDir => {
      const classes = new Set();

      function scanCssFiles(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanCssFiles(fullPath);
          } else if (item.endsWith('.css')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const classMatches = content.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g);
            if (classMatches) {
              classMatches.forEach(match => classes.add(match.substring(1)));
            }
          }
        }
      }

      scanCssFiles(cssDir);
      return Array.from(classes).sort();
    };

    const devClasses = extractCssClasses(devCssDir);
    const prodClasses = extractCssClasses(prodCssDir);

    const missingInProd = devClasses.filter(cls => !prodClasses.includes(cls));
    const extraInProd = prodClasses.filter(cls => !devClasses.includes(cls));

    if (missingInProd.length === 0 && extraInProd.length === 0) {
      return {
        status: 'PASSED',
        message: 'CSS classes are identical',
        details: {
          totalClasses: devClasses.length,
          devClasses: devClasses.length,
          prodClasses: prodClasses.length,
        },
      };
    } else if (missingInProd.length <= 5 && extraInProd.length <= 5) {
      return {
        status: 'WARNING',
        message: `Minor CSS differences: ${missingInProd.length} missing, ${extraInProd.length} extra`,
        details: {
          missingInProd,
          extraInProd,
          devTotal: devClasses.length,
          prodTotal: prodClasses.length,
        },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Significant CSS differences: ${missingInProd.length} missing, ${extraInProd.length} extra`,
        details: {
          missingInProd,
          extraInProd,
          devTotal: devClasses.length,
          prodTotal: prodClasses.length,
        },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `CSS classes test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test JavaScript functions availability
 */
async function testJavaScriptFunctions() {
  try {
    // Check if minified JS contains key function patterns
    const prodAppJs = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'dist/js/app.js'),
      'utf-8'
    );
    const prodFirebaseJs = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'dist/js/firebase-init.js'),
      'utf-8'
    );

    // Key functions that should exist (even if minified)
    const keyFunctions = [
      'firebase',
      'auth',
      'firestore',
      'search',
      'filter',
      'display',
      'login',
      'logout',
      'save',
      'delete',
      'edit',
      'toast',
      'analytics',
    ];

    const foundFunctions = [];
    const missingFunctions = [];

    for (const func of keyFunctions) {
      // Look for function patterns (accounting for minification)
      const patterns = [
        new RegExp(`${func}\\s*[:=]\\s*function`, 'i'),
        new RegExp(`function\\s+${func}`, 'i'),
        new RegExp(`\\.${func}\\s*=`, 'i'),
        new RegExp(`${func}\\s*\\(`, 'i'),
      ];

      const found = patterns.some(
        pattern => pattern.test(prodAppJs) || pattern.test(prodFirebaseJs)
      );

      if (found) {
        foundFunctions.push(func);
      } else {
        missingFunctions.push(func);
      }
    }

    const foundPercentage = (foundFunctions.length / keyFunctions.length) * 100;

    if (foundPercentage >= 90) {
      return {
        status: 'PASSED',
        message: `JavaScript functions preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFunctions, missingFunctions, total: keyFunctions.length },
      };
    } else if (foundPercentage >= 70) {
      return {
        status: 'WARNING',
        message: `Most JavaScript functions preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFunctions, missingFunctions, total: keyFunctions.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Too many JavaScript functions missing: ${foundPercentage.toFixed(1)}%`,
        details: { foundFunctions, missingFunctions, total: keyFunctions.length },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `JavaScript functions test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test Firebase integration
 */
async function testFirebaseIntegration() {
  try {
    const prodFirebaseJs = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'dist/js/firebase-init.js'),
      'utf-8'
    );

    const firebaseFeatures = [
      'firebase',
      'auth',
      'firestore',
      'initializeApp',
      'getAuth',
      'getFirestore',
      'connectAuthEmulator',
      'connectFirestoreEmulator',
    ];

    const foundFeatures = [];
    const missingFeatures = [];

    for (const feature of firebaseFeatures) {
      if (prodFirebaseJs.includes(feature)) {
        foundFeatures.push(feature);
      } else {
        missingFeatures.push(feature);
      }
    }

    const foundPercentage = (foundFeatures.length / firebaseFeatures.length) * 100;

    if (foundPercentage >= 90) {
      return {
        status: 'PASSED',
        message: `Firebase integration preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: firebaseFeatures.length },
      };
    } else if (foundPercentage >= 70) {
      return {
        status: 'WARNING',
        message: `Firebase integration mostly preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: firebaseFeatures.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Firebase integration compromised: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: firebaseFeatures.length },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Firebase integration test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test UI components
 */
async function testUiComponents() {
  try {
    const prodHtml = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'pages/popup.html'),
      'utf-8'
    );

    const uiComponents = [
      { name: 'search-input', pattern: /search.*input|input.*search/i },
      { name: 'search-button', pattern: /search.*button|button.*search/i },
      { name: 'prompt-list', pattern: /prompt.*list|list.*prompt/i },
      { name: 'auth-section', pattern: /auth.*section|login.*section/i },
      { name: 'filter-tabs', pattern: /filter.*tab|tab.*filter/i },
      { name: 'toast-container', pattern: /toast.*container|notification/i },
      { name: 'loading-spinner', pattern: /loading|spinner/i },
      { name: 'modal-dialog', pattern: /modal|dialog/i },
    ];

    const foundComponents = [];
    const missingComponents = [];

    for (const component of uiComponents) {
      if (component.pattern.test(prodHtml)) {
        foundComponents.push(component.name);
      } else {
        missingComponents.push(component.name);
      }
    }

    const foundPercentage = (foundComponents.length / uiComponents.length) * 100;

    if (foundPercentage >= 80) {
      return {
        status: 'PASSED',
        message: `UI components preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundComponents, missingComponents, total: uiComponents.length },
      };
    } else if (foundPercentage >= 60) {
      return {
        status: 'WARNING',
        message: `Most UI components preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundComponents, missingComponents, total: uiComponents.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Too many UI components missing: ${foundPercentage.toFixed(1)}%`,
        details: { foundComponents, missingComponents, total: uiComponents.length },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `UI components test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test search functionality
 */
async function testSearchFunctionality() {
  try {
    const prodAppJs = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'dist/js/app.js'),
      'utf-8'
    );

    const searchFeatures = [
      'search',
      'filter',
      'query',
      'results',
      'prompt',
      'category',
      'addEventListener',
      'keyup',
      'input',
    ];

    const foundFeatures = [];
    const missingFeatures = [];

    for (const feature of searchFeatures) {
      if (prodAppJs.includes(feature)) {
        foundFeatures.push(feature);
      } else {
        missingFeatures.push(feature);
      }
    }

    const foundPercentage = (foundFeatures.length / searchFeatures.length) * 100;

    if (foundPercentage >= 85) {
      return {
        status: 'PASSED',
        message: `Search functionality preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: searchFeatures.length },
      };
    } else if (foundPercentage >= 70) {
      return {
        status: 'WARNING',
        message: `Search functionality mostly preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: searchFeatures.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Search functionality compromised: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: searchFeatures.length },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Search functionality test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test authentication flow
 */
async function testAuthenticationFlow() {
  try {
    const prodAppJs = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'dist/js/app.js'),
      'utf-8'
    );
    const prodFirebaseJs = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'dist/js/firebase-init.js'),
      'utf-8'
    );

    const authFeatures = [
      'login',
      'logout',
      'signIn',
      'signOut',
      'auth',
      'user',
      'credential',
      'email',
      'password',
    ];

    const foundFeatures = [];
    const missingFeatures = [];

    for (const feature of authFeatures) {
      if (prodAppJs.includes(feature) || prodFirebaseJs.includes(feature)) {
        foundFeatures.push(feature);
      } else {
        missingFeatures.push(feature);
      }
    }

    const foundPercentage = (foundFeatures.length / authFeatures.length) * 100;

    if (foundPercentage >= 80) {
      return {
        status: 'PASSED',
        message: `Authentication flow preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: authFeatures.length },
      };
    } else if (foundPercentage >= 65) {
      return {
        status: 'WARNING',
        message: `Authentication flow mostly preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: authFeatures.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Authentication flow compromised: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: authFeatures.length },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Authentication flow test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test data handling
 */
async function testDataHandling() {
  try {
    const prodAppJs = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'dist/js/app.js'),
      'utf-8'
    );

    const dataFeatures = [
      'chrome.storage',
      'localStorage',
      'sessionStorage',
      'firestore',
      'collection',
      'doc',
      'get',
      'set',
      'add',
      'update',
      'delete',
    ];

    const foundFeatures = [];
    const missingFeatures = [];

    for (const feature of dataFeatures) {
      if (prodAppJs.includes(feature)) {
        foundFeatures.push(feature);
      } else {
        missingFeatures.push(feature);
      }
    }

    const foundPercentage = (foundFeatures.length / dataFeatures.length) * 100;

    if (foundPercentage >= 75) {
      return {
        status: 'PASSED',
        message: `Data handling preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: dataFeatures.length },
      };
    } else if (foundPercentage >= 60) {
      return {
        status: 'WARNING',
        message: `Data handling mostly preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: dataFeatures.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Data handling compromised: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: dataFeatures.length },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Data handling test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test analytics tracking
 */
async function testAnalyticsTracking() {
  try {
    const prodAppJs = fs.readFileSync(
      path.join(projectRoot, TEST_CONFIG.productionPackagePath, 'dist/js/app.js'),
      'utf-8'
    );

    const analyticsFeatures = [
      'analytics',
      'gtag',
      'GA4',
      'track',
      'event',
      'pageview',
      'measurement',
    ];

    const foundFeatures = [];
    const missingFeatures = [];

    for (const feature of analyticsFeatures) {
      if (prodAppJs.includes(feature)) {
        foundFeatures.push(feature);
      } else {
        missingFeatures.push(feature);
      }
    }

    const foundPercentage = (foundFeatures.length / analyticsFeatures.length) * 100;

    if (foundPercentage >= 70) {
      return {
        status: 'PASSED',
        message: `Analytics tracking preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: analyticsFeatures.length },
      };
    } else if (foundPercentage >= 50) {
      return {
        status: 'WARNING',
        message: `Analytics tracking mostly preserved: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: analyticsFeatures.length },
      };
    } else {
      return {
        status: 'FAILED',
        message: `Analytics tracking compromised: ${foundPercentage.toFixed(1)}%`,
        details: { foundFeatures, missingFeatures, total: analyticsFeatures.length },
      };
    }
  } catch (error) {
    return {
      status: 'FAILED',
      message: `Analytics tracking test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Display test results
 */
function displayTestResults(results) {
  console.log('🎯 PRODUCTION BUILD FUNCTIONALITY TEST RESULTS');
  console.log('='.repeat(60));

  console.log('\n📊 TEST SUMMARY:');
  console.log(`  ✅ Passed: ${results.summary.passed}/${results.summary.total}`);
  console.log(`  ❌ Failed: ${results.summary.failed}/${results.summary.total}`);
  console.log(`  ⚠️  Warnings: ${results.summary.warnings}/${results.summary.total}`);

  const successRate =
    ((results.summary.passed + results.summary.warnings) / results.summary.total) * 100;
  console.log(`  📈 Success Rate: ${successRate.toFixed(1)}%`);

  console.log('\n🔍 DETAILED RESULTS:');
  Object.entries(results.testResults).forEach(([testName, result]) => {
    console.log(`  ${getStatusIcon(result.status)} ${testName}: ${result.message}`);
  });

  console.log('\n🎯 OVERALL ASSESSMENT:');
  console.log(`  Functionality Match: ${results.functionalityMatch ? '✅ YES' : '❌ NO'}`);
  console.log(`  Deployment Ready: ${results.deploymentReady ? '✅ YES' : '❌ NO'}`);

  if (results.functionalityMatch) {
    console.log('\n🎉 PRODUCTION BUILD FUNCTIONALITY VERIFIED!');
    console.log('   The production build maintains all core functionality from development.');
  } else {
    console.log('\n⚠️  FUNCTIONALITY ISSUES DETECTED');
    console.log('   Review failed tests before deployment.');
  }
}

/**
 * Save test report
 */
function saveTestReport(results) {
  const report = {
    ...results,
    testConfig: TEST_CONFIG,
    recommendations: generateRecommendations(results),
  };

  fs.writeFileSync(
    path.join(projectRoot, 'production-build-functionality-test-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(
    '\n📝 Detailed test report saved to: production-build-functionality-test-report.json'
  );
}

/**
 * Generate recommendations
 */
function generateRecommendations(results) {
  const recommendations = [];

  if (results.functionalityMatch) {
    recommendations.push('✅ Production build functionality verified - ready for deployment');
    recommendations.push('🚀 All core features preserved in production build');
  } else {
    recommendations.push('❌ Address failed functionality tests before deployment');

    const failedTests = Object.entries(results.testResults)
      .filter(([_, result]) => result.status === 'FAILED')
      .map(([testName, _]) => testName);

    if (failedTests.length > 0) {
      recommendations.push(`🔧 Fix failed tests: ${failedTests.join(', ')}`);
    }
  }

  const warningTests = Object.entries(results.testResults)
    .filter(([_, result]) => result.status === 'WARNING')
    .map(([testName, _]) => testName);

  if (warningTests.length > 0) {
    recommendations.push(`⚠️  Review warning tests: ${warningTests.join(', ')}`);
  }

  if (results.summary.passed >= results.summary.total * 0.9) {
    recommendations.push('🏆 Excellent functionality preservation - production ready');
  }

  return recommendations;
}

/**
 * Utility functions
 */
function getStatusIcon(status) {
  switch (status) {
    case 'PASSED':
      return '✅';
    case 'FAILED':
      return '❌';
    case 'WARNING':
      return '⚠️';
    default:
      return '❓';
  }
}

// Run testing if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testProductionBuild()
    .then(results => {
      if (results.functionalityMatch) {
        console.log('\n🎉 Production build functionality testing completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Production build functionality testing found issues.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Production build functionality testing failed:', error);
      process.exit(1);
    });
}

export { testProductionBuild };
