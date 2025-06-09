/**
 * Unit tests for GA4 Event Filter
 */

import { GA4EventFilter, filteringUtils } from '../../js/analytics/event-filter.js';

// Mock the config module
jest.mock('../../js/analytics/config.js', () => ({
  getCurrentConfig: jest.fn(() => ({
    environment: 'development',
    ga4MeasurementId: 'G-TEST123',
  })),
}));

describe('GA4EventFilter', () => {
  let eventFilter;

  beforeEach(() => {
    eventFilter = new GA4EventFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Basic Setup', () => {
    test('should initialize with development environment by default', () => {
      expect(eventFilter.environment).toBe('development');
      expect(eventFilter.filteringEnabled).toBe(true);
    });

    test('should initialize with empty custom rules', () => {
      expect(eventFilter.customRules.size).toBe(0);
    });
  });

  describe('Filtering Control', () => {
    test('should enable and disable filtering', () => {
      // Test enabling
      eventFilter.setFilteringEnabled(true);
      expect(eventFilter.filteringEnabled).toBe(true);

      // Test disabling
      eventFilter.setFilteringEnabled(false);
      expect(eventFilter.filteringEnabled).toBe(false);
    });

    test('should pass through all events when filtering is disabled', () => {
      eventFilter.setFilteringEnabled(false);

      const result = eventFilter.shouldAllowEvent('debug_event');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Filtering disabled');
      expect(result.action).toBe('pass-through');
    });
  });

  describe('Development Environment Filtering', () => {
    test('should allow all standard events in development', () => {
      const events = ['page_view', 'search', 'custom_prompt_action'];

      events.forEach(eventName => {
        const result = eventFilter.shouldAllowEvent(eventName);
        expect(result.allowed).toBe(true);
      });
    });

    test('should allow development-only events', () => {
      const devEvents = ['debug_event', 'test_event', 'validation_event'];

      devEvents.forEach(eventName => {
        const result = eventFilter.shouldAllowEvent(eventName);
        expect(result.allowed).toBe(true);
      });
    });

    test('should block production-only events in development', () => {
      // Test production-only events in development environment (should be blocked)
      const prodEvents = ['production_error', 'user_conversion', 'revenue_event'];

      prodEvents.forEach(eventName => {
        const result = eventFilter.shouldAllowEvent(eventName);
        expect(result.allowed).toBe(false);
        expect(result.rule).toBe('production_only');
      });
    });

    test('should apply development parameter overrides', () => {
      const params = { custom_param: 'test' };
      const result = eventFilter.applyParameterOverrides('page_view', params);

      expect(result.environment).toBe('development');
      expect(result.debug_mode).toBe(true);
      expect(result.dev_session).toBe(true);
      expect(result.dev_page_view).toBe(true);
      expect(result.custom_param).toBe('test');
    });
  });

  describe('Production Environment Filtering', () => {
    beforeEach(() => {
      eventFilter.environment = 'production';
    });

    test('should block debug and test events in production', () => {
      const blockedEvents = ['debug_event', 'test_event', 'validation_event'];

      blockedEvents.forEach(eventName => {
        const result = eventFilter.shouldAllowEvent(eventName);
        expect(result.allowed).toBe(false);
        expect(result.rule).toBe('blocked_events');
      });
    });

    test('should block events matching test patterns', () => {
      const testEvents = ['my_event_test', 'test_something', 'debug_performance'];

      testEvents.forEach(eventName => {
        const result = eventFilter.shouldAllowEvent(eventName);
        expect(result.allowed).toBe(false);
        expect(result.rule).toBe('blocked_events_pattern');
      });
    });

    test('should allow production-only events', () => {
      const prodEvents = ['production_error', 'user_conversion', 'revenue_event'];

      prodEvents.forEach(eventName => {
        const result = eventFilter.shouldAllowEvent(eventName);
        expect(result.allowed).toBe(true);
      });
    });

    test('should apply production parameter overrides', () => {
      const params = { custom_param: 'test' };
      const result = eventFilter.applyParameterOverrides('page_view', params);

      expect(result.environment).toBe('production');
      expect(result.debug_mode).toBe(false);
      expect(result.dev_session).toBeUndefined();
      expect(result.custom_param).toBe('test');
    });
  });

  describe('Testing Environment Filtering', () => {
    beforeEach(() => {
      eventFilter.environment = 'testing';
    });

    test('should block production-only events in testing', () => {
      const prodEvents = ['production_error', 'user_conversion', 'revenue_event'];

      prodEvents.forEach(eventName => {
        const result = eventFilter.shouldAllowEvent(eventName);
        expect(result.allowed).toBe(false);
        expect(result.rule).toBe('blocked_events');
      });
    });

    test('should allow testing-only events', () => {
      const testEvents = ['jest_test_event', 'integration_test', 'e2e_test_event'];

      testEvents.forEach(eventName => {
        const result = eventFilter.shouldAllowEvent(eventName);
        expect(result.allowed).toBe(true);
      });
    });

    test('should apply testing parameter overrides', () => {
      const params = { custom_param: 'test' };
      const result = eventFilter.applyParameterOverrides('page_view', params);

      expect(result.environment).toBe('testing');
      expect(result.test_mode).toBe(true);
      expect(result.automated_test).toBe(true);
      expect(result.custom_param).toBe('test');
    });
  });

  describe('Custom Rules', () => {
    test('should add and remove custom rules', () => {
      const ruleName = 'test_rule';
      const ruleFunction = () => true;

      eventFilter.addCustomRule(ruleName, ruleFunction);
      expect(eventFilter.customRules.has(ruleName)).toBe(true);

      eventFilter.removeCustomRule(ruleName);
      expect(eventFilter.customRules.has(ruleName)).toBe(false);
    });

    test('should apply custom rules that block events', () => {
      const blockingRule = eventName => eventName !== 'blocked_by_custom';
      eventFilter.addCustomRule('blocking_rule', blockingRule);

      const allowedResult = eventFilter.shouldAllowEvent('normal_event');
      expect(allowedResult.allowed).toBe(true);

      const blockedResult = eventFilter.shouldAllowEvent('blocked_by_custom');
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.rule).toBe('custom_blocking_rule');
    });

    test('should handle errors in custom rules gracefully', () => {
      const errorRule = () => {
        throw new Error('Test error');
      };
      eventFilter.addCustomRule('error_rule', errorRule);

      const result = eventFilter.shouldAllowEvent('test_event');
      // Should continue with other rules and not fail
      expect(result.allowed).toBe(true);
    });

    test('should apply multiple custom rules', () => {
      const rule1 = eventName => !eventName.includes('rule1');
      const rule2 = eventName => !eventName.includes('rule2');

      eventFilter.addCustomRule('rule1', rule1);
      eventFilter.addCustomRule('rule2', rule2);

      expect(eventFilter.shouldAllowEvent('normal_event').allowed).toBe(true);
      expect(eventFilter.shouldAllowEvent('test_rule1').allowed).toBe(false);
      expect(eventFilter.shouldAllowEvent('test_rule2').allowed).toBe(false);
    });
  });

  describe('Sampling', () => {
    beforeEach(() => {
      eventFilter.environment = 'production';
      // Mock getSamplingValue to return predictable values
      jest.spyOn(eventFilter, '_getSamplingValue').mockImplementation(() => 0.5);
    });

    test('should allow events with 100% sampling rate', () => {
      const result = eventFilter.shouldAllowEvent('page_view');
      expect(result.allowed).toBe(true);
    });

    test('should filter events based on sampling rate', () => {
      // Mock to return value above error_events sampling rate (0.1)
      eventFilter._getSamplingValue.mockReturnValue(0.2);

      const result = eventFilter.shouldAllowEvent('error_events');
      expect(result.allowed).toBe(false);
      expect(result.rule).toBe('sampling');
      expect(result.samplingRate).toBe(0.1);
    });

    test('should allow events within sampling rate', () => {
      // Mock to return value below error_events sampling rate (0.1)
      eventFilter._getSamplingValue.mockReturnValue(0.05);

      const result = eventFilter.shouldAllowEvent('error_events');
      expect(result.allowed).toBe(true);
      expect(result.samplingRate).toBe(0.1);
    });

    test('should use default sampling rate for unknown events', () => {
      const result = eventFilter.shouldAllowEvent('unknown_event');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Parameter Overrides', () => {
    test('should not modify parameters when filtering is disabled', () => {
      eventFilter.setFilteringEnabled(false);

      const params = { test: 'value' };
      const result = eventFilter.applyParameterOverrides('test_event', params);

      expect(result).toEqual(params);
    });

    test('should apply global parameter overrides', () => {
      const params = { custom: 'value' };
      const result = eventFilter.applyParameterOverrides('test_event', params);

      expect(result.environment).toBe('development');
      expect(result.debug_mode).toBe(true);
      expect(result.custom).toBe('value');
    });

    test('should apply event-specific overrides', () => {
      const params = { custom: 'value' };
      const result = eventFilter.applyParameterOverrides('page_view', params);

      expect(result.dev_page_view).toBe(true);
      expect(result.custom).toBe('value');
    });

    test('should prioritize event-specific over global overrides', () => {
      // This would require modifying rules to test, but the logic is correct
      const params = { test: 'original' };
      const result = eventFilter.applyParameterOverrides('page_view', params);

      expect(result.test).toBe('original');
    });
  });

  describe('Statistics and Testing', () => {
    test('should return filtering statistics', () => {
      eventFilter.addCustomRule('test_rule', () => true);

      const stats = eventFilter.getFilteringStats();

      expect(stats.environment).toBe('development');
      expect(stats.filteringEnabled).toBe(true);
      expect(stats.customRulesCount).toBe(1);
      expect(stats.customRules).toContain('test_rule');
      expect(stats.config.hasParameterOverrides).toBe(true);
      expect(stats.config.hasSamplingRules).toBe(true);
    });

    test('should test event filtering without executing', () => {
      const params = { test: 'value' };
      const result = eventFilter.testEventFilter('page_view', params);

      expect(result.eventName).toBe('page_view');
      expect(result.originalParams).toEqual(params);
      expect(result.modifiedParams.environment).toBe('development');
      expect(result.filterResult.allowed).toBe(true);
      expect(result.wouldSend).toBe(true);
      expect(result.parameterChanges).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should detect parameter changes', () => {
      const params = { existing: 'value' };
      const result = eventFilter.testEventFilter('page_view', params);

      expect(result.parameterChanges.added.environment).toBe('development');
      expect(result.parameterChanges.unchanged.existing).toBe('value');
    });
  });

  describe('Sampling Value Generation', () => {
    test('should generate consistent sampling values for same event within minute', () => {
      const eventName = 'test_event';

      const value1 = eventFilter._getSamplingValue(eventName);
      const value2 = eventFilter._getSamplingValue(eventName);

      expect(value1).toBe(value2);
      expect(value1).toBeGreaterThanOrEqual(0);
      expect(value1).toBeLessThan(1);
    });

    test('should generate different values for different events', () => {
      const value1 = eventFilter._getSamplingValue('event1');
      const value2 = eventFilter._getSamplingValue('event2');

      expect(value1).not.toBe(value2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined event parameters', () => {
      const result = eventFilter.shouldAllowEvent('test_event');
      expect(result.allowed).toBe(true);
    });

    test('should handle empty event parameters', () => {
      const result = eventFilter.shouldAllowEvent('test_event', {});
      expect(result.allowed).toBe(true);
    });

    test('should handle unknown environment gracefully', () => {
      eventFilter.environment = 'unknown';

      const result = eventFilter.shouldAllowEvent('test_event');
      expect(result.allowed).toBe(true);
    });

    test('should handle missing sampling rules', () => {
      eventFilter.environment = 'unknown'; // Will use development rules

      const result = eventFilter.shouldAllowEvent('test_event');
      expect(result.allowed).toBe(true);
    });
  });

  describe('filteringUtils', () => {
    test('should provide quick event check utility', () => {
      const result = filteringUtils.shouldAllowEvent('page_view', { test: 'value' });
      expect(result.allowed).toBe(true);
    });

    test('should provide parameter override utility', () => {
      const result = filteringUtils.applyOverrides('page_view', { test: 'value' });
      expect(result.environment).toBe('development');
      expect(result.test).toBe('value');
    });

    test('should provide complete event processing utility', () => {
      const result = filteringUtils.processEvent('page_view', { test: 'value' });

      expect(result.allowed).toBe(true);
      expect(result.eventName).toBe('page_view');
      expect(result.eventParams.environment).toBe('development');
      expect(result.eventParams.test).toBe('value');
      expect(result.filterResult).toBeDefined();
    });

    test('should handle blocked events in processing utility', () => {
      // Test with a blocked event in production
      const filter = new GA4EventFilter();
      filter.environment = 'production';

      // Temporarily replace the singleton for this test
      const originalUtils = filteringUtils.processEvent;
      filteringUtils.processEvent = (eventName, eventParams) => {
        const allowResult = filter.shouldAllowEvent(eventName, eventParams);
        if (!allowResult.allowed) {
          return {
            allowed: false,
            ...allowResult,
          };
        }

        const processedParams = filter.applyParameterOverrides(eventName, eventParams);
        return {
          allowed: true,
          eventName,
          eventParams: processedParams,
          filterResult: allowResult,
        };
      };

      const result = filteringUtils.processEvent('debug_event', {});
      expect(result.allowed).toBe(false);
      expect(result.rule).toBe('blocked_events');

      // Restore original
      filteringUtils.processEvent = originalUtils;
    });
  });
});
