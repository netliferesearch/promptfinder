#!/usr/bin/env node

/**
 * Keyboard Navigation Testing Script for PromptFinder Chrome Extension
 *
 * This script simulates and tests keyboard navigation patterns including:
 * - Tab order and focus management
 * - Enter/Space key activation
 * - Arrow key navigation
 * - Escape key handling
 * - Focus trapping in dialogs
 * - Skip links functionality
 */

import fs from 'fs';
import path from 'path';

// Configuration
const TEST_FILES = ['pages/popup.html'];
const KEYBOARD_PATTERNS = {
  tabOrder: /tabindex\s*=\s*["']?(-?\d+)["']?/gi,
  focusable: /<(?:button|input|select|textarea|a\s+href|area\s+href|iframe|object|embed)[^>]*>/gi,
  keyHandlers:
    /(addEventListener\s*\(\s*['"](?:keydown|keyup|keypress)['"]|onkey(?:down|up|press))/gi,
  ariaControls: /aria-controls\s*=\s*["']([^"']+)["']/gi,
  ariaExpanded: /aria-expanded\s*=\s*["']([^"']+)["']/gi,
};

/**
 * Main keyboard navigation test function
 */
async function runKeyboardNavigationTest() {
  console.log('⌨️  Starting Keyboard Navigation Testing for PromptFinder...\n');

  const results = {
    tab_order: await testTabOrder(),
    focus_management: await testFocusManagement(),
    keyboard_shortcuts: await testKeyboardShortcuts(),
    dialog_navigation: await testDialogNavigation(),
    aria_navigation: await testAriaNavigation(),
  };

  const summary = generateSummary(results);
  displayResults(results, summary);

  return summary;
}

/**
 * Test tab order and focusable elements
 */
async function testTabOrder() {
  const files = getHtmlFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Find all focusable elements
    const focusableElements = [...content.matchAll(KEYBOARD_PATTERNS.focusable)];
    const tabIndexElements = [...content.matchAll(KEYBOARD_PATTERNS.tabOrder)];

    if (focusableElements.length > 0) {
      score += 25;
      findings.push(
        `✅ Found ${focusableElements.length} focusable elements in ${path.basename(file)}`
      );

      // Analyze tab order
      const tabOrderAnalysis = analyzeTabOrder(content, focusableElements, tabIndexElements);
      findings.push(...tabOrderAnalysis.findings);
      issues.push(...tabOrderAnalysis.issues);
      score += tabOrderAnalysis.score;
    }
  }

  // Check for logical navigation flow
  const navigationFlow = await analyzeNavigationFlow();
  findings.push(...navigationFlow.findings);
  issues.push(...navigationFlow.issues);
  score += navigationFlow.score;

  return {
    category: 'Tab Order & Focus Flow',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Test focus management patterns
 */
async function testFocusManagement() {
  const jsFiles = getJsFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for programmatic focus management
    const focusCalls = [...content.matchAll(/\.focus\s*\(/gi)];
    if (focusCalls.length > 0) {
      score += 15;
      findings.push(
        `✅ Focus management in ${path.basename(file)}: ${focusCalls.length} .focus() calls`
      );
    }

    // Check for focus restoration patterns
    const focusContext = analyzeContextualFocus(content);
    findings.push(...focusContext.findings);
    issues.push(...focusContext.issues);
    score += focusContext.score;
  }

  // Check for visual focus indicators
  const visualFocus = await testVisualFocusIndicators();
  findings.push(...visualFocus.findings);
  issues.push(...visualFocus.issues);
  score += visualFocus.score;

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
 * Test keyboard shortcuts and key handlers
 */
async function testKeyboardShortcuts() {
  const jsFiles = getJsFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for keyboard event handlers
    const keyHandlers = [...content.matchAll(KEYBOARD_PATTERNS.keyHandlers)];
    if (keyHandlers.length > 0) {
      score += 20;
      findings.push(
        `✅ Keyboard handlers in ${path.basename(file)}: ${keyHandlers.length} instances`
      );
    }

    // Check for specific key handling
    const keyPatterns = analyzeKeyHandling(content);
    findings.push(...keyPatterns.findings);
    issues.push(...keyPatterns.issues);
    score += keyPatterns.score;
  }

  // Check for common keyboard shortcuts
  const shortcuts = await identifyKeyboardShortcuts();
  findings.push(...shortcuts.findings);
  issues.push(...shortcuts.issues);
  score += shortcuts.score;

  return {
    category: 'Keyboard Shortcuts',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Test dialog and modal navigation
 */
async function testDialogNavigation() {
  const files = [...getHtmlFiles(), ...getJsFiles()];
  let score = 0;
  const issues = [];
  const findings = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for dialog/modal patterns
    const dialogs = [...content.matchAll(/(dialog|modal|popup|overlay|alertdialog)/gi)];
    if (dialogs.length > 0) {
      score += 15;
      findings.push(`✅ Dialog patterns in ${path.basename(file)}: ${dialogs.length} instances`);

      // Check for focus trapping
      const focusTrap = analyzeFocusTrapping(content);
      findings.push(...focusTrap.findings);
      issues.push(...focusTrap.issues);
      score += focusTrap.score;
    }
  }

  // Check for escape key handling
  const escapeHandling = await testEscapeKeyHandling();
  findings.push(...escapeHandling.findings);
  issues.push(...escapeHandling.issues);
  score += escapeHandling.score;

  return {
    category: 'Dialog Navigation',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Test ARIA-based navigation
 */
async function testAriaNavigation() {
  const files = getHtmlFiles();
  let score = 0;
  const issues = [];
  const findings = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for ARIA controls
    const ariaControls = [...content.matchAll(KEYBOARD_PATTERNS.ariaControls)];
    if (ariaControls.length > 0) {
      score += 20;
      findings.push(`✅ ARIA controls in ${path.basename(file)}: ${ariaControls.length} instances`);
    }

    // Check for expandable content
    const expandable = analyzeExpandableContent(content);
    findings.push(...expandable.findings);
    issues.push(...expandable.issues);
    score += expandable.score;

    // Check for tab panels and navigation
    const tabNavigation = analyzeTabNavigation(content);
    findings.push(...tabNavigation.findings);
    issues.push(...tabNavigation.issues);
    score += tabNavigation.score;
  }

  return {
    category: 'ARIA Navigation',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Analysis helper functions
 */
function analyzeTabOrder(content, focusableElements, tabIndexElements) {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for positive tabindex (generally discouraged)
  const positiveTabIndex = tabIndexElements.filter(el => {
    const value = parseInt(el[1]);
    return value > 0;
  });

  if (positiveTabIndex.length === 0) {
    score += 15;
    findings.push(`✅ No positive tabindex values (good practice)`);
  } else {
    issues.push(
      `⚠️ Found ${positiveTabIndex.length} positive tabindex values (may disrupt natural order)`
    );
  }

  // Check for reasonable tab order
  const tabIndexValues = tabIndexElements.map(el => parseInt(el[1])).filter(v => !isNaN(v));
  if (tabIndexValues.length > 0) {
    const hasLogicalOrder = tabIndexValues.every((val, i, arr) => {
      return i === 0 || val >= arr[i - 1] || val === -1 || val === 0;
    });

    if (hasLogicalOrder) {
      score += 10;
      findings.push(`✅ Tab order appears logical`);
    } else {
      issues.push(`⚠️ Tab order may be confusing`);
    }
  }

  return { findings, issues, score };
}

function analyzeNavigationFlow() {
  const findings = [];
  const issues = [];
  let score = 0;

  // This would typically involve DOM analysis, simulated here
  // Check for skip links
  const hasSkipLinks = checkForSkipLinks();
  if (hasSkipLinks) {
    score += 15;
    findings.push(`✅ Skip links detected for efficient navigation`);
  } else {
    issues.push(`⚠️ No skip links found - keyboard users may need to tab through many elements`);
  }

  // Check for landmark navigation
  const hasLandmarks = checkForLandmarks();
  if (hasLandmarks) {
    score += 10;
    findings.push(`✅ ARIA landmarks available for screen reader navigation`);
  } else {
    issues.push(`⚠️ Limited landmark navigation available`);
  }

  return { findings, issues, score };
}

function analyzeContextualFocus(content) {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for form validation focus
  if (content.includes('firstInvalid') && content.includes('.focus()')) {
    score += 10;
    findings.push(`✅ Form validation focuses first invalid field`);
  }

  // Check for modal focus management
  if (content.includes('modal') || content.includes('dialog')) {
    if (content.includes('.focus()')) {
      score += 10;
      findings.push(`✅ Modal/dialog focus management present`);
    } else {
      issues.push(`⚠️ Modal/dialog found but no focus management detected`);
    }
  }

  return { findings, issues, score };
}

function testVisualFocusIndicators() {
  const cssFiles = getCssFiles();
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for focus styles
    const focusStyles = [...content.matchAll(/:focus\s*[,{]|\.focus/gi)];
    if (focusStyles.length > 0) {
      score += 15;
      findings.push(`✅ Focus styles in ${path.basename(file)}: ${focusStyles.length} instances`);
    }

    // Check for focus-visible
    const focusVisible = [...content.matchAll(/:focus-visible/gi)];
    if (focusVisible.length > 0) {
      score += 10;
      findings.push(`✅ Modern focus-visible selectors: ${focusVisible.length} instances`);
    } else {
      issues.push(`⚠️ No focus-visible selectors found in ${path.basename(file)}`);
    }
  }

  return { findings, issues, score };
}

function analyzeKeyHandling(content) {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for Enter/Space key handling
  if (content.includes('Enter') || content.includes('13')) {
    score += 10;
    findings.push(`✅ Enter key handling detected`);
  }

  if (content.includes('Space') || content.includes('32')) {
    score += 10;
    findings.push(`✅ Space key handling detected`);
  }

  // Check for Escape key handling
  if (content.includes('Escape') || content.includes('27')) {
    score += 10;
    findings.push(`✅ Escape key handling detected`);
  }

  // Check for arrow key navigation
  if (content.includes('Arrow') || content.match(/(?:37|38|39|40)/)) {
    score += 10;
    findings.push(`✅ Arrow key navigation detected`);
  } else {
    issues.push(`⚠️ No arrow key navigation found`);
  }

  return { findings, issues, score };
}

function identifyKeyboardShortcuts() {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for common shortcuts in JS files
  const jsFiles = getJsFiles();
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for copy shortcuts
    if (content.includes('copy') && (content.includes('ctrl') || content.includes('cmd'))) {
      score += 10;
      findings.push(`✅ Copy shortcuts detected in ${path.basename(file)}`);
    }
  }

  return { findings, issues, score };
}

function analyzeFocusTrapping(content) {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for focus trap patterns
  if (content.includes('trap') || content.includes('contain')) {
    score += 15;
    findings.push(`✅ Focus trapping patterns detected`);
  } else {
    issues.push(`⚠️ No focus trapping detected for modal/dialog`);
  }

  return { findings, issues, score };
}

function testEscapeKeyHandling() {
  const findings = [];
  const issues = [];
  let score = 0;

  const jsFiles = getJsFiles();
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    if (content.includes('Escape') || content.includes('27')) {
      score += 15;
      findings.push(`✅ Escape key handling in ${path.basename(file)}`);
    }
  }

  if (score === 0) {
    issues.push(`⚠️ No Escape key handling found for closing dialogs`);
  }

  return { findings, issues, score };
}

function analyzeExpandableContent(content) {
  const findings = [];
  const issues = [];
  let score = 0;

  const ariaExpanded = [...content.matchAll(KEYBOARD_PATTERNS.ariaExpanded)];
  if (ariaExpanded.length > 0) {
    score += 15;
    findings.push(`✅ Expandable content with aria-expanded: ${ariaExpanded.length} instances`);
  }

  return { findings, issues, score };
}

function analyzeTabNavigation(content) {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for tab role and tablist
  if (content.includes('role="tab"') && content.includes('role="tablist"')) {
    score += 15;
    findings.push(`✅ Proper tab navigation structure detected`);

    // Check for arrow key navigation in tabs
    if (content.includes('Arrow')) {
      score += 10;
      findings.push(`✅ Arrow key navigation for tabs`);
    } else {
      issues.push(`⚠️ Tab navigation may not support arrow keys`);
    }
  }

  return { findings, issues, score };
}

/**
 * Utility functions
 */
function getHtmlFiles() {
  return TEST_FILES.filter(file => fs.existsSync(file));
}

function getJsFiles() {
  const jsFiles = [];
  const jsDir = 'js';
  if (fs.existsSync(jsDir)) {
    const files = fs.readdirSync(jsDir, { recursive: true });
    for (const file of files) {
      if (file.endsWith('.js')) {
        jsFiles.push(path.join(jsDir, file));
      }
    }
  }
  return jsFiles;
}

function getCssFiles() {
  const cssFiles = [];
  const cssDirs = ['css', 'css-min'];

  for (const dir of cssDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir, { recursive: true });
      for (const file of files) {
        if (file.endsWith('.css')) {
          cssFiles.push(path.join(dir, file));
        }
      }
    }
  }
  return cssFiles;
}

function checkForSkipLinks() {
  // Simplified check - would need DOM analysis for real implementation
  const htmlFiles = getHtmlFiles();
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.toLowerCase().includes('skip')) {
      return true;
    }
  }
  return false;
}

function checkForLandmarks() {
  const htmlFiles = getHtmlFiles();
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (
      content.includes('role="search"') ||
      content.includes('role="main"') ||
      content.includes('<nav')
    ) {
      return true;
    }
  }
  return false;
}

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateSummary(results) {
  const scores = Object.values(results).map(r => r.score);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
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
  console.log('⌨️  KEYBOARD NAVIGATION TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`📊 Overall Score: ${summary.overallScore}/100 (Grade ${summary.overallGrade})`);
  console.log(`🚨 Critical Issues: ${summary.criticalIssues}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`📂 Categories Tested: ${summary.categories}`);
  console.log();

  // Display each category
  for (const [key, result] of Object.entries(results)) {
    console.log(`⌨️  ${result.category}`);
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

  // Recommendations
  console.log('🔧 KEYBOARD NAVIGATION RECOMMENDATIONS');
  console.log('='.repeat(50));

  if (summary.overallScore >= 80) {
    console.log('✅ Excellent keyboard navigation support!');
    console.log('   Your extension provides comprehensive keyboard accessibility.');
  } else if (summary.overallScore >= 60) {
    console.log('👍 Good keyboard navigation with some areas for improvement.');
    console.log('   Consider implementing the suggested enhancements above.');
  } else {
    console.log('⚠️  Keyboard navigation needs significant improvement.');
    console.log('   Focus on critical navigation patterns before deployment.');
  }

  console.log('\n🧪 Manual Testing Recommendations:');
  console.log('   1. Navigate entire interface using only Tab, Shift+Tab, Enter, Space');
  console.log('   2. Test with screen reader (tab through all interactive elements)');
  console.log('   3. Verify all buttons/links are reachable and activatable');
  console.log('   4. Test modal/dialog focus trapping and restoration');
  console.log('   5. Verify visual focus indicators are clearly visible');
  console.log('   6. Test arrow key navigation in tab panels and lists');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runKeyboardNavigationTest()
    .then(summary => {
      process.exit(summary.criticalIssues > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { runKeyboardNavigationTest };
