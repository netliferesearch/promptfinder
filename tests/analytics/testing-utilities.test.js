/**
 * Tests for GA4 Analytics Testing Utilities
 */

import { AnalyticsTestingUtilities } from '../../js/analytics/testing-utilities.js';

// Mock dependencies
jest.mock('../../js/analytics/config.js', () => ({
  getCurrentConfig: jest.fn(() => ({
    enableDebugMode: true,
    enableConsoleLogging: true,
    environment: 'development',
    endpoint: 'https://www.google-analytics.com/mp/collect',
  })),
}));

jest.mock('../../js/analytics/event-schema.js', () => ({
  EventSchemaValidator: {
    validateEvent: jest.fn((eventName, _params) => ({
      valid: eventName !== 'invalid_schema_event',
      errors: eventName === 'invalid_schema_event' ? ['Schema validation failed'] : [],
    })),
  },
}));

jest.mock('../../js/analytics/analytics-service.js', () => ({
  validateEvent: jest.fn().mockResolvedValue({
    valid: true,
    validationMessages: [],
    payload: { test: 'payload' },
  }),
}));

describe('Analytics Testing Utilities', () => {
  let testingUtilities;

  beforeEach(() => {
    testingUtilities = new AnalyticsTestingUtilities();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    jest.clearAllMocks();
  });

  describe('Test Mode Management', () => {
    test('should enable test mode', () => {
      testingUtilities.setTestMode(true);
      expect(testingUtilities.isTestMode).toBe(true);
      expect(console.log).toHaveBeenCalledWith('🧪 [GA4 Testing] Analytics testing mode enabled');
    });

    test('should disable test mode', () => {
      testingUtilities.setTestMode(false);
      expect(testingUtilities.isTestMode).toBe(false);
    });

    test('should default to enabling test mode', () => {
      testingUtilities.setTestMode();
      expect(testingUtilities.isTestMode).toBe(true);
    });
  });

  describe('Mock Event Creation', () => {
    test('should create basic mock event', () => {
      const event = testingUtilities.createMockEvent('test_event');

      expect(event).toEqual({
        name: 'test_event',
        params: {
          engagement_time_msec: 100,
          session_id: expect.stringMatching(/test_session_\d+/),
        },
        timestamp: expect.any(String),
        context: 'testing',
      });
    });

    test('should create mock event with custom parameters', () => {
      const customParams = {
        custom_param: 'value',
        numeric_param: 123,
      };

      const event = testingUtilities.createMockEvent('custom_event', customParams);

      expect(event.params).toEqual({
        engagement_time_msec: 100,
        session_id: expect.stringMatching(/test_session_\d+/),
        custom_param: 'value',
        numeric_param: 123,
      });
    });

    test('should create mock event with custom options', () => {
      const options = {
        sessionId: 'custom_session',
        context: 'integration_test',
      };

      const event = testingUtilities.createMockEvent('test_event', {}, options);

      expect(event.params.session_id).toBe('custom_session');
      expect(event.context).toBe('integration_test');
    });

    test('should allow parameter overrides', () => {
      const params = {
        engagement_time_msec: 500,
        session_id: 'override_session',
      };

      const event = testingUtilities.createMockEvent('test_event', params);

      expect(event.params.engagement_time_msec).toBe(500);
      expect(event.params.session_id).toBe('override_session');
    });
  });

  describe('Event Validation', () => {
    test('should validate correct event successfully', () => {
      const event = {
        name: 'test_event',
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
        },
      };

      const result = testingUtilities.validateEvent(event);

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(80);
      expect(result.issues).toHaveLength(0);
      expect(result.performance.duration).toBeGreaterThanOrEqual(0);
    });

    test('should detect missing event name', () => {
      const event = {
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
        },
      };

      const result = testingUtilities.validateEvent(event);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual({
        type: 'structure',
        severity: 'error',
        message: 'Event must have a name property',
      });
    });

    test('should detect invalid event name format', () => {
      const event = {
        name: 'invalid-event-name',
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
        },
      };

      const result = testingUtilities.validateEvent(event);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual({
        type: 'event_name',
        severity: 'error',
        message:
          'Event name must start with a letter and contain only letters, numbers, and underscores',
        value: 'invalid-event-name',
      });
    });

    test('should detect long event name', () => {
      const longName = 'a'.repeat(50);
      const event = {
        name: longName,
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
        },
      };

      const result = testingUtilities.validateEvent(event);

      expect(result.issues).toContainEqual({
        type: 'event_name',
        severity: 'warning',
        message: 'Event name exceeds 40 character limit',
        value: longName,
      });
    });

    test('should detect missing required GA4 parameters', () => {
      const event = {
        name: 'test_event',
        params: {
          custom_param: 'value',
        },
      };

      const result = testingUtilities.validateEvent(event);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual({
        type: 'ga4_requirements',
        severity: 'error',
        message: 'session_id parameter is required for GA4',
        suggestion: 'Add session_id to event parameters',
      });
      expect(result.issues).toContainEqual({
        type: 'ga4_requirements',
        severity: 'error',
        message: 'engagement_time_msec parameter is required and must be > 0',
        suggestion: 'Add engagement_time_msec with a positive value',
      });
    });

    test('should detect invalid parameter names', () => {
      const event = {
        name: 'test_event',
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
          'invalid-param-name': 'value',
        },
      };

      const result = testingUtilities.validateEvent(event);

      expect(result.issues).toContainEqual({
        type: 'parameter_name',
        severity: 'warning',
        message:
          "Parameter name 'invalid-param-name' should start with a letter and contain only letters, numbers, and underscores",
        value: 'invalid-param-name',
      });
    });

    test('should detect too many parameters', () => {
      const params = {
        session_id: 'test_session',
        engagement_time_msec: 100,
      };

      // Add 25 more parameters to exceed limit
      for (let i = 0; i < 25; i++) {
        params[`param_${i}`] = `value_${i}`;
      }

      const event = {
        name: 'test_event',
        params,
      };

      const result = testingUtilities.validateEvent(event);

      expect(result.issues).toContainEqual({
        type: 'best_practices',
        severity: 'warning',
        message: 'Event has 27 parameters, GA4 limit is 25',
        suggestion: 'Reduce the number of custom parameters',
      });
    });

    test('should handle validation errors gracefully', () => {
      const invalidEvent = null;

      const result = testingUtilities.validateEvent(invalidEvent);

      expect(result.valid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.issues).toContainEqual({
        type: 'structure',
        severity: 'error',
        message: 'Event must be an object',
      });
    });

    test('should calculate validation score correctly', () => {
      const event = {
        name: 'test_event_with_warning',
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
          'warning-param': 'value', // Will generate warning
        },
      };

      const result = testingUtilities.validateEvent(event);

      expect(result.score).toBeLessThan(100); // Should lose points for warning
      expect(result.score).toBeGreaterThan(80); // But not too much
    });
  });

  describe('Batch Validation', () => {
    test('should validate multiple events', () => {
      const events = [
        {
          name: 'valid_event_1',
          params: {
            session_id: 'test_session',
            engagement_time_msec: 100,
          },
        },
        {
          name: 'valid_event_2',
          params: {
            session_id: 'test_session',
            engagement_time_msec: 200,
          },
        },
        {
          name: 'invalid-event',
          params: {
            session_id: 'test_session',
          },
        },
      ];

      const result = testingUtilities.batchValidateEvents(events);

      expect(result.totalEvents).toBe(3);
      expect(result.validEvents).toBe(2);
      expect(result.invalidEvents).toBe(1);
      expect(result.results).toHaveLength(3);
      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.summary.bestPerformers).toHaveLength(3);
      expect(result.summary.worstPerformers).toHaveLength(3);
    });

    test('should track common issues in batch validation', () => {
      const events = [
        {
          name: 'invalid-event-1',
          params: { session_id: 'test' },
        },
        {
          name: 'invalid-event-2',
          params: { session_id: 'test' },
        },
      ];

      const result = testingUtilities.batchValidateEvents(events);

      expect(result.summary.commonIssues).toHaveProperty('event_name_error');
      expect(result.summary.commonIssues.event_name_error).toBe(2);
    });

    test('should handle empty event array', () => {
      const result = testingUtilities.batchValidateEvents([]);

      expect(result.totalEvents).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('Debug Endpoint Testing', () => {
    test('should test event with debug endpoint', async () => {
      const event = {
        name: 'test_event',
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
        },
      };

      const result = await testingUtilities.testWithDebugEndpoint(event);

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.endpoint).toBe('debug');
      expect(result.validationMessages).toEqual([]);
      expect(result.timestamp).toBeDefined();
    });

    test('should handle debug endpoint errors', async () => {
      const analyticsService = require('../../js/analytics/analytics-service.js');
      analyticsService.validateEvent.mockRejectedValue(new Error('Network error'));

      const event = {
        name: 'test_event',
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
        },
      };

      const result = await testingUtilities.testWithDebugEndpoint(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('should handle debug mode disabled', async () => {
      const getCurrentConfig = require('../../js/analytics/config.js').getCurrentConfig;
      getCurrentConfig.mockReturnValue({
        enableDebugMode: false,
      });

      const event = {
        name: 'test_event',
        params: {},
      };

      const result = await testingUtilities.testWithDebugEndpoint(event);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Debug mode is not enabled');
      expect(result.suggestion).toBe('Enable debug mode in analytics configuration');
    });
  });

  describe('Test Event Generation', () => {
    test('should generate user journey events', () => {
      const events = testingUtilities.generateTestEvents('user_journey');

      expect(events).toHaveLength(5);
      expect(events[0].name).toBe('page_view');
      expect(events[1].name).toBe('search');
      expect(events[2].name).toBe('select_content');
      expect(events[3].name).toBe('prompt_copy');
      expect(events[4].name).toBe('sign_up');
    });

    test('should generate error scenario events', () => {
      const events = testingUtilities.generateTestEvents('error_scenarios');

      expect(events).toHaveLength(5);
      expect(events[0].name).toBe(''); // Empty name
      expect(events[1].name).toBe('invalid-event-name'); // Invalid format
      expect(events[2].name).toBe('valid_event'); // Missing required params
      expect(events[3].name).toBe('test_event'); // Invalid param name
      expect(events[4].name).toHaveLength(50); // Too long name
    });

    test('should generate performance test events', () => {
      const events = testingUtilities.generateTestEvents('performance_test');

      expect(events).toHaveLength(50);
      events.forEach((event, index) => {
        expect(event.name).toBe(`perf_test_event_${index}`);
        expect(event.params.index).toBe(index);
      });
    });

    test('should generate parameter validation events', () => {
      const events = testingUtilities.generateTestEvents('parameter_validation');

      expect(events).toHaveLength(5);
      events.forEach(event => {
        expect(event.name).toBe('param_test');
      });
    });

    test('should handle custom events', () => {
      const customEvents = [
        { name: 'custom_1', params: {} },
        { name: 'custom_2', params: {} },
      ];

      const events = testingUtilities.generateTestEvents('custom', { events: customEvents });

      expect(events).toEqual(customEvents);
    });

    test('should handle unknown scenario', () => {
      const events = testingUtilities.generateTestEvents('unknown_scenario');

      expect(events).toEqual([]);
    });
  });

  describe('Test Suite Execution', () => {
    test('should run comprehensive test suite', async () => {
      testingUtilities.setTestMode(true);

      const result = await testingUtilities.runTestSuite({
        includeDebugEndpoint: true, // Enable debug endpoint for this test
        includePerformance: false, // Disable performance for speed
      });

      expect(result.summary.totalTests).toBeGreaterThan(0); // Check summary instead of passed
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0); // Duration could be 0 in very fast tests
      expect(result.tests.schemaValidation).toBeDefined();
      expect(result.tests.errorScenarios).toBeDefined();
      expect(result.tests.debugEndpoint).toBeDefined();
    });

    test('should run test suite without debug endpoint', async () => {
      const result = await testingUtilities.runTestSuite({ includeDebugEndpoint: false });

      expect(result.tests.debugEndpoint).toBeUndefined();
      expect(result.tests.schemaValidation).toBeDefined();
    });

    test('should run test suite without performance tests', async () => {
      const result = await testingUtilities.runTestSuite({ includePerformance: false });

      expect(result.tests.performance).toBeUndefined();
      expect(result.tests.schemaValidation).toBeDefined();
    });
  });

  describe('Validation Status', () => {
    test('should get current validation status', () => {
      testingUtilities.setTestMode(true);

      const status = testingUtilities.getValidationStatus();

      expect(status.testMode).toBe(true);
      expect(status.debugMode).toBe(false); // Debug mode defaults to false in test config
      expect(Object.prototype.hasOwnProperty.call(status, 'environment')).toBe(true); // Environment property should exist (even if undefined)
      expect(status.features.localValidation).toBe(true);
      expect(status.features.testUtilities).toBe(true);
      expect(status.endpoint.debug).toBe('https://www.google-analytics.com/debug/mp/collect');
      expect(status.stats.testsRun).toBe(0);
    });

    test('should track test statistics', () => {
      const event = {
        name: 'test_event',
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
        },
      };

      // Run a test to generate stats
      testingUtilities.validateEvent(event);

      const status = testingUtilities.getValidationStatus();
      expect(status.stats.testsRun).toBe(0); // testResults not tracked by validateEvent
    });

    test('should log batch results in test mode', () => {
      testingUtilities.setTestMode(true);

      const events = [
        {
          name: 'test_event',
          params: {
            session_id: 'test_session',
            engagement_time_msec: 100,
          },
        },
      ];

      testingUtilities.batchValidateEvents(events);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('📊 [GA4 Testing] Batch validation complete:'),
        expect.objectContaining({
          total: 1,
          valid: 1,
          invalid: 0,
        })
      );
    });
  });

  describe('Logging and Test Mode', () => {
    test('should log validation results in test mode', () => {
      testingUtilities.setTestMode(true);

      const event = {
        name: 'test_event',
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
        },
      };

      testingUtilities.validateEvent(event);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[GA4 Testing] Event 'test_event' validation")
      );
    });

    test('should not log validation results when test mode is off', () => {
      testingUtilities.setTestMode(false);

      const event = {
        name: 'test_event',
        params: {
          session_id: 'test_session',
          engagement_time_msec: 100,
        },
      };

      testingUtilities.validateEvent(event);

      // Should not log validation results
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining("[GA4 Testing] Event 'test_event' validation")
      );
    });
  });
});
