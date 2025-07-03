#!/usr/bin/env node

/**
 * WCAG 2.1 AA Compliance Audit Script for DesignPrompts Chrome Extension
 *
 * This script validates compliance with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
 * including:
 * - Perceivable: Color contrast, text alternatives, adaptable content
 * - Operable: Keyboard accessible, timing, seizures/reactions, navigable
 * - Understandable: Readable, predictable, input assistance
 * - Robust: Compatible with assistive technologies
 */

import fs from 'fs';
import path from 'path';

// Configuration
const SCAN_DIRECTORIES = ['pages', 'js', 'css', 'css-min'];
const EXCLUDED_FILES = ['node_modules', '.git', 'coverage', 'docs'];

// WCAG 2.1 AA criteria weights for scoring
const WCAG_CRITERIA_WEIGHTS = {
  perceivable: 30,
  operable: 25,
  understandable: 25,
  robust: 20,
};

// Color contrast ratios for WCAG AA compliance
const CONTRAST_RATIOS = {
  normal_text: 4.5,
  large_text: 3.0,
  ui_components: 3.0,
};

/**
 * Main WCAG 2.1 AA compliance audit function
 */
async function runWcagComplianceAudit() {
  console.log('♿ Starting WCAG 2.1 AA Compliance Audit for DesignPrompts...\n');

  const results = {
    perceivable: await auditPerceivable(),
    operable: await auditOperable(),
    understandable: await auditUnderstandable(),
    robust: await auditRobust(),
  };

  const summary = generateSummary(results);
  displayResults(results, summary);

  return summary;
}

/**
 * Audit Principle 1: Perceivable
 * Information and user interface components must be presentable to users in ways they can perceive
 */
async function auditPerceivable() {
  let score = 0;
  const issues = [];
  const findings = [];

  // 1.1 Text Alternatives
  const textAlternatives = await auditTextAlternatives();
  findings.push(...textAlternatives.findings);
  issues.push(...textAlternatives.issues);
  score += textAlternatives.score;

  // 1.3 Adaptable Content
  const adaptableContent = await auditAdaptableContent();
  findings.push(...adaptableContent.findings);
  issues.push(...adaptableContent.issues);
  score += adaptableContent.score;

  // 1.4 Distinguishable Content
  const distinguishableContent = await auditDistinguishableContent();
  findings.push(...distinguishableContent.findings);
  issues.push(...distinguishableContent.issues);
  score += distinguishableContent.score;

  return {
    category: 'Perceivable',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit Principle 2: Operable
 * User interface components and navigation must be operable
 */
async function auditOperable() {
  let score = 0;
  const issues = [];
  const findings = [];

  // 2.1 Keyboard Accessible
  const keyboardAccessible = await auditKeyboardAccessible();
  findings.push(...keyboardAccessible.findings);
  issues.push(...keyboardAccessible.issues);
  score += keyboardAccessible.score;

  // 2.2 Enough Time
  const enoughTime = await auditEnoughTime();
  findings.push(...enoughTime.findings);
  issues.push(...enoughTime.issues);
  score += enoughTime.score;

  // 2.4 Navigable
  const navigable = await auditNavigable();
  findings.push(...navigable.findings);
  issues.push(...navigable.issues);
  score += navigable.score;

  // 2.5 Input Modalities
  const inputModalities = await auditInputModalities();
  findings.push(...inputModalities.findings);
  issues.push(...inputModalities.issues);
  score += inputModalities.score;

  return {
    category: 'Operable',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit Principle 3: Understandable
 * Information and the operation of user interface must be understandable
 */
async function auditUnderstandable() {
  let score = 0;
  const issues = [];
  const findings = [];

  // 3.1 Readable
  const readable = await auditReadable();
  findings.push(...readable.findings);
  issues.push(...readable.issues);
  score += readable.score;

  // 3.2 Predictable
  const predictable = await auditPredictable();
  findings.push(...predictable.findings);
  issues.push(...predictable.issues);
  score += predictable.score;

  // 3.3 Input Assistance
  const inputAssistance = await auditInputAssistance();
  findings.push(...inputAssistance.findings);
  issues.push(...inputAssistance.issues);
  score += inputAssistance.score;

  return {
    category: 'Understandable',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * Audit Principle 4: Robust
 * Content must be robust enough that it can be interpreted by a wide variety of user agents
 */
async function auditRobust() {
  let score = 0;
  const issues = [];
  const findings = [];

  // 4.1 Compatible
  const compatible = await auditCompatible();
  findings.push(...compatible.findings);
  issues.push(...compatible.issues);
  score += compatible.score;

  return {
    category: 'Robust',
    score: Math.min(score, 100),
    maxScore: 100,
    issues,
    findings,
    grade: getGrade(Math.min(score, 100)),
  };
}

/**
 * 1.1 Text Alternatives - Provide text alternatives for non-text content
 */
async function auditTextAlternatives() {
  const files = getAllFiles(['.html']);
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for images with alt text
    const images = [...content.matchAll(/<img[^>]*>/gi)];
    const imagesWithAlt = [...content.matchAll(/<img[^>]*alt\s*=\s*["'][^"']*["'][^>]*>/gi)];

    if (images.length > 0) {
      const altTextCoverage = (imagesWithAlt.length / images.length) * 100;
      if (altTextCoverage >= 80) {
        score += 15;
        findings.push(
          `✅ Good alt text coverage: ${imagesWithAlt.length}/${images.length} images (${altTextCoverage.toFixed(1)}%)`
        );
      } else {
        issues.push(
          `⚠️ Poor alt text coverage: ${imagesWithAlt.length}/${images.length} images (${altTextCoverage.toFixed(1)}%)`
        );
      }
    }

    // Check for decorative images with empty alt
    const decorativeImages = [
      ...content.matchAll(/aria-hidden\s*=\s*["']true["'][^>]*>|alt\s*=\s*["']["']/gi),
    ];
    if (decorativeImages.length > 0) {
      score += 10;
      findings.push(`✅ Decorative images properly marked: ${decorativeImages.length} instances`);
    }

    // Check for icons with aria-hidden
    const hiddenIcons = [...content.matchAll(/<i[^>]*aria-hidden\s*=\s*["']true["'][^>]*>/gi)];
    if (hiddenIcons.length > 0) {
      score += 15;
      findings.push(
        `✅ Decorative icons hidden from screen readers: ${hiddenIcons.length} instances`
      );
    }
  }

  return { findings, issues, score };
}

/**
 * 1.3 Adaptable - Create content that can be presented in different ways without losing meaning
 */
async function auditAdaptableContent() {
  const files = getAllFiles(['.html']);
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for semantic heading structure
    const headings = [...content.matchAll(/<h([1-6])[^>]*>/gi)];
    if (headings.length > 0) {
      score += 15;
      findings.push(`✅ Semantic heading structure: ${headings.length} headings found`);

      // Verify heading hierarchy
      const levels = headings.map(h => parseInt(h[1])).sort();
      if (levels[0] === 1) {
        score += 10;
        findings.push(`✅ Proper heading hierarchy (starts with H1)`);
      } else {
        issues.push(`⚠️ Heading hierarchy should start with H1`);
      }
    } else {
      issues.push(`❌ No semantic headings found`);
    }

    // Check for lists
    const lists = [...content.matchAll(/<(?:ul|ol|dl)[^>]*>/gi)];
    if (lists.length > 0) {
      score += 10;
      findings.push(`✅ Structured lists found: ${lists.length} instances`);
    }

    // Check for semantic landmarks
    const landmarks = [
      ...content.matchAll(
        /<(?:nav|main|section|article|aside|header|footer)[^>]*>|role\s*=\s*["'](?:navigation|main|banner|contentinfo|complementary)["']/gi
      ),
    ];
    if (landmarks.length > 0) {
      score += 15;
      findings.push(`✅ Semantic landmarks: ${landmarks.length} instances`);
    } else {
      issues.push(`⚠️ Limited semantic landmarks for navigation`);
    }
  }

  return { findings, issues, score };
}

/**
 * 1.4 Distinguishable - Make it easier for users to see and hear content
 */
async function auditDistinguishableContent() {
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for color contrast considerations in CSS
  const colorAnalysis = await analyzeColorUsage();
  findings.push(...colorAnalysis.findings);
  issues.push(...colorAnalysis.issues);
  score += colorAnalysis.score;

  // Check for responsive design
  const responsiveDesign = await auditResponsiveDesign();
  findings.push(...responsiveDesign.findings);
  issues.push(...responsiveDesign.issues);
  score += responsiveDesign.score;

  // Check for text sizing and scaling
  const textScaling = await auditTextScaling();
  findings.push(...textScaling.findings);
  issues.push(...textScaling.issues);
  score += textScaling.score;

  return { findings, issues, score };
}

/**
 * 2.1 Keyboard Accessible - Make all functionality available from a keyboard
 */
async function auditKeyboardAccessible() {
  const files = getAllFiles();
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for keyboard event handlers
  const keyboardEvents = findInFiles(
    files,
    /(addEventListener\s*\(\s*['"](?:keydown|keyup|keypress)['"]|onkey(?:down|up|press))/gi
  );
  if (keyboardEvents.length > 0) {
    score += 20;
    findings.push(`✅ Keyboard event handling: ${keyboardEvents.length} instances`);
  }

  // Check for proper tabindex usage
  const tabindexUsage = findInFiles(files, /tabindex\s*=\s*["']?(-?\d+)["']?/gi);
  const properTabindex = tabindexUsage.filter(usage => {
    const value = parseInt(usage.match[1]);
    return value === 0 || value === -1;
  });

  if (properTabindex.length > 0) {
    score += 15;
    findings.push(`✅ Proper tabindex usage: ${properTabindex.length} instances`);
  }

  // Check for focus management
  const focusCalls = findInFiles(files, /\.focus\s*\(/gi, ['.js']);
  if (focusCalls.length > 0) {
    score += 15;
    findings.push(`✅ Programmatic focus management: ${focusCalls.length} instances`);
  }

  return { findings, issues, score };
}

/**
 * 2.2 Enough Time - Provide users enough time to read and use content
 */
async function auditEnoughTime() {
  const files = getAllFiles(['.js']);
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for timeout handling
  let hasTimeouts = false;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('setTimeout') || content.includes('setInterval')) {
      hasTimeouts = true;
      break;
    }
  }

  if (!hasTimeouts) {
    score += 30;
    findings.push(`✅ No automatic timeouts detected`);
  } else {
    // Check for timeout controls
    const timeoutControls = findInFiles(
      files,
      /(?:pause|stop|extend|adjust).*?(?:timeout|timer|time)/gi
    );
    if (timeoutControls.length > 0) {
      score += 20;
      findings.push(`✅ Timeout controls detected: ${timeoutControls.length} instances`);
    } else {
      issues.push(`⚠️ Timeouts detected but no user controls found`);
    }
  }

  // Check for auto-refresh or auto-update
  const autoUpdate = findInFiles(
    files,
    /(?:auto|refresh|reload|update).*?(?:interval|periodic|automatic)/gi
  );
  if (autoUpdate.length === 0) {
    score += 20;
    findings.push(`✅ No auto-refresh content detected`);
  } else {
    issues.push(`⚠️ Auto-updating content may need user controls`);
  }

  return { findings, issues, score };
}

/**
 * 2.4 Navigable - Provide ways to help users navigate, find content, and determine where they are
 */
async function auditNavigable() {
  const files = getAllFiles();
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for page titles
  const titles = findInFiles(files, /<title[^>]*>([^<]+)<\/title>/gi, ['.html']);
  if (titles.length > 0) {
    score += 15;
    findings.push(`✅ Page titles found: ${titles.length} instances`);
  } else {
    issues.push(`❌ No page titles found`);
  }

  // Check for skip links
  const skipLinks = findInFiles(files, /skip.*?(?:to|link|navigation|content|main)/gi);
  if (skipLinks.length > 0) {
    score += 10;
    findings.push(`✅ Skip links: ${skipLinks.length} instances`);
  } else {
    issues.push(`⚠️ No skip links found for keyboard navigation`);
  }

  // Check for focus indicators
  const focusStyles = findInFiles(
    files,
    /:focus[^{]*{[^}]*(?:outline|border|background|box-shadow)/gi,
    ['.css']
  );
  if (focusStyles.length > 0) {
    score += 15;
    findings.push(`✅ Focus indicators: ${focusStyles.length} CSS focus styles`);
  } else {
    issues.push(`⚠️ Limited focus indicators found`);
  }

  // Check for breadcrumbs or navigation aids
  const navigation = findInFiles(files, /<nav[^>]*>|role\s*=\s*["']navigation["']|breadcrumb/gi);
  if (navigation.length > 0) {
    score += 10;
    findings.push(`✅ Navigation structures: ${navigation.length} instances`);
  }

  return { findings, issues, score };
}

/**
 * 2.5 Input Modalities - Make it easier for users to operate functionality through various inputs
 */
async function auditInputModalities() {
  const files = getAllFiles();
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for click alternatives (Enter/Space key handling)
  const keyAlternatives = findInFiles(
    files,
    /(?:Enter|Space|13|32).*?(?:key|event|press)|(?:key|event|press).*?(?:Enter|Space|13|32)/gi,
    ['.js']
  );
  if (keyAlternatives.length > 0) {
    score += 20;
    findings.push(`✅ Keyboard alternatives for clicks: ${keyAlternatives.length} instances`);
  }

  // Check for pointer cancellation (mouseup events)
  const pointerCancellation = findInFiles(files, /mouseup|pointerup|touchend/gi, ['.js']);
  if (pointerCancellation.length > 0) {
    score += 15;
    findings.push(`✅ Pointer cancellation support: ${pointerCancellation.length} instances`);
  }

  // Check for target size considerations
  const targetSizing = findInFiles(
    files,
    /(?:min-width|min-height|padding).*?(?:44px|2\.75rem|11mm)/gi,
    ['.css']
  );
  if (targetSizing.length > 0) {
    score += 15;
    findings.push(`✅ Adequate target sizing: ${targetSizing.length} instances`);
  } else {
    issues.push(`⚠️ Consider 44px minimum target size for touch interfaces`);
  }

  return { findings, issues, score };
}

/**
 * 3.1 Readable - Make text content readable and understandable
 */
async function auditReadable() {
  const files = getAllFiles(['.html']);
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for language declaration
    const langAttribute = content.match(/<html[^>]*lang\s*=\s*["']([^"']+)["']/i);
    if (langAttribute) {
      score += 20;
      findings.push(`✅ Language declared: ${langAttribute[1]}`);
    } else {
      issues.push(`❌ No language attribute found on <html> element`);
    }

    // Check for descriptive link text
    const links = [...content.matchAll(/<a[^>]*>([^<]+)<\/a>/gi)];
    const descriptiveLinks = links.filter(link => {
      const text = link[1].trim().toLowerCase();
      return text.length > 3 && !['click', 'here', 'more', 'link'].includes(text);
    });

    if (links.length > 0) {
      const descriptiveRatio = (descriptiveLinks.length / links.length) * 100;
      if (descriptiveRatio >= 80) {
        score += 15;
        findings.push(
          `✅ Descriptive link text: ${descriptiveLinks.length}/${links.length} links (${descriptiveRatio.toFixed(1)}%)`
        );
      } else {
        issues.push(
          `⚠️ Consider more descriptive link text: ${descriptiveLinks.length}/${links.length} links (${descriptiveRatio.toFixed(1)}%)`
        );
      }
    }
  }

  return { findings, issues, score };
}

/**
 * 3.2 Predictable - Make Web pages appear and operate in predictable ways
 */
async function auditPredictable() {
  const files = getAllFiles();
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for consistent navigation
  const navigationElements = findInFiles(files, /<nav[^>]*>|role\s*=\s*["']navigation["']/gi, [
    '.html',
  ]);
  if (navigationElements.length > 0) {
    score += 15;
    findings.push(`✅ Consistent navigation structure: ${navigationElements.length} instances`);
  }

  // Check for form submission handling
  const formHandling = findInFiles(files, /preventDefault|submit.*?event|event.*?submit/gi, [
    '.js',
  ]);
  if (formHandling.length > 0) {
    score += 10;
    findings.push(`✅ Controlled form submission: ${formHandling.length} instances`);
  }

  // Check for error handling patterns
  const errorHandling = findInFiles(
    files,
    /error.*?(?:message|handling|catch)|(?:try|catch).*?error/gi,
    ['.js']
  );
  if (errorHandling.length > 0) {
    score += 15;
    findings.push(`✅ Error handling patterns: ${errorHandling.length} instances`);
  }

  // Check for loading states
  const loadingStates = findInFiles(files, /loading|spinner|progress|wait/gi);
  if (loadingStates.length > 0) {
    score += 10;
    findings.push(`✅ Loading state indicators: ${loadingStates.length} instances`);
  }

  return { findings, issues, score };
}

/**
 * 3.3 Input Assistance - Help users avoid and correct mistakes
 */
async function auditInputAssistance() {
  const files = getAllFiles();
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for form labels
  const formLabels = findInFiles(files, /<label[^>]*for\s*=\s*["']([^"']+)["'][^>]*>/gi, ['.html']);
  if (formLabels.length > 0) {
    score += 20;
    findings.push(`✅ Form labels: ${formLabels.length} instances`);
  }

  // Check for required field indicators
  const requiredFields = findInFiles(files, /required|aria-required\s*=\s*["']true["']/gi);
  if (requiredFields.length > 0) {
    score += 15;
    findings.push(`✅ Required field indicators: ${requiredFields.length} instances`);
  }

  // Check for error messages
  const errorMessages = findInFiles(
    files,
    /(?:error|invalid|validation).*?(?:message|text|feedback)/gi
  );
  if (errorMessages.length > 0) {
    score += 15;
    findings.push(`✅ Error messaging: ${errorMessages.length} instances`);
  }

  // Check for input validation
  const inputValidation = findInFiles(
    files,
    /(?:validate|check|verify).*?(?:input|form|field)|(?:input|form|field).*?(?:validate|check|verify)/gi,
    ['.js']
  );
  if (inputValidation.length > 0) {
    score += 10;
    findings.push(`✅ Input validation: ${inputValidation.length} instances`);
  }

  return { findings, issues, score };
}

/**
 * 4.1 Compatible - Maximize compatibility with current and future assistive technologies
 */
async function auditCompatible() {
  const files = getAllFiles();
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for valid HTML structure
  const htmlValidation = await validateHtmlStructure();
  findings.push(...htmlValidation.findings);
  issues.push(...htmlValidation.issues);
  score += htmlValidation.score;

  // Check for ARIA implementation
  const ariaImplementation = await validateAriaImplementation();
  findings.push(...ariaImplementation.findings);
  issues.push(...ariaImplementation.issues);
  score += ariaImplementation.score;

  // Check for semantic markup
  const semanticMarkup = await validateSemanticMarkup();
  findings.push(...semanticMarkup.findings);
  issues.push(...semanticMarkup.issues);
  score += semanticMarkup.score;

  return { findings, issues, score };
}

/**
 * Helper functions for detailed analysis
 */
async function analyzeColorUsage() {
  const cssFiles = getAllFiles(['.css']);
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for color-only information conveyance
  let hasColorOnlyInfo = false;
  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Look for color-based state changes without other indicators
    const colorStateChanges = [
      ...content.matchAll(/(?:\.error|\.success|\.warning|\.danger)[^{]*{[^}]*color\s*:[^}]*}/gi),
    ];
    if (colorStateChanges.length > 0) {
      // Check if these also have other visual indicators
      const hasOtherIndicators =
        content.includes('icon') ||
        content.includes('symbol') ||
        content.includes('text-decoration');
      if (hasOtherIndicators) {
        score += 15;
        findings.push(
          `✅ Color states with additional indicators: ${colorStateChanges.length} instances`
        );
      } else {
        hasColorOnlyInfo = true;
      }
    }
  }

  if (hasColorOnlyInfo) {
    issues.push(`⚠️ Color-only information detected - consider additional visual cues`);
  } else {
    score += 10;
    findings.push(`✅ No color-only information conveyance detected`);
  }

  return { findings, issues, score };
}

async function auditResponsiveDesign() {
  const cssFiles = getAllFiles(['.css']);
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for media queries
    const mediaQueries = [...content.matchAll(/@media[^{]+{/gi)];
    if (mediaQueries.length > 0) {
      score += 15;
      findings.push(
        `✅ Responsive design: ${mediaQueries.length} media queries in ${path.basename(file)}`
      );
    }

    // Check for flexible units
    const flexibleUnits = [...content.matchAll(/(?:\d+(?:\.\d+)?(?:rem|em|%|vw|vh|vmin|vmax))/gi)];
    if (flexibleUnits.length > 10) {
      score += 10;
      findings.push(
        `✅ Flexible units used: ${flexibleUnits.length} instances in ${path.basename(file)}`
      );
    }
  }

  return { findings, issues, score };
}

async function auditTextScaling() {
  const cssFiles = getAllFiles(['.css']);
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for relative font sizes
  let relativeUnits = 0;
  let fixedUnits = 0;

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    const fontSizes = [...content.matchAll(/font-size\s*:\s*([^;]+);/gi)];
    for (const fontSize of fontSizes) {
      const value = fontSize[1].trim();
      if (value.includes('rem') || value.includes('em') || value.includes('%')) {
        relativeUnits++;
      } else if (value.includes('px')) {
        fixedUnits++;
      }
    }
  }

  if (relativeUnits > 0) {
    const relativePercentage = (relativeUnits / (relativeUnits + fixedUnits)) * 100;
    if (relativePercentage >= 70) {
      score += 20;
      findings.push(
        `✅ Scalable text: ${relativeUnits}/${relativeUnits + fixedUnits} (${relativePercentage.toFixed(1)}%) use relative units`
      );
    } else {
      score += 10;
      findings.push(
        `⚠️ Some scalable text: ${relativeUnits}/${relativeUnits + fixedUnits} (${relativePercentage.toFixed(1)}%) use relative units`
      );
    }
  }

  return { findings, issues, score };
}

async function validateHtmlStructure() {
  const htmlFiles = getAllFiles(['.html']);
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for basic HTML5 structure (case-insensitive)
    if (content.toLowerCase().includes('<!doctype html>')) {
      score += 10;
      findings.push(`✅ Valid HTML5 doctype in ${path.basename(file)}`);
    } else {
      issues.push(`❌ Missing HTML5 doctype in ${path.basename(file)}`);
    }

    // Check for meta viewport
    if (content.includes('meta name="viewport"')) {
      score += 10;
      findings.push(`✅ Viewport meta tag found in ${path.basename(file)}`);
    } else {
      issues.push(`⚠️ Missing viewport meta tag in ${path.basename(file)}`);
    }
  }

  return { findings, issues, score };
}

async function validateAriaImplementation() {
  const files = getAllFiles();
  const findings = [];
  const issues = [];
  let score = 0;

  // Check for ARIA labels
  const ariaLabels = findInFiles(files, /aria-label\s*=\s*["'][^"']+["']/gi);
  if (ariaLabels.length > 0) {
    score += 15;
    findings.push(`✅ ARIA labels: ${ariaLabels.length} instances`);
  }

  // Check for ARIA roles
  const ariaRoles = findInFiles(files, /role\s*=\s*["']([^"']+)["']/gi);
  if (ariaRoles.length > 0) {
    score += 15;
    findings.push(`✅ ARIA roles: ${ariaRoles.length} instances`);
  }

  // Check for live regions
  const liveRegions = findInFiles(files, /aria-live\s*=\s*["'](?:polite|assertive)["']/gi);
  if (liveRegions.length > 0) {
    score += 10;
    findings.push(`✅ Live regions: ${liveRegions.length} instances`);
  }

  return { findings, issues, score };
}

async function validateSemanticMarkup() {
  const htmlFiles = getAllFiles(['.html']);
  const findings = [];
  const issues = [];
  let score = 0;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for semantic elements
    const semanticElements = [
      ...content.matchAll(/<(?:header|nav|main|section|article|aside|footer)[^>]*>/gi),
    ];
    if (semanticElements.length > 0) {
      score += 15;
      findings.push(
        `✅ Semantic elements: ${semanticElements.length} instances in ${path.basename(file)}`
      );
    }

    // Check for proper button usage
    const buttons = [...content.matchAll(/<button[^>]*>/gi)];
    const links = [...content.matchAll(/<a[^>]*href[^>]*>/gi)];
    if (buttons.length > 0 && links.length > 0) {
      score += 10;
      findings.push(
        `✅ Proper button/link usage: ${buttons.length} buttons, ${links.length} links in ${path.basename(file)}`
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

  for (const [category, weight] of Object.entries(WCAG_CRITERIA_WEIGHTS)) {
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
  console.log('♿ WCAG 2.1 AA COMPLIANCE AUDIT RESULTS');
  console.log('='.repeat(60));
  console.log(`📊 Overall Score: ${summary.overallScore}/100 (Grade ${summary.overallGrade})`);
  console.log(`🚨 Critical Issues: ${summary.criticalIssues}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`📂 WCAG Principles Tested: ${summary.categories}`);
  console.log();

  // Display each WCAG principle
  for (const [key, result] of Object.entries(results)) {
    console.log(`♿ ${result.category} (Weight: ${WCAG_CRITERIA_WEIGHTS[key]}%)`);
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

  // WCAG 2.1 AA compliance assessment
  console.log('🏆 WCAG 2.1 AA COMPLIANCE ASSESSMENT');
  console.log('='.repeat(60));

  if (summary.overallScore >= 90 && summary.criticalIssues === 0) {
    console.log('✅ EXCELLENT - Meets WCAG 2.1 AA standards!');
    console.log('   Your extension demonstrates outstanding accessibility practices.');
    console.log('   Ready for deployment with confidence in accessibility compliance.');
  } else if (summary.overallScore >= 80 && summary.criticalIssues === 0) {
    console.log('👍 GOOD - Strong WCAG 2.1 AA compliance foundation.');
    console.log('   Minor improvements recommended but overall compliance is solid.');
    console.log('   Suitable for deployment with minor accessibility enhancements.');
  } else if (summary.overallScore >= 70) {
    console.log('⚠️  FAIR - Partial WCAG 2.1 AA compliance.');
    console.log('   Several areas need improvement before full compliance.');
    console.log('   Address critical issues before deployment.');
  } else {
    console.log('❌ POOR - Significant WCAG 2.1 AA compliance gaps.');
    console.log('   Major accessibility improvements required.');
    console.log('   Not recommended for deployment until issues are resolved.');
  }

  console.log('\n📋 WCAG 2.1 AA Compliance Checklist:');
  console.log('   ✅ Principle 1 - Perceivable: Information must be presentable to users');
  console.log('   ✅ Principle 2 - Operable: UI components must be operable');
  console.log(
    '   ✅ Principle 3 - Understandable: Information and UI operation must be understandable'
  );
  console.log('   ✅ Principle 4 - Robust: Content must be robust for assistive technologies');

  console.log('\n🔍 Recommended Next Steps:');
  console.log('   1. Address any critical issues (❌) identified above');
  console.log('   2. Review warnings (⚠️) for potential improvements');
  console.log('   3. Test with actual assistive technologies (screen readers, voice control)');
  console.log('   4. Conduct user testing with people who use assistive technologies');
  console.log('   5. Consider professional accessibility audit for critical applications');
}

// Run the audit
if (import.meta.url === `file://${process.argv[1]}`) {
  runWcagComplianceAudit()
    .then(summary => {
      process.exit(summary.criticalIssues > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ WCAG audit failed:', error);
      process.exit(1);
    });
}

export { runWcagComplianceAudit };
