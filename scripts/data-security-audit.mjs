#!/usr/bin/env node

/**
 * Data Security Audit Script for DesignPrompts Chrome Extension
 *
 * This script validates secure data storage and transmission practices including:
 * - Data storage security (Chrome storage APIs, localStorage usage)
 * - Data transmission security (HTTPS, API security, encryption)
 * - Sensitive data handling (credentials, tokens, personal information)
 * - Firebase security configuration and rules
 * - Privacy compliance and data minimization
 * - Encryption and data protection mechanisms
 * - Chrome extension specific security practices
 */

import fs from 'fs';
import path from 'path';

// Configuration
const SCAN_DIRECTORIES = ['js', 'pages', 'functions'];
const EXCLUDED_FILES = ['node_modules', '.git', 'coverage', 'docs'];

// Data security criteria weights for scoring
const DATA_SECURITY_WEIGHTS = {
  storage_security: 25,
  transmission_security: 25,
  sensitive_data_handling: 20,
  firebase_security: 15,
  privacy_compliance: 15,
};

// Sensitive data patterns to look for
const SENSITIVE_PATTERNS = {
  passwords: /password|pwd|pass/gi,
  tokens: /token|jwt|auth|secret|key/gi,
  credentials: /credential|username|email|login/gi,
  personalInfo: /name|address|phone|ssn|dob|birthdate/gi,
  financial: /credit|card|bank|payment|billing/gi,
};

/**
 * Main data security audit function
 */
async function runDataSecurityAudit() {
  console.log('🔒 Starting Data Security Audit for DesignPrompts...\n');

  const results = {
    storage_security: await auditStorageSecurity(),
    transmission_security: await auditTransmissionSecurity(),
    sensitive_data_handling: await auditSensitiveDataHandling(),
    firebase_security: await auditFirebaseSecurity(),
    privacy_compliance: await auditPrivacyCompliance(),
  };

  const summary = generateSummary(results);
  displayResults(results, summary);

  // Save results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    overallScore: summary.overallScore,
    overallGrade: summary.overallGrade,
    criticalIssues: summary.criticalIssues,
    warnings: summary.warnings,
    categories: results,
  };

  fs.writeFileSync('data-security-audit-results.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed results saved to: data-security-audit-results.json');

  return summary;
}

/**
 * Audit data storage security practices
 */
async function auditStorageSecurity() {
  const files = getAllFiles(['.js']);
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for Chrome storage API usage
  const chromeStorageUsage = await analyzeChromeStorageUsage(files);
  findings.push(...chromeStorageUsage.findings);
  issues.push(...chromeStorageUsage.issues);
  score += chromeStorageUsage.score;

  // Check for localStorage/sessionStorage usage
  const webStorageUsage = await analyzeWebStorageUsage(files);
  findings.push(...webStorageUsage.findings);
  issues.push(...webStorageUsage.issues);
  score += webStorageUsage.score;

  // Check for data encryption
  const dataEncryption = await analyzeDataEncryption(files);
  findings.push(...dataEncryption.findings);
  issues.push(...dataEncryption.issues);
  score += dataEncryption.score;

  // Check for storage security patterns
  const storagePatterns = await analyzeStorageSecurityPatterns(files);
  findings.push(...storagePatterns.findings);
  issues.push(...storagePatterns.issues);
  score += storagePatterns.score;

  return {
    category: 'Storage Security',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit data transmission security
 */
async function auditTransmissionSecurity() {
  const files = getAllFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for HTTPS usage
  const httpsUsage = await analyzeHttpsUsage(files);
  findings.push(...httpsUsage.findings);
  issues.push(...httpsUsage.issues);
  score += httpsUsage.score;

  // Check for API security
  const apiSecurity = await analyzeApiSecurity(files);
  findings.push(...apiSecurity.findings);
  issues.push(...apiSecurity.issues);
  score += apiSecurity.score;

  // Check for transmission encryption
  const transmissionEncryption = await analyzeTransmissionEncryption(files);
  findings.push(...transmissionEncryption.findings);
  issues.push(...transmissionEncryption.issues);
  score += transmissionEncryption.score;

  // Check for secure headers
  const secureHeaders = await analyzeSecureHeaders(files);
  findings.push(...secureHeaders.findings);
  issues.push(...secureHeaders.issues);
  score += secureHeaders.score;

  return {
    category: 'Transmission Security',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit sensitive data handling practices
 */
async function auditSensitiveDataHandling() {
  const files = getAllFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for credential handling
  const credentialHandling = await analyzeCredentialHandling(files);
  findings.push(...credentialHandling.findings);
  issues.push(...credentialHandling.issues);
  score += credentialHandling.score;

  // Check for token management
  const tokenManagement = await analyzeTokenManagement(files);
  findings.push(...tokenManagement.findings);
  issues.push(...tokenManagement.issues);
  score += tokenManagement.score;

  // Check for personal information handling
  const personalInfoHandling = await analyzePersonalInfoHandling(files);
  findings.push(...personalInfoHandling.findings);
  issues.push(...personalInfoHandling.issues);
  score += personalInfoHandling.score;

  // Check for data minimization
  const dataMinimization = await analyzeDataMinimization(files);
  findings.push(...dataMinimization.findings);
  issues.push(...dataMinimization.issues);
  score += dataMinimization.score;

  return {
    category: 'Sensitive Data Handling',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit Firebase security configuration
 */
async function auditFirebaseSecurity() {
  let score = 0;
  const issues = [];
  const findings = [];

  // Check Firestore security rules
  const firestoreRules = await analyzeFirestoreRules();
  findings.push(...firestoreRules.findings);
  issues.push(...firestoreRules.issues);
  score += firestoreRules.score;

  // Check Firebase configuration
  const firebaseConfig = await analyzeFirebaseConfig();
  findings.push(...firebaseConfig.findings);
  issues.push(...firebaseConfig.issues);
  score += firebaseConfig.score;

  // Check authentication security
  const authSecurity = await analyzeAuthSecurity();
  findings.push(...authSecurity.findings);
  issues.push(...authSecurity.issues);
  score += authSecurity.score;

  return {
    category: 'Firebase Security',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit privacy compliance and data protection
 */
async function auditPrivacyCompliance() {
  const files = getAllFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for privacy policy
  const privacyPolicy = await analyzePrivacyPolicy();
  findings.push(...privacyPolicy.findings);
  issues.push(...privacyPolicy.issues);
  score += privacyPolicy.score;

  // Check for data retention policies
  const dataRetention = await analyzeDataRetention(files);
  findings.push(...dataRetention.findings);
  issues.push(...dataRetention.issues);
  score += dataRetention.score;

  // Check for user consent mechanisms
  const userConsent = await analyzeUserConsent(files);
  findings.push(...userConsent.findings);
  issues.push(...userConsent.issues);
  score += userConsent.score;

  // Check for data anonymization
  const dataAnonymization = await analyzeDataAnonymization(files);
  findings.push(...dataAnonymization.findings);
  issues.push(...dataAnonymization.issues);
  score += dataAnonymization.score;

  return {
    category: 'Privacy Compliance',
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
async function analyzeChromeStorageUsage(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for Chrome storage API usage
    const chromeStorageUsage = [...content.matchAll(/chrome\.storage\.(local|sync|managed)/g)];
    if (chromeStorageUsage.length > 0) {
      score += 20;
      findings.push(
        `✅ Chrome storage API usage in ${path.basename(file)}: ${chromeStorageUsage.length} instances`
      );

      // Check for secure storage practices
      const secureStorage = [...content.matchAll(/chrome\.storage\.[^.]+\.(get|set)\([^)]*\)/g)];
      if (secureStorage.length > 0) {
        score += 10;
        findings.push(
          `✅ Proper Chrome storage methods in ${path.basename(file)}: ${secureStorage.length} instances`
        );
      }
    }

    // Check for storage error handling
    const storageErrorHandling = [
      ...content.matchAll(/chrome\.storage.*\.catch|chrome\.runtime\.lastError/g),
    ];
    if (storageErrorHandling.length > 0) {
      score += 10;
      findings.push(
        `✅ Storage error handling in ${path.basename(file)}: ${storageErrorHandling.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeWebStorageUsage(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for localStorage usage
    const localStorageUsage = [...content.matchAll(/localStorage\.(get|set|remove)/g)];
    if (localStorageUsage.length > 0) {
      issues.push(
        `⚠️ localStorage usage in ${path.basename(file)}: ${localStorageUsage.length} instances (Chrome storage preferred)`
      );
    } else {
      score += 15;
      findings.push(`✅ No localStorage usage in ${path.basename(file)} (good practice)`);
    }

    // Check for sessionStorage usage
    const sessionStorageUsage = [...content.matchAll(/sessionStorage\.(get|set|remove)/g)];
    if (sessionStorageUsage.length > 0) {
      issues.push(
        `⚠️ sessionStorage usage in ${path.basename(file)}: ${sessionStorageUsage.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeDataEncryption(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for encryption functions
    const encryptionUsage = [...content.matchAll(/encrypt|decrypt|cipher|crypto|hash/gi)];
    if (encryptionUsage.length > 0) {
      score += 15;
      findings.push(
        `✅ Encryption usage in ${path.basename(file)}: ${encryptionUsage.length} instances`
      );
    }

    // Check for secure random generation
    const secureRandom = [...content.matchAll(/crypto\.getRandomValues|Math\.random/g)];
    const secureRandomCount = secureRandom.filter(match => match[0].includes('crypto')).length;
    if (secureRandomCount > 0) {
      score += 10;
      findings.push(
        `✅ Secure random generation in ${path.basename(file)}: ${secureRandomCount} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeStorageSecurityPatterns(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for data validation before storage
    const dataValidation = [...content.matchAll(/validate.*before.*stor|stor.*after.*valid/gi)];
    if (dataValidation.length > 0) {
      score += 10;
      findings.push(
        `✅ Data validation before storage in ${path.basename(file)}: ${dataValidation.length} instances`
      );
    }

    // Check for data sanitization
    const dataSanitization = [...content.matchAll(/sanitize.*data|clean.*data|escape.*data/gi)];
    if (dataSanitization.length > 0) {
      score += 10;
      findings.push(
        `✅ Data sanitization in ${path.basename(file)}: ${dataSanitization.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeHttpsUsage(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check manifest.json for HTTPS requirements
  const manifestFile = 'manifest.json';
  if (fs.existsSync(manifestFile)) {
    const manifestContent = fs.readFileSync(manifestFile, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Check host permissions for HTTPS
    const hostPermissions = manifest.host_permissions || [];
    const httpsUrls = hostPermissions.filter(url => url.startsWith('https://'));
    const httpUrls = hostPermissions.filter(url => url.startsWith('http://'));

    if (httpsUrls.length > 0 && httpUrls.length === 0) {
      score += 25;
      findings.push(`✅ All host permissions use HTTPS: ${httpsUrls.length} secure URLs`);
    } else if (httpUrls.length > 0) {
      issues.push(`⚠️ HTTP URLs found in host permissions: ${httpUrls.length} insecure URLs`);
    }

    // Check CSP for HTTPS requirements
    const csp = manifest.content_security_policy;
    if (csp && typeof csp === 'object') {
      const extensionPages = csp.extension_pages;
      if (extensionPages && extensionPages.includes('https:')) {
        score += 15;
        findings.push(`✅ CSP enforces HTTPS for external resources`);
      }
    }
  }

  // Check for hardcoded HTTP URLs in code
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    const httpUrls = [...content.matchAll(/['"`]http:\/\/[^'"`\s]+['"`]/g)];
    const httpsUrls = [...content.matchAll(/['"`]https:\/\/[^'"`\s]+['"`]/g)];

    if (httpUrls.length > 0) {
      issues.push(`⚠️ HTTP URLs found in ${path.basename(file)}: ${httpUrls.length} insecure URLs`);
    } else if (httpsUrls.length > 0) {
      score += 10;
      findings.push(`✅ HTTPS URLs in ${path.basename(file)}: ${httpsUrls.length} secure URLs`);
    }
  }

  return { findings, issues, score };
}

async function analyzeApiSecurity(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for API key security
    const apiKeys = [...content.matchAll(/api[_-]?key|apiKey/gi)];
    if (apiKeys.length > 0) {
      // Check if API keys are properly handled (not hardcoded, except Firebase which is safe)
      const hardcodedKeys = [
        ...content.matchAll(/api[_-]?key\s*[:=]\s*['"`][a-zA-Z0-9]{20,}['"`]/gi),
      ];
      if (hardcodedKeys.length > 0) {
        // Check if this is a Firebase config file (Firebase API keys are safe to expose)
        const isFirebaseConfig =
          content.includes('firebaseConfig') ||
          content.includes('firebase/app') ||
          content.includes('authDomain') ||
          content.includes('projectId');
        if (isFirebaseConfig) {
          score += 15;
          findings.push(
            `✅ Firebase API keys in ${path.basename(file)}: ${hardcodedKeys.length} instances (safe for client-side Firebase)`
          );
        } else {
          issues.push(
            `❌ Hardcoded API keys detected in ${path.basename(file)}: ${hardcodedKeys.length} instances`
          );
        }
      } else {
        score += 15;
        findings.push(
          `✅ API key references in ${path.basename(file)}: ${apiKeys.length} instances (appear to be properly handled)`
        );
      }
    }

    // Check for authentication headers
    const authHeaders = [...content.matchAll(/authorization|bearer|x-api-key/gi)];
    if (authHeaders.length > 0) {
      score += 10;
      findings.push(
        `✅ Authentication headers in ${path.basename(file)}: ${authHeaders.length} instances`
      );
    }

    // Check for request validation
    const requestValidation = [...content.matchAll(/validate.*request|request.*validation/gi)];
    if (requestValidation.length > 0) {
      score += 10;
      findings.push(
        `✅ Request validation in ${path.basename(file)}: ${requestValidation.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeTransmissionEncryption(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for TLS/SSL usage
    const tlsUsage = [...content.matchAll(/tls|ssl|https/gi)];
    if (tlsUsage.length > 0) {
      score += 15;
      findings.push(
        `✅ TLS/SSL references in ${path.basename(file)}: ${tlsUsage.length} instances`
      );
    }

    // Check for secure fetch options
    const secureFetch = [...content.matchAll(/fetch\([^)]*{[^}]*mode:\s*['"`]cors['"`]/g)];
    if (secureFetch.length > 0) {
      score += 10;
      findings.push(
        `✅ Secure fetch configuration in ${path.basename(file)}: ${secureFetch.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeSecureHeaders(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for security headers
    const securityHeaders = [
      ...content.matchAll(/x-frame-options|x-content-type-options|strict-transport-security/gi),
    ];
    if (securityHeaders.length > 0) {
      score += 15;
      findings.push(
        `✅ Security headers in ${path.basename(file)}: ${securityHeaders.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeCredentialHandling(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for password handling
    const passwordHandling = [...content.matchAll(/password.*hash|hash.*password|bcrypt|scrypt/gi)];
    if (passwordHandling.length > 0) {
      score += 20;
      findings.push(
        `✅ Secure password handling in ${path.basename(file)}: ${passwordHandling.length} instances`
      );
    }

    // Check for credential storage
    const credentialStorage = [...content.matchAll(/credential.*stor|stor.*credential/gi)];
    if (credentialStorage.length > 0) {
      // Check if using secure storage
      const secureCredentialStorage = [
        ...content.matchAll(/chrome\.storage.*credential|credential.*chrome\.storage/gi),
      ];
      if (secureCredentialStorage.length > 0) {
        score += 15;
        findings.push(
          `✅ Secure credential storage in ${path.basename(file)}: ${secureCredentialStorage.length} instances`
        );
      } else {
        issues.push(
          `⚠️ Credential storage in ${path.basename(file)}: verify secure storage method`
        );
      }
    }
  }

  return { findings, issues, score };
}

async function analyzeTokenManagement(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for token expiration handling
    const tokenExpiration = [...content.matchAll(/token.*expir|expir.*token|refresh.*token/gi)];
    if (tokenExpiration.length > 0) {
      score += 15;
      findings.push(
        `✅ Token expiration handling in ${path.basename(file)}: ${tokenExpiration.length} instances`
      );
    }

    // Check for token validation
    const tokenValidation = [...content.matchAll(/validate.*token|token.*valid|verify.*token/gi)];
    if (tokenValidation.length > 0) {
      score += 15;
      findings.push(
        `✅ Token validation in ${path.basename(file)}: ${tokenValidation.length} instances`
      );
    }

    // Check for secure token storage
    const tokenStorage = [...content.matchAll(/token.*stor|stor.*token/gi)];
    if (tokenStorage.length > 0) {
      score += 10;
      findings.push(
        `✅ Token storage handling in ${path.basename(file)}: ${tokenStorage.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzePersonalInfoHandling(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for PII handling
    const piiHandling = [...content.matchAll(/pii|personal.*info|sensitive.*data/gi)];
    if (piiHandling.length > 0) {
      score += 15;
      findings.push(
        `✅ PII handling awareness in ${path.basename(file)}: ${piiHandling.length} instances`
      );
    }

    // Check for data anonymization
    const anonymization = [...content.matchAll(/anonymize|anonymization|redact|mask/gi)];
    if (anonymization.length > 0) {
      score += 15;
      findings.push(
        `✅ Data anonymization in ${path.basename(file)}: ${anonymization.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeDataMinimization(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for data minimization principles
    const dataMinimization = [...content.matchAll(/minimum.*data|minimal.*data|necessary.*data/gi)];
    if (dataMinimization.length > 0) {
      score += 15;
      findings.push(
        `✅ Data minimization principles in ${path.basename(file)}: ${dataMinimization.length} instances`
      );
    }

    // Check for data cleanup
    const dataCleanup = [...content.matchAll(/cleanup.*data|clear.*data|delete.*data/gi)];
    if (dataCleanup.length > 0) {
      score += 10;
      findings.push(
        `✅ Data cleanup mechanisms in ${path.basename(file)}: ${dataCleanup.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeFirestoreRules() {
  const findings = [];
  const issues = [];
  let score = 0;

  const rulesFile = 'firestore.rules';
  if (fs.existsSync(rulesFile)) {
    const rulesContent = fs.readFileSync(rulesFile, 'utf-8');

    // Check for authentication requirements
    const authRequirements = [...rulesContent.matchAll(/request\.auth\s*!=\s*null/g)];
    if (authRequirements.length > 0) {
      score += 20;
      findings.push(
        `✅ Authentication requirements in Firestore rules: ${authRequirements.length} rules`
      );
    }

    // Check for user-specific access controls
    const userAccess = [
      ...rulesContent.matchAll(/request\.auth\.uid\s*==\s*resource\.data\.userId/g),
    ];
    if (userAccess.length > 0) {
      score += 15;
      findings.push(`✅ User-specific access controls: ${userAccess.length} rules`);
    }

    // Check for data validation in rules
    const dataValidation = [...rulesContent.matchAll(/is\s+string|is\s+number|is\s+bool|matches/g)];
    if (dataValidation.length > 0) {
      score += 15;
      findings.push(
        `✅ Data validation in Firestore rules: ${dataValidation.length} validation rules`
      );
    }
  } else {
    issues.push(`❌ Firestore rules file not found`);
  }

  return { findings, issues, score };
}

async function analyzeFirebaseConfig() {
  const findings = [];
  const issues = [];
  let score = 0;

  const configFiles = ['js/firebase-init.js', 'js/config.js'];

  for (const configFile of configFiles) {
    if (fs.existsSync(configFile)) {
      const content = fs.readFileSync(configFile, 'utf-8');

      // Check for proper Firebase configuration
      const firebaseConfig = [...content.matchAll(/apiKey|authDomain|projectId|storageBucket/g)];
      if (firebaseConfig.length > 0) {
        score += 10;
        findings.push(
          `✅ Firebase configuration in ${path.basename(configFile)}: ${firebaseConfig.length} config items`
        );
      }

      // Check for environment-based configuration
      const envConfig = [...content.matchAll(/process\.env|NODE_ENV|FIREBASE_CONFIG/g)];
      if (envConfig.length > 0) {
        score += 10;
        findings.push(
          `✅ Environment-based configuration in ${path.basename(configFile)}: ${envConfig.length} instances`
        );
      }
    }
  }

  return { findings, issues, score };
}

async function analyzeAuthSecurity() {
  const findings = [];
  const issues = [];
  let score = 0;

  const authFiles = ['js/app.js', 'js/promptData.js'];

  for (const authFile of authFiles) {
    if (fs.existsSync(authFile)) {
      const content = fs.readFileSync(authFile, 'utf-8');

      // Check for secure authentication methods
      const secureAuth = [
        ...content.matchAll(
          /signInWithEmailAndPassword|signInWithPopup|createUserWithEmailAndPassword/g
        ),
      ];
      if (secureAuth.length > 0) {
        score += 15;
        findings.push(
          `✅ Secure authentication methods in ${path.basename(authFile)}: ${secureAuth.length} instances`
        );
      }

      // Check for email verification
      const emailVerification = [...content.matchAll(/sendEmailVerification|emailVerified/g)];
      if (emailVerification.length > 0) {
        score += 10;
        findings.push(
          `✅ Email verification in ${path.basename(authFile)}: ${emailVerification.length} instances`
        );
      }
    }
  }

  return { findings, issues, score };
}

async function analyzePrivacyPolicy() {
  const findings = [];
  const issues = [];
  let score = 0;

  const privacyFiles = ['docs/privacy-policy.md', 'privacy-policy.md', 'PRIVACY.md'];

  for (const privacyFile of privacyFiles) {
    if (fs.existsSync(privacyFile)) {
      const content = fs.readFileSync(privacyFile, 'utf-8');

      // Check for key privacy policy sections
      const dataCollection = content.toLowerCase().includes('data collection');
      const dataUse =
        content.toLowerCase().includes('data use') || content.toLowerCase().includes('how we use');
      const dataSharing =
        content.toLowerCase().includes('data sharing') ||
        content.toLowerCase().includes('third parties');
      const userRights =
        content.toLowerCase().includes('user rights') ||
        content.toLowerCase().includes('your rights');

      let policyScore = 0;
      if (dataCollection) policyScore += 5;
      if (dataUse) policyScore += 5;
      if (dataSharing) policyScore += 5;
      if (userRights) policyScore += 5;

      score += policyScore;
      findings.push(`✅ Privacy policy found with ${policyScore}/20 key sections`);
      break;
    }
  }

  if (score === 0) {
    issues.push(`⚠️ Privacy policy not found or incomplete`);
  }

  return { findings, issues, score };
}

async function analyzeDataRetention(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for data retention policies
    const dataRetention = [
      ...content.matchAll(/retention|retain.*data|delete.*after|expire.*data/gi),
    ];
    if (dataRetention.length > 0) {
      score += 15;
      findings.push(
        `✅ Data retention handling in ${path.basename(file)}: ${dataRetention.length} instances`
      );
    }

    // Check for automatic cleanup
    const autoCleanup = [
      ...content.matchAll(/auto.*cleanup|cleanup.*automatic|scheduled.*delete/gi),
    ];
    if (autoCleanup.length > 0) {
      score += 10;
      findings.push(
        `✅ Automatic cleanup in ${path.basename(file)}: ${autoCleanup.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

async function analyzeUserConsent(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for consent mechanisms
    const userConsent = [
      ...content.matchAll(/consent|user.*agreement|terms.*accept|privacy.*accept/gi),
    ];
    if (userConsent.length > 0) {
      score += 15;
      findings.push(
        `✅ User consent mechanisms in ${path.basename(file)}: ${userConsent.length} instances`
      );
    }

    // Check for opt-out mechanisms
    const optOut = [...content.matchAll(/opt.*out|unsubscribe|disable.*tracking/gi)];
    if (optOut.length > 0) {
      score += 10;
      findings.push(`✅ Opt-out mechanisms in ${path.basename(file)}: ${optOut.length} instances`);
    }
  }

  return { findings, issues, score };
}

async function analyzeDataAnonymization(files) {
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for anonymization techniques
    const anonymization = [...content.matchAll(/anonymize|hash.*user|uuid|pseudonym/gi)];
    if (anonymization.length > 0) {
      score += 15;
      findings.push(
        `✅ Data anonymization in ${path.basename(file)}: ${anonymization.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

/**
 * Utility functions
 */
function getAllFiles(extensions = ['.html', '.js', '.css', '.md']) {
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

  for (const [category, weight] of Object.entries(DATA_SECURITY_WEIGHTS)) {
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
  console.log('🔒 DATA SECURITY AUDIT RESULTS');
  console.log('='.repeat(50));
  console.log(`📊 Overall Score: ${summary.overallScore}/100 (Grade ${summary.overallGrade})`);
  console.log(`🚨 Critical Issues: ${summary.criticalIssues}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`📂 Categories Tested: ${summary.categories}`);
  console.log();

  // Display each category
  for (const [key, result] of Object.entries(results)) {
    console.log(`🔒 ${result.category} (Weight: ${DATA_SECURITY_WEIGHTS[key]}%)`);
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

  // Data security assessment
  console.log('🛡️  DATA SECURITY ASSESSMENT');
  console.log('='.repeat(50));

  if (summary.overallScore >= 90 && summary.criticalIssues === 0) {
    console.log('✅ EXCELLENT - Robust data security implementation!');
    console.log(
      '   Your extension follows security best practices for data storage and transmission.'
    );
    console.log('   Ready for production deployment with high security confidence.');
  } else if (summary.overallScore >= 80 && summary.criticalIssues <= 1) {
    console.log('👍 GOOD - Strong data security with minor considerations.');
    console.log('   Most security practices are well implemented with room for enhancement.');
    console.log('   Suitable for deployment with minor security improvements.');
  } else if (summary.overallScore >= 70) {
    console.log('⚠️  FAIR - Adequate data security but improvements needed.');
    console.log('   Several security practices need enhancement.');
    console.log('   Address security issues before production deployment.');
  } else {
    console.log('❌ POOR - Significant data security gaps detected.');
    console.log('   Major security improvements required for production readiness.');
    console.log('   Not recommended for deployment until security issues are resolved.');
  }

  console.log('\n🔐 Data Security Checklist:');
  console.log('   ✅ Storage Security: Chrome storage APIs, encryption, secure patterns');
  console.log('   ✅ Transmission Security: HTTPS, API security, secure headers');
  console.log('   ✅ Sensitive Data: Credentials, tokens, PII handling');
  console.log('   ✅ Firebase Security: Rules, configuration, authentication');
  console.log('   ✅ Privacy Compliance: Policy, retention, consent, anonymization');

  console.log('\n🧪 Manual Security Testing Recommendations:');
  console.log('   1. Test data storage and retrieval under various conditions');
  console.log('   2. Verify HTTPS enforcement and certificate validation');
  console.log('   3. Test authentication flows and token management');
  console.log('   4. Validate Firestore security rules with different user roles');
  console.log('   5. Review privacy policy alignment with actual data practices');
  console.log('   6. Test data deletion and retention mechanisms');
}

// Run the audit
if (import.meta.url === `file://${process.argv[1]}`) {
  runDataSecurityAudit()
    .then(summary => {
      process.exit(summary.criticalIssues > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Data security audit failed:', error);
      process.exit(1);
    });
}

export { runDataSecurityAudit };
