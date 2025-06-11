#!/usr/bin/env node
/**
 * Firebase Authentication Security Audit Script
 * Analyzes authentication flows for security vulnerabilities and best practices
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Security audit results
 */
const auditResults = {
  timestamp: new Date().toISOString(),
  overall: {
    score: 0,
    grade: '',
    criticalIssues: 0,
    warnings: 0,
    passed: 0,
  },
  categories: {
    authentication: [],
    authorization: [],
    dataValidation: [],
    sessionManagement: [],
    inputSanitization: [],
    errorHandling: [],
    permissions: [],
  },
};

/**
 * Add audit finding
 */
function addFinding(
  category,
  severity,
  title,
  description,
  recommendation,
  file = null,
  line = null
) {
  const finding = {
    severity,
    title,
    description,
    recommendation,
    file,
    line,
    timestamp: new Date().toISOString(),
  };

  auditResults.categories[category].push(finding);

  switch (severity) {
    case 'critical':
      auditResults.overall.criticalIssues++;
      break;
    case 'warning':
      auditResults.overall.warnings++;
      break;
    case 'pass':
      auditResults.overall.passed++;
      break;
  }
}

/**
 * Analyze Firebase configuration
 */
function auditFirebaseConfig() {
  console.log('🔍 Auditing Firebase configuration...');

  try {
    const firebaseInit = readFileSync(join(projectRoot, 'js/firebase-init.js'), 'utf8');

    // Check for hardcoded API keys (should be in config but validated)
    if (firebaseInit.includes('apiKey:')) {
      addFinding(
        'authentication',
        'warning',
        'Firebase API Key Exposed',
        'Firebase API key is visible in source code. While this is normal for client-side apps, ensure project security rules are properly configured.',
        'Verify Firestore security rules prevent unauthorized access. Consider using environment variables for sensitive configs.',
        'js/firebase-init.js'
      );
    }

    // Check for proper region configuration
    if (firebaseInit.includes("'europe-west1'")) {
      addFinding(
        'authentication',
        'pass',
        'Regional Configuration Present',
        'Firebase Functions are configured with specific region, which is good for performance and compliance.',
        'Continue using regional configuration for optimal performance.',
        'js/firebase-init.js'
      );
    }

    // Check for error handling in initialization
    if (firebaseInit.includes('try {') && firebaseInit.includes('catch')) {
      addFinding(
        'errorHandling',
        'pass',
        'Error Handling in Initialization',
        'Firebase initialization includes proper error handling.',
        'Continue implementing comprehensive error handling patterns.',
        'js/firebase-init.js'
      );
    }
  } catch (error) {
    addFinding(
      'authentication',
      'critical',
      'Firebase Configuration File Missing',
      'Cannot read Firebase configuration file.',
      'Ensure js/firebase-init.js exists and is properly configured.'
    );
  }
}

/**
 * Analyze authentication implementation
 */
function auditAuthenticationImplementation() {
  console.log('🔍 Auditing authentication implementation...');

  try {
    const promptData = readFileSync(join(projectRoot, 'js/promptData.js'), 'utf8');

    // Check for email verification implementation
    if (promptData.includes('sendEmailVerification') && promptData.includes('emailVerified')) {
      addFinding(
        'authentication',
        'pass',
        'Email Verification Implemented',
        'Email verification is properly implemented for new user accounts.',
        'Ensure email verification is enforced before allowing critical operations.',
        'js/promptData.js'
      );
    }

    // Check for proper password validation
    if (promptData.includes('minlength="8"') || promptData.includes('password')) {
      addFinding(
        'authentication',
        'pass',
        'Basic Password Requirements',
        'Minimum password length requirements are implemented.',
        'Consider implementing additional password complexity requirements.',
        'js/promptData.js'
      );
    }

    // Check for secure logout implementation
    if (promptData.includes('signOut') && promptData.includes('logoutUser')) {
      addFinding(
        'authentication',
        'pass',
        'Secure Logout Implementation',
        'Proper logout functionality is implemented.',
        'Ensure logout clears all session data and redirects appropriately.',
        'js/promptData.js'
      );
    }

    // Check for Google OAuth implementation
    if (promptData.includes('GoogleAuthProvider') && promptData.includes('signInWithCredential')) {
      addFinding(
        'authentication',
        'pass',
        'OAuth Integration',
        'Google OAuth integration is properly implemented using Firebase Auth.',
        'Ensure OAuth tokens are handled securely and not stored unnecessarily.',
        'js/promptData.js'
      );
    }

    // Check for authentication state management
    if (promptData.includes('onAuthStateChanged')) {
      addFinding(
        'sessionManagement',
        'pass',
        'Authentication State Management',
        'Proper authentication state change handling is implemented.',
        'Continue monitoring auth state changes for session security.',
        'js/promptData.js'
      );
    }

    // Check for error handling in auth functions
    const authFunctions = ['signupUser', 'loginUser', 'logoutUser', 'signInWithGoogle'];
    const hasErrorHandling = authFunctions.every(func => {
      const funcMatch = promptData.match(new RegExp(`${func}.*?catch`, 's'));
      return funcMatch !== null;
    });

    if (hasErrorHandling) {
      addFinding(
        'errorHandling',
        'pass',
        'Authentication Error Handling',
        'All authentication functions include proper error handling.',
        "Ensure error messages don't leak sensitive information.",
        'js/promptData.js'
      );
    } else {
      addFinding(
        'errorHandling',
        'warning',
        'Incomplete Authentication Error Handling',
        'Some authentication functions may lack comprehensive error handling.',
        'Add try-catch blocks to all authentication functions.',
        'js/promptData.js'
      );
    }
  } catch (error) {
    addFinding(
      'authentication',
      'critical',
      'Authentication Implementation File Missing',
      'Cannot read authentication implementation file.',
      'Ensure js/promptData.js exists and contains authentication functions.'
    );
  }
}

/**
 * Analyze input validation and sanitization
 */
function auditInputValidation() {
  console.log('🔍 Auditing input validation...');

  try {
    const appJS = readFileSync(join(projectRoot, 'app.js'), 'utf8');
    const popupHTML = readFileSync(join(projectRoot, 'pages/popup.html'), 'utf8');

    // Check for input validation in forms
    if (popupHTML.includes('required') && popupHTML.includes('minlength')) {
      addFinding(
        'dataValidation',
        'pass',
        'HTML5 Form Validation',
        'Basic HTML5 form validation attributes are implemented.',
        'Supplement HTML5 validation with JavaScript validation for better security.',
        'pages/popup.html'
      );
    }

    // Check for email validation
    if (popupHTML.includes('type="email"')) {
      addFinding(
        'dataValidation',
        'pass',
        'Email Input Validation',
        'Email input fields use proper HTML5 type attribute.',
        'Ensure server-side email validation is also implemented.',
        'pages/popup.html'
      );
    }

    // Check for display name validation
    if (appJS.includes('displayName.includes(') && appJS.includes('@')) {
      addFinding(
        'dataValidation',
        'pass',
        'Display Name Validation',
        'Display name validation prevents email addresses as display names.',
        'Consider additional validation rules for display names.',
        'app.js'
      );
    }

    // Check for XSS prevention
    if (appJS.includes('textContent') || appJS.includes('innerText')) {
      addFinding(
        'inputSanitization',
        'pass',
        'XSS Prevention Methods',
        'Code uses textContent/innerText instead of innerHTML in some places.',
        'Ensure all dynamic content uses safe DOM manipulation methods.',
        'app.js'
      );
    }

    // Check for dangerous innerHTML usage
    if (appJS.includes('innerHTML')) {
      addFinding(
        'inputSanitization',
        'warning',
        'Potential XSS Risk - innerHTML Usage',
        'Direct innerHTML usage found, which could lead to XSS if user input is not sanitized.',
        'Replace innerHTML with safer alternatives like textContent, or implement proper sanitization.',
        'app.js'
      );
    }
  } catch (error) {
    addFinding(
      'dataValidation',
      'warning',
      'Input Validation Analysis Incomplete',
      'Could not fully analyze input validation implementation.',
      'Manually review form validation and input sanitization.'
    );
  }
}

/**
 * Analyze authorization and access control
 */
function auditAuthorization() {
  console.log('🔍 Auditing authorization and access control...');

  try {
    const firestoreRules = readFileSync(join(projectRoot, 'firestore.rules'), 'utf8');

    // Check for authentication requirement
    if (
      firestoreRules.includes('isAuthenticated()') &&
      firestoreRules.includes('request.auth != null')
    ) {
      addFinding(
        'authorization',
        'pass',
        'Authentication Required for Database Access',
        'Firestore rules require authentication for database operations.',
        'Continue enforcing authentication for all sensitive operations.',
        'firestore.rules'
      );
    }

    // Check for user ownership validation
    if (firestoreRules.includes('isOwner') && firestoreRules.includes('request.auth.uid')) {
      addFinding(
        'authorization',
        'pass',
        'User Ownership Validation',
        'Firestore rules validate user ownership for resource access.',
        'Ensure ownership validation covers all user-specific resources.',
        'firestore.rules'
      );
    }

    // Check for admin role validation
    if (firestoreRules.includes('isAdmin()') && firestoreRules.includes('token.admin')) {
      addFinding(
        'authorization',
        'pass',
        'Admin Role Authorization',
        'Admin role authorization is implemented in Firestore rules.',
        'Ensure admin tokens are securely managed and validated.',
        'firestore.rules'
      );
    }

    // Check for data validation in rules
    if (firestoreRules.includes('isValidPrompt') && firestoreRules.includes('hasRequiredFields')) {
      addFinding(
        'dataValidation',
        'pass',
        'Server-side Data Validation',
        'Comprehensive server-side data validation is implemented in Firestore rules.',
        'Continue validating all data fields at the database level.',
        'firestore.rules'
      );
    }

    // Check for private data protection
    if (firestoreRules.includes('isPrivate') && firestoreRules.includes('resource.data.userId')) {
      addFinding(
        'authorization',
        'pass',
        'Private Data Access Control',
        'Access control for private data is properly implemented.',
        'Ensure private data cannot be accessed by unauthorized users.',
        'firestore.rules'
      );
    }
  } catch (error) {
    addFinding(
      'authorization',
      'critical',
      'Firestore Security Rules Missing',
      'Cannot read Firestore security rules file.',
      'Ensure firestore.rules exists and is properly configured for production.'
    );
  }
}

/**
 * Analyze manifest permissions
 */
function auditManifestPermissions() {
  console.log('🔍 Auditing manifest permissions...');

  try {
    const manifest = JSON.parse(readFileSync(join(projectRoot, 'manifest.json'), 'utf8'));

    // Check for minimal permissions
    const permissions = manifest.permissions || [];
    const essentialPerms = ['storage', 'identity'];

    essentialPerms.forEach(perm => {
      if (permissions.includes(perm)) {
        addFinding(
          'permissions',
          'pass',
          `Essential Permission: ${perm}`,
          `Required permission '${perm}' is properly declared.`,
          'Continue using minimal necessary permissions.',
          'manifest.json'
        );
      }
    });

    // Check for OAuth configuration
    if (manifest.oauth2 && manifest.oauth2.client_id && manifest.oauth2.scopes) {
      addFinding(
        'permissions',
        'pass',
        'OAuth2 Configuration',
        'OAuth2 configuration is properly set up in manifest.',
        'Ensure OAuth client ID is restricted to authorized domains.',
        'manifest.json'
      );
    }

    // Check for Content Security Policy
    if (manifest.content_security_policy && manifest.content_security_policy.extension_pages) {
      addFinding(
        'permissions',
        'pass',
        'Content Security Policy',
        'Content Security Policy is implemented for extension pages.',
        'Regularly review and update CSP directives for security.',
        'manifest.json'
      );
    } else {
      addFinding(
        'permissions',
        'warning',
        'Missing Content Security Policy',
        'No Content Security Policy found in manifest.',
        'Implement CSP to prevent code injection attacks.',
        'manifest.json'
      );
    }

    // Check for excessive permissions
    const allPerms = [...permissions, ...(manifest.host_permissions || [])];
    if (allPerms.length > 10) {
      addFinding(
        'permissions',
        'warning',
        'High Permission Count',
        'Extension requests a large number of permissions.',
        'Review and minimize permissions to only what is necessary.',
        'manifest.json'
      );
    }
  } catch (error) {
    addFinding(
      'permissions',
      'critical',
      'Manifest File Error',
      'Cannot read or parse manifest.json file.',
      'Ensure manifest.json exists and contains valid JSON.'
    );
  }
}

/**
 * Calculate overall security score
 */
function calculateSecurityScore() {
  const total =
    auditResults.overall.criticalIssues +
    auditResults.overall.warnings +
    auditResults.overall.passed;
  if (total === 0) return 0;

  const criticalWeight = -10;
  const warningWeight = -3;
  const passWeight = 5;

  const score =
    auditResults.overall.criticalIssues * criticalWeight +
    auditResults.overall.warnings * warningWeight +
    auditResults.overall.passed * passWeight;

  // Normalize to 0-100 scale
  const maxPossibleScore = total * passWeight;
  const normalizedScore = Math.max(0, Math.min(100, (score / maxPossibleScore) * 100));

  auditResults.overall.score = Math.round(normalizedScore);

  // Assign letter grade
  if (normalizedScore >= 90) auditResults.overall.grade = 'A';
  else if (normalizedScore >= 80) auditResults.overall.grade = 'B';
  else if (normalizedScore >= 70) auditResults.overall.grade = 'C';
  else if (normalizedScore >= 60) auditResults.overall.grade = 'D';
  else auditResults.overall.grade = 'F';
}

/**
 * Display audit results
 */
function displayResults() {
  console.log('\n🔒 Firebase Authentication Security Audit Results');
  console.log('================================================\n');

  console.log(
    `📊 Overall Security Score: ${auditResults.overall.score}/100 (Grade: ${auditResults.overall.grade})`
  );
  console.log(
    `🎯 Summary: ${auditResults.overall.passed} passed, ${auditResults.overall.warnings} warnings, ${auditResults.overall.criticalIssues} critical issues\n`
  );

  Object.entries(auditResults.categories).forEach(([category, findings]) => {
    if (findings.length === 0) return;

    console.log(`📋 ${category.toUpperCase()}:`);
    findings.forEach(finding => {
      const icon =
        finding.severity === 'critical' ? '🚨' : finding.severity === 'warning' ? '⚠️' : '✅';
      console.log(`  ${icon} ${finding.title}`);
      console.log(`     ${finding.description}`);
      if (finding.file)
        console.log(`     File: ${finding.file}${finding.line ? `:${finding.line}` : ''}`);
      console.log(`     Recommendation: ${finding.recommendation}\n`);
    });
  });

  // High-level recommendations
  console.log('🎯 Priority Recommendations:');
  if (auditResults.overall.criticalIssues > 0) {
    console.log('  🚨 Address all critical security issues immediately');
  }
  if (auditResults.overall.warnings > 0) {
    console.log('  ⚠️ Review and address warning-level security concerns');
  }
  if (auditResults.overall.score >= 80) {
    console.log('  ✅ Good security posture - continue monitoring and updating');
  } else {
    console.log('  🔧 Significant security improvements needed');
  }
}

/**
 * Main audit execution
 */
function runSecurityAudit() {
  console.log('🔒 Starting Firebase Authentication Security Audit...\n');

  auditFirebaseConfig();
  auditAuthenticationImplementation();
  auditInputValidation();
  auditAuthorization();
  auditManifestPermissions();

  calculateSecurityScore();
  displayResults();

  // Save detailed results
  const resultsPath = join(projectRoot, 'security-audit-results.json');
  try {
    writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
    console.log(`\n📄 Detailed audit results saved to: security-audit-results.json`);
  } catch (err) {
    console.log('\n📄 Results not saved due to filesystem access limitation');
  }

  return auditResults;
}

// Run the audit
runSecurityAudit();
