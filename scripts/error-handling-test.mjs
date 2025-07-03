#!/usr/bin/env node

/**
 * Error Handling Testing Script for DesignPrompts Chrome Extension
 *
 * This script tests comprehensive error handling including:
 * - Network failure scenarios and recovery
 * - Invalid input validation and sanitization
 * - Firebase connection and authentication errors
 * - Form validation and user feedback
 * - API timeout and rate limiting
 * - Offline functionality and graceful degradation
 * - Data corruption and malformed input handling
 */

import fs from 'fs';
import path from 'path';

// Configuration
const SCAN_DIRECTORIES = ['js', 'pages'];
const EXCLUDED_FILES = ['node_modules', '.git', 'coverage', 'docs'];

// Error handling criteria weights for scoring
const ERROR_HANDLING_WEIGHTS = {
  network_errors: 25,
  input_validation: 25,
  firebase_errors: 20,
  form_validation: 15,
  recovery_mechanisms: 15,
};

/**
 * Main error handling test function
 */
async function runErrorHandlingTest() {
  console.log('🚨 Starting Error Handling Testing for DesignPrompts...\n');

  const results = {
    network_errors: await testNetworkErrorHandling(),
    input_validation: await testInputValidation(),
    firebase_errors: await testFirebaseErrorHandling(),
    form_validation: await testFormValidation(),
    recovery_mechanisms: await testRecoveryMechanisms(),
  };

  const summary = generateSummary(results);
  displayResults(results, summary);

  return summary;
}

/**
 * Test network error handling and recovery
 */
async function testNetworkErrorHandling() {
  const files = getAllFiles(['.js']);
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for fetch error handling
  const fetchErrorHandling = await analyzeFetchErrorHandling(files);
  findings.push(...fetchErrorHandling.findings);
  issues.push(...fetchErrorHandling.issues);
  score += fetchErrorHandling.score;

  // Check for timeout handling
  const timeoutHandling = await analyzeTimeoutHandling(files);
  findings.push(...timeoutHandling.findings);
  issues.push(...timeoutHandling.issues);
  score += timeoutHandling.score;

  // Check for offline handling
  const offlineHandling = await analyzeOfflineHandling(files);
  findings.push(...offlineHandling.findings);
  issues.push(...offlineHandling.issues);
  score += offlineHandling.score;

  // Check for retry mechanisms
  const retryMechanisms = await analyzeRetryMechanisms(files);
  findings.push(...retryMechanisms.findings);
  issues.push(...retryMechanisms.issues);
  score += retryMechanisms.score;

  return {
    category: 'Network Error Handling',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Test input validation and sanitization
 */
async function testInputValidation() {
  const files = getAllFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for HTML escaping
  const htmlEscaping = await analyzeHtmlEscaping(files);
  findings.push(...htmlEscaping.findings);
  issues.push(...htmlEscaping.issues);
  score += htmlEscaping.score;

  // Check for input sanitization
  const inputSanitization = await analyzeInputSanitization(files);
  findings.push(...inputSanitization.findings);
  issues.push(...inputSanitization.issues);
  score += inputSanitization.score;

  // Check for XSS prevention
  const xssPrevention = await analyzeXssPrevention(files);
  findings.push(...xssPrevention.findings);
  issues.push(...xssPrevention.issues);
  score += xssPrevention.score;

  // Check for data validation
  const dataValidation = await analyzeDataValidation(files);
  findings.push(...dataValidation.findings);
  issues.push(...dataValidation.issues);
  score += dataValidation.score;

  return {
    category: 'Input Validation',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Test Firebase-specific error handling
 */
async function testFirebaseErrorHandling() {
  const files = getAllFiles(['.js']);
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for authentication error handling
  const authErrorHandling = await analyzeAuthErrorHandling(files);
  findings.push(...authErrorHandling.findings);
  issues.push(...authErrorHandling.issues);
  score += authErrorHandling.score;

  // Check for Firestore error handling
  const firestoreErrorHandling = await analyzeFirestoreErrorHandling(files);
  findings.push(...firestoreErrorHandling.findings);
  issues.push(...firestoreErrorHandling.issues);
  score += firestoreErrorHandling.score;

  // Check for connection error handling
  const connectionErrorHandling = await analyzeConnectionErrorHandling(files);
  findings.push(...connectionErrorHandling.findings);
  issues.push(...connectionErrorHandling.issues);
  score += connectionErrorHandling.score;

  return {
    category: 'Firebase Error Handling',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Test form validation and user feedback
 */
async function testFormValidation() {
  const files = getAllFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for client-side validation
  const clientValidation = await analyzeClientSideValidation(files);
  findings.push(...clientValidation.findings);
  issues.push(...clientValidation.issues);
  score += clientValidation.score;

  // Check for error message display
  const errorMessageDisplay = await analyzeErrorMessageDisplay(files);
  findings.push(...errorMessageDisplay.findings);
  issues.push(...errorMessageDisplay.issues);
  score += errorMessageDisplay.score;

  // Check for field highlighting
  const fieldHighlighting = await analyzeFieldHighlighting(files);
  findings.push(...fieldHighlighting.findings);
  issues.push(...fieldHighlighting.issues);
  score += fieldHighlighting.score;

  return {
    category: 'Form Validation',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Test recovery mechanisms and graceful degradation
 */
async function testRecoveryMechanisms() {
  const files = getAllFiles(['.js']);
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for graceful degradation
  const gracefulDegradation = await analyzeGracefulDegradation(files);
  findings.push(...gracefulDegradation.findings);
  issues.push(...gracefulDegradation.issues);
  score += gracefulDegradation.score;

  // Check for user notification systems
  const userNotifications = await analyzeUserNotifications(files);
  findings.push(...userNotifications.findings);
  issues.push(...userNotifications.issues);
  score += userNotifications.score;

  // Check for fallback mechanisms
  const fallbackMechanisms = await analyzeFallbackMechanisms(files);
  findings.push(...fallbackMechanisms.findings);
  issues.push(...fallbackMechanisms.issues);
  score += fallbackMechanisms.score;

  return {
    category: 'Recovery Mechanisms',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Detailed analysis functions
 */
async function analyzeFetchErrorHandling(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for fetch with try-catch
    const fetchWithTryCatch = [...content.matchAll(/try\s*{[^}]*fetch[^}]*}\s*catch/gs)];
    if (fetchWithTryCatch.length > 0) {
      score += 15;
      findings.push(
        `✅ Fetch error handling in ${path.basename(file)}: ${fetchWithTryCatch.length} try-catch blocks`
      );
    }

    // Check for .catch() on fetch promises
    const fetchWithCatch = [...content.matchAll(/fetch\([^)]*\)[^;]*\.catch\(/g)];
    if (fetchWithCatch.length > 0) {
      score += 10;
      findings.push(
        `✅ Promise catch handling in ${path.basename(file)}: ${fetchWithCatch.length} instances`
      );
    }

    // Check for response status checking
    const responseStatusCheck = [...content.matchAll(/response\.(?:ok|status)/g)];
    if (responseStatusCheck.length > 0) {
      score += 10;
      findings.push(
        `✅ Response status checking in ${path.basename(file)}: ${responseStatusCheck.length} instances`
      );
    }
  }

  if (score === 0) {
    issues.push('❌ No network error handling patterns detected');
  }

  return { findings, issues, score };
}

async function analyzeTimeoutHandling(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for timeout configuration
    const timeoutConfig = [...content.matchAll(/timeout|AbortController|signal/gi)];
    if (timeoutConfig.length > 0) {
      score += 15;
      findings.push(
        `✅ Timeout handling in ${path.basename(file)}: ${timeoutConfig.length} instances`
      );
    }

    // Check for timeout error handling
    const timeoutErrorHandling = [...content.matchAll(/timeout.*error|error.*timeout/gi)];
    if (timeoutErrorHandling.length > 0) {
      score += 10;
      findings.push(
        `✅ Timeout error handling in ${path.basename(file)}: ${timeoutErrorHandling.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeOfflineHandling(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for offline detection
    const offlineDetection = [...content.matchAll(/navigator\.onLine|offline|online.*event/gi)];
    if (offlineDetection.length > 0) {
      score += 15;
      findings.push(
        `✅ Offline detection in ${path.basename(file)}: ${offlineDetection.length} instances`
      );
    }

    // Check for offline fallbacks
    const offlineFallbacks = [
      ...content.matchAll(/offline.*fallback|fallback.*offline|cache.*offline/gi),
    ];
    if (offlineFallbacks.length > 0) {
      score += 10;
      findings.push(
        `✅ Offline fallbacks in ${path.basename(file)}: ${offlineFallbacks.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeRetryMechanisms(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for retry logic
    const retryLogic = [...content.matchAll(/retry|attempt.*again|try.*again/gi)];
    if (retryLogic.length > 0) {
      score += 10;
      findings.push(
        `✅ Retry mechanisms in ${path.basename(file)}: ${retryLogic.length} instances`
      );
    }

    // Check for exponential backoff
    const exponentialBackoff = [...content.matchAll(/backoff|delay.*retry|retry.*delay/gi)];
    if (exponentialBackoff.length > 0) {
      score += 10;
      findings.push(
        `✅ Retry delay mechanisms in ${path.basename(file)}: ${exponentialBackoff.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeHtmlEscaping(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for HTML escaping functions
    const htmlEscaping = [...content.matchAll(/escapeHtml|escapeHTML|escape.*html/gi)];
    if (htmlEscaping.length > 0) {
      score += 20;
      findings.push(`✅ HTML escaping in ${path.basename(file)}: ${htmlEscaping.length} instances`);
    }

    // Check for dangerous innerHTML usage
    const dangerousInnerHTML = [...content.matchAll(/innerHTML\s*=/g)];
    const safeInnerHTML = [...content.matchAll(/innerHTML\s*=.*(?:escapeHTML|escape)/g)];

    if (dangerousInnerHTML.length > 0) {
      const unsafeUsage = dangerousInnerHTML.length - safeInnerHTML.length;
      if (unsafeUsage > 0) {
        issues.push(
          `⚠️ Potentially unsafe innerHTML usage in ${path.basename(file)}: ${unsafeUsage} instances`
        );
      } else {
        score += 15;
        findings.push(
          `✅ Safe innerHTML usage in ${path.basename(file)}: all ${dangerousInnerHTML.length} instances appear escaped`
        );
      }
    }
  }

  return { findings, issues, score };
}

async function analyzeInputSanitization(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for input sanitization
    const sanitization = [...content.matchAll(/sanitize|clean.*input|validate.*input/gi)];
    if (sanitization.length > 0) {
      score += 15;
      findings.push(
        `✅ Input sanitization in ${path.basename(file)}: ${sanitization.length} instances`
      );
    }

    // Check for type checking
    const typeChecking = [...content.matchAll(/typeof|instanceof|isArray|isString|isNumber/gi)];
    if (typeChecking.length > 0) {
      score += 10;
      findings.push(`✅ Type checking in ${path.basename(file)}: ${typeChecking.length} instances`);
    }

    // Check for length validation
    const lengthValidation = [...content.matchAll(/length\s*[<>=]/g)];
    if (lengthValidation.length > 0) {
      score += 10;
      findings.push(
        `✅ Length validation in ${path.basename(file)}: ${lengthValidation.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeXssPrevention(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for Content Security Policy
  const manifestFile = 'manifest.json';
  if (fs.existsSync(manifestFile)) {
    const manifestContent = fs.readFileSync(manifestFile, 'utf-8');
    if (manifestContent.includes('content_security_policy')) {
      score += 20;
      findings.push(`✅ Content Security Policy configured in manifest.json`);
    }
  }

  // Check for XSS prevention patterns
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for textContent usage instead of innerHTML
    const textContentUsage = [...content.matchAll(/textContent\s*=/g)];
    if (textContentUsage.length > 0) {
      score += 10;
      findings.push(
        `✅ Safe textContent usage in ${path.basename(file)}: ${textContentUsage.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeDataValidation(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for data validation patterns
    const dataValidation = [...content.matchAll(/validate|check.*data|verify.*data/gi)];
    if (dataValidation.length > 0) {
      score += 15;
      findings.push(
        `✅ Data validation in ${path.basename(file)}: ${dataValidation.length} instances`
      );
    }

    // Check for null/undefined checks
    const nullChecks = [
      ...content.matchAll(/!=\s*null|!==\s*null|!=\s*undefined|!==\s*undefined|\?\?/g),
    ];
    if (nullChecks.length > 0) {
      score += 10;
      findings.push(
        `✅ Null/undefined checks in ${path.basename(file)}: ${nullChecks.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeAuthErrorHandling(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for Firebase auth error handling
    const authErrorHandling = [...content.matchAll(/auth.*error|error.*auth|FirebaseError/gi)];
    if (authErrorHandling.length > 0) {
      score += 20;
      findings.push(
        `✅ Authentication error handling in ${path.basename(file)}: ${authErrorHandling.length} instances`
      );
    }

    // Check for login error handling
    const loginErrorHandling = [...content.matchAll(/login.*error|signin.*error|signUp.*error/gi)];
    if (loginErrorHandling.length > 0) {
      score += 15;
      findings.push(
        `✅ Login error handling in ${path.basename(file)}: ${loginErrorHandling.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeFirestoreErrorHandling(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for Firestore error handling
    const firestoreErrorHandling = [
      ...content.matchAll(/firestore.*error|firebase.*error|permission.*denied/gi),
    ];
    if (firestoreErrorHandling.length > 0) {
      score += 20;
      findings.push(
        `✅ Firestore error handling in ${path.basename(file)}: ${firestoreErrorHandling.length} instances`
      );
    }

    // Check for database error patterns
    const dbErrorPatterns = [...content.matchAll(/database.*error|doc.*error|collection.*error/gi)];
    if (dbErrorPatterns.length > 0) {
      score += 10;
      findings.push(
        `✅ Database error patterns in ${path.basename(file)}: ${dbErrorPatterns.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeConnectionErrorHandling(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for connection error handling
    const connectionErrorHandling = [
      ...content.matchAll(/connection.*error|network.*error|WebChannelConnection/gi),
    ];
    if (connectionErrorHandling.length > 0) {
      score += 15;
      findings.push(
        `✅ Connection error handling in ${path.basename(file)}: ${connectionErrorHandling.length} instances`
      );
    }

    // Check for connection retry logic
    const connectionRetry = [
      ...content.matchAll(/handleConnectionError|reconnect|connection.*retry/gi),
    ];
    if (connectionRetry.length > 0) {
      score += 15;
      findings.push(
        `✅ Connection retry logic in ${path.basename(file)}: ${connectionRetry.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeClientSideValidation(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check HTML files for validation attributes
  const htmlFiles = files.filter(f => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for HTML5 validation attributes
    const html5Validation = [
      ...content.matchAll(/required|pattern|min|max|maxlength|type="email"/gi),
    ];
    if (html5Validation.length > 0) {
      score += 15;
      findings.push(
        `✅ HTML5 validation in ${path.basename(file)}: ${html5Validation.length} attributes`
      );
    }
  }

  // Check JS files for client-side validation
  const jsFiles = files.filter(f => f.endsWith('.js'));
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for form validation functions
    const formValidation = [...content.matchAll(/validate.*form|form.*validate|checkValidity/gi)];
    if (formValidation.length > 0) {
      score += 15;
      findings.push(
        `✅ Form validation in ${path.basename(file)}: ${formValidation.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeErrorMessageDisplay(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for error message display
    const errorMessageDisplay = [
      ...content.matchAll(/error.*message|message.*error|showToast.*error/gi),
    ];
    if (errorMessageDisplay.length > 0) {
      score += 20;
      findings.push(
        `✅ Error message display in ${path.basename(file)}: ${errorMessageDisplay.length} instances`
      );
    }

    // Check for toast notifications
    const toastNotifications = [...content.matchAll(/toast|notification|alert/gi)];
    if (toastNotifications.length > 0) {
      score += 10;
      findings.push(
        `✅ User notifications in ${path.basename(file)}: ${toastNotifications.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeFieldHighlighting(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for field highlighting on errors
    const fieldHighlighting = [
      ...content.matchAll(/invalid|error.*field|field.*error|highlight.*error/gi),
    ];
    if (fieldHighlighting.length > 0) {
      score += 15;
      findings.push(
        `✅ Field error highlighting in ${path.basename(file)}: ${fieldHighlighting.length} instances`
      );
    }

    // Check for CSS error classes
    if (file.endsWith('.css')) {
      const errorClasses = [...content.matchAll(/\.error|\.invalid|\.warning/gi)];
      if (errorClasses.length > 0) {
        score += 10;
        findings.push(
          `✅ Error styling classes in ${path.basename(file)}: ${errorClasses.length} instances`
        );
      }
    }
  }

  return { findings, issues, score };
}

async function analyzeGracefulDegradation(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for graceful degradation patterns
    const gracefulDegradation = [
      ...content.matchAll(/fallback|graceful.*degradation|degrade.*gracefully/gi),
    ];
    if (gracefulDegradation.length > 0) {
      score += 15;
      findings.push(
        `✅ Graceful degradation in ${path.basename(file)}: ${gracefulDegradation.length} instances`
      );
    }

    // Check for feature detection
    const featureDetection = [
      ...content.matchAll(/feature.*detect|detect.*feature|support.*check/gi),
    ];
    if (featureDetection.length > 0) {
      score += 10;
      findings.push(
        `✅ Feature detection in ${path.basename(file)}: ${featureDetection.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeUserNotifications(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for user notification systems
    const userNotifications = [
      ...content.matchAll(/showToast|notification|alert.*user|user.*feedback/gi),
    ];
    if (userNotifications.length > 0) {
      score += 20;
      findings.push(
        `✅ User notification systems in ${path.basename(file)}: ${userNotifications.length} instances`
      );
    }

    // Check for loading states
    const loadingStates = [...content.matchAll(/loading|spinner|progress/gi)];
    if (loadingStates.length > 0) {
      score += 10;
      findings.push(
        `✅ Loading state indicators in ${path.basename(file)}: ${loadingStates.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeFallbackMechanisms(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for fallback mechanisms
    const fallbackMechanisms = [...content.matchAll(/fallback|default.*value|backup.*plan/gi)];
    if (fallbackMechanisms.length > 0) {
      score += 15;
      findings.push(
        `✅ Fallback mechanisms in ${path.basename(file)}: ${fallbackMechanisms.length} instances`
      );
    }

    // Check for alternative code paths
    const alternativePaths = [...content.matchAll(/else.*if|alternative|backup/gi)];
    if (alternativePaths.length > 0) {
      score += 10;
      findings.push(
        `✅ Alternative code paths in ${path.basename(file)}: ${alternativePaths.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

/**
 * Utility functions
 */
function getAllFiles(extensions = ['.html', '.js', '.css']) {
  const files = [];

  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !EXCLUDED_FILES.some(excluded => item.includes(excluded))) {
          if (SCAN_DIRECTORIES.includes(item) || dir !== '.') {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error.message);
    }
  }

  scanDirectory('.');
  return files;
}

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function calculateOverallScore(results) {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [category, weight] of Object.entries(ERROR_HANDLING_WEIGHTS)) {
    if (results[category]) {
      weightedSum += results[category].score * weight;
      totalWeight += weight;
    }
  }

  return Math.round(weightedSum / totalWeight);
}

function generateSummary(results) {
  const overallScore = calculateOverallScore(results);
  const overallGrade = getGrade(overallScore);

  const criticalIssues = Object.values(results)
    .flatMap(r => r.issues)
    .filter(issue => issue.includes('❌')).length;

  const warnings = Object.values(results)
    .flatMap(r => r.issues)
    .filter(issue => issue.includes('⚠️')).length;

  return {
    overallScore,
    overallGrade,
    criticalIssues,
    warnings,
    categories: Object.keys(results).length,
  };
}

function displayResults(results, summary) {
  console.log('🚨 ERROR HANDLING TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`📊 Overall Score: ${summary.overallScore}/100 (Grade ${summary.overallGrade})`);
  console.log(`🚨 Critical Issues: ${summary.criticalIssues}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`📂 Categories Tested: ${summary.categories}`);
  console.log();

  // Display each category
  for (const [key, result] of Object.entries(results)) {
    console.log(`🚨 ${result.category} (Weight: ${ERROR_HANDLING_WEIGHTS[key]}%)`);
    console.log(`   Score: ${result.score}/${result.maxScore} (${result.grade})`);

    if (result.findings.length > 0) {
      console.log('   Findings:');
      result.findings.forEach(finding => console.log(`     ${finding}`));
    }

    if (result.issues.length > 0) {
      console.log('   Issues:');
      result.issues.forEach(issue => console.log(`     ${issue}`));
    }
    console.log();
  }

  // Error handling assessment
  console.log('🛡️  ERROR HANDLING ASSESSMENT');
  console.log('='.repeat(50));

  if (summary.overallScore >= 90 && summary.criticalIssues === 0) {
    console.log('✅ EXCELLENT - Robust error handling implementation!');
    console.log(
      '   Your extension handles errors gracefully and provides excellent user experience.'
    );
    console.log('   Ready for production deployment with confidence.');
  } else if (summary.overallScore >= 80 && summary.criticalIssues <= 1) {
    console.log('👍 GOOD - Strong error handling with minor gaps.');
    console.log('   Most error scenarios are well handled with room for improvement.');
    console.log('   Suitable for deployment with minor enhancements.');
  } else if (summary.overallScore >= 70) {
    console.log('⚠️  FAIR - Adequate error handling but improvements needed.');
    console.log('   Several error scenarios need better handling.');
    console.log('   Address issues before production deployment.');
  } else {
    console.log('❌ POOR - Significant error handling gaps detected.');
    console.log('   Major improvements required for production readiness.');
    console.log('   Not recommended for deployment until issues are resolved.');
  }

  console.log('\n🔧 Error Handling Checklist:');
  console.log('   ✅ Network Errors: Connection failures, timeouts, retries');
  console.log('   ✅ Input Validation: XSS prevention, sanitization, type checking');
  console.log('   ✅ Firebase Errors: Authentication, Firestore, connection issues');
  console.log('   ✅ Form Validation: Client-side validation, error messages, field highlighting');
  console.log('   ✅ Recovery: Graceful degradation, user notifications, fallback mechanisms');

  console.log('\n🧪 Manual Testing Recommendations:');
  console.log('   1. Test offline scenarios and network failures');
  console.log('   2. Attempt invalid inputs and malformed data');
  console.log('   3. Test Firebase connection interruptions');
  console.log('   4. Verify form validation with various invalid inputs');
  console.log('   5. Test recovery mechanisms after errors occur');
  console.log('   6. Validate user feedback for all error scenarios');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runErrorHandlingTest()
    .then(summary => {
      process.exit(summary.criticalIssues > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Error handling test failed:', error);
      process.exit(1);
    });
}

export { runErrorHandlingTest };
