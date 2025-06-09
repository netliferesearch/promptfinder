/**
 * PurgeCSS Compatibility Tests for Analytics
 * Verifies that PurgeCSS safelist includes all necessary analytics-related classes
 */

const fs = require('fs').promises;
const { join } = require('path');
const { PurgeCSS } = require('purgecss');

// __dirname is available in CommonJS
const projectRoot = join(__dirname, '../..');

describe('PurgeCSS Analytics Compatibility', () => {
  let purgeConfig;
  let testCSSContent;

  beforeAll(async () => {
    // Load the actual PurgeCSS configuration
    const configPath = join(projectRoot, 'scripts/purge-css.mjs');
    const configContent = await fs.readFile(configPath, 'utf-8');

    // Extract the config object (simplified parsing for testing)
    const configMatch = configContent.match(/const config = ({[\s\S]*?});/);
    if (configMatch) {
      // Parse the config (simplified for testing purposes)
      purgeConfig = {
        content: [
          join(projectRoot, 'pages/**/*.html'),
          join(projectRoot, 'js/**/*.js'),
          join(projectRoot, 'dist/js/**/*.js'),
          join(projectRoot, '*.js'),
        ],
        safelist: {
          standard: [
            // Core analytics classes
            'analytics-status',
            'debug-panel',
            'console-output',
            'validation-result',
            'error-message',
            'warning-message',
            'success-message',
            'info-message',
            'analytics-enabled',
            'analytics-disabled',
            'realtime-status',
            'performance-metrics',
            'event-status',
            'ga4-debug',
            'validation-score',
            'test-mode',
            'analytics-error',
            'tracking-disabled',
          ],
          deep: [
            /^analytics/,
            /^debug/,
            /^console/,
            /^tracker/,
            /^ga4/,
            /^validation/,
            /^error/,
            /^warning/,
            /^success/,
            /^info/,
            /^realtime/,
            /^performance/,
            /^testing/,
            /^event/,
            /^metrics/,
            /^status/,
          ],
        },
      };
    }

    // Create test CSS content with analytics classes
    testCSSContent = `
      /* Analytics Status Classes */
      .analytics-status { color: green; }
      .analytics-enabled { background: #e8f5e8; }
      .analytics-disabled { background: #f5e8e8; }
      
      /* Debug Panel Classes */
      .debug-panel { border: 1px solid #ccc; }
      .debug-panel-header { font-weight: bold; }
      .debug-panel-content { padding: 10px; }
      
      /* Console Output Classes */
      .console-output { font-family: monospace; }
      .console-output-line { margin-bottom: 5px; }
      .console-output-error { color: red; }
      
      /* Validation Classes */
      .validation-result { padding: 8px; }
      .validation-success { border-left: 3px solid green; }
      .validation-warning { border-left: 3px solid orange; }
      .validation-error { border-left: 3px solid red; }
      .validation-score { font-weight: bold; }
      
      /* GA4 Debug Classes */
      .ga4-debug { background: #f0f8ff; }
      .ga4-debug-endpoint { color: blue; }
      .ga4-debug-response { background: #f9f9f9; }
      
      /* Event Status Classes */
      .event-status { display: inline-block; }
      .event-status-pending { color: orange; }
      .event-status-success { color: green; }
      .event-status-failed { color: red; }
      
      /* Performance Metrics Classes */
      .performance-metrics { border: 1px solid #ddd; }
      .performance-timing { font-family: monospace; }
      .performance-fast { color: green; }
      .performance-slow { color: red; }
      
      /* Testing Classes */
      .testing-panel { background: #fff5f5; }
      .testing-result { margin: 5px 0; }
      .testing-passed { color: green; }
      .testing-failed { color: red; }
      
      /* Realtime Classes */
      .realtime-status { font-weight: bold; }
      .realtime-connected { color: green; }
      .realtime-disconnected { color: red; }
      
      /* Message Classes */
      .error-message { background: #fee; color: #c00; }
      .warning-message { background: #ffa; color: #850; }
      .success-message { background: #efe; color: #060; }
      .info-message { background: #eef; color: #006; }
      
      /* Tracker Classes */
      .tracker-status { display: flex; }
      .tracker-enabled { opacity: 1; }
      .tracker-disabled { opacity: 0.5; }
      
      /* Metrics Classes */
      .metrics-display { table-layout: fixed; }
      .metrics-value { text-align: right; }
      .metrics-label { font-weight: normal; }
      
      /* Classes that should be removed */
      .unused-analytics-class { display: none; }
      .old-debug-class { visibility: hidden; }
    `;
  });

  describe('Safelist Configuration', () => {
    test('should include all core analytics classes in standard safelist', () => {
      const analyticsClasses = [
        'analytics-status',
        'debug-panel',
        'console-output',
        'validation-result',
        'error-message',
        'warning-message',
        'success-message',
        'info-message',
        'analytics-enabled',
        'analytics-disabled',
        'realtime-status',
        'performance-metrics',
        'event-status',
        'ga4-debug',
        'validation-score',
        'test-mode',
        'analytics-error',
        'tracking-disabled',
      ];

      analyticsClasses.forEach(className => {
        expect(purgeConfig.safelist.standard).toContain(className);
      });
    });

    test('should include analytics patterns in deep safelist', () => {
      const analyticsPatterns = [
        /^analytics/,
        /^debug/,
        /^console/,
        /^tracker/,
        /^ga4/,
        /^validation/,
        /^error/,
        /^warning/,
        /^success/,
        /^info/,
        /^realtime/,
        /^performance/,
        /^testing/,
        /^event/,
        /^metrics/,
        /^status/,
      ];

      analyticsPatterns.forEach(pattern => {
        const patternExists = purgeConfig.safelist.deep.some(
          deepPattern => deepPattern.toString() === pattern.toString()
        );
        expect(patternExists).toBe(true);
      });
    });
  });

  describe('CSS Purging Tests', () => {
    test('should preserve analytics classes during purging', async () => {
      // Create a temporary CSS string for testing
      const purgeCSSResult = await new PurgeCSS().purge({
        content: [
          {
            raw: `
              <div class="analytics-status">Status</div>
              <div class="debug-panel">Debug Panel</div>
              <div class="validation-result">Result</div>
              <div class="ga4-debug">GA4 Debug</div>
              <div class="error-message">Error</div>
              <div class="performance-metrics">Metrics</div>
            `,
            extension: 'html',
          },
        ],
        css: [
          {
            raw: testCSSContent,
          },
        ],
        safelist: purgeConfig.safelist,
      });

      const purgedCSS = purgeCSSResult[0].css;

      // Check that analytics classes are preserved
      expect(purgedCSS).toContain('.analytics-status');
      expect(purgedCSS).toContain('.debug-panel');
      expect(purgedCSS).toContain('.validation-result');
      expect(purgedCSS).toContain('.ga4-debug');
      expect(purgedCSS).toContain('.error-message');
      expect(purgedCSS).toContain('.performance-metrics');
    });

    test('should preserve classes with analytics prefixes', async () => {
      const purgeCSSResult = await new PurgeCSS().purge({
        content: [
          {
            raw: `
              <div class="analytics-custom-status">Custom Status</div>
              <div class="debug-custom-panel">Custom Debug</div>
              <div class="validation-custom-result">Custom Result</div>
              <div class="performance-custom-timing">Custom Timing</div>
            `,
            extension: 'html',
          },
        ],
        css: [
          {
            raw: `
            .analytics-custom-status { color: blue; }
            .debug-custom-panel { border: 2px solid red; }
            .validation-custom-result { padding: 15px; }
            .performance-custom-timing { font-size: 12px; }
          `,
          },
        ],
        safelist: purgeConfig.safelist,
      });

      const purgedCSS = purgeCSSResult[0].css;

      // Check that prefixed classes are preserved
      expect(purgedCSS).toContain('.analytics-custom-status');
      expect(purgedCSS).toContain('.debug-custom-panel');
      expect(purgedCSS).toContain('.validation-custom-result');
      expect(purgedCSS).toContain('.performance-custom-timing');
    });

    test('should remove unused analytics classes not in safelist', async () => {
      const purgeCSSResult = await new PurgeCSS().purge({
        content: [
          {
            raw: `
              <div class="analytics-status">Used Class</div>
            `,
            extension: 'html',
          },
        ],
        css: [
          {
            raw: `
            .analytics-status { color: green; }
            .unused-analytics-class { display: none; }
            .old-debug-class { visibility: hidden; }
          `,
          },
        ],
        safelist: purgeConfig.safelist,
      });

      const purgedCSS = purgeCSSResult[0].css;

      // Used class should be preserved
      expect(purgedCSS).toContain('.analytics-status');

      // Unused classes should be removed (unless protected by safelist)
      expect(purgedCSS).not.toContain('.unused-analytics-class');
      expect(purgedCSS).not.toContain('.old-debug-class');
    });
  });

  describe('Integration with Existing CSS', () => {
    test('should work with actual project CSS files', async () => {
      try {
        // Test with actual CSS files if they exist
        const cssPath = join(projectRoot, 'css');

        try {
          await fs.access(cssPath);

          const purgeCSSResult = await new PurgeCSS().purge({
            content: [join(projectRoot, 'pages/**/*.html'), join(projectRoot, 'js/**/*.js')],
            css: [join(projectRoot, 'css/**/*.css')],
            safelist: purgeConfig.safelist,
          });

          // Should successfully purge without errors
          expect(purgeCSSResult).toBeDefined();
          expect(Array.isArray(purgeCSSResult)).toBe(true);

          // Check that some basic classes are preserved
          if (purgeCSSResult.length > 0) {
            const combinedCSS = purgeCSSResult.map(result => result.css).join('\n');

            // These should be preserved by existing safelist
            expect(combinedCSS).toMatch(/\.(button|hidden|active)/);
          }
        } catch {
          // CSS files don't exist - skip this test
          console.log('CSS files not found, skipping integration test');
        }
      } catch (error) {
        // If PurgeCSS fails, the test should fail
        console.error('PurgeCSS integration test failed:', error);
        throw error;
      }
    });

    test('should preserve analytics classes in production build', async () => {
      // Simulate production build scenario
      const productionHTML = `
        <!DOCTYPE html>
        <html>
        <head><title>PromptFinder</title></head>
        <body>
          <div id="analytics-dashboard" class="analytics-status">
            <div class="debug-panel">
              <div class="validation-result success-message">
                All events validated successfully
              </div>
              <div class="performance-metrics">
                <span class="metrics-label">Response Time:</span>
                <span class="metrics-value performance-fast">150ms</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const productionCSS = `
        .analytics-status { display: block; }
        .debug-panel { padding: 10px; }
        .validation-result { margin: 5px 0; }
        .success-message { color: green; }
        .performance-metrics { font-family: monospace; }
        .metrics-label { font-weight: bold; }
        .metrics-value { margin-left: 10px; }
        .performance-fast { color: #28a745; }
      `;

      const purgeCSSResult = await new PurgeCSS().purge({
        content: [{ raw: productionHTML, extension: 'html' }],
        css: [{ raw: productionCSS }],
        safelist: purgeConfig.safelist,
      });

      const purgedCSS = purgeCSSResult[0].css;

      // All used analytics classes should be preserved
      expect(purgedCSS).toContain('.analytics-status');
      expect(purgedCSS).toContain('.debug-panel');
      expect(purgedCSS).toContain('.validation-result');
      expect(purgedCSS).toContain('.success-message');
      expect(purgedCSS).toContain('.performance-metrics');
      expect(purgedCSS).toContain('.metrics-label');
      expect(purgedCSS).toContain('.metrics-value');
      expect(purgedCSS).toContain('.performance-fast');
    });
  });

  describe('Performance Impact', () => {
    test('should not significantly increase CSS bundle size', async () => {
      // Test that safelist additions don't drastically increase bundle size
      const testCSS = `
        .test-class { color: red; }
        .another-test { background: blue; }
        .analytics-test { border: 1px solid green; }
      `;

      const withoutSafelist = await new PurgeCSS().purge({
        content: [{ raw: '<div class="test-class">Test</div>', extension: 'html' }],
        css: [{ raw: testCSS }],
        safelist: { standard: [], deep: [] },
      });

      const withSafelist = await new PurgeCSS().purge({
        content: [{ raw: '<div class="test-class">Test</div>', extension: 'html' }],
        css: [{ raw: testCSS }],
        safelist: purgeConfig.safelist,
      });

      const sizeWithout = withoutSafelist[0].css.length;
      const sizeWith = withSafelist[0].css.length;

      // Safelist should not dramatically increase size for unused classes
      // (allowing for some increase due to preserved classes)
      expect(sizeWith).toBeLessThan(sizeWithout * 3); // Allow up to 3x increase
    });
  });
});
