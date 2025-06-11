#!/usr/bin/env node
/**
 * Content Security Policy (CSP) Validation Audit Script
 * Analyzes CSP settings in manifest.json for security compliance and best practices
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * CSP audit results
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
  cspPolicy: null,
  directives: {},
  findings: [],
  recommendations: [],
};

/**
 * CSP directive security levels and requirements
 */
const CSP_DIRECTIVES = {
  'script-src': {
    required: true,
    secureDefaults: ["'self'"],
    dangerous: ["'unsafe-inline'", "'unsafe-eval'", '*'],
    description: 'Controls script execution sources',
  },
  'object-src': {
    required: true,
    secureDefaults: ["'none'", "'self'"],
    dangerous: ['*'],
    description: 'Controls object, embed, and applet sources',
  },
  'style-src': {
    required: false,
    secureDefaults: ["'self'", "'unsafe-inline'"],
    dangerous: ['*'],
    description: 'Controls stylesheet sources',
  },
  'img-src': {
    required: false,
    secureDefaults: ["'self'", 'data:', 'https:'],
    dangerous: [],
    description: 'Controls image sources',
  },
  'connect-src': {
    required: false,
    secureDefaults: ["'self'"],
    dangerous: ['*'],
    description: 'Controls fetch, XMLHttpRequest, WebSocket sources',
  },
  'font-src': {
    required: false,
    secureDefaults: ["'self'", 'data:'],
    dangerous: ['*'],
    description: 'Controls font sources',
  },
  'media-src': {
    required: false,
    secureDefaults: ["'self'"],
    dangerous: ['*'],
    description: 'Controls audio and video sources',
  },
  'worker-src': {
    required: false,
    secureDefaults: ["'self'"],
    dangerous: ['*'],
    description: 'Controls worker script sources',
  },
  'child-src': {
    required: false,
    secureDefaults: ["'self'"],
    dangerous: ['*'],
    description: 'Controls nested browsing contexts (frames)',
  },
  'frame-ancestors': {
    required: false,
    secureDefaults: ["'none'", "'self'"],
    dangerous: ['*'],
    description: 'Controls who can embed this content in frames',
  },
  'base-uri': {
    required: false,
    secureDefaults: ["'self'"],
    dangerous: ['*'],
    description: 'Controls base element URLs',
  },
  'form-action': {
    required: false,
    secureDefaults: ["'self'"],
    dangerous: ['*'],
    description: 'Controls form submission targets',
  },
};

/**
 * Add audit finding
 */
function addFinding(severity, title, description, recommendation, directive = null) {
  const finding = {
    severity,
    title,
    description,
    recommendation,
    directive,
    timestamp: new Date().toISOString(),
  };

  auditResults.findings.push(finding);

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
 * Parse CSP policy string into directives
 */
function parseCSP(cspString) {
  const directives = {};

  // Split by semicolon and process each directive
  const parts = cspString
    .split(';')
    .map(part => part.trim())
    .filter(Boolean);

  parts.forEach(part => {
    const [directive, ...values] = part.split(/\s+/);
    if (directive) {
      directives[directive] = values.filter(Boolean);
    }
  });

  return directives;
}

/**
 * Validate individual CSP directive
 */
function validateDirective(directiveName, values, config) {
  console.log(`🔍 Validating ${directiveName}...`);

  if (!values || values.length === 0) {
    if (config.required) {
      addFinding(
        'critical',
        `Missing required directive: ${directiveName}`,
        `${config.description}. This directive is required for security.`,
        `Add ${directiveName} directive with secure values like: ${config.secureDefaults.join(', ')}`,
        directiveName
      );
    } else {
      addFinding(
        'warning',
        `Missing optional directive: ${directiveName}`,
        `${config.description}. While optional, this directive improves security.`,
        `Consider adding ${directiveName} directive: ${config.secureDefaults.join(', ')}`,
        directiveName
      );
    }
    return;
  }

  // Check for dangerous values
  const dangerousFound = values.filter(value => config.dangerous.includes(value));
  if (dangerousFound.length > 0) {
    addFinding(
      'critical',
      `Dangerous ${directiveName} directive`,
      `Contains dangerous values: ${dangerousFound.join(', ')}. ${config.description}.`,
      `Remove dangerous values and use more restrictive alternatives.`,
      directiveName
    );
  }

  // Special validation for script-src
  if (directiveName === 'script-src') {
    if (values.includes("'unsafe-inline'")) {
      addFinding(
        'critical',
        'script-src allows unsafe-inline',
        'Allows inline scripts which can enable XSS attacks.',
        "Remove 'unsafe-inline' and use nonces or hashes for inline scripts.",
        directiveName
      );
    }

    if (values.includes("'unsafe-eval'")) {
      addFinding(
        'critical',
        'script-src allows unsafe-eval',
        'Allows eval() and similar functions which can enable code injection.',
        "Remove 'unsafe-eval' from script-src.",
        directiveName
      );
    }

    if (values.includes("'self'") && !dangerousFound.length) {
      addFinding(
        'pass',
        'script-src properly restricts sources',
        'Script sources are properly restricted to self and approved domains.',
        'Continue restricting script sources to trusted origins.',
        directiveName
      );
    }
  }

  // Special validation for object-src
  if (directiveName === 'object-src') {
    if (values.includes("'none'")) {
      addFinding(
        'pass',
        'object-src set to none (most secure)',
        'Completely blocks object, embed, and applet elements.',
        'Continue blocking object sources for maximum security.',
        directiveName
      );
    } else if (values.includes("'self'") && !dangerousFound.length) {
      addFinding(
        'pass',
        'object-src properly restricted',
        'Object sources are restricted to self.',
        'Consider setting to none if objects are not needed.',
        directiveName
      );
    }
  }

  // Special validation for connect-src
  if (directiveName === 'connect-src') {
    const httpsDomains = values.filter(v => v.startsWith('https://'));
    const wssDomains = values.filter(v => v.startsWith('wss://'));

    if (httpsDomains.length > 0 || wssDomains.length > 0) {
      addFinding(
        'pass',
        'connect-src includes specific HTTPS/WSS domains',
        `Allows connections to ${httpsDomains.length + wssDomains.length} specific secure domains.`,
        'Regularly review and minimize the list of allowed connection targets.',
        directiveName
      );
    }

    if (values.includes("'self'")) {
      addFinding(
        'pass',
        'connect-src allows self connections',
        'Properly allows connections to same origin.',
        'Continue allowing self connections.',
        directiveName
      );
    }
  }

  // General validation for wildcard usage
  if (values.includes('*')) {
    addFinding(
      'critical',
      `${directiveName} uses wildcard`,
      `Wildcard (*) allows any source, defeating CSP protection.`,
      `Replace wildcard with specific trusted domains.`,
      directiveName
    );
  }
}

/**
 * Analyze CSP for Chrome Extension specific requirements
 */
function validateExtensionSpecificCSP(directives) {
  console.log('🔍 Validating Chrome Extension specific CSP requirements...');

  // Check for manifest v3 compatibility
  if (!directives['script-src'] || !directives['script-src'].includes("'self'")) {
    addFinding(
      'critical',
      'script-src must include self for Manifest V3',
      'Chrome extensions require script-src to include self.',
      "Add 'self' to script-src directive.",
      'script-src'
    );
  }

  // Check for appropriate connect-src for Firebase/API usage
  if (directives['connect-src']) {
    const firebaseUrls = directives['connect-src'].filter(
      url =>
        url.includes('firebase') || url.includes('googleapis') || url.includes('google-analytics')
    );

    if (firebaseUrls.length > 0) {
      addFinding(
        'pass',
        'connect-src properly configured for Firebase',
        `Allows connections to ${firebaseUrls.length} Firebase/Google services.`,
        'Ensure all listed Firebase URLs are necessary and up to date.',
        'connect-src'
      );
    }
  }

  // Extension should not allow frame-ancestors unless needed
  if (!directives['frame-ancestors']) {
    addFinding(
      'pass',
      'frame-ancestors not specified (secure default)',
      'Extension pages cannot be embedded in frames by default.',
      'Continue omitting frame-ancestors unless embedding is needed.',
      'frame-ancestors'
    );
  }
}

/**
 * Check for CSP bypass techniques and common vulnerabilities
 */
function checkCSPBypasses(directives) {
  console.log('🔍 Checking for CSP bypass vulnerabilities...');

  // Check for JSONP endpoints in script-src
  if (directives['script-src']) {
    const potentialJsonpDomains = directives['script-src'].filter(
      src =>
        src.includes('googleapis.com') || src.includes('google.com') || src.includes('gstatic.com')
    );

    if (potentialJsonpDomains.length > 0) {
      addFinding(
        'warning',
        'Potential JSONP endpoints in script-src',
        'Some Google domains may allow JSONP which could bypass CSP.',
        'Verify that script-src domains do not serve JSONP or user-controlled content.',
        'script-src'
      );
    }
  }

  // Check for data: URIs in script-src
  if (directives['script-src'] && directives['script-src'].includes('data:')) {
    addFinding(
      'critical',
      'script-src allows data: URIs',
      'Data URIs in script-src can be used to bypass CSP.',
      'Remove data: from script-src directive.',
      'script-src'
    );
  }

  // Check for blob: URIs in script-src
  if (directives['script-src'] && directives['script-src'].includes('blob:')) {
    addFinding(
      'critical',
      'script-src allows blob: URIs',
      'Blob URIs in script-src can be used to bypass CSP.',
      'Remove blob: from script-src directive.',
      'script-src'
    );
  }
}

/**
 * Validate host permissions alignment with CSP
 */
function validateHostPermissionsAlignment(cspDirectives, manifest) {
  console.log('🔍 Validating host permissions alignment with CSP...');

  if (!manifest.host_permissions) {
    addFinding(
      'pass',
      'No host permissions defined',
      'Extension does not request broad host permissions.',
      'Continue limiting host permissions to necessary domains.',
      'host_permissions'
    );
    return;
  }

  const hostPermissions = manifest.host_permissions;
  const connectSrcDomains = cspDirectives['connect-src'] || [];

  // Extract domains from host permissions
  const permissionDomains = hostPermissions.map(perm => {
    try {
      const url = new URL(perm.replace('*', 'example'));
      return url.hostname.replace('example.', '');
    } catch {
      return perm;
    }
  });

  // Check if CSP connect-src covers host permissions
  let alignmentIssues = 0;
  permissionDomains.forEach(domain => {
    const isCovered = connectSrcDomains.some(
      cspDomain =>
        cspDomain.includes(domain) ||
        domain.includes(cspDomain.replace('https://', '').replace('/*', ''))
    );

    if (!isCovered) {
      alignmentIssues++;
    }
  });

  if (alignmentIssues === 0) {
    addFinding(
      'pass',
      'Host permissions aligned with CSP',
      'All host permissions are covered by CSP connect-src directive.',
      'Continue maintaining alignment between permissions and CSP.',
      'connect-src'
    );
  } else {
    addFinding(
      'warning',
      'Host permissions not fully covered by CSP',
      `${alignmentIssues} host permissions may not be covered by CSP connect-src.`,
      'Ensure CSP connect-src covers all domains in host_permissions.',
      'connect-src'
    );
  }
}

/**
 * Calculate overall CSP security score
 */
function calculateCSPScore() {
  const total =
    auditResults.overall.criticalIssues +
    auditResults.overall.warnings +
    auditResults.overall.passed;
  if (total === 0) return 0;

  const criticalWeight = -20;
  const warningWeight = -5;
  const passWeight = 10;

  const score =
    auditResults.overall.criticalIssues * criticalWeight +
    auditResults.overall.warnings * warningWeight +
    auditResults.overall.passed * passWeight;

  const maxPossibleScore = total * passWeight;
  const normalizedScore = Math.max(0, Math.min(100, (score / maxPossibleScore) * 100));

  auditResults.overall.score = Math.round(normalizedScore);

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
  console.log('\n🛡️ Content Security Policy Validation Results');
  console.log('===============================================\n');

  console.log(
    `📊 Overall CSP Score: ${auditResults.overall.score}/100 (Grade: ${auditResults.overall.grade})`
  );
  console.log(
    `🎯 Summary: ${auditResults.overall.passed} passed, ${auditResults.overall.warnings} warnings, ${auditResults.overall.criticalIssues} critical\n`
  );

  // CSP Policy Overview
  console.log('📋 CSP POLICY OVERVIEW:');
  if (auditResults.cspPolicy) {
    console.log(`  📜 Policy: ${auditResults.cspPolicy.substring(0, 100)}...`);
    console.log(`  📊 Directives: ${Object.keys(auditResults.directives).length} defined`);
    console.log(
      `  🔍 Required directives: ${Object.values(CSP_DIRECTIVES).filter(d => d.required).length}`
    );
  }

  // Directive Analysis
  console.log('\n🔍 DIRECTIVE ANALYSIS:');
  Object.entries(auditResults.directives).forEach(([directive, values]) => {
    const status = auditResults.findings.find(
      f => f.directive === directive && f.severity === 'pass'
    )
      ? '✅'
      : auditResults.findings.find(f => f.directive === directive && f.severity === 'critical')
        ? '🚨'
        : '⚠️';
    console.log(`  ${status} ${directive}: ${values.join(' ')}`);
  });

  // Detailed findings
  console.log('\n🔍 DETAILED FINDINGS:');
  auditResults.findings.forEach(finding => {
    const icon =
      finding.severity === 'critical' ? '🚨' : finding.severity === 'warning' ? '⚠️' : '✅';
    console.log(`  ${icon} ${finding.title}`);
    console.log(`     ${finding.description}`);
    if (finding.directive) console.log(`     Directive: ${finding.directive}`);
    console.log(`     Recommendation: ${finding.recommendation}\n`);
  });

  // Priority recommendations
  console.log('🎯 PRIORITY RECOMMENDATIONS:');
  if (auditResults.overall.criticalIssues > 0) {
    console.log('  🚨 CRITICAL: Address all critical CSP vulnerabilities immediately');
  }
  if (auditResults.overall.warnings > 0) {
    console.log('  ⚠️ WARNING: Review and improve warning-level CSP issues');
  }
  if (auditResults.overall.score >= 80) {
    console.log('  ✅ EXCELLENT: Strong CSP configuration - continue monitoring');
  } else {
    console.log('  🔧 IMPROVEMENT NEEDED: Strengthen CSP configuration');
  }

  console.log('\n🛡️ CSP BEST PRACTICES:');
  console.log("  • Use 'self' for script-src and avoid 'unsafe-inline'/'unsafe-eval'");
  console.log("  • Set object-src to 'none' if objects are not needed");
  console.log('  • Specify explicit domains instead of wildcards');
  console.log('  • Regularly review and minimize allowed domains');
  console.log('  • Use nonces or hashes for necessary inline scripts');
  console.log('  • Test CSP in report-only mode before enforcing');
}

/**
 * Main CSP validation execution
 */
function runCSPValidation() {
  console.log('🛡️ Starting Content Security Policy Validation...\n');

  try {
    // Read and parse manifest
    const manifestContent = readFileSync(join(projectRoot, 'manifest.json'), 'utf8');
    const manifest = JSON.parse(manifestContent);

    if (!manifest.content_security_policy || !manifest.content_security_policy.extension_pages) {
      addFinding(
        'critical',
        'No Content Security Policy defined',
        'Extension does not define a Content Security Policy.',
        'Add content_security_policy.extension_pages to manifest.json with secure directives.'
      );

      calculateCSPScore();
      displayResults();
      return auditResults;
    }

    // Parse CSP
    const cspPolicy = manifest.content_security_policy.extension_pages;
    auditResults.cspPolicy = cspPolicy;
    auditResults.directives = parseCSP(cspPolicy);

    console.log(
      `📜 Found CSP policy with ${Object.keys(auditResults.directives).length} directives`
    );

    // Validate each directive
    Object.entries(CSP_DIRECTIVES).forEach(([directiveName, config]) => {
      const values = auditResults.directives[directiveName];
      validateDirective(directiveName, values, config);
    });

    // Extension-specific validation
    validateExtensionSpecificCSP(auditResults.directives);

    // Check for bypass vulnerabilities
    checkCSPBypasses(auditResults.directives);

    // Validate host permissions alignment
    validateHostPermissionsAlignment(auditResults.directives, manifest);

    calculateCSPScore();
    displayResults();

    // Save results
    try {
      const resultsPath = join(projectRoot, 'csp-audit-results.json');
      writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
      console.log(`\n📄 Detailed CSP audit results saved to: csp-audit-results.json`);
    } catch (err) {
      console.log('\n📄 Results not saved due to filesystem access limitation');
    }
  } catch (error) {
    addFinding(
      'critical',
      'Cannot read manifest.json',
      `Failed to read or parse manifest.json: ${error.message}`,
      'Ensure manifest.json exists and is valid JSON.'
    );

    calculateCSPScore();
    displayResults();
  }

  return auditResults;
}

// Run the validation
runCSPValidation();
