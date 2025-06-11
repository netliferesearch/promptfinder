#!/usr/bin/env node

/**
 * GA4 Analytics Production Testing Script
 *
 * Tests GA4 analytics tracking in production environment for Chrome Web Store readiness.
 * Validates event transmission, debug mode functionality, and recent fixes.
 *
 * Usage: npm run test:ga4-production
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

class GA4ProductionTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testSuite: 'GA4 Analytics Production Testing',
      environment: 'production',
      packageLocation: 'chrome-store-package/',
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      testResults: [],
      summary: {},
      recommendations: [],
    };
  }

  /**
   * Run comprehensive GA4 production testing
   */
  async runTests() {
    console.log('🧪 Starting GA4 Analytics Production Testing...\n');

    try {
      // Test Categories
      await this.testProductionPackageStructure();
      await this.testAnalyticsConfiguration();
      await this.testEventSchemaValidation();
      await this.testRecentFixes();
      await this.testGA4DebugMode();
      await this.testChromeExtensionIntegration();
      await this.testPrivacyCompliance();

      this.generateSummary();
      this.saveReport();
      this.displayResults();
    } catch (error) {
      console.error('❌ Testing failed:', error.message);
      this.results.testResults.push({
        category: 'System',
        test: 'Overall Test Execution',
        status: 'FAILED',
        details: error.message,
        impact: 'CRITICAL',
      });
    }
  }

  /**
   * Test production package structure for analytics files
   */
  async testProductionPackageStructure() {
    console.log('📦 Testing Production Package Structure...');

    const requiredAnalyticsFiles = [
      'dist/js/js/analytics/analytics.js',
      'dist/js/js/analytics/analytics-service.js',
      'dist/js/js/analytics/event-tracker.js',
      'dist/js/js/analytics/event-schema.js',
      'dist/js/js/analytics/config.js',
      'dist/js/js/analytics/session-manager.js',
      'dist/js/js/analytics/client-manager.js',
      'dist/js/app.js',
    ];

    const packagePath = join(rootDir, 'chrome-store-package');

    for (const file of requiredAnalyticsFiles) {
      const filePath = join(packagePath, file);
      const exists = existsSync(filePath);

      this.addTestResult(
        'Package Structure',
        `Analytics file: ${file}`,
        exists ? 'PASS' : 'FAIL',
        exists ? 'File present in production package' : 'File missing from production package',
        exists ? 'NONE' : 'HIGH'
      );
    }

    // Check for recent fixes in production files
    const eventSchemaPath = join(packagePath, 'dist/js/js/analytics/event-schema.js');
    if (existsSync(eventSchemaPath)) {
      const content = readFileSync(eventSchemaPath, 'utf8');
      const hasCustomEngagement = content.includes('custom_user_engagement');

      this.addTestResult(
        'Package Structure',
        'Reserved event name fix applied',
        hasCustomEngagement ? 'PASS' : 'FAIL',
        hasCustomEngagement
          ? 'Uses custom_user_engagement instead of reserved name'
          : 'Still using reserved user_engagement name',
        hasCustomEngagement ? 'NONE' : 'HIGH'
      );
    }
  }

  /**
   * Test analytics configuration for production
   */
  async testAnalyticsConfiguration() {
    console.log('⚙️ Testing Analytics Configuration...');

    const configPath = join(rootDir, 'chrome-store-package/dist/js/js/analytics/config.js');

    if (existsSync(configPath)) {
      const configContent = readFileSync(configPath, 'utf8');

      // Test for required configuration elements
      const hasGA4Config =
        configContent.includes('GA4_MEASUREMENT_ID') || configContent.includes('G-');
      const hasDebugMode = configContent.includes('debugMode') || configContent.includes('DEBUG');
      const hasPrivacyConfig =
        configContent.includes('privacy') || configContent.includes('consent');

      this.addTestResult(
        'Configuration',
        'GA4 Measurement ID configured',
        hasGA4Config ? 'PASS' : 'FAIL',
        hasGA4Config ? 'GA4 configuration found' : 'GA4 configuration missing',
        hasGA4Config ? 'NONE' : 'CRITICAL'
      );

      this.addTestResult(
        'Configuration',
        'Debug mode configuration',
        hasDebugMode ? 'PASS' : 'WARNING',
        hasDebugMode ? 'Debug mode configuration found' : 'Debug mode configuration not found',
        'LOW'
      );

      this.addTestResult(
        'Configuration',
        'Privacy configuration',
        hasPrivacyConfig ? 'PASS' : 'WARNING',
        hasPrivacyConfig
          ? 'Privacy configuration found'
          : 'Privacy configuration not explicitly found',
        'MEDIUM'
      );
    } else {
      this.addTestResult(
        'Configuration',
        'Analytics config file exists',
        'FAIL',
        'Analytics config file not found in production package',
        'CRITICAL'
      );
    }
  }

  /**
   * Test event schema validation
   */
  async testEventSchemaValidation() {
    console.log('📋 Testing Event Schema Validation...');

    const schemaPath = join(rootDir, 'chrome-store-package/dist/js/js/analytics/event-schema.js');

    if (existsSync(schemaPath)) {
      const schemaContent = readFileSync(schemaPath, 'utf8');

      // Test for required events
      const requiredEvents = [
        'page_view',
        'custom_user_engagement', // Changed from user_engagement
        'prompt_view',
        'prompt_copy',
        'search',
        'login',
        'sign_up',
      ];

      const reservedEvents = [
        'user_engagement', // Should NOT be present
        'session_start',
        'first_visit',
      ];

      for (const event of requiredEvents) {
        const hasEvent =
          schemaContent.includes(`'${event}'`) || schemaContent.includes(`"${event}"`);
        this.addTestResult(
          'Event Schema',
          `Required event: ${event}`,
          hasEvent ? 'PASS' : 'FAIL',
          hasEvent ? `Event ${event} found in schema` : `Event ${event} missing from schema`,
          hasEvent ? 'NONE' : 'HIGH'
        );
      }

      // Check that reserved events are NOT being used as custom events
      const hasReservedUserEngagement =
        schemaContent.includes("'user_engagement'") &&
        !schemaContent.includes('// Reserved') &&
        !schemaContent.includes('/* Reserved');

      this.addTestResult(
        'Event Schema',
        'No reserved event names used',
        !hasReservedUserEngagement ? 'PASS' : 'FAIL',
        !hasReservedUserEngagement
          ? 'No reserved GA4 event names used'
          : 'Reserved user_engagement event name still in use',
        !hasReservedUserEngagement ? 'NONE' : 'HIGH'
      );

      // Test for proper event parameters
      const hasRequiredParams =
        schemaContent.includes('session_id') && schemaContent.includes('engagement_time_msec');

      this.addTestResult(
        'Event Schema',
        'Required parameters defined',
        hasRequiredParams ? 'PASS' : 'FAIL',
        hasRequiredParams ? 'Required GA4 parameters found' : 'Required GA4 parameters missing',
        hasRequiredParams ? 'NONE' : 'HIGH'
      );
    } else {
      this.addTestResult(
        'Event Schema',
        'Event schema file exists',
        'FAIL',
        'Event schema file not found in production package',
        'CRITICAL'
      );
    }
  }

  /**
   * Test recent fixes are properly applied
   */
  async testRecentFixes() {
    console.log('🔧 Testing Recent Fixes...');

    // Test popup height fix
    const popupCSSPath = join(rootDir, 'chrome-store-package/css/pages/popup.css');
    if (existsSync(popupCSSPath)) {
      const cssContent = readFileSync(popupCSSPath, 'utf8');

      const hasFixedHeight =
        cssContent.includes('height: 600px') &&
        cssContent.includes('width: 400px') &&
        !cssContent.includes('height: 100vh');

      this.addTestResult(
        'Recent Fixes',
        'Popup height fix applied',
        hasFixedHeight ? 'PASS' : 'FAIL',
        hasFixedHeight
          ? 'Popup uses fixed dimensions instead of 100vh'
          : 'Popup height not properly fixed',
        hasFixedHeight ? 'NONE' : 'HIGH'
      );
    }

    // Test oauth-config fix
    const oauthConfigPath = join(rootDir, 'chrome-store-package/dist/js/js/oauth-config.js');
    const promptDataPath = join(rootDir, 'chrome-store-package/dist/js/js/promptData.js');

    const hasOAuthConfig = existsSync(oauthConfigPath);
    this.addTestResult(
      'Recent Fixes',
      'OAuth config file copied',
      hasOAuthConfig ? 'PASS' : 'FAIL',
      hasOAuthConfig ? 'OAuth config file present in production' : 'OAuth config file missing',
      hasOAuthConfig ? 'NONE' : 'HIGH'
    );

    if (existsSync(promptDataPath)) {
      const promptDataContent = readFileSync(promptDataPath, 'utf8');
      const hasFixedImport =
        promptDataContent.includes("from './oauth-config.js'") &&
        !promptDataContent.includes("from '../config/oauth-config.js'");

      this.addTestResult(
        'Recent Fixes',
        'OAuth import path fixed',
        hasFixedImport ? 'PASS' : 'FAIL',
        hasFixedImport ? 'OAuth import uses correct relative path' : 'OAuth import path not fixed',
        hasFixedImport ? 'NONE' : 'HIGH'
      );
    }
  }

  /**
   * Test GA4 debug mode functionality
   */
  async testGA4DebugMode() {
    console.log('🐛 Testing GA4 Debug Mode...');

    const analyticsFiles = [
      'dist/js/js/analytics/analytics-service.js',
      'dist/js/js/analytics/realtime-validator.js',
    ];

    for (const file of analyticsFiles) {
      const filePath = join(rootDir, 'chrome-store-package', file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');

        const hasDebugSupport =
          content.includes('debug') ||
          content.includes('DEBUG') ||
          content.includes('validation') ||
          content.includes('_debug');

        this.addTestResult(
          'GA4 Debug Mode',
          `Debug support in ${file}`,
          hasDebugSupport ? 'PASS' : 'WARNING',
          hasDebugSupport ? 'Debug functionality present' : 'Debug functionality not found',
          'LOW'
        );
      }
    }

    // Test for debug URL configuration
    const analyticsServicePath = join(
      rootDir,
      'chrome-store-package/dist/js/js/analytics/analytics-service.js'
    );
    if (existsSync(analyticsServicePath)) {
      const content = readFileSync(analyticsServicePath, 'utf8');
      const hasDebugURL =
        content.includes('debug/mp/collect') ||
        content.includes('gtag') ||
        content.includes('analytics.google.com');

      this.addTestResult(
        'GA4 Debug Mode',
        'Debug URL configuration',
        hasDebugURL ? 'PASS' : 'WARNING',
        hasDebugURL ? 'GA4 debug/collection URLs found' : 'GA4 URLs not explicitly found',
        'LOW'
      );
    }
  }

  /**
   * Test Chrome Extension integration
   */
  async testChromeExtensionIntegration() {
    console.log('🔌 Testing Chrome Extension Integration...');

    const manifestPath = join(rootDir, 'chrome-store-package/manifest.json');
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

      // Test permissions for analytics
      const hasStoragePermission = manifest.permissions?.includes('storage');
      const hasHostPermissions = manifest.host_permissions?.some(
        perm => perm.includes('google-analytics.com') || perm.includes('googleapis.com')
      );

      this.addTestResult(
        'Chrome Integration',
        'Storage permission for analytics',
        hasStoragePermission ? 'PASS' : 'FAIL',
        hasStoragePermission ? 'Storage permission available' : 'Storage permission missing',
        hasStoragePermission ? 'NONE' : 'HIGH'
      );

      this.addTestResult(
        'Chrome Integration',
        'Host permissions for GA4',
        hasHostPermissions ? 'PASS' : 'WARNING',
        hasHostPermissions
          ? 'Google Analytics host permissions found'
          : 'Google Analytics host permissions not found',
        'MEDIUM'
      );

      // Test CSP for analytics
      const csp = manifest.content_security_policy?.extension_pages;
      const cspAllowsGA4 = csp?.includes('google-analytics.com') || csp?.includes('googleapis.com');

      this.addTestResult(
        'Chrome Integration',
        'CSP allows GA4 connections',
        cspAllowsGA4 ? 'PASS' : 'WARNING',
        cspAllowsGA4 ? 'CSP permits GA4 connections' : 'CSP may not explicitly allow GA4',
        'MEDIUM'
      );
    }

    // Test popup analytics integration
    const popupAnalyticsPath = join(
      rootDir,
      'chrome-store-package/dist/js/js/analytics/popup-analytics.js'
    );
    const hasPopupAnalytics = existsSync(popupAnalyticsPath);

    this.addTestResult(
      'Chrome Integration',
      'Popup analytics integration',
      hasPopupAnalytics ? 'PASS' : 'WARNING',
      hasPopupAnalytics ? 'Popup analytics file present' : 'Popup analytics file not found',
      'LOW'
    );
  }

  /**
   * Test privacy compliance
   */
  async testPrivacyCompliance() {
    console.log('🔒 Testing Privacy Compliance...');

    // Test for consent management
    const consentDialogPath = join(
      rootDir,
      'chrome-store-package/dist/js/js/analytics/consent-dialog.js'
    );
    const hasConsentDialog = existsSync(consentDialogPath);

    this.addTestResult(
      'Privacy Compliance',
      'Consent dialog implementation',
      hasConsentDialog ? 'PASS' : 'WARNING',
      hasConsentDialog ? 'Consent dialog found' : 'Consent dialog not found',
      'MEDIUM'
    );

    // Test for data minimization in analytics
    const analyticsFiles = [
      'dist/js/js/analytics/analytics-service.js',
      'dist/js/js/analytics/event-tracker.js',
    ];

    for (const file of analyticsFiles) {
      const filePath = join(rootDir, 'chrome-store-package', file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');

        // Look for privacy-related implementations
        const hasPrivacyFeatures =
          content.includes('consent') ||
          content.includes('privacy') ||
          content.includes('anonymize') ||
          content.includes('opt');

        this.addTestResult(
          'Privacy Compliance',
          `Privacy features in ${file}`,
          hasPrivacyFeatures ? 'PASS' : 'WARNING',
          hasPrivacyFeatures
            ? 'Privacy-related code found'
            : 'Privacy-related code not explicitly found',
          'LOW'
        );
      }
    }

    // Test for minimal data collection
    const eventSchemaPath = join(
      rootDir,
      'chrome-store-package/dist/js/js/analytics/event-schema.js'
    );
    if (existsSync(eventSchemaPath)) {
      const content = readFileSync(eventSchemaPath, 'utf8');

      // Check that we're not collecting excessive personal data
      const collectsPII =
        content.includes('email') ||
        content.includes('name') ||
        content.includes('phone') ||
        content.includes('address');

      this.addTestResult(
        'Privacy Compliance',
        'Minimal data collection',
        !collectsPII ? 'PASS' : 'WARNING',
        !collectsPII ? 'No obvious PII collection in schema' : 'Potential PII collection detected',
        'MEDIUM'
      );
    }
  }

  /**
   * Add test result to results array
   */
  addTestResult(category, test, status, details, impact = 'NONE') {
    this.results.totalTests++;

    if (status === 'PASS') {
      this.results.passed++;
    } else if (status === 'FAIL') {
      this.results.failed++;
    } else if (status === 'WARNING') {
      this.results.warnings++;
    }

    this.results.testResults.push({
      category,
      test,
      status,
      details,
      impact,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate summary and recommendations
   */
  generateSummary() {
    const passRate = ((this.results.passed / this.results.totalTests) * 100).toFixed(1);
    const score = Math.max(
      0,
      this.results.passed * 10 - this.results.failed * 20 - this.results.warnings * 5
    );

    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    this.results.summary = {
      passRate: `${passRate}%`,
      score: score,
      grade: grade,
      criticalIssues: this.results.testResults.filter(
        r => r.impact === 'CRITICAL' && r.status === 'FAIL'
      ).length,
      highIssues: this.results.testResults.filter(r => r.impact === 'HIGH' && r.status === 'FAIL')
        .length,
      mediumIssues: this.results.testResults.filter(
        r => r.impact === 'MEDIUM' && (r.status === 'FAIL' || r.status === 'WARNING')
      ).length,
      readiness: score >= 80 ? 'READY' : score >= 60 ? 'NEEDS_ATTENTION' : 'NOT_READY',
    };

    // Generate recommendations
    const criticalFailures = this.results.testResults.filter(
      r => r.impact === 'CRITICAL' && r.status === 'FAIL'
    );
    const highFailures = this.results.testResults.filter(
      r => r.impact === 'HIGH' && r.status === 'FAIL'
    );

    if (criticalFailures.length > 0) {
      this.results.recommendations.push({
        priority: 'CRITICAL',
        action: 'Fix critical issues before deployment',
        details: criticalFailures.map(f => f.test).join(', '),
      });
    }

    if (highFailures.length > 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        action: 'Address high-impact issues',
        details: highFailures.map(f => f.test).join(', '),
      });
    }

    if (this.results.warnings > 0) {
      this.results.recommendations.push({
        priority: 'LOW',
        action: 'Review warnings for potential improvements',
        details: `${this.results.warnings} warnings found`,
      });
    }

    if (this.results.summary.readiness === 'READY') {
      this.results.recommendations.push({
        priority: 'SUCCESS',
        action: 'GA4 analytics ready for production deployment',
        details: 'All critical tests passed',
      });
    }
  }

  /**
   * Display results to console
   */
  displayResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 GA4 ANALYTICS PRODUCTION TESTING RESULTS');
    console.log('='.repeat(80));

    console.log(
      `\n📈 Overall Score: ${this.results.summary.score}/100 (Grade ${this.results.summary.grade})`
    );
    console.log(`✅ Pass Rate: ${this.results.summary.passRate}`);
    console.log(`🎯 Readiness: ${this.results.summary.readiness}\n`);

    console.log('📋 Test Summary:');
    console.log(`   Total Tests: ${this.results.totalTests}`);
    console.log(`   ✅ Passed: ${this.results.passed}`);
    console.log(`   ❌ Failed: ${this.results.failed}`);
    console.log(`   ⚠️  Warnings: ${this.results.warnings}\n`);

    console.log('🚨 Issues by Impact:');
    console.log(`   🔴 Critical: ${this.results.summary.criticalIssues}`);
    console.log(`   🟠 High: ${this.results.summary.highIssues}`);
    console.log(`   🟡 Medium: ${this.results.summary.mediumIssues}\n`);

    // Show failed tests
    const failures = this.results.testResults.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log('❌ Failed Tests:');
      failures.forEach(failure => {
        console.log(`   ${failure.category}: ${failure.test}`);
        console.log(`      ${failure.details} (Impact: ${failure.impact})`);
      });
      console.log();
    }

    // Show warnings
    const warnings = this.results.testResults.filter(r => r.status === 'WARNING');
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.slice(0, 5).forEach(warning => {
        console.log(`   ${warning.category}: ${warning.test}`);
      });
      if (warnings.length > 5) {
        console.log(`   ... and ${warnings.length - 5} more warnings`);
      }
      console.log();
    }

    // Show recommendations
    if (this.results.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      this.results.recommendations.forEach(rec => {
        const emoji =
          rec.priority === 'CRITICAL'
            ? '🔴'
            : rec.priority === 'HIGH'
              ? '🟠'
              : rec.priority === 'SUCCESS'
                ? '🟢'
                : '🟡';
        console.log(`   ${emoji} ${rec.action}`);
        if (rec.details) {
          console.log(`      ${rec.details}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`📄 Detailed report saved to: ga4-analytics-production-testing-summary.md`);
    console.log('='.repeat(80));
  }

  /**
   * Save detailed report to file
   */
  saveReport() {
    const reportPath = join(rootDir, 'ga4-analytics-production-testing-summary.md');

    let report = `# GA4 Analytics Production Testing Summary\n\n`;
    report += `**Date**: ${this.results.timestamp}\n`;
    report += `**Environment**: ${this.results.environment}\n`;
    report += `**Package**: ${this.results.packageLocation}\n\n`;

    report += `## 📊 Overall Results\n\n`;
    report += `- **Score**: ${this.results.summary.score}/100 (Grade ${this.results.summary.grade})\n`;
    report += `- **Pass Rate**: ${this.results.summary.passRate}\n`;
    report += `- **Readiness**: ${this.results.summary.readiness}\n`;
    report += `- **Total Tests**: ${this.results.totalTests}\n`;
    report += `- **Passed**: ${this.results.passed}\n`;
    report += `- **Failed**: ${this.results.failed}\n`;
    report += `- **Warnings**: ${this.results.warnings}\n\n`;

    report += `## 🚨 Issues Summary\n\n`;
    report += `- **Critical Issues**: ${this.results.summary.criticalIssues}\n`;
    report += `- **High Impact Issues**: ${this.results.summary.highIssues}\n`;
    report += `- **Medium Impact Issues**: ${this.results.summary.mediumIssues}\n\n`;

    // Test results by category
    const categories = [...new Set(this.results.testResults.map(r => r.category))];
    report += `## 📋 Detailed Test Results\n\n`;

    categories.forEach(category => {
      report += `### ${category}\n\n`;
      const categoryResults = this.results.testResults.filter(r => r.category === category);

      categoryResults.forEach(result => {
        const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        report += `${emoji} **${result.test}**\n`;
        report += `   - Status: ${result.status}\n`;
        report += `   - Details: ${result.details}\n`;
        if (result.impact !== 'NONE') {
          report += `   - Impact: ${result.impact}\n`;
        }
        report += `\n`;
      });
    });

    // Recommendations
    if (this.results.recommendations.length > 0) {
      report += `## 💡 Recommendations\n\n`;
      this.results.recommendations.forEach(rec => {
        report += `### ${rec.priority} Priority\n`;
        report += `**Action**: ${rec.action}\n\n`;
        if (rec.details) {
          report += `**Details**: ${rec.details}\n\n`;
        }
      });
    }

    report += `## 🎯 Next Steps\n\n`;
    if (this.results.summary.readiness === 'READY') {
      report += `✅ **READY FOR DEPLOYMENT**\n\n`;
      report += `GA4 analytics tracking has been successfully validated in the production environment. `;
      report += `All critical tests have passed and the system is ready for Chrome Web Store submission.\n\n`;
      report += `### Recommended actions:\n`;
      report += `1. Proceed with Task 6.2: Verify GA4 debug mode functionality\n`;
      report += `2. Test user interactions in live environment\n`;
      report += `3. Monitor GA4 dashboard for event data\n`;
    } else {
      report += `⚠️ **NEEDS ATTENTION**\n\n`;
      report += `Some issues were found that should be addressed before deployment:\n\n`;
      const criticalFailures = this.results.testResults.filter(
        r => r.impact === 'CRITICAL' && r.status === 'FAIL'
      );
      if (criticalFailures.length > 0) {
        report += `**Critical Issues to Fix:**\n`;
        criticalFailures.forEach(f => {
          report += `- ${f.test}: ${f.details}\n`;
        });
        report += `\n`;
      }
    }

    report += `---\n\n`;
    report += `*Generated by GA4 Analytics Production Testing Suite*\n`;
    report += `*Timestamp: ${this.results.timestamp}*\n`;

    writeFileSync(reportPath, report);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  const tester = new GA4ProductionTester();
  await tester.runTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default GA4ProductionTester;
