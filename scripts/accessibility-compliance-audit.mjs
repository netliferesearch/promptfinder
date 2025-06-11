#!/usr/bin/env node

/**
 * Accessibility Compliance Audit Script for PromptFinder Chrome Extension
 *
 * This script analyzes the codebase for accessibility compliance including:
 * - Keyboard navigation and focus management
 * - Screen reader support (ARIA labels, roles, live regions)
 * - Form accessibility (labels, required fields, validation)
 * - Interactive element accessibility
 * - Semantic HTML structure
 * - Color contrast considerations
 */

import fs from 'fs';
import path from 'path';

// Configuration
const SCAN_DIRECTORIES = ['pages', 'js', 'css', 'css-min'];
const EXCLUDED_FILES = ['node_modules', '.git', 'coverage', 'docs'];

// Accessibility criteria weights for scoring
const CRITERIA_WEIGHTS = {
  keyboard_navigation: 25,
  aria_implementation: 25,
  form_accessibility: 20,
  semantic_html: 15,
  focus_management: 15,
};

/**
 * Main audit function
 */
async function runAccessibilityAudit() {
  console.log('🔍 Starting Accessibility Compliance Audit for PromptFinder...\n');

  const results = {
    keyboard_navigation: await auditKeyboardNavigation(),
    aria_implementation: await auditAriaImplementation(),
    form_accessibility: await auditFormAccessibility(),
    semantic_html: await auditSemanticHtml(),
    focus_management: await auditFocusManagement(),
  };

  const summary = generateSummary(results);
  displayResults(results, summary);

  return summary;
}

/**
 * Audit keyboard navigation support
 */
async function auditKeyboardNavigation() {
  const files = getAllFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for tabindex usage
  const tabindexUsage = findInFiles(files, /tabindex\s*=\s*["']?(-?\d+)["']?/gi);
  const properTabindex = tabindexUsage.filter(usage => {
    const value = usage.match[1];
    return value === '0' || value === '-1';
  });

  if (properTabindex.length > 0) {
    score += 20;
    findings.push(`✅ Proper tabindex usage found: ${properTabindex.length} instances`);
  }

  // Check for keyboard event handlers
  const keyboardEvents = findInFiles(
    files,
    /(addEventListener\s*\(\s*['"](?:keydown|keyup|keypress)['"]|onkeydown|onkeyup|onkeypress)/gi
  );
  if (keyboardEvents.length > 0) {
    score += 15;
    findings.push(`✅ Keyboard event handlers found: ${keyboardEvents.length} instances`);
  } else {
    issues.push('⚠️ No keyboard event handlers detected for enhanced navigation');
  }

  // Check for Enter/Space key handling on non-button elements
  const clickableNonButtons = findInFiles(files, /(div|span|a).*?(?:click|tabindex)/gi);
  if (clickableNonButtons.length > 0) {
    issues.push(
      `⚠️ ${clickableNonButtons.length} clickable non-button elements may need keyboard support`
    );
  }

  // Check for focus styles
  const focusStyles = findInFiles(files, /:focus\s*{|\.focus/gi, ['.css']);
  if (focusStyles.length > 0) {
    score += 15;
    findings.push(`✅ Focus styles defined: ${focusStyles.length} instances`);
  } else {
    issues.push('⚠️ No focus styles detected - keyboard users may have poor visibility');
  }

  // Check for skip links
  const skipLinks = findInFiles(files, /skip.*?(?:main|content|navigation)/gi);
  if (skipLinks.length > 0) {
    score += 10;
    findings.push(`✅ Skip links found: ${skipLinks.length} instances`);
  } else {
    issues.push('⚠️ No skip links detected for keyboard navigation efficiency');
  }

  // Check for interactive elements
  const interactiveElements = findInFiles(files, /<(?:button|input|select|textarea|a\s+href)/gi, [
    '.html',
  ]);
  if (interactiveElements.length > 10) {
    score += 20;
    findings.push(
      `✅ Rich interactive interface: ${interactiveElements.length} interactive elements`
    );
  }

  return {
    category: 'Keyboard Navigation',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit ARIA implementation
 */
async function auditAriaImplementation() {
  const files = getAllFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for ARIA labels
  const ariaLabels = findInFiles(files, /aria-label\s*=\s*["'][^"']+["']/gi);
  if (ariaLabels.length > 0) {
    score += 25;
    findings.push(`✅ ARIA labels found: ${ariaLabels.length} instances`);

    // Analyze quality of ARIA labels
    const meaningfulLabels = ariaLabels.filter(
      label =>
        label.match[0].length > 20 &&
        !label.match[0].includes('Click') &&
        !label.match[0].includes('Button')
    );
    if (meaningfulLabels.length > ariaLabels.length * 0.7) {
      score += 10;
      findings.push(
        `✅ High-quality ARIA labels: ${meaningfulLabels.length}/${ariaLabels.length} are descriptive`
      );
    }
  } else {
    issues.push('❌ No ARIA labels found');
  }

  // Check for ARIA roles
  const ariaRoles = findInFiles(files, /role\s*=\s*["']([^"']+)["']/gi);
  if (ariaRoles.length > 0) {
    score += 20;
    findings.push(`✅ ARIA roles found: ${ariaRoles.length} instances`);

    // Check for common roles
    const roleTypes = [...new Set(ariaRoles.map(r => r.match[1]))];
    findings.push(`   Role types: ${roleTypes.join(', ')}`);
  } else {
    issues.push('⚠️ No ARIA roles found');
  }

  // Check for live regions
  const liveRegions = findInFiles(files, /aria-live\s*=\s*["'](?:polite|assertive)["']/gi);
  if (liveRegions.length > 0) {
    score += 15;
    findings.push(`✅ Live regions found: ${liveRegions.length} instances`);
  } else {
    issues.push('⚠️ No ARIA live regions found');
  }

  // Check for aria-hidden
  const ariaHidden = findInFiles(files, /aria-hidden\s*=\s*["']true["']/gi);
  if (ariaHidden.length > 0) {
    score += 10;
    findings.push(`✅ Decorative content hidden: ${ariaHidden.length} aria-hidden instances`);
  }

  // Check for aria-expanded/pressed for interactive states
  const ariaStates = findInFiles(files, /aria-(?:expanded|pressed|selected|checked)\s*=/gi);
  if (ariaStates.length > 0) {
    score += 15;
    findings.push(`✅ ARIA states found: ${ariaStates.length} instances`);
  } else {
    issues.push('⚠️ No ARIA states (expanded, pressed, selected) found');
  }

  // Check for aria-describedby/labelledby
  const ariaRelations = findInFiles(files, /aria-(?:describedby|labelledby)\s*=/gi);
  if (ariaRelations.length > 0) {
    score += 15;
    findings.push(`✅ ARIA relationships found: ${ariaRelations.length} instances`);
  } else {
    issues.push('⚠️ No ARIA relationships (describedby, labelledby) found');
  }

  return {
    category: 'ARIA Implementation',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit form accessibility
 */
async function auditFormAccessibility() {
  const files = getAllFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for form labels
  const formLabels = findInFiles(files, /<label\s+for\s*=\s*["']([^"']+)["']/gi);
  const formInputs = findInFiles(
    files,
    /<(?:input|select|textarea)[^>]*id\s*=\s*["']([^"']+)["']/gi
  );

  if (formLabels.length > 0) {
    score += 25;
    findings.push(`✅ Form labels found: ${formLabels.length} instances`);

    // Check label-input associations
    const labelIds = new Set(formLabels.map(l => l.match[1]));
    const inputIds = new Set(formInputs.map(i => i.match[1]));
    const associatedLabels = [...labelIds].filter(id => inputIds.has(id));

    if (associatedLabels.length > 0) {
      score += 15;
      findings.push(
        `✅ Properly associated labels: ${associatedLabels.length}/${formLabels.length}`
      );
    }
  } else {
    issues.push('❌ No form labels found');
  }

  // Check for required field indicators
  const requiredFields = findInFiles(files, /(?:required|aria-required\s*=\s*["']true["'])/gi);
  if (requiredFields.length > 0) {
    score += 15;
    findings.push(`✅ Required fields marked: ${requiredFields.length} instances`);
  } else {
    issues.push('⚠️ No required field indicators found');
  }

  // Check for error handling
  const errorPatterns = findInFiles(
    files,
    /(?:error|invalid|validation).*?(?:message|text|aria-live)/gi
  );
  if (errorPatterns.length > 0) {
    score += 20;
    findings.push(`✅ Error handling patterns: ${errorPatterns.length} instances`);
  } else {
    issues.push('⚠️ No form error handling patterns found');
  }

  // Check for fieldsets and legends
  const fieldsets = findInFiles(files, /<fieldset[^>]*>.*?<legend[^>]*>/gi, ['.html']);
  if (fieldsets.length > 0) {
    score += 10;
    findings.push(`✅ Fieldsets with legends: ${fieldsets.length} instances`);
  } else {
    issues.push('⚠️ No fieldsets with legends found');
  }

  // Check for autocomplete attributes
  const autocomplete = findInFiles(
    files,
    /autocomplete\s*=\s*["'](?:on|off|email|password|name|username)["']/gi
  );
  if (autocomplete.length > 0) {
    score += 15;
    findings.push(`✅ Autocomplete attributes: ${autocomplete.length} instances`);
  } else {
    issues.push('⚠️ No autocomplete attributes found');
  }

  // Check for placeholder text (should not be only label)
  const placeholders = findInFiles(files, /placeholder\s*=\s*["'][^"']+["']/gi);
  if (placeholders.length > 0) {
    findings.push(
      `ℹ️ Placeholder text found: ${placeholders.length} instances (ensure labels also present)`
    );
  }

  return {
    category: 'Form Accessibility',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit semantic HTML structure
 */
async function auditSemanticHtml() {
  const files = getAllFiles(['.html']);
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for semantic elements
  const semanticElements = findInFiles(
    files,
    /<(?:header|nav|main|section|article|aside|footer|h[1-6])[^>]*>/gi
  );
  if (semanticElements.length > 0) {
    score += 30;
    findings.push(`✅ Semantic elements found: ${semanticElements.length} instances`);

    // Check for heading hierarchy
    const headings = findInFiles(files, /<h([1-6])[^>]*>/gi);
    if (headings.length > 0) {
      score += 20;
      findings.push(`✅ Headings found: ${headings.length} instances`);

      // Analyze heading levels
      const levels = headings.map(h => parseInt(h.match[1])).sort();
      if (levels[0] === 1) {
        score += 10;
        findings.push(`✅ Proper heading hierarchy starts with H1`);
      } else {
        issues.push('⚠️ Heading hierarchy should start with H1');
      }
    }
  } else {
    issues.push('❌ No semantic HTML elements found');
  }

  // Check for lists
  const lists = findInFiles(files, /<(?:ul|ol|dl)[^>]*>/gi);
  if (lists.length > 0) {
    score += 15;
    findings.push(`✅ Lists found: ${lists.length} instances`);
  } else {
    issues.push('⚠️ No list elements found');
  }

  // Check for landmarks
  const landmarks = findInFiles(
    files,
    /role\s*=\s*["'](?:banner|navigation|main|complementary|contentinfo|search|form)["']/gi
  );
  if (landmarks.length > 0) {
    score += 15;
    findings.push(`✅ ARIA landmarks: ${landmarks.length} instances`);
  } else {
    issues.push('⚠️ No ARIA landmarks found');
  }

  // Check for proper button vs link usage
  const buttons = findInFiles(files, /<button[^>]*>/gi);
  const links = findInFiles(files, /<a\s+href[^>]*>/gi);
  if (buttons.length > 0 && links.length > 0) {
    score += 10;
    findings.push(`✅ Both buttons (${buttons.length}) and links (${links.length}) used`);
  }

  return {
    category: 'Semantic HTML',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit focus management
 */
async function auditFocusManagement() {
  const files = getAllFiles(['.js']);
  let score = 0;
  const issues = [];
  const findings = [];

  // Check for focus() calls
  const focusCalls = findInFiles(files, /\.focus\s*\(/gi);
  if (focusCalls.length > 0) {
    score += 25;
    findings.push(`✅ Focus management found: ${focusCalls.length} .focus() calls`);
  } else {
    issues.push('⚠️ No programmatic focus management found');
  }

  // Check for focus trapping (modal/dialog patterns)
  const focusTrap = findInFiles(
    files,
    /(?:trap|modal|dialog).*?focus|focus.*?(?:trap|modal|dialog)/gi
  );
  if (focusTrap.length > 0) {
    score += 20;
    findings.push(`✅ Focus trapping patterns: ${focusTrap.length} instances`);
  } else {
    issues.push('⚠️ No focus trapping patterns found for modals/dialogs');
  }

  // Check for focus restoration
  const focusRestore = findInFiles(
    files,
    /(?:restore|return|previous).*?focus|focus.*?(?:restore|return|previous)/gi
  );
  if (focusRestore.length > 0) {
    score += 15;
    findings.push(`✅ Focus restoration patterns: ${focusRestore.length} instances`);
  } else {
    issues.push('⚠️ No focus restoration patterns found');
  }

  // Check for scroll management
  const scrollManagement = findInFiles(
    files,
    /(?:scrollIntoView|scroll.*?behavior|smooth.*?scroll)/gi
  );
  if (scrollManagement.length > 0) {
    score += 15;
    findings.push(`✅ Scroll management: ${scrollManagement.length} instances`);
  } else {
    issues.push('⚠️ No scroll management for keyboard navigation found');
  }

  // Check for activeElement tracking
  const activeElementTracking = findInFiles(files, /document\.activeElement|activeElement/gi);
  if (activeElementTracking.length > 0) {
    score += 15;
    findings.push(`✅ Active element tracking: ${activeElementTracking.length} instances`);
  } else {
    issues.push('⚠️ No active element tracking found');
  }

  // Check for visual focus indicators
  const visualFocus = findInFiles(files, /:focus-visible|focus.*?outline|outline.*?focus/gi, [
    '.css',
  ]);
  if (visualFocus.length > 0) {
    score += 10;
    findings.push(`✅ Visual focus indicators: ${visualFocus.length} instances`);
  } else {
    issues.push('⚠️ No visual focus indicators found in CSS');
  }

  return {
    category: 'Focus Management',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
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

function findInFiles(files, pattern, filterExtensions = null) {
  const matches = [];

  for (const file of files) {
    if (filterExtensions && !filterExtensions.some(ext => file.endsWith(ext))) {
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileMatches = [...content.matchAll(pattern)];

      for (const match of fileMatches) {
        matches.push({
          file: file.replace(process.cwd() + '/', ''),
          match: match,
          line: content.substring(0, match.index).split('\n').length,
        });
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error.message);
    }
  }

  return matches;
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

  for (const [category, weight] of Object.entries(CRITERIA_WEIGHTS)) {
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
  console.log('🎯 ACCESSIBILITY COMPLIANCE AUDIT RESULTS');
  console.log('='.repeat(50));
  console.log(`📊 Overall Score: ${summary.overallScore}/100 (Grade ${summary.overallGrade})`);
  console.log(`🚨 Critical Issues: ${summary.criticalIssues}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`📂 Categories Tested: ${summary.categories}`);
  console.log();

  // Display each category
  for (const [key, result] of Object.entries(results)) {
    console.log(`📋 ${result.category}`);
    console.log(`   Score: ${result.score}/${result.maxScore} (${result.grade})`);
    console.log(`   Weight: ${CRITERIA_WEIGHTS[key]}%`);

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

  // Recommendations
  console.log('🔧 RECOMMENDATIONS');
  console.log('='.repeat(50));

  if (summary.overallScore >= 80) {
    console.log('✅ Excellent accessibility implementation!');
    console.log('   Your extension demonstrates strong accessibility practices.');
    console.log('   Continue to test with real assistive technologies.');
  } else if (summary.overallScore >= 60) {
    console.log('👍 Good accessibility foundation with room for improvement.');
    console.log('   Focus on addressing critical issues and warnings above.');
  } else {
    console.log('⚠️  Accessibility needs significant improvement.');
    console.log('   Prioritize fixing critical issues before deployment.');
  }

  console.log('\n📚 Next Steps:');
  console.log('   1. Test with screen readers (NVDA, JAWS, VoiceOver)');
  console.log('   2. Perform keyboard-only navigation testing');
  console.log('   3. Test with browser accessibility tools');
  console.log('   4. Consider automated accessibility testing integration');
  console.log('   5. Conduct user testing with accessibility needs');
}

// Run the audit
if (import.meta.url === `file://${process.argv[1]}`) {
  runAccessibilityAudit()
    .then(summary => {
      process.exit(summary.criticalIssues > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

export { runAccessibilityAudit };
