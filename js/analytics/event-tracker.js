/**
 * GA4 Analytics Event Tracker
 *
 * Handles event collection, validation, queueing, and sending to Google Analytics 4
 * via the Measurement Protocol for Chrome Extensions
 */

import { isValidEnvironment } from './config.js';
import { AnalyticsService } from './analytics-service.js';
import clientManager from './client-manager.js';
import sessionManager from './session-manager.js';

/**
 * Event Tracker Class
 * Manages GA4 event tracking with validation, queueing, and batch processing
 */
class EventTracker {
  constructor(dependencies = {}) {
    // Allow dependency injection for testing
    this.analyticsService = dependencies.analyticsService || new AnalyticsService();
    this.clientManager = dependencies.clientManager || clientManager;
    this.sessionManager = dependencies.sessionManager || sessionManager;
    this.config = dependencies.config || { isValidEnvironment };

    this.eventQueue = [];
    this.isProcessing = false;
    this.maxQueueSize = 100;
    this.batchSize = 10;
    this.flushTimeout = 5000; // 5 seconds
    this.flushTimer = null;
    this.debugMode = false;
    this.realTimeValidationEnabled = false;
  }

  /**
   * Track a custom event
   * @param {string} eventName - The event name
   * @param {Object} parameters - Event parameters
   * @param {Object} options - Tracking options
   * @returns {Promise<boolean>} Success status
   */
  async trackEvent(eventName, parameters = {}, options = {}) {
    const startTime = Date.now();

    try {
      // Enhanced logging for event start
      this._logEventDetails(eventName, parameters, {
        status: 'processing',
        queueSize: this.eventQueue.length,
      });

      // Validate environment
      if (!this.config.isValidEnvironment()) {
        this._logEventDetails(eventName, parameters, {
          status: 'error',
          error: new Error('Event tracking disabled - invalid environment'),
        });
        return false;
      }

      // Validate event name
      if (!this._isValidEventName(eventName)) {
        this._logEventDetails(eventName, parameters, {
          status: 'validation_failed',
          error: new Error(`Invalid event name: ${eventName}`),
        });
        return false;
      }

      // Get client ID and session ID with timing
      const clientId = await this.clientManager.getOrCreateClientId();
      const sessionId = await this.sessionManager.getOrCreateSessionId();

      // Build event data
      const eventData = this._buildEventData(eventName, parameters, clientId, sessionId, options);

      // Validate event data
      if (!this._validateEventData(eventData)) {
        this._logEventDetails(eventName, parameters, {
          status: 'validation_failed',
          clientId,
          sessionId,
          error: new Error('Event data validation failed'),
        });
        return false;
      }

      // If skipSending is true (for testing), just validate and return
      if (options.skipSending) {
        this._logEventDetails(eventName, parameters, {
          status: 'success',
          clientId,
          sessionId,
          note: 'validation_only_mode',
        });
        return true;
      }

      // Add to queue with enhanced logging
      this._addToQueue(eventData);

      // Trigger real-time validation in development mode (non-blocking)
      if (this.debugMode && options.enableRealTimeValidation !== false) {
        this._performRealTimeValidation(eventName, parameters, {
          clientId,
          sessionId,
          ...options,
        });
      }

      this._logEventDetails(eventName, parameters, {
        status: 'queued',
        clientId,
        sessionId,
        queueSize: this.eventQueue.length,
        timing: { duration: Date.now() - startTime },
      });

      // Process queue if needed
      this._scheduleFlush();

      // Final success logging
      this._logEventDetails(eventName, parameters, {
        status: 'success',
        clientId,
        sessionId,
        queueSize: this.eventQueue.length,
        timing: { duration: Date.now() - startTime },
      });

      return true;
    } catch (error) {
      this._logEventDetails(eventName, parameters, {
        status: 'error',
        error: error,
        timing: { duration: Date.now() - startTime },
      });
      return false;
    }
  }

  /**
   * Track a page view event
   * @param {Object} pageData - Page information
   * @param {Object} options - Tracking options
   * @returns {Promise<boolean>} Success status
   */
  async trackPageView(pageData = {}, options = {}) {
    const parameters = {
      page_title:
        pageData.title ||
        (typeof document !== 'undefined' ? document.title : null) ||
        'Unknown Page',
      page_location:
        pageData.url ||
        (typeof window !== 'undefined' ? window.location?.href : null) ||
        'chrome-extension://unknown',
      page_referrer:
        pageData.referrer || (typeof document !== 'undefined' ? document.referrer : null) || '',
      ...pageData.customParameters,
    };

    return this.trackEvent('page_view', parameters, options);
  }

  /**
   * Track a search event
   * @param {Object} searchData - Search information
   * @param {Object} options - Tracking options
   * @returns {Promise<boolean>} Success status
   */
  async trackSearch(searchData = {}, options = {}) {
    const parameters = {
      search_term: searchData.query || '',
      search_results: searchData.results_count || 0,
      search_category: searchData.category || 'general',
      search_type: searchData.type || 'text',
      ...searchData.customParameters,
    };

    return this.trackEvent('search', parameters, options);
  }

  /**
   * Track a user engagement event
   * @param {Object} engagementData - Engagement information
   * @param {Object} options - Tracking options
   * @returns {Promise<boolean>} Success status
   */
  async trackEngagement(engagementData = {}, options = {}) {
    const parameters = {
      engagement_time_msec: engagementData.duration || 0,
      engagement_type: engagementData.type || 'interaction',
      engagement_value: engagementData.value || 1,
      ...engagementData.customParameters,
    };

    return this.trackEvent('custom_user_engagement', parameters, options);
  }

  /**
   * Track a conversion event
   * @param {Object} conversionData - Conversion information
   * @param {Object} options - Tracking options
   * @returns {Promise<boolean>} Success status
   */
  async trackConversion(conversionData = {}, options = {}) {
    const parameters = {
      conversion_id: conversionData.id || '',
      conversion_value: conversionData.value || 0,
      conversion_currency: conversionData.currency || 'USD',
      conversion_type: conversionData.type || 'goal',
      ...conversionData.customParameters,
    };

    return this.trackEvent('conversion', parameters, options);
  }

  /**
   * Track an error event
   * @param {Object} errorData - Error information
   * @param {Object} options - Tracking options
   * @returns {Promise<boolean>} Success status
   */
  async trackError(errorData = {}, options = {}) {
    const parameters = {
      error_message: errorData.message || 'Unknown error',
      error_code: errorData.code || 'unknown',
      error_category: errorData.category || 'general',
      error_severity: errorData.severity || 'error',
      error_stack: errorData.stack?.substring(0, 1000) || '', // Limit stack trace length
      ...errorData.customParameters,
    };

    return this.trackEvent('error', parameters, options);
  }

  /**
   * Flush all queued events immediately
   * @returns {Promise<boolean>} Success status
   */
  async flush() {
    if (this.eventQueue.length === 0) {
      this._logQueueStatus('flush_requested', {
        result: 'no_events_to_flush',
      });
      return true;
    }

    const startTime = Date.now();
    const initialQueueSize = this.eventQueue.length;

    this._logQueueStatus('flush_requested', {
      eventsToFlush: initialQueueSize,
      immediate: true,
    });

    try {
      await this._processQueue();
      const success = this.eventQueue.length === 0;

      this._logPerformance('manual_flush', startTime, {
        initialEvents: initialQueueSize,
        remainingEvents: this.eventQueue.length,
        success: success,
      });

      return success;
    } catch (error) {
      this._logEventDetails(
        'manual_flush',
        {},
        {
          status: 'error',
          error: error,
          timing: { duration: Date.now() - startTime },
          initialQueueSize: initialQueueSize,
          remainingQueueSize: this.eventQueue.length,
        }
      );
      return false;
    }
  }

  /**
   * Clear the event queue
   */
  clearQueue() {
    this.eventQueue = [];
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this._log('Event queue cleared');
  }

  /**
   * Get current queue status
   * @returns {Object} Queue information
   */
  getQueueStatus() {
    return {
      queueSize: this.eventQueue.length,
      maxQueueSize: this.maxQueueSize,
      isProcessing: this.isProcessing,
      batchSize: this.batchSize,
    };
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Debug mode state
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this._log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Calculate appropriate engagement time for event type
   * @private
   * @param {string} eventName - Event name
   * @param {Object} parameters - Event parameters
   * @returns {number} Engagement time in milliseconds
   */
  _calculateEngagementTime(eventName, parameters) {
    // If explicitly provided, use that value
    if (parameters.engagement_time_msec && typeof parameters.engagement_time_msec === 'number') {
      return Math.max(1, Math.min(parameters.engagement_time_msec, 86400000)); // Cap at 24 hours
    }

    // Calculate based on event type and context
    switch (eventName) {
      case 'page_view':
        return 1000; // 1 second for page views

      case 'prompt_view':
      case 'select_content':
        return parameters.view_duration_ms || 2000; // Use actual view duration or 2 seconds

      case 'prompt_copy':
        return 500; // Quick action

      case 'search':
        return parameters.search_duration_ms || 1500; // Use search duration or 1.5 seconds

      case 'favorite_action':
      case 'rating_action':
        return 300; // Quick interactions

      case 'prompt_create':
      case 'prompt_edit':
        return parameters.creation_time_ms || 10000; // Use creation time or 10 seconds

      case 'login':
      case 'sign_up':
        return parameters.form_completion_time_ms || 5000; // Use form time or 5 seconds

      case 'funnel_registration':
      case 'funnel_onboarding':
        return parameters.time_spent_ms || 3000; // Use time spent or 3 seconds

      case 'error':
        return 100; // Minimal for errors

      default:
        return 1000; // Default 1 second for unknown events
    }
  }

  /**
   * Build event data for GA4 Measurement Protocol
   * @private
   * @param {string} eventName - Event name
   * @param {Object} parameters - Event parameters
   * @param {string} clientId - Client ID
   * @param {string} sessionId - Session ID
   * @param {Object} options - Options
   * @returns {Object} Event data
   */
  _buildEventData(eventName, parameters, clientId, sessionId, options) {
    const timestamp = Date.now();

    // Ensure session_id is always present and valid
    const validSessionId = sessionId || 'session_' + Date.now();

    // Calculate appropriate engagement time
    const engagementTime = this._calculateEngagementTime(eventName, parameters);

    return {
      client_id: clientId,
      timestamp_micros: timestamp * 1000, // Convert to microseconds
      user_properties: options.userProperties || {},
      events: [
        {
          name: eventName,
          params: {
            session_id: validSessionId,
            engagement_time_msec: engagementTime,
            ...this._sanitizeParameters(parameters),
            ...options.eventParameters,
          },
        },
      ],
      // Add non-personalized ads flag for privacy
      non_personalized_ads: true,
    };
  }

  /**
   * Validate event name according to GA4 requirements
   * @private
   * @param {string} eventName - Event name to validate
   * @returns {boolean} Is valid
   */
  _isValidEventName(eventName) {
    if (!eventName || typeof eventName !== 'string') {
      return false;
    }

    // GA4 event name requirements:
    // - Must be 40 characters or fewer
    // - Can only contain letters, numbers, and underscores
    // - Must start with a letter
    const eventNameRegex = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
    return eventNameRegex.test(eventName);
  }

  /**
   * Sanitize event parameters for GA4
   * @private
   * @param {Object} parameters - Raw parameters
   * @returns {Object} Sanitized parameters
   */
  _sanitizeParameters(parameters) {
    const sanitized = {};

    for (const [key, value] of Object.entries(parameters)) {
      // Validate parameter name
      if (!this._isValidParameterName(key)) {
        this._log(`Invalid parameter name skipped: ${key}`);
        continue;
      }

      // Sanitize parameter value
      const sanitizedValue = this._sanitizeParameterValue(value);
      if (sanitizedValue !== null) {
        sanitized[key] = sanitizedValue;
      }
    }

    return sanitized;
  }

  /**
   * Validate parameter name according to GA4 requirements
   * @private
   * @param {string} paramName - Parameter name
   * @returns {boolean} Is valid
   */
  _isValidParameterName(paramName) {
    if (!paramName || typeof paramName !== 'string') {
      return false;
    }

    // GA4 parameter name requirements:
    // - Must be 40 characters or fewer
    // - Can only contain letters, numbers, and underscores
    // - Must start with a letter
    const paramNameRegex = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
    return paramNameRegex.test(paramName);
  }

  /**
   * Sanitize parameter value for GA4
   * @private
   * @param {any} value - Parameter value
   * @returns {any} Sanitized value or null if invalid
   */
  _sanitizeParameterValue(value) {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      // Truncate strings to 100 characters max
      return value.substring(0, 100);
    }

    if (typeof value === 'number') {
      // Ensure number is finite
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    // Convert other types to string and truncate
    return String(value).substring(0, 100);
  }

  /**
   * Validate complete event data
   * @private
   * @param {Object} eventData - Event data to validate
   * @returns {boolean} Is valid
   */
  _validateEventData(eventData) {
    // Check required fields
    if (!eventData.client_id || !eventData.events || !Array.isArray(eventData.events)) {
      this._log('Event validation failed: Missing client_id or events array');
      return false;
    }

    // Check events array
    if (eventData.events.length === 0) {
      this._log('Event validation failed: Empty events array');
      return false;
    }

    // Validate each event
    for (const event of eventData.events) {
      if (!event.name || !this._isValidEventName(event.name)) {
        this._log(`Event validation failed: Invalid event name '${event.name}'`);
        return false;
      }

      // Validate GA4 required parameters
      if (!this._validateGA4RequiredParams(event)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate GA4 required parameters (session_id and engagement_time_msec)
   * @private
   * @param {Object} event - Event object
   * @returns {boolean} Is valid
   */
  _validateGA4RequiredParams(event) {
    const params = event.params || {};

    // Validate session_id
    if (!params.session_id || typeof params.session_id !== 'string') {
      this._log(`GA4 validation failed: Missing or invalid session_id for event '${event.name}'`);
      return false;
    }

    // Validate engagement_time_msec
    if (params.engagement_time_msec === undefined || params.engagement_time_msec === null) {
      this._log(`GA4 validation failed: Missing engagement_time_msec for event '${event.name}'`);
      return false;
    }

    if (typeof params.engagement_time_msec !== 'number' || params.engagement_time_msec < 1) {
      this._log(
        `GA4 validation failed: Invalid engagement_time_msec (${params.engagement_time_msec}) for event '${event.name}'`
      );
      return false;
    }

    return true;
  }

  /**
   * Add event to queue
   * @private
   * @param {Object} eventData - Event data
   */
  _addToQueue(eventData) {
    // Remove oldest events if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      const removed = this.eventQueue.splice(0, this.eventQueue.length - this.maxQueueSize + 1);
      this._logQueueStatus('queue_full', {
        removedEvents: removed.length,
        remainingEvents: this.eventQueue.length,
      });
    }

    this.eventQueue.push(eventData);

    // Enhanced queue logging
    this._logQueueStatus('event_added', {
      newQueueSize: this.eventQueue.length,
      utilization: Math.round((this.eventQueue.length / this.maxQueueSize) * 100),
    });
  }

  /**
   * Schedule a queue flush
   * @private
   */
  _scheduleFlush() {
    // Flush immediately if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this._logQueueStatus('batch_ready', {
        batchSize: this.batchSize,
        immediate: true,
      });
      setTimeout(() => this._processQueue(), 0);
      return;
    }

    // Schedule flush if not already scheduled
    if (!this.flushTimer) {
      this._logQueueStatus('flush_scheduled', {
        timeout: this.flushTimeout,
        currentQueueSize: this.eventQueue.length,
      });

      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        this._processQueue();
      }, this.flushTimeout);
    }
  }

  /**
   * Process the event queue
   * @private
   * @returns {Promise<void>}
   */
  async _processQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    const startTime = Date.now();
    this.isProcessing = true;

    try {
      this._logQueueStatus('processing_started', {
        totalEvents: this.eventQueue.length,
      });

      // Clear flush timer
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }

      let processedBatches = 0;
      let totalProcessedEvents = 0;

      // Process events in batches
      while (this.eventQueue.length > 0) {
        const batchSize = Math.min(this.batchSize, this.eventQueue.length);
        const batch = this.eventQueue.splice(0, batchSize);

        processedBatches++;
        totalProcessedEvents += batch.length;

        this._logEventDetails(
          'batch_processing',
          {},
          {
            status: 'batch_sending',
            batchSize: batch.length,
            batchNumber: processedBatches,
            queueSize: this.eventQueue.length,
          }
        );

        // Send batch to GA4 with timing
        const batchStartTime = Date.now();
        await this._sendEventBatch(batch);

        this._logPerformance(`batch_${processedBatches}_send`, batchStartTime, {
          batchSize: batch.length,
          eventsRemaining: this.eventQueue.length,
        });
      }

      this._logQueueStatus('processing_completed', {
        processedBatches,
        totalProcessedEvents,
        processingDuration: Date.now() - startTime,
      });

      this._logPerformance('queue_processing', startTime, {
        batches: processedBatches,
        events: totalProcessedEvents,
      });
    } catch (error) {
      this._logEventDetails(
        'queue_processing',
        {},
        {
          status: 'error',
          error: error,
          timing: { duration: Date.now() - startTime },
        }
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send a batch of events to GA4
   * @private
   * @param {Array} events - Events to send
   * @returns {Promise<void>}
   */
  async _sendEventBatch(events) {
    let successCount = 0;
    let failureCount = 0;

    for (const [index, eventData] of events.entries()) {
      const eventStartTime = Date.now();

      try {
        // Extract the first event from the eventData structure
        const event = eventData.events && eventData.events[0];
        if (!event) {
          this._logEventDetails(
            'batch_event',
            {},
            {
              status: 'error',
              error: new Error('Invalid event data structure'),
              batchIndex: index + 1,
              batchTotal: events.length,
            }
          );
          failureCount++;
          continue;
        }

        // Call the correct method with proper parameters
        const success = await this.analyticsService.sendEvent(event, {
          clientId: eventData.client_id,
          sessionId: event.params?.session_id,
          userProperties: eventData.user_properties,
        });

        if (success) {
          successCount++;
          this._logEventDetails(event.name, event.params, {
            status: 'success',
            clientId: eventData.client_id,
            sessionId: event.params?.session_id,
            batchIndex: index + 1,
            batchTotal: events.length,
            timing: { duration: Date.now() - eventStartTime },
          });
        } else {
          failureCount++;
          this._logEventDetails(event.name, event.params, {
            status: 'error',
            error: new Error('Analytics service returned false'),
            clientId: eventData.client_id,
            sessionId: event.params?.session_id,
            batchIndex: index + 1,
            batchTotal: events.length,
            timing: { duration: Date.now() - eventStartTime },
          });
        }
      } catch (error) {
        failureCount++;
        this._logEventDetails(
          'batch_event',
          {},
          {
            status: 'error',
            error: error,
            batchIndex: index + 1,
            batchTotal: events.length,
            timing: { duration: Date.now() - eventStartTime },
          }
        );
      }
    }

    // Log batch summary
    this._logQueueStatus('batch_completed', {
      totalEvents: events.length,
      successCount: successCount,
      failureCount: failureCount,
      successRate: Math.round((successCount / events.length) * 100),
    });
  }

  /**
   * Log debug messages
   * @private
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  _log(message, ...args) {
    if (this.debugMode && typeof console !== 'undefined' && console.log) {
      console.log(`[GA4 Event Tracker] ${message}`, ...args);
    }
  }

  /**
   * Enhanced development mode event logging
   * @private
   * @param {string} eventName - Event name being tracked
   * @param {Object} parameters - Event parameters
   * @param {Object} context - Additional context for logging
   */
  _logEventDetails(eventName, parameters, context = {}) {
    if (!this.debugMode) return;

    const {
      status = 'processing',
      clientId = 'unknown',
      sessionId = 'unknown',
      queueSize = 0,
      validationResult = null,
      timing = {},
      error = null,
    } = context;

    // Create structured log entry
    const logEntry = {
      event: eventName,
      status: status,
      timestamp: new Date().toISOString(),
      context: {
        clientId: clientId.substring(0, 8) + '...', // Truncate for privacy
        sessionId: sessionId.substring(0, 8) + '...',
        queueSize: queueSize,
        debugMode: this.debugMode,
      },
      parameters: this._sanitizeParametersForLogging(parameters),
      ...(timing.duration && { duration_ms: timing.duration }),
      ...(validationResult && { validation: validationResult }),
      ...(error && { error: error.message }),
    };

    // Choose appropriate console method based on status
    switch (status) {
      case 'success':
        console.log(`🟢 [GA4 Event Tracker] Event '${eventName}' tracked successfully`, logEntry);
        break;
      case 'queued':
        console.log(`🟡 [GA4 Event Tracker] Event '${eventName}' added to queue`, logEntry);
        break;
      case 'error':
        console.error(`🔴 [GA4 Event Tracker] Event '${eventName}' failed`, logEntry);
        break;
      case 'validation_failed':
        console.warn(`⚠️ [GA4 Event Tracker] Event '${eventName}' validation failed`, logEntry);
        break;
      case 'batch_sending':
        console.log(
          `📤 [GA4 Event Tracker] Sending batch of ${context.batchSize} events`,
          logEntry
        );
        break;
      case 'queue_processing':
        console.log(`⚙️ [GA4 Event Tracker] Processing queue (${queueSize} events)`, logEntry);
        break;
      case 'realtime_validation_started':
        console.log(
          `🔍 [GA4 Event Tracker] Event '${eventName}' real-time validation started`,
          logEntry
        );
        break;
      default:
        console.log(`[GA4 Event Tracker] ${eventName}`, logEntry);
    }
  }

  /**
   * Sanitize parameters for logging (remove sensitive data, truncate long values)
   * @private
   * @param {Object} parameters - Parameters to sanitize
   * @returns {Object} Sanitized parameters
   */
  _sanitizeParametersForLogging(parameters) {
    const sanitized = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];

    for (const [key, value] of Object.entries(parameters)) {
      // Check for sensitive keys
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Truncate long strings for readability
      if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...';
      } else if (typeof value === 'object' && value !== null) {
        // Limit object depth to prevent overwhelming output
        sanitized[key] = JSON.stringify(value).substring(0, 200);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Log queue status changes in development mode
   * @private
   * @param {string} action - Action being performed on queue
   * @param {Object} details - Additional details
   */
  _logQueueStatus(action, details = {}) {
    if (!this.debugMode) return;

    const queueInfo = {
      action: action,
      queueSize: this.eventQueue.length,
      maxQueueSize: this.maxQueueSize,
      isProcessing: this.isProcessing,
      timestamp: new Date().toISOString(),
      ...details,
    };

    switch (action) {
      case 'queue_full':
        console.warn(`⚠️ [GA4 Event Tracker] Queue full, removing oldest events`, queueInfo);
        break;
      case 'batch_ready':
        console.log(`📋 [GA4 Event Tracker] Batch ready for processing`, queueInfo);
        break;
      case 'processing_started':
        console.log(`▶️ [GA4 Event Tracker] Queue processing started`, queueInfo);
        break;
      case 'processing_completed':
        console.log(`✅ [GA4 Event Tracker] Queue processing completed`, queueInfo);
        break;
      case 'flush_scheduled':
        console.log(`⏰ [GA4 Event Tracker] Flush scheduled in ${details.timeout}ms`, queueInfo);
        break;
      default:
        console.log(`[GA4 Event Tracker] Queue ${action}`, queueInfo);
    }
  }

  /**
   * Log performance metrics for event processing
   * @private
   * @param {string} operation - Operation being measured
   * @param {number} startTime - Start time in milliseconds
   * @param {Object} context - Additional context
   */
  _logPerformance(operation, startTime, context = {}) {
    if (!this.debugMode) return;

    const duration = Date.now() - startTime;
    const perfInfo = {
      operation: operation,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (duration > 1000) {
      console.warn(
        `🐌 [GA4 Event Tracker] Slow operation: ${operation} took ${duration}ms`,
        perfInfo
      );
    } else if (duration > 100) {
      console.log(`⏱️ [GA4 Event Tracker] ${operation} completed in ${duration}ms`, perfInfo);
    } else {
      console.log(
        `⚡ [GA4 Event Tracker] ${operation} completed quickly (${duration}ms)`,
        perfInfo
      );
    }
  }

  /**
   * Perform real-time validation for an event (non-blocking)
   * @private
   * @param {string} eventName - Event name
   * @param {Object} parameters - Event parameters
   * @param {Object} options - Validation options
   */
  _performRealTimeValidation(eventName, parameters, options = {}) {
    if (!this.debugMode) return;

    try {
      // Create event object for validation
      const event = {
        name: eventName,
        params: {
          ...parameters,
          engagement_time_msec: this._calculateEngagementTime(eventName, parameters),
        },
      };

      // Use analytics service for real-time validation
      this.analyticsService.performRealTimeValidation(event, options).catch(error => {
        // Log validation errors but don't interrupt main flow
        console.warn(`[GA4 Event Tracker] Real-time validation failed for '${eventName}':`, error);
      });

      // Log that real-time validation was triggered
      this._logEventDetails(eventName, parameters, {
        status: 'realtime_validation_started',
        clientId: options.clientId,
        sessionId: options.sessionId,
        note: 'background_validation',
      });
    } catch (error) {
      // Don't let validation errors affect main event tracking
      console.warn(
        `[GA4 Event Tracker] Failed to start real-time validation for '${eventName}':`,
        error
      );
    }
  }

  /**
   * Enable real-time validation for all future events
   * @param {boolean} enabled - Whether to enable real-time validation
   */
  setRealTimeValidation(enabled) {
    this.realTimeValidationEnabled = enabled;

    if (this.debugMode) {
      const status = enabled ? 'enabled' : 'disabled';
      console.log(`[GA4 Event Tracker] Real-time validation ${status}`);
    }
  }

  /**
   * Validate multiple events in batch using real-time validation
   * @param {Array<Object>} events - Array of events to validate
   * @returns {Promise<Array<Object>>} Validation results
   */
  async batchValidateEvents(events) {
    if (!this.debugMode) {
      return events.map(event => ({
        event: event.name || 'unknown',
        valid: true,
        message: 'Real-time validation disabled',
      }));
    }

    const startTime = Date.now();

    try {
      // Convert event tracker format to analytics service format
      const formattedEvents = events.map(event => ({
        name: event.name,
        params: {
          ...event.params,
          engagement_time_msec:
            event.params?.engagement_time_msec ||
            this._calculateEngagementTime(event.name, event.params),
        },
      }));

      // Use analytics service batch validation
      const results = await this.analyticsService.batchValidateEvents(formattedEvents);

      this._logPerformance('batch_validation', startTime, {
        eventCount: events.length,
        resultsCount: results.length,
      });

      return results;
    } catch (error) {
      console.error('[GA4 Event Tracker] Batch validation failed:', error);
      return events.map(event => ({
        event: event.name || 'unknown',
        valid: false,
        error: error.message,
      }));
    }
  }

  /**
   * Get real-time validation statistics
   * @returns {Object} Validation statistics
   */
  getRealTimeValidationStats() {
    const baseStats = this.analyticsService.getRealTimeValidationStats();

    return {
      ...baseStats,
      eventTracker: {
        realTimeValidationEnabled: this.realTimeValidationEnabled !== false,
        debugMode: this.debugMode,
        automaticValidation: this.debugMode,
        queueSize: this.eventQueue.length,
        maxQueueSize: this.maxQueueSize,
      },
    };
  }

  /**
   * Test real-time validation connectivity
   * @returns {Promise<Object>} Test result
   */
  async testRealTimeValidation() {
    if (!this.debugMode) {
      return {
        success: false,
        message: 'Real-time validation requires debug mode to be enabled',
      };
    }

    const testEvent = {
      name: 'real_time_validation_test',
      params: {
        test_parameter: 'connectivity_test',
        engagement_time_msec: 100,
      },
    };

    try {
      const startTime = Date.now();

      // Test using analytics service
      const result = await this.analyticsService.validateEvent(testEvent, {
        clientId: 'test_client_rt_validation',
        sessionId: 'test_session_rt_validation',
      });

      const duration = Date.now() - startTime;

      const testResult = {
        success: result.valid !== undefined,
        valid: result.valid,
        duration: duration,
        endpoint: 'debug',
        validationMessages: result.validationMessages || [],
        error: result.error,
      };

      // Log test result
      if (testResult.success) {
        console.log('✅ [GA4 Event Tracker] Real-time validation test passed', testResult);
      } else {
        console.error('❌ [GA4 Event Tracker] Real-time validation test failed', testResult);
      }

      return testResult;
    } catch (error) {
      const testResult = {
        success: false,
        error: error.message,
        duration: 0,
      };

      console.error('❌ [GA4 Event Tracker] Real-time validation test failed', testResult);
      return testResult;
    }
  }
}

// Create and export singleton instance
const eventTracker = new EventTracker();

export { EventTracker };
export default eventTracker;
