/**
 * Tests for analytics configuration
 */

import { jest } from '@jest/globals';

// Mock process.env before importing the module
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Analytics Configuration', () => {
  describe('Environment Detection', () => {
    test('should detect development environment for unpacked extension', async () => {
      // Mock Chrome runtime for unpacked extension (no update_url)
      global.chrome = {
        ...global.chrome,
        runtime: {
          ...global.chrome.runtime,
          getManifest: jest.fn(() => ({
            name: 'PromptFinder',
            version: '1.0',
            // No update_url indicates unpacked extension
          })),
        },
      };

      const { getEnvironment } = await import('../../js/analytics/config.js');
      expect(getEnvironment()).toBe('development');
    });

    test('should detect development environment from manifest name', async () => {
      global.chrome = {
        ...global.chrome,
        runtime: {
          ...global.chrome.runtime,
          getManifest: jest.fn(() => ({
            name: 'PromptFinder Dev',
            version: '1.0',
            update_url: 'https://clients2.google.com/service/update2/crx',
          })),
        },
      };

      const { getEnvironment } = await import('../../js/analytics/config.js');
      expect(getEnvironment()).toBe('development');
    });

    test('should detect production environment for packed extension', async () => {
      global.chrome = {
        ...global.chrome,
        runtime: {
          ...global.chrome.runtime,
          getManifest: jest.fn(() => ({
            name: 'PromptFinder',
            version: '1.0',
            update_url: 'https://clients2.google.com/service/update2/crx',
          })),
        },
      };

      const { getEnvironment } = await import('../../js/analytics/config.js');
      expect(getEnvironment()).toBe('production');
    });

    test('should default to production when chrome is not available', async () => {
      const originalChrome = global.chrome;
      global.chrome = undefined;

      const { getEnvironment } = await import('../../js/analytics/config.js');
      expect(getEnvironment()).toBe('production');

      global.chrome = originalChrome;
    });
  });

  describe('Configuration Management', () => {
    test('should return development config when in development environment', async () => {
      global.chrome = {
        ...global.chrome,
        runtime: {
          ...global.chrome.runtime,
          getManifest: jest.fn(() => ({
            name: 'PromptFinder Dev',
            version: '1.0',
          })),
        },
      };

      const { getCurrentConfig } = await import('../../js/analytics/config.js');
      const config = getCurrentConfig();

      expect(config.environment).toBe('development');
      expect(config.enableDebugMode).toBe(true);
      expect(config.enableConsoleLogging).toBe(true);
      expect(config.endpoint).toBe('https://www.google-analytics.com/debug/mp/collect');
    });

    test('should return production config when in production environment', async () => {
      global.chrome = {
        ...global.chrome,
        runtime: {
          ...global.chrome.runtime,
          getManifest: jest.fn(() => ({
            name: 'PromptFinder',
            version: '1.0',
            update_url: 'https://clients2.google.com/service/update2/crx',
          })),
        },
      };

      const { getCurrentConfig } = await import('../../js/analytics/config.js');
      const config = getCurrentConfig();

      expect(config.environment).toBe('production');
      expect(config.enableDebugMode).toBe(false);
      expect(config.enableConsoleLogging).toBe(false);
      expect(config.endpoint).toBe('https://www.google-analytics.com/mp/collect');
    });

    test('should include all required configuration properties', async () => {
      const { getCurrentConfig } = await import('../../js/analytics/config.js');
      const config = getCurrentConfig();

      expect(config).toHaveProperty('environment');
      expect(config).toHaveProperty('measurementId');
      expect(config).toHaveProperty('apiSecret');
      expect(config).toHaveProperty('endpoint');
      expect(config).toHaveProperty('defaultEngagementTime');
      expect(config).toHaveProperty('sessionTimeout');
      expect(config).toHaveProperty('enableDebugMode');
      expect(config).toHaveProperty('enableConsoleLogging');
    });

    test('should use development config in development environment', async () => {
      global.chrome = {
        ...global.chrome,
        runtime: {
          ...global.chrome.runtime,
          getManifest: jest.fn(() => ({
            name: 'PromptFinder Dev',
            version: '1.0',
          })),
        },
      };

      const { getCurrentConfig } = await import('../../js/analytics/config.js');
      const config = getCurrentConfig();

      expect(config.measurementId).toBe('G-0E14FPYC5W');
      expect(config.apiSecret).toBe('UmhKBYThRLS4Bp-YGShMfA');
      expect(config.environment).toBe('development');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate correct configuration', async () => {
      const { validateConfig } = await import('../../js/analytics/config.js');

      const validConfig = {
        measurementId: 'G-ABCD123456',
        apiSecret: 'valid_api_secret',
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
      expect(validateConfig(validConfig)).toBe(true);
    });

    test('should reject configuration with placeholder measurement ID', async () => {
      const { validateConfig } = await import('../../js/analytics/config.js');

      const invalidConfig = {
        measurementId: 'G-XXXXXXXXXX',
        apiSecret: 'valid_api_secret',
      };

      expect(() => validateConfig(invalidConfig)).toThrow('Invalid measurementId');
    });

    test('should reject configuration with placeholder API secret', async () => {
      const { validateConfig } = await import('../../js/analytics/config.js');

      const invalidConfig = {
        measurementId: 'G-ABCD123456',
        apiSecret: 'dev_api_secret_placeholder',
      };

      expect(() => validateConfig(invalidConfig)).toThrow('Invalid apiSecret');
    });

    test('should reject invalid measurement ID format', async () => {
      const { validateConfig } = await import('../../js/analytics/config.js');

      const invalidConfig = {
        measurementId: 'INVALID-FORMAT',
        apiSecret: 'valid_api_secret',
      };

      expect(() => validateConfig(invalidConfig)).toThrow('Invalid measurementId format');
    });

    test('should reject missing required fields', async () => {
      const { validateConfig } = await import('../../js/analytics/config.js');

      const invalidConfig = {
        measurementId: 'G-ABCD123456',
        // Missing apiSecret
      };

      expect(() => validateConfig(invalidConfig)).toThrow('Invalid apiSecret');
    });
  });

  describe('Analytics Configuration Status', () => {
    test('should return true when analytics is properly configured', async () => {
      process.env.GA4_PROD_MEASUREMENT_ID = 'G-ABCD123456';
      process.env.GA4_PROD_API_SECRET = 'valid_api_secret';

      const { isAnalyticsConfigured } = await import('../../js/analytics/config.js');
      expect(isAnalyticsConfigured()).toBe(true);
    });

    test('should return true in test environment', async () => {
      const { isAnalyticsConfigured } = await import('../../js/analytics/config.js');

      // In test environment, isAnalyticsConfigured always returns true
      expect(isAnalyticsConfigured()).toBe(true);
    });

    test('should not log warnings in test environment', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { isAnalyticsConfigured } = await import('../../js/analytics/config.js');
      isAnalyticsConfigured();

      // In test environment, no warnings should be logged
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Constants Export', () => {
    test('should export expected constants', async () => {
      const config = await import('../../js/analytics/config.js');

      expect(config.DEFAULT_ENGAGEMENT_TIME_MSEC).toBe(100);
      expect(config.SESSION_EXPIRATION_IN_MIN).toBe(30);
      expect(typeof config.getEnvironment).toBe('function');
      expect(typeof config.getCurrentConfig).toBe('function');
      expect(typeof config.validateConfig).toBe('function');
      expect(typeof config.isAnalyticsConfigured).toBe('function');
    });
  });
});
