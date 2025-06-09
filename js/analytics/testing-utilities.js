/**
 * GA4 Analytics Testing Utilities
 * Comprehensive testing helpers for validating GA4 events in development
 */

import { getCurrentConfig } from './config.js';
import { EventSchemaValidator } from './event-schema.js';
import analyticsService from './analytics-service.js';

/**
 * Testing utilities class for GA4 analytics event validation
 */
export class AnalyticsTestingUtilities {
  constructor() {
    this.testResults = [];
    this.isTestMode = false;
  }

  /**
   * Enable test mode for utilities
   * @param {boolean} enabled - Whether to enable test mode
   */
  setTestMode(enabled = true) {
    this.isTestMode = enabled;
    if (enabled) {
      console.log('🧪 [GA4 Testing] Analytics testing mode enabled');
    }
  }

  /**
   * Create a mock event for testing
   * @param {string} eventName - Name of the event
   * @param {Object} params - Event parameters
   * @param {Object} options - Additional options
   * @returns {Object} Mock event object
   */
  createMockEvent(eventName, params = {}, options = {}) {
    const defaultParams = {
      engagement_time_msec: 100,
      session_id: options.sessionId || 'test_session_' + Date.now(),
      ...params,
    };

    return {
      name: eventName,
      params: defaultParams,
      timestamp: new Date().toISOString(),
      context: options.context || 'testing',
    };
  }

  /**
   * Validate an event against GA4 requirements
   * @param {Object} event - Event to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with detailed feedback
   */
  validateEvent(event, options = {}) {
    const result = {
      valid: true,
      score: 100,
      issues: [],
      suggestions: [],
      performance: {
        startTime: Date.now(),
      },
    };

    try {
      // Basic structure validation
      this._validateEventStructure(event, result);

      // Event name validation
      this._validateEventName(event.name, result);

      // Parameters validation
      this._validateParameters(event.params, result);

      // Schema validation
      this._validateEventSchema(event, result);

      // GA4 requirements validation
      this._validateGA4Requirements(event, result);

      // Best practices validation
      this._validateBestPractices(event, result, options);

      // Calculate final score
      this._calculateValidationScore(result);

      result.performance.endTime = Date.now();
      result.performance.duration = result.performance.endTime - result.performance.startTime;

      if (this.isTestMode) {
        this._logValidationResult(event, result);
      }

      return result;
    } catch (error) {
      result.valid = false;
      result.score = 0;
      result.issues.push({
        type: 'validation_error',
        severity: 'error',
        message: 'Validation process failed',
        details: error.message,
      });
      return result;
    }
  }

  /**
   * Batch validate multiple events
   * @param {Array<Object>} events - Events to validate
   * @param {Object} options - Validation options
   * @returns {Object} Batch validation result
   */
  batchValidateEvents(events, options = {}) {
    const batchResult = {
      totalEvents: events.length,
      validEvents: 0,
      invalidEvents: 0,
      averageScore: 0,
      results: [],
      summary: {
        commonIssues: {},
        bestPerformers: [],
        worstPerformers: [],
      },
    };

    let totalScore = 0;

    events.forEach((event, index) => {
      const result = this.validateEvent(event, options);
      result.index = index;

      batchResult.results.push(result);
      totalScore += result.score;

      if (result.valid) {
        batchResult.validEvents++;
      } else {
        batchResult.invalidEvents++;
      }

      // Track common issues
      result.issues.forEach(issue => {
        const key = `${issue.type}_${issue.severity}`;
        batchResult.summary.commonIssues[key] = (batchResult.summary.commonIssues[key] || 0) + 1;
      });
    });

    batchResult.averageScore = events.length > 0 ? totalScore / events.length : 0;

    // Find best and worst performers
    const sortedResults = [...batchResult.results].sort((a, b) => b.score - a.score);
    batchResult.summary.bestPerformers = sortedResults.slice(0, 3);
    batchResult.summary.worstPerformers = sortedResults.slice(-3).reverse();

    if (this.isTestMode) {
      this._logBatchResult(batchResult);
    }

    return batchResult;
  }

  /**
   * Test event against GA4 debug endpoint
   * @param {Object} event - Event to test
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Debug endpoint result
   */
  async testWithDebugEndpoint(event, options = {}) {
    const config = getCurrentConfig();

    if (!config.enableDebugMode) {
      return {
        success: false,
        message: 'Debug mode is not enabled',
        suggestion: 'Enable debug mode in analytics configuration',
      };
    }

    try {
      const result = await analyticsService.validateEvent(event, {
        clientId: options.clientId || 'test_client_' + Date.now(),
        sessionId: options.sessionId || 'test_session_' + Date.now(),
        ...options,
      });

      const debugResult = {
        success: result.valid !== undefined,
        valid: result.valid,
        endpoint: 'debug',
        validationMessages: result.validationMessages || [],
        error: result.error,
        payload: result.payload,
        timestamp: new Date().toISOString(),
      };

      if (this.isTestMode) {
        this._logDebugResult(event, debugResult);
      }

      return debugResult;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate test events for common scenarios
   * @param {string} scenario - Test scenario name
   * @param {Object} options - Generation options
   * @returns {Array<Object>} Generated test events
   */
  generateTestEvents(scenario, options = {}) {
    const scenarios = {
      user_journey: [
        this.createMockEvent('page_view', { page_title: 'Homepage' }),
        this.createMockEvent('search', { search_term: 'react components' }),
        this.createMockEvent('select_content', {
          content_type: 'prompt',
          item_id: 'test-prompt-1',
        }),
        this.createMockEvent('prompt_copy', {
          prompt_id: 'test-prompt-1',
          prompt_category: 'development',
        }),
        this.createMockEvent('sign_up', { method: 'email' }),
      ],

      error_scenarios: [
        this.createMockEvent('', { invalid: 'empty_name' }),
        this.createMockEvent('invalid-event-name', { dash: 'not_allowed' }),
        this.createMockEvent('valid_event', {}), // Missing required params
        this.createMockEvent('test_event', { 'invalid-param': 'dashes_not_allowed' }),
        this.createMockEvent('a'.repeat(50), { too_long: 'event_name' }),
      ],

      performance_test: Array.from({ length: 50 }, (_, i) =>
        this.createMockEvent(`perf_test_event_${i}`, {
          index: i,
          timestamp: Date.now(),
          test_data: 'performance_validation',
        })
      ),

      parameter_validation: [
        this.createMockEvent('param_test', { string_param: 'test' }),
        this.createMockEvent('param_test', { number_param: 123 }),
        this.createMockEvent('param_test', { boolean_param: true }),
        this.createMockEvent('param_test', { array_param: [1, 2, 3] }),
        this.createMockEvent('param_test', { object_param: { nested: 'value' } }),
      ],

      custom: options.events || [],
    };

    const events = scenarios[scenario] || scenarios.custom;

    if (this.isTestMode) {
      console.log(
        `🧪 [GA4 Testing] Generated ${events.length} test events for scenario: ${scenario}`
      );
    }

    return events;
  }

  /**
   * Run comprehensive test suite
   * @param {Object} options - Test suite options
   * @returns {Promise<Object>} Complete test results
   */
  async runTestSuite(options = {}) {
    const suiteResult = {
      startTime: new Date().toISOString(),
      tests: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
      },
    };

    console.log('🚀 [GA4 Testing] Starting comprehensive analytics test suite...');

    // Test 1: Schema validation
    console.log('📋 [GA4 Testing] Running schema validation tests...');
    const schemaEvents = this.generateTestEvents('user_journey');
    suiteResult.tests.schemaValidation = this.batchValidateEvents(schemaEvents);

    // Test 2: Error scenarios
    console.log('❌ [GA4 Testing] Running error scenario tests...');
    const errorEvents = this.generateTestEvents('error_scenarios');
    suiteResult.tests.errorScenarios = this.batchValidateEvents(errorEvents);

    // Test 3: Debug endpoint validation
    if (options.includeDebugEndpoint !== false) {
      console.log('🐛 [GA4 Testing] Running debug endpoint tests...');
      const debugTests = [];
      for (const event of schemaEvents.slice(0, 3)) {
        const debugResult = await this.testWithDebugEndpoint(event);
        debugTests.push(debugResult);
      }
      suiteResult.tests.debugEndpoint = { results: debugTests };
    }

    // Test 4: Performance validation
    if (options.includePerformance !== false) {
      console.log('⚡ [GA4 Testing] Running performance tests...');
      const perfEvents = this.generateTestEvents('performance_test');
      const startTime = Date.now();
      suiteResult.tests.performance = this.batchValidateEvents(perfEvents);
      suiteResult.tests.performance.executionTime = Date.now() - startTime;
    }

    // Calculate summary
    Object.values(suiteResult.tests).forEach(test => {
      if (test.totalEvents) {
        suiteResult.summary.totalTests += test.totalEvents;
        suiteResult.summary.passedTests += test.validEvents;
        suiteResult.summary.failedTests += test.invalidEvents;
      }
    });

    suiteResult.endTime = new Date().toISOString();
    suiteResult.duration = new Date(suiteResult.endTime) - new Date(suiteResult.startTime);

    this._logTestSuiteResults(suiteResult);
    return suiteResult;
  }

  /**
   * Get validation statistics and configuration info
   * @returns {Object} Current validation system status
   */
  getValidationStatus() {
    const config = getCurrentConfig();

    return {
      testMode: this.isTestMode,
      debugMode: config.enableDebugMode,
      consoleLogging: config.enableConsoleLogging,
      environment: config.environment,
      endpoint: {
        debug: 'https://www.google-analytics.com/debug/mp/collect',
        production: 'https://www.google-analytics.com/mp/collect',
        current: config.endpoint,
      },
      features: {
        localValidation: true,
        schemaValidation: true,
        debugEndpointValidation: config.enableDebugMode,
        realTimeValidation: config.enableDebugMode,
        batchValidation: true,
        testUtilities: true,
      },
      stats: {
        testsRun: this.testResults.length,
        lastTestTime:
          this.testResults.length > 0
            ? this.testResults[this.testResults.length - 1].timestamp
            : null,
      },
    };
  }

  // Private validation methods

  _validateEventStructure(event, result) {
    if (!event || typeof event !== 'object') {
      result.valid = false;
      result.issues.push({
        type: 'structure',
        severity: 'error',
        message: 'Event must be an object',
      });
      return;
    }

    if (!event.name) {
      result.valid = false;
      result.issues.push({
        type: 'structure',
        severity: 'error',
        message: 'Event must have a name property',
      });
    }

    if (!event.params || typeof event.params !== 'object') {
      result.valid = false;
      result.issues.push({
        type: 'structure',
        severity: 'error',
        message: 'Event must have a params object',
      });
    }
  }

  _validateEventName(eventName, result) {
    if (!eventName || typeof eventName !== 'string') {
      result.valid = false;
      result.issues.push({
        type: 'event_name',
        severity: 'error',
        message: 'Event name must be a non-empty string',
      });
      return;
    }

    // Check length
    if (eventName.length > 40) {
      result.issues.push({
        type: 'event_name',
        severity: 'warning',
        message: 'Event name exceeds 40 character limit',
        value: eventName,
      });
    }

    // Check format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(eventName)) {
      result.valid = false;
      result.issues.push({
        type: 'event_name',
        severity: 'error',
        message:
          'Event name must start with a letter and contain only letters, numbers, and underscores',
        value: eventName,
      });
    }
  }

  _validateParameters(params, result) {
    if (!params || typeof params !== 'object') {
      return;
    }

    Object.keys(params).forEach(key => {
      // Check parameter name format
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
        result.issues.push({
          type: 'parameter_name',
          severity: 'warning',
          message: `Parameter name '${key}' should start with a letter and contain only letters, numbers, and underscores`,
          value: key,
        });
      }

      // Check parameter name length
      if (key.length > 40) {
        result.issues.push({
          type: 'parameter_name',
          severity: 'warning',
          message: `Parameter name '${key}' exceeds 40 character limit`,
          value: key,
        });
      }

      // Check parameter value
      const value = params[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result.issues.push({
          type: 'parameter_value',
          severity: 'warning',
          message: `Parameter '${key}' contains object value which may not be properly tracked`,
          value: key,
        });
      }
    });
  }

  _validateEventSchema(event, result) {
    try {
      const schemaValidation = EventSchemaValidator.validateEvent(event.name, event.params);

      if (!schemaValidation.valid) {
        result.issues.push({
          type: 'schema',
          severity: 'warning',
          message: 'Event does not match defined schema',
          details: schemaValidation.errors || [],
        });
      }
    } catch (error) {
      result.issues.push({
        type: 'schema',
        severity: 'info',
        message: 'Schema validation unavailable',
        details: error.message,
      });
    }
  }

  _validateGA4Requirements(event, result) {
    if (!event.params) return;

    // Check for required session_id
    if (!event.params.session_id) {
      result.issues.push({
        type: 'ga4_requirements',
        severity: 'error',
        message: 'session_id parameter is required for GA4',
        suggestion: 'Add session_id to event parameters',
      });
      result.valid = false;
    }

    // Check for required engagement_time_msec
    if (!event.params.engagement_time_msec || event.params.engagement_time_msec <= 0) {
      result.issues.push({
        type: 'ga4_requirements',
        severity: 'error',
        message: 'engagement_time_msec parameter is required and must be > 0',
        suggestion: 'Add engagement_time_msec with a positive value',
      });
      result.valid = false;
    }
  }

  _validateBestPractices(event, result, _options) {
    // Check for recommended parameters
    const recommendedParams = ['session_id', 'engagement_time_msec'];
    const missingRecommended = recommendedParams.filter(param => !event.params[param]);

    if (missingRecommended.length > 0) {
      result.suggestions.push({
        type: 'best_practices',
        message: `Consider adding recommended parameters: ${missingRecommended.join(', ')}`,
      });
    }

    // Check parameter count
    const paramCount = Object.keys(event.params).length;
    if (paramCount > 25) {
      result.issues.push({
        type: 'best_practices',
        severity: 'warning',
        message: `Event has ${paramCount} parameters, GA4 limit is 25`,
        suggestion: 'Reduce the number of custom parameters',
      });
    }

    // Check for common naming patterns
    if (event.name.includes('_')) {
      result.suggestions.push({
        type: 'best_practices',
        message: 'Good: Using snake_case for event names follows GA4 conventions',
      });
    }
  }

  _calculateValidationScore(result) {
    let score = 100;

    result.issues.forEach(issue => {
      switch (issue.severity) {
        case 'error':
          score -= 20;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 2;
          break;
      }
    });

    result.score = Math.max(0, score);
  }

  _logValidationResult(event, result) {
    const emoji = result.valid ? '✅' : '❌';
    const scoreColor = result.score >= 80 ? '🟢' : result.score >= 60 ? '🟡' : '🔴';

    console.log(
      `${emoji} [GA4 Testing] Event '${event.name}' validation ${scoreColor} Score: ${result.score}/100`
    );

    if (result.issues.length > 0) {
      console.log('📋 [GA4 Testing] Issues found:', result.issues);
    }

    if (result.suggestions.length > 0) {
      console.log('💡 [GA4 Testing] Suggestions:', result.suggestions);
    }
  }

  _logBatchResult(batchResult) {
    console.log(`📊 [GA4 Testing] Batch validation complete:`, {
      total: batchResult.totalEvents,
      valid: batchResult.validEvents,
      invalid: batchResult.invalidEvents,
      averageScore: Math.round(batchResult.averageScore),
      commonIssues: Object.keys(batchResult.summary.commonIssues).length,
    });
  }

  _logDebugResult(event, result) {
    const emoji = result.success ? (result.valid ? '✅' : '⚠️') : '❌';
    console.log(`${emoji} [GA4 Testing] Debug endpoint test for '${event.name}':`, {
      success: result.success,
      valid: result.valid,
      messages: result.validationMessages?.length || 0,
    });
  }

  _logTestSuiteResults(suiteResult) {
    console.log('🎯 [GA4 Testing] Test suite complete!');
    console.log('📈 [GA4 Testing] Results:', {
      duration: `${suiteResult.duration}ms`,
      totalTests: suiteResult.summary.totalTests,
      passed: suiteResult.summary.passedTests,
      failed: suiteResult.summary.failedTests,
      successRate: `${Math.round((suiteResult.summary.passedTests / suiteResult.summary.totalTests) * 100)}%`,
    });

    // Log detailed results for each test category
    Object.entries(suiteResult.tests).forEach(([testName, testResult]) => {
      if (testResult.totalEvents) {
        console.log(
          `  📋 ${testName}: ${testResult.validEvents}/${testResult.totalEvents} passed (avg score: ${Math.round(testResult.averageScore)})`
        );
      }
    });
  }
}

// Create singleton instance
const testingUtilities = new AnalyticsTestingUtilities();

// Export singleton instance
export default testingUtilities;
