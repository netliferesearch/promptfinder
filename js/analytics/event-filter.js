/**
 * GA4 Analytics Event Filtering System
 * Manages different event behavior between development and production environments
 */

import { getCurrentConfig } from './config.js';

/**
 * Event filtering rules and behavior configurations
 */
const FILTERING_RULES = {
  development: {
    // Events that should be blocked in development
    blockedEvents: [
      // No events blocked by default in development
    ],
    // Events that should only exist in development
    developmentOnlyEvents: [
      'debug_event',
      'test_event',
      'validation_event',
      'development_error',
      'dev_performance_test',
    ],
    // Event parameter modifications for development
    parameterOverrides: {
      // Add development indicators to all events
      global: {
        environment: 'development',
        debug_mode: true,
        dev_session: true,
      },
      // Specific event overrides
      page_view: {
        dev_page_view: true,
      },
      search: {
        dev_search: true,
      },
    },
    // Sampling rates (1.0 = 100%, 0.5 = 50%, etc.)
    sampling: {
      default: 1.0, // Track all events in development
      page_view: 1.0,
      search: 1.0,
      custom_prompt_action: 1.0,
      error_events: 1.0,
    },
  },
  production: {
    // Events that should be blocked in production
    blockedEvents: [
      'debug_event',
      'test_event',
      'validation_event',
      'development_error',
      'dev_performance_test',
      // Block events with test identifiers
      /.*_test$/,
      /^test_.*/,
      /.*debug.*/,
    ],
    // Events that should only exist in production
    productionOnlyEvents: ['production_error', 'user_conversion', 'revenue_event'],
    // Event parameter modifications for production
    parameterOverrides: {
      global: {
        environment: 'production',
        debug_mode: false,
      },
    },
    // Sampling rates for production (reduce volume if needed)
    sampling: {
      default: 1.0,
      page_view: 1.0,
      search: 1.0,
      custom_prompt_action: 1.0,
      error_events: 0.1, // Sample 10% of error events to reduce noise
      performance_timing: 0.5, // Sample 50% of performance events
    },
  },
  testing: {
    // Special rules for testing environment
    blockedEvents: ['production_error', 'user_conversion', 'revenue_event'],
    testingOnlyEvents: ['jest_test_event', 'integration_test', 'e2e_test_event'],
    parameterOverrides: {
      global: {
        environment: 'testing',
        test_mode: true,
        automated_test: true,
      },
    },
    sampling: {
      default: 1.0, // Track everything in tests
    },
  },
};

/**
 * GA4 Event Filter class
 */
export class GA4EventFilter {
  constructor() {
    this.config = getCurrentConfig();
    this.environment = this.config?.environment || 'development';
    this.filteringEnabled = true;
    this.customRules = new Map();
  }

  /**
   * Enable or disable event filtering
   * @param {boolean} enabled - Whether filtering should be enabled
   */
  setFilteringEnabled(enabled) {
    this.filteringEnabled = enabled;
    // Browser-safe logging - avoid process.env which doesn't exist in browsers
    if (typeof console !== 'undefined' && console.log) {
      console.log(`🔄 [GA4 Event Filter] Filtering ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Add custom filtering rule
   * @param {string} ruleName - Name of the custom rule
   * @param {Function} filterFunction - Function that returns true to allow event, false to block
   */
  addCustomRule(ruleName, filterFunction) {
    this.customRules.set(ruleName, filterFunction);
    // Browser-safe logging - avoid process.env which doesn't exist in browsers
    if (typeof console !== 'undefined' && console.log) {
      console.log(`✅ [GA4 Event Filter] Added custom rule: ${ruleName}`);
    }
  }

  /**
   * Remove custom filtering rule
   * @param {string} ruleName - Name of the rule to remove
   */
  removeCustomRule(ruleName) {
    const removed = this.customRules.delete(ruleName);
    if (removed) {
      // Browser-safe logging - avoid process.env which doesn't exist in browsers
      if (typeof console !== 'undefined' && console.log) {
        console.log(`🗑️ [GA4 Event Filter] Removed custom rule: ${ruleName}`);
      }
    }
  }

  /**
   * Check if an event should be allowed based on filtering rules
   * @param {string} eventName - GA4 event name
   * @param {Object} eventParams - Event parameters
   * @returns {Object} Filter result with allowed status and reason
   */
  shouldAllowEvent(eventName, eventParams = {}) {
    if (!this.filteringEnabled) {
      return {
        allowed: true,
        reason: 'Filtering disabled',
        action: 'pass-through',
      };
    }

    const rules = FILTERING_RULES[this.environment];
    if (!rules) {
      // Unknown environment - allow everything but apply development overrides
      return {
        allowed: true,
        reason: `Unknown environment '${this.environment}' - allowing event`,
        action: 'allow',
        environment: this.environment,
      };
    }

    // Check blocked events
    const blockResult = this._checkBlockedEvents(eventName, rules.blockedEvents);
    if (!blockResult.allowed) {
      return blockResult;
    }

    // Check environment-specific events
    const envResult = this._checkEnvironmentEvents(eventName, rules);
    if (!envResult.allowed) {
      return envResult;
    }

    // Check custom rules
    const customResult = this._checkCustomRules(eventName, eventParams);
    if (!customResult.allowed) {
      return customResult;
    }

    // Check sampling
    const samplingResult = this._checkSampling(eventName, rules.sampling);
    if (!samplingResult.allowed) {
      return samplingResult;
    }

    // Get sampling information for successful events
    const samplingRate = rules.sampling?.[eventName] || rules.sampling?.default || 1.0;

    return {
      allowed: true,
      reason: 'Event passes all filters',
      action: 'allow',
      environment: this.environment,
      samplingRate: samplingRate,
    };
  }

  /**
   * Apply parameter overrides to an event
   * @param {string} eventName - GA4 event name
   * @param {Object} eventParams - Original event parameters
   * @returns {Object} Modified event parameters
   */
  applyParameterOverrides(eventName, eventParams = {}) {
    if (!this.filteringEnabled) {
      return eventParams;
    }

    const rules = FILTERING_RULES[this.environment] || FILTERING_RULES.development;
    const overrides = rules?.parameterOverrides || {};

    // Start with original parameters
    let modifiedParams = { ...eventParams };

    // Apply global overrides
    if (overrides.global) {
      modifiedParams = { ...modifiedParams, ...overrides.global };
    }

    // Apply event-specific overrides
    if (overrides[eventName]) {
      modifiedParams = { ...modifiedParams, ...overrides[eventName] };
    }

    return modifiedParams;
  }

  /**
   * Get filtering statistics
   * @returns {Object} Filtering statistics
   */
  getFilteringStats() {
    return {
      environment: this.environment,
      filteringEnabled: this.filteringEnabled,
      customRulesCount: this.customRules.size,
      customRules: Array.from(this.customRules.keys()),
      rules: FILTERING_RULES[this.environment] || {},
      config: {
        blockedEventsCount: (FILTERING_RULES[this.environment]?.blockedEvents || []).length,
        hasParameterOverrides: !!FILTERING_RULES[this.environment]?.parameterOverrides,
        hasSamplingRules: !!FILTERING_RULES[this.environment]?.sampling,
      },
    };
  }

  /**
   * Test an event against current filtering rules without executing
   * @param {string} eventName - GA4 event name
   * @param {Object} eventParams - Event parameters
   * @returns {Object} Test result with detailed information
   */
  testEventFilter(eventName, eventParams = {}) {
    const allowResult = this.shouldAllowEvent(eventName, eventParams);
    const modifiedParams = this.applyParameterOverrides(eventName, eventParams);

    return {
      eventName,
      originalParams: eventParams,
      modifiedParams,
      filterResult: allowResult,
      environment: this.environment,
      parameterChanges: this._getParameterChanges(eventParams, modifiedParams),
      wouldSend: allowResult.allowed,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if event is blocked
   * @private
   */
  _checkBlockedEvents(eventName, blockedEvents) {
    for (const blockedEvent of blockedEvents) {
      if (typeof blockedEvent === 'string') {
        if (eventName === blockedEvent) {
          return {
            allowed: false,
            reason: `Event '${eventName}' is blocked in ${this.environment} environment`,
            action: 'block',
            rule: 'blocked_events',
          };
        }
      } else if (blockedEvent instanceof RegExp) {
        if (blockedEvent.test(eventName)) {
          return {
            allowed: false,
            reason: `Event '${eventName}' matches blocked pattern in ${this.environment} environment`,
            action: 'block',
            rule: 'blocked_events_pattern',
          };
        }
      }
    }
    return { allowed: true };
  }

  /**
   * Check environment-specific event rules
   * @private
   */
  _checkEnvironmentEvents(eventName, _rules) {
    // Check development-only events
    if (this.environment !== 'development') {
      const devOnlyEvents = FILTERING_RULES.development?.developmentOnlyEvents || [];
      if (devOnlyEvents.includes(eventName)) {
        return {
          allowed: false,
          reason: `Event '${eventName}' is only allowed in development environment`,
          action: 'block',
          rule: 'development_only',
        };
      }
    }

    // Check production-only events
    if (this.environment !== 'production') {
      const prodOnlyEvents = FILTERING_RULES.production?.productionOnlyEvents || [];
      if (prodOnlyEvents.includes(eventName)) {
        return {
          allowed: false,
          reason: `Event '${eventName}' is only allowed in production environment`,
          action: 'block',
          rule: 'production_only',
        };
      }
    }

    // Check testing-only events
    if (this.environment !== 'testing') {
      const testOnlyEvents = FILTERING_RULES.testing?.testingOnlyEvents || [];
      if (testOnlyEvents.includes(eventName)) {
        return {
          allowed: false,
          reason: `Event '${eventName}' is only allowed in testing environment`,
          action: 'block',
          rule: 'testing_only',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check custom filtering rules
   * @private
   */
  _checkCustomRules(eventName, eventParams) {
    for (const [ruleName, filterFunction] of this.customRules) {
      try {
        const result = filterFunction(eventName, eventParams);
        if (!result) {
          return {
            allowed: false,
            reason: `Event blocked by custom rule: ${ruleName}`,
            action: 'block',
            rule: `custom_${ruleName}`,
          };
        }
      } catch (error) {
        // Browser-safe logging - avoid process.env which doesn't exist in browsers
        if (typeof console !== 'undefined' && console.error) {
          console.error(`🚨 [GA4 Event Filter] Error in custom rule '${ruleName}':`, error);
        }
        // Continue with other rules if one fails
      }
    }
    return { allowed: true };
  }

  /**
   * Check sampling rules
   * @private
   */
  _checkSampling(eventName, samplingRules) {
    if (!samplingRules) {
      return { allowed: true };
    }

    // Get sampling rate for this event type
    const samplingRate = samplingRules[eventName] || samplingRules.default || 1.0;

    if (samplingRate >= 1.0) {
      return { allowed: true };
    }

    // Use deterministic sampling based on event name and timestamp
    const randomValue = this._getSamplingValue(eventName);
    const allowed = randomValue < samplingRate;

    if (!allowed) {
      return {
        allowed: false,
        reason: `Event '${eventName}' filtered by sampling (rate: ${(samplingRate * 100).toFixed(1)}%)`,
        action: 'sample_filter',
        rule: 'sampling',
        samplingRate,
      };
    }

    return {
      allowed: true,
      samplingRate,
      samplingValue: randomValue,
    };
  }

  /**
   * Get deterministic sampling value
   * @private
   */
  _getSamplingValue(eventName) {
    // Use a simple hash of the event name and current minute
    // This ensures consistent sampling within the same minute
    const minute = Math.floor(Date.now() / 60000);
    const str = `${eventName}_${minute}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash % 1000) / 1000;
  }

  /**
   * Get parameter changes between original and modified params
   * @private
   */
  _getParameterChanges(original, modified) {
    const changes = {
      added: {},
      modified: {},
      unchanged: {},
    };

    // Check for added parameters
    for (const key in modified) {
      if (!(key in original)) {
        changes.added[key] = modified[key];
      } else if (original[key] !== modified[key]) {
        changes.modified[key] = {
          from: original[key],
          to: modified[key],
        };
      } else {
        changes.unchanged[key] = modified[key];
      }
    }

    return changes;
  }
}

// Export singleton instance
const eventFilter = new GA4EventFilter();

// Export commonly used filtering functions
export const filteringUtils = {
  /**
   * Quick check if event should be allowed
   */
  shouldAllowEvent: (eventName, eventParams) =>
    eventFilter.shouldAllowEvent(eventName, eventParams),

  /**
   * Apply parameter overrides
   */
  applyOverrides: (eventName, eventParams) =>
    eventFilter.applyParameterOverrides(eventName, eventParams),

  /**
   * Filter and process event in one call
   */
  processEvent: (eventName, eventParams) => {
    const allowResult = eventFilter.shouldAllowEvent(eventName, eventParams);
    if (!allowResult.allowed) {
      return {
        allowed: false,
        ...allowResult,
      };
    }

    const processedParams = eventFilter.applyParameterOverrides(eventName, eventParams);
    return {
      allowed: true,
      eventName,
      eventParams: processedParams,
      filterResult: allowResult,
    };
  },
};

export default eventFilter;
