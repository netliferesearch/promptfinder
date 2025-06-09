/**
 * GA4 Analytics Service
 *
 * Core service for sending events to Google Analytics 4 via Measurement Protocol
 * Works across all Chrome Extension contexts (popup, content scripts, service worker)
 */

import { getCurrentConfig, isAnalyticsConfigured, DEFAULT_ENGAGEMENT_TIME_MSEC } from './config.js';
import { EventSchemaValidator } from './event-schema.js';

/**
 * Analytics Service Class
 */
class AnalyticsService {
  constructor() {
    this.isEnabled = true;
    this.eventQueue = [];
    this.isOnline = navigator.onLine || true; // Default to true for service worker compatibility
    this.retryDelay = 1000; // Start with 1 second retry delay
    this.maxRetries = 3;

    // Listen for online/offline events if available
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', () => this.handleOnlineStatus(true));
      window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }
  }

  /**
   * Handle online/offline status changes
   * @param {boolean} isOnline - Current online status
   */
  handleOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    if (isOnline && this.eventQueue.length > 0) {
      this.log('Coming back online, processing queued events...');
      this.processEventQueue();
    }
  }

  /**
   * Log messages in development mode
   * @param {string} message - Message to log
   * @param {*} data - Optional data to log
   */
  log(message, data = null) {
    try {
      const config = getCurrentConfig();
      if (config.enableConsoleLogging) {
        if (data) {
          console.log(`[GA4 Analytics] ${message}`, data);
        } else {
          console.log(`[GA4 Analytics] ${message}`);
        }
      }
    } catch {
      // Silently fail if config is not available
    }
  }

  /**
   * Send event to GA4 Measurement Protocol
   * @param {Object} event - GA4 event object
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async sendEvent(event, options = {}) {
    // Check if analytics is enabled and configured
    const analyticsConfigured =
      typeof isAnalyticsConfigured === 'function' ? isAnalyticsConfigured() : true;
    if (!this.isEnabled || !analyticsConfigured) {
      this.log('Analytics disabled or not configured, skipping event');
      return false;
    }

    try {
      const config = getCurrentConfig();
      const payload = this.buildPayload(event, options);

      this.log('Sending GA4 event', { event: event.name, payload });

      // If offline, queue the event
      if (!this.isOnline) {
        this.queueEvent(payload, config);
        return false;
      }

      return await this.sendPayload(payload, config);
    } catch (error) {
      this.log('Error sending event', error);
      return false;
    }
  }

  /**
   * Build GA4 Measurement Protocol payload
   * @param {Object} event - Event data
   * @param {Object} options - Additional options
   * @returns {Object} GA4 payload
   */
  buildPayload(event, options = {}) {
    const payload = {
      client_id: options.clientId || 'placeholder_client_id', // Will be set by client manager
      events: [
        {
          name: event.name,
          params: {
            engagement_time_msec: event.engagement_time_msec || DEFAULT_ENGAGEMENT_TIME_MSEC,
            session_id: options.sessionId || 'placeholder_session_id', // Will be set by session manager
            ...event.params,
          },
        },
      ],
    };

    // Add user properties if provided
    if (options.userProperties) {
      payload.user_properties = options.userProperties;
    }

    return payload;
  }

  /**
   * Send payload to GA4 endpoint
   * @param {Object} payload - GA4 payload
   * @param {Object} config - Current configuration
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<boolean>} Success status
   */
  async sendPayload(payload, config, retryCount = 0) {
    const url = `${config.endpoint}?measurement_id=${config.measurementId}&api_secret=${config.apiSecret}`;

    try {
      // Use text/plain content-type to avoid CORS preflight request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Handle debug endpoint response
        if (config.enableDebugMode && config.endpoint.includes('/debug/')) {
          await this.handleDebugResponse(response, payload);
        }

        this.log('Event sent successfully', { status: response.status });
        return true;
      } else {
        const errorText = await response.text();

        // Handle debug endpoint validation errors
        if (config.enableDebugMode && config.endpoint.includes('/debug/')) {
          this.log('GA4 Debug validation failed', {
            status: response.status,
            statusText: response.statusText,
            validationErrors: errorText,
            payload: payload,
          });
        } else {
          this.log('GA4 API error', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
        }

        // Handle specific error responses
        if (response.status >= 400 && response.status < 500) {
          // Client error - don't retry
          this.log('Client error, not retrying');
          return false;
        }

        // Server error - retry if attempts remaining
        if (retryCount < this.maxRetries) {
          return await this.retryRequest(payload, config, retryCount);
        }

        return false;
      }
    } catch (error) {
      this.log('Network error sending event', error);

      // Retry network errors
      if (retryCount < this.maxRetries) {
        return await this.retryRequest(payload, config, retryCount);
      }

      // If all retries failed, queue the event for later
      this.queueEvent(payload, config);
      return false;
    }
  }

  /**
   * Handle GA4 debug endpoint response
   * @param {Response} response - Fetch response from debug endpoint
   * @param {Object} payload - Original payload sent
   */
  async handleDebugResponse(response, payload) {
    try {
      const debugData = await response.json();

      if (debugData.validationMessages && debugData.validationMessages.length > 0) {
        // Log validation issues
        debugData.validationMessages.forEach(msg => {
          const logLevel = msg.validation_code ? 'warn' : 'error';
          this.log(`GA4 Debug ${logLevel.toUpperCase()}: ${msg.description}`, {
            validationCode: msg.validation_code,
            fieldPath: msg.field_path,
            originalPayload: payload,
          });

          // Use console methods for better visibility in debug mode
          if (console && console[logLevel]) {
            console[logLevel](`[GA4 Debug] ${msg.description}`, {
              code: msg.validation_code,
              field: msg.field_path,
              payload: payload,
            });
          }
        });
      } else {
        // Event validated successfully
        this.log('GA4 Debug: Event validated successfully', {
          payload: payload,
        });

        if (console && console.log) {
          console.log('[GA4 Debug] ✅ Event validated successfully', payload);
        }
      }
    } catch (parseError) {
      // Fallback if response isn't JSON
      this.log('GA4 Debug: Could not parse debug response', {
        error: parseError.message,
        payload: payload,
      });
    }
  }

  /**
   * Retry sending payload with exponential backoff
   * @param {Object} payload - GA4 payload
   * @param {Object} config - Current configuration
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<boolean>} Success status
   */
  async retryRequest(payload, config, retryCount) {
    const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
    this.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);

    await this.sleep(delay);
    return await this.sendPayload(payload, config, retryCount + 1);
  }

  /**
   * Queue event for later sending
   * @param {Object} payload - GA4 payload to queue
   * @param {Object} config - Current configuration
   */
  queueEvent(payload, config) {
    this.eventQueue.push({
      payload,
      config,
      timestamp: Date.now(),
    });

    this.log(`Event queued. Queue size: ${this.eventQueue.length}`);

    // Limit queue size to prevent memory issues
    if (this.eventQueue.length > 100) {
      this.eventQueue.shift(); // Remove oldest event
      this.log('Event queue full, removed oldest event');
    }
  }

  /**
   * Process queued events
   */
  async processEventQueue() {
    if (this.eventQueue.length === 0) {
      return;
    }

    this.log(`Processing ${this.eventQueue.length} queued events`);

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const queuedEvent of events) {
      const success = await this.sendPayload(queuedEvent.payload, queuedEvent.config);
      if (!success) {
        // Re-queue failed events (but don't retry infinitely)
        const age = Date.now() - queuedEvent.timestamp;
        if (age < 24 * 60 * 60 * 1000) {
          // Only retry events less than 24 hours old
          this.queueEvent(queuedEvent.payload, queuedEvent.config);
        }
      }

      // Small delay between queued events to avoid overwhelming the server
      await this.sleep(100);
    }
  }

  /**
   * Enable or disable analytics
   * @param {boolean} enabled - Whether analytics should be enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    this.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if analytics is enabled
   * @returns {boolean} Whether analytics is enabled
   */
  getEnabled() {
    return this.isEnabled && isAnalyticsConfigured();
  }

  /**
   * Get current queue size
   * @returns {number} Number of queued events
   */
  getQueueSize() {
    return this.eventQueue.length;
  }

  /**
   * Clear event queue
   */
  clearQueue() {
    this.eventQueue = [];
    this.log('Event queue cleared');
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether debug mode should be enabled
   */
  setDebugMode(enabled) {
    // Update the current configuration to use debug endpoint
    if (enabled) {
      this.log('Debug mode enabled - using GA4 debug endpoint for validation');
    } else {
      this.log('Debug mode disabled - using production GA4 endpoint');
    }

    // Note: This affects the endpoint used in the next request
    // The config.js getCurrentConfig() will determine the endpoint based on enableDebugMode
  }

  /**
   * Validate an event using GA4 debug endpoint
   * @param {Object} event - Event to validate
   * @param {Object} options - Additional options (clientId, sessionId, etc.)
   * @returns {Promise<Object>} Validation result
   */
  async validateEvent(event, options = {}) {
    const payload = this.buildPayload(event, options);

    // Force debug endpoint for validation
    const debugConfig = {
      ...getCurrentConfig(),
      endpoint: 'https://www.google-analytics.com/debug/mp/collect',
      enableDebugMode: true,
    };

    const url = `${debugConfig.endpoint}?measurement_id=${debugConfig.measurementId}&api_secret=${debugConfig.apiSecret}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const debugData = await response.json();
        return {
          valid: !debugData.validationMessages || debugData.validationMessages.length === 0,
          validationMessages: debugData.validationMessages || [],
          payload: payload,
        };
      } else {
        const errorText = await response.text();
        return {
          valid: false,
          error: `HTTP ${response.status}: ${errorText}`,
          payload: payload,
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        payload: payload,
      };
    }
  }

  /**
   * Validate event locally using schema validation (development mode)
   * @param {Object} event - Event to validate
   * @param {Object} options - Additional options (clientId, sessionId, etc.)
   * @returns {Object} Local validation result
   */
  validateEventLocally(event, options = {}) {
    const config = getCurrentConfig();

    if (!config.enableDebugMode) {
      return { valid: true, warnings: [], errors: [] };
    }

    const warnings = [];
    const errors = [];

    try {
      // Build payload for validation
      const payload = this.buildPayload(event, options);

      // Validate using event schema
      const schemaValidation = EventSchemaValidator.validateEvent(event.name, event.params);

      if (!schemaValidation.valid) {
        errors.push({
          type: 'schema_validation',
          message: 'Event failed schema validation',
          details: schemaValidation.errors || [],
        });
      }

      // Check for common issues
      this._validateCommonIssues(event, options, warnings, errors);

      // Check payload structure
      this._validatePayloadStructure(payload, warnings, errors);

      const result = {
        valid: errors.length === 0,
        warnings,
        errors,
        payload,
      };

      // Log validation results in development mode
      this._logValidationResults(result, event);

      return result;
    } catch (error) {
      return {
        valid: false,
        warnings: [],
        errors: [
          {
            type: 'validation_error',
            message: 'Local validation failed',
            details: error.message,
          },
        ],
      };
    }
  }

  /**
   * Validate common issues in development mode
   * @private
   * @param {Object} event - Event object
   * @param {Object} options - Options object
   * @param {Array} warnings - Warnings array to populate
   * @param {Array} errors - Errors array to populate
   */
  _validateCommonIssues(event, options, warnings, errors) {
    // Check event name
    if (!event.name || typeof event.name !== 'string') {
      errors.push({
        type: 'missing_event_name',
        message: 'Event name is required and must be a string',
        field: 'event.name',
      });
    } else if (event.name.length > 40) {
      warnings.push({
        type: 'event_name_length',
        message: 'Event name should be 40 characters or less',
        field: 'event.name',
        value: event.name,
      });
    }

    // Check for placeholder values
    if (options.clientId === 'placeholder_client_id') {
      warnings.push({
        type: 'placeholder_client_id',
        message: 'Using placeholder client ID - ensure client manager is initialized',
        field: 'client_id',
      });
    }

    if (options.sessionId === 'placeholder_session_id') {
      warnings.push({
        type: 'placeholder_session_id',
        message: 'Using placeholder session ID - ensure session manager is initialized',
        field: 'session_id',
      });
    }

    // Check required GA4 parameters
    if (!event.params || typeof event.params !== 'object') {
      errors.push({
        type: 'missing_params',
        message: 'Event params object is required',
        field: 'event.params',
      });
    } else {
      // Check engagement time
      if (!event.params.engagement_time_msec && !options.engagement_time_msec) {
        warnings.push({
          type: 'missing_engagement_time',
          message: 'engagement_time_msec is recommended for better reporting',
          field: 'event.params.engagement_time_msec',
        });
      }
    }

    // Check parameter count (GA4 limit is 25 custom parameters)
    if (event.params && Object.keys(event.params).length > 25) {
      warnings.push({
        type: 'too_many_parameters',
        message: 'GA4 supports up to 25 custom parameters per event',
        field: 'event.params',
        count: Object.keys(event.params).length,
      });
    }

    // Check parameter name length (GA4 limit is 40 characters)
    if (event.params) {
      Object.keys(event.params).forEach(paramName => {
        if (paramName.length > 40) {
          warnings.push({
            type: 'param_name_length',
            message: 'Parameter names should be 40 characters or less',
            field: `event.params.${paramName}`,
            value: paramName,
          });
        }
      });
    }
  }

  /**
   * Validate payload structure
   * @private
   * @param {Object} payload - GA4 payload
   * @param {Array} warnings - Warnings array to populate
   * @param {Array} errors - Errors array to populate
   */
  _validatePayloadStructure(payload, warnings, errors) {
    // Check payload structure
    if (!payload.client_id) {
      errors.push({
        type: 'missing_client_id',
        message: 'client_id is required in GA4 payload',
        field: 'client_id',
      });
    }

    if (!payload.events || !Array.isArray(payload.events)) {
      errors.push({
        type: 'invalid_events_array',
        message: 'events must be an array in GA4 payload',
        field: 'events',
      });
    } else if (payload.events.length === 0) {
      errors.push({
        type: 'empty_events_array',
        message: 'events array cannot be empty',
        field: 'events',
      });
    }

    // Check payload size (GA4 limit is 8KB per request)
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > 8192) {
      warnings.push({
        type: 'payload_size_warning',
        message: 'Payload size exceeds recommended 8KB limit',
        field: 'payload',
        size: payloadSize,
      });
    }
  }

  /**
   * Log validation results in development mode
   * @private
   * @param {Object} result - Validation result
   * @param {Object} event - Original event
   */
  _logValidationResults(result, event) {
    const config = getCurrentConfig();

    if (!config.enableConsoleLogging) {
      return;
    }

    if (result.valid && result.warnings.length === 0) {
      console.log(`[GA4 Dev Validation] ✅ Event '${event.name}' passed validation`);
    } else {
      if (result.errors.length > 0) {
        console.error(`[GA4 Dev Validation] ❌ Event '${event.name}' failed validation:`, {
          errors: result.errors,
          event: event,
        });
      }

      if (result.warnings.length > 0) {
        console.warn(`[GA4 Dev Validation] ⚠️ Event '${event.name}' has warnings:`, {
          warnings: result.warnings,
          event: event,
        });
      }
    }
  }

  /**
   * Send event with development mode validation
   * @param {Object} event - GA4 event object
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async sendEventWithValidation(event, options = {}) {
    const config = getCurrentConfig();

    // Perform local validation in development mode
    if (config.enableDebugMode) {
      const localValidation = this.validateEventLocally(event, options);

      // Stop if there are critical errors
      if (!localValidation.valid) {
        this.log('Event blocked due to validation errors', {
          event: event.name,
          errors: localValidation.errors,
        });
        return false;
      }

      // Log warnings but continue
      if (localValidation.warnings.length > 0) {
        this.log('Event has validation warnings', {
          event: event.name,
          warnings: localValidation.warnings,
        });
      }
    }

    // Send the event normally
    return await this.sendEvent(event, options);
  }

  /**
   * Test debug endpoint connectivity and authentication
   * @returns {Promise<Object>} Connection test result
   */
  async testDebugEndpoint() {
    const testEvent = {
      name: 'debug_test',
      params: {
        test_parameter: 'debug_connectivity_test',
      },
    };

    const result = await this.validateEvent(testEvent, {
      clientId: 'debug_test_client',
      sessionId: 'debug_test_session',
    });

    this.log('Debug endpoint test result', result);

    if (console && console.log) {
      if (result.valid) {
        console.log('[GA4 Debug] ✅ Debug endpoint connectivity test passed');
      } else {
        console.error('[GA4 Debug] ❌ Debug endpoint connectivity test failed', result);
      }
    }

    return result;
  }

  /**
   * Get development validation summary
   * @returns {Object} Validation summary and statistics
   */
  getValidationSummary() {
    const config = getCurrentConfig();

    return {
      developmentMode: config.enableDebugMode,
      debugEndpoint: config.endpoint.includes('/debug/'),
      validationEnabled: config.enableDebugMode,
      consoleLogging: config.enableConsoleLogging,
      environment: config.environment,
      features: {
        localValidation: true,
        schemaValidation: true,
        debugEndpointValidation: config.enableDebugMode,
        developmentWarnings: config.enableDebugMode,
      },
    };
  }

  /**
   * Real-time event validation using debug endpoint
   * Automatically validates events in development mode without blocking the main send operation
   * @param {Object} event - Event to validate
   * @param {Object} options - Validation options
   * @returns {Promise<void>} Validation result (non-blocking)
   */
  async performRealTimeValidation(event, options = {}) {
    const config = getCurrentConfig();

    // Only perform real-time validation in development mode
    if (!config.enableDebugMode) {
      return;
    }

    try {
      // Perform validation in background without blocking main operation
      const validationPromise = this._validateInBackground(event, options);

      // Don't await - let it run in background for real-time feedback
      validationPromise.catch(error => {
        console.warn('[GA4 Real-time Validation] Background validation failed:', error);
      });
    } catch (error) {
      // Don't let validation errors affect main functionality
      console.warn('[GA4 Real-time Validation] Failed to start background validation:', error);
    }
  }

  /**
   * Background validation using debug endpoint
   * @private
   * @param {Object} event - Event to validate
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation result
   */
  async _validateInBackground(event, options = {}) {
    const startTime = Date.now();

    try {
      // Build payload for validation
      const payload = this.buildPayload(event, options);

      // Use debug endpoint for validation
      const debugConfig = {
        ...getCurrentConfig(),
        endpoint: 'https://www.google-analytics.com/debug/mp/collect',
        enableDebugMode: true,
      };

      const url = `${debugConfig.endpoint}?measurement_id=${debugConfig.measurementId}&api_secret=${debugConfig.apiSecret}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        const debugData = await response.json();
        const validationResult = {
          valid: !debugData.validationMessages || debugData.validationMessages.length === 0,
          validationMessages: debugData.validationMessages || [],
          payload: payload,
          performance: {
            validationTime: duration,
            endpoint: 'debug',
          },
        };

        // Provide real-time feedback
        this._provideRealTimeFeedback(event, validationResult);

        return validationResult;
      } else {
        const errorText = await response.text();
        const errorResult = {
          valid: false,
          error: `HTTP ${response.status}: ${errorText}`,
          payload: payload,
          performance: {
            validationTime: duration,
            endpoint: 'debug',
            failed: true,
          },
        };

        this._provideRealTimeFeedback(event, errorResult);
        return errorResult;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResult = {
        valid: false,
        error: error.message,
        payload: null,
        performance: {
          validationTime: duration,
          endpoint: 'debug',
          networkError: true,
        },
      };

      this._provideRealTimeFeedback(event, errorResult);
      return errorResult;
    }
  }

  /**
   * Provide real-time validation feedback to developers
   * @private
   * @param {Object} event - Original event
   * @param {Object} validationResult - Validation result from debug endpoint
   */
  _provideRealTimeFeedback(event, validationResult) {
    const config = getCurrentConfig();

    if (!config.enableConsoleLogging) {
      return;
    }

    const perfIcon =
      validationResult.performance?.validationTime < 200
        ? '⚡'
        : validationResult.performance?.validationTime < 1000
          ? '⏱️'
          : '🐌';

    if (validationResult.valid) {
      console.log(
        `${perfIcon} [GA4 Real-time] ✅ Event '${event.name}' validated successfully (${validationResult.performance?.validationTime}ms)`,
        {
          event: event.name,
          validationTime: validationResult.performance?.validationTime,
          payload: validationResult.payload,
        }
      );
    } else if (validationResult.validationMessages?.length > 0) {
      // Show individual validation messages
      validationResult.validationMessages.forEach(msg => {
        const level = msg.validation_code ? 'warn' : 'error';
        const icon = level === 'warn' ? '⚠️' : '❌';

        console[level](
          `${perfIcon} [GA4 Real-time] ${icon} Event '${event.name}': ${msg.description}`,
          {
            event: event.name,
            validationCode: msg.validation_code,
            fieldPath: msg.field_path,
            validationTime: validationResult.performance?.validationTime,
            suggestion: this._getValidationSuggestion(msg),
          }
        );
      });
    } else if (validationResult.error) {
      console.error(
        `${perfIcon} [GA4 Real-time] 🔴 Event '${event.name}' validation failed: ${validationResult.error}`,
        {
          event: event.name,
          error: validationResult.error,
          validationTime: validationResult.performance?.validationTime,
          networkError: validationResult.performance?.networkError,
        }
      );
    }
  }

  /**
   * Get helpful suggestions for validation errors
   * @private
   * @param {Object} validationMessage - GA4 validation message
   * @returns {string} Helpful suggestion
   */
  _getValidationSuggestion(validationMessage) {
    const { validation_code } = validationMessage;

    const suggestions = {
      INVALID_EVENT_NAME: 'Use only letters, numbers, and underscores. Max 40 characters.',
      INVALID_PARAMETER_NAME: 'Use only letters, numbers, and underscores. Max 40 characters.',
      INVALID_PARAMETER_VALUE: 'Check data types and value limits for this parameter.',
      MISSING_REQUIRED_PARAMETER: 'Add the required parameter to your event.',
      VALUE_OUT_OF_RANGE: 'Check the allowed range for this parameter value.',
      INVALID_CURRENCY_CODE: 'Use valid ISO 4217 currency codes (e.g., USD, EUR).',
      INVALID_TIMESTAMP: 'Use valid Unix timestamp in microseconds.',
      PARAMETER_COUNT_TOO_HIGH: 'Reduce the number of custom parameters (max 25).',
      EVENT_COUNT_TOO_HIGH: 'Reduce the number of events per request (max 25).',
      PAYLOAD_TOO_LARGE: 'Reduce the size of your event data (max 130KB).',
    };

    return suggestions[validation_code] || 'Check GA4 documentation for this validation code.';
  }

  /**
   * Enhanced send event with real-time validation
   * @param {Object} event - GA4 event object
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async sendEventWithRealTimeValidation(event, options = {}) {
    // Start real-time validation in background (non-blocking)
    this.performRealTimeValidation(event, options);

    // Continue with normal event sending
    return await this.sendEvent(event, options);
  }

  /**
   * Batch validate multiple events using debug endpoint
   * @param {Array<Object>} events - Array of events to validate
   * @param {Object} options - Validation options
   * @returns {Promise<Array<Object>>} Array of validation results
   */
  async batchValidateEvents(events, options = {}) {
    const config = getCurrentConfig();

    if (!config.enableDebugMode) {
      return events.map(event => ({
        event: event.name,
        valid: true,
        message: 'Validation skipped - not in development mode',
      }));
    }

    const validationPromises = events.map(async (event, index) => {
      try {
        const result = await this._validateInBackground(event, options);
        return {
          index,
          event: event.name,
          valid: result.valid,
          validationMessages: result.validationMessages || [],
          error: result.error,
          performance: result.performance,
        };
      } catch (error) {
        return {
          index,
          event: event.name,
          valid: false,
          error: error.message,
          performance: { validationTime: 0, failed: true },
        };
      }
    });

    const results = await Promise.allSettled(validationPromises);

    // Log batch validation summary
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.valid).length;
    const failed = results.length - successful;

    console.log(
      `[GA4 Batch Validation] Validated ${results.length} events: ${successful} ✅ valid, ${failed} ❌ invalid`
    );

    return results.map(r =>
      r.status === 'fulfilled'
        ? r.value
        : {
            valid: false,
            error: r.reason?.message || 'Validation promise failed',
          }
    );
  }

  /**
   * Real-time validation status and statistics
   * @returns {Object} Validation statistics
   */
  getRealTimeValidationStats() {
    return {
      enabled: getCurrentConfig().enableDebugMode,
      endpoint: 'https://www.google-analytics.com/debug/mp/collect',
      features: {
        backgroundValidation: true,
        realTimeFeedback: true,
        performanceMonitoring: true,
        validationSuggestions: true,
        batchValidation: true,
      },
      performance: {
        averageValidationTime: 'varies by network',
        nonBlocking: true,
        backgroundExecution: true,
      },
    };
  }

  /**
   * Sleep utility for delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Export singleton instance and class
export { analyticsService as default, AnalyticsService };
