/**
 * Service Worker Analytics Integration
 * Handles analytics events in the service worker environment following Chrome extension best practices
 *
 * Key Principles from Chrome Extension Documentation:
 * 1. Event listeners must be registered synchronously at the top level
 * 2. Use chrome.storage instead of global variables (service workers are ephemeral)
 * 3. Use fetch() instead of XMLHttpRequest()
 * 4. Handle service worker lifecycle events properly
 * 5. Prepare for unexpected termination
 */

import { eventTracker } from './event-tracker.js';
import { promiseRejectionTracker } from './promise-rejection-tracker.js';
// import { TextConstants } from '../text-constants.js'; // Unused

/**
 * Service Worker Analytics Manager
 * Manages analytics tracking in the service worker environment
 */
class ServiceWorkerAnalytics {
  constructor() {
    this.isInitialized = false;
    this.pendingEvents = [];

    // Initialize immediately
    this.initialize();
  }

  /**
   * Initialize service worker analytics
   * Must be called synchronously at module load
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Track service worker startup
      await this.trackServiceWorkerEvent('service_worker_startup', {
        timestamp: Date.now(),
        version: chrome.runtime.getManifest().version,
      });

      this.isInitialized = true;

      // Process any pending events
      await this.processPendingEvents();
    } catch (error) {
      console.error('[Service Worker Analytics] Initialization failed:', error);
      // Store in pending events for retry
      this.pendingEvents.push({
        name: 'service_worker_init_error',
        params: { error: error.message },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Track service worker lifecycle events
   * @param {string} eventName - The lifecycle event name
   * @param {Object} params - Additional event parameters
   */
  async trackServiceWorkerEvent(eventName, params = {}) {
    if (!this.isInitialized) {
      this.pendingEvents.push({ name: eventName, params, timestamp: Date.now() });
      return false;
    }

    try {
      const serviceWorkerParams = {
        ...params,
        sw_event_type: eventName,
        sw_lifetime: await this.getServiceWorkerLifetime(),
        sw_session_count: await this.getSessionCount(),
        user_agent: navigator.userAgent,
      };

      return await eventTracker.trackEvent(eventName, serviceWorkerParams);
    } catch (error) {
      console.error(`[Service Worker Analytics] Failed to track ${eventName}:`, error);
      return false;
    }
  }

  /**
   * Track extension installation events
   * @param {Object} details - Installation details from chrome.runtime.onInstalled
   */
  async trackInstallation(details) {
    const installParams = {
      reason: details.reason,
      previous_version: details.previousVersion || 'none',
      current_version: chrome.runtime.getManifest().version,
      installation_time: Date.now(),
    };

    if (details.reason === 'install') {
      // Store installation date for user property tracking
      await chrome.storage.local.set({
        installation_date: Date.now(),
        install_source: 'chrome_web_store', // Default assumption
      });

      return await this.trackServiceWorkerEvent('extension_installed', installParams);
    } else if (details.reason === 'update') {
      return await this.trackServiceWorkerEvent('extension_updated', installParams);
    }

    return false;
  }

  /**
   * Track unhandled promise rejections in service worker
   * @param {PromiseRejectionEvent} event - The rejection event
   * @deprecated Use promiseRejectionTracker.handleUnhandledRejection instead
   */
  async trackUnhandledRejection(event) {
    // Delegate to the comprehensive promise rejection tracker
    return await promiseRejectionTracker.handleUnhandledRejection(event);
  }

  /**
   * Track service worker termination preparation
   */
  async trackTerminationPreparation() {
    const terminationParams = {
      sw_lifetime: await this.getServiceWorkerLifetime(),
      pending_events_count: this.pendingEvents.length,
      termination_reason: 'natural_timeout',
      timestamp: Date.now(),
    };

    return await this.trackServiceWorkerEvent('service_worker_termination', terminationParams);
  }

  /**
   * Track performance timing for service worker operations
   * @param {string} operation - Operation name
   * @param {number} startTime - Operation start time
   * @param {number} endTime - Operation end time
   */
  async trackPerformanceTiming(operation, startTime, endTime) {
    const duration = endTime - startTime;

    const timingParams = {
      operation_name: operation,
      duration_ms: duration,
      start_time: startTime,
      end_time: endTime,
      sw_context: 'service_worker',
    };

    return await eventTracker.trackTiming('service_worker_timing', timingParams, {
      name: operation,
      value: duration,
    });
  }

  /**
   * Track Chrome API usage in service worker
   * @param {string} apiName - The Chrome API being used
   * @param {string} method - The specific method called
   * @param {boolean} success - Whether the call was successful
   */
  async trackChromeApiUsage(apiName, method, success = true) {
    const apiParams = {
      api_name: apiName,
      api_method: method,
      api_success: success,
      sw_context: 'service_worker',
      timestamp: Date.now(),
    };

    return await this.trackServiceWorkerEvent('chrome_api_usage', apiParams);
  }

  /**
   * Process pending events (called after initialization or on retry)
   */
  async processPendingEvents() {
    if (this.pendingEvents.length === 0) return;

    const eventsToProcess = [...this.pendingEvents];
    this.pendingEvents = [];

    for (const event of eventsToProcess) {
      try {
        await this.trackServiceWorkerEvent(event.name, {
          ...event.params,
          was_pending: true,
          pending_delay_ms: Date.now() - event.timestamp,
        });
      } catch (error) {
        console.error('[Service Worker Analytics] Failed to process pending event:', error);
        // Re-add to pending if still failing
        this.pendingEvents.push(event);
      }
    }
  }

  /**
   * Get service worker lifetime (time since startup)
   */
  async getServiceWorkerLifetime() {
    try {
      const result = await chrome.storage.local.get(['sw_startup_time']);
      const startupTime = result.sw_startup_time || Date.now();

      if (!result.sw_startup_time) {
        await chrome.storage.local.set({ sw_startup_time: startupTime });
      }

      return Date.now() - startupTime;
    } catch (error) {
      console.error('[Service Worker Analytics] Failed to get lifetime:', error);
      return 0;
    }
  }

  /**
   * Get session count for this service worker instance
   */
  async getSessionCount() {
    try {
      const result = await chrome.storage.local.get(['sw_session_count']);
      const currentCount = (result.sw_session_count || 0) + 1;

      await chrome.storage.local.set({ sw_session_count: currentCount });
      return currentCount;
    } catch (error) {
      console.error('[Service Worker Analytics] Failed to get session count:', error);
      return 1;
    }
  }

  /**
   * Sanitize error messages to remove sensitive information
   * @param {string} message - Raw error message
   * @returns {string} Sanitized message
   */
  sanitizeErrorMessage(message) {
    if (!message || typeof message !== 'string') return 'Unknown error';

    // Remove potential file paths, URLs, and personal information
    return message
      .replace(/(?:file|chrome-extension):\/\/[^\s]+/g, '[FILE_PATH]')
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
      .substring(0, 200); // Limit length
  }

  /**
   * Sanitize stack traces to remove sensitive paths
   * @param {string} stack - Raw stack trace
   * @returns {string} Sanitized stack trace
   */
  sanitizeStackTrace(stack) {
    if (!stack || typeof stack !== 'string') return '';

    return stack
      .split('\n')
      .slice(0, 5) // Limit to first 5 lines
      .map(line => line.replace(/(?:file|chrome-extension):\/\/[^\s]+/g, '[FILE_PATH]'))
      .join('\n')
      .substring(0, 500); // Limit total length
  }

  /**
   * Get current status of service worker analytics
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pendingEventsCount: this.pendingEvents.length,
      version: chrome.runtime.getManifest().version,
    };
  }

  /**
   * Flush any remaining events before service worker termination
   */
  async flush() {
    try {
      await this.processPendingEvents();
      await eventTracker.flush();
      return true;
    } catch (error) {
      console.error('[Service Worker Analytics] Flush failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const serviceWorkerAnalytics = new ServiceWorkerAnalytics();

// Register event listeners at the top level (Chrome extension requirement)
// These must be registered synchronously when the module loads

// Service Worker Installation Event Listener
chrome.runtime.onInstalled.addListener(async details => {
  try {
    await serviceWorkerAnalytics.trackInstallation(details);
  } catch (error) {
    console.error('[Service Worker Analytics] Installation tracking failed:', error);
  }
});

// Service Worker Startup Event Listener
chrome.runtime.onStartup.addListener(async () => {
  try {
    await serviceWorkerAnalytics.trackServiceWorkerEvent('extension_startup', {
      startup_reason: 'browser_restart',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Service Worker Analytics] Startup tracking failed:', error);
  }
});

// Unhandled Promise Rejection Listener
// Note: promiseRejectionTracker automatically handles this when imported
// This listener is kept for backwards compatibility and additional logging
self.addEventListener('unhandledrejection', async event => {
  try {
    // Log service worker specific context
    console.error('[Service Worker Analytics] Unhandled promise rejection detected:', {
      reason: event.reason,
      promise: event.promise,
      timestamp: Date.now(),
    });

    // The promiseRejectionTracker will handle the actual tracking
    // This ensures consistent tracking across all contexts
  } catch (error) {
    console.error('[Service Worker Analytics] Rejection logging failed:', error);
  }
});

// Service Worker Error Listener
self.addEventListener('error', async event => {
  try {
    const errorParams = {
      error_type: 'service_worker_error',
      error_message: serviceWorkerAnalytics.sanitizeErrorMessage(event.message),
      error_filename: event.filename?.replace(
        /(?:file|chrome-extension):\/\/[^\s]+/g,
        '[FILE_PATH]'
      ),
      error_line: event.lineno,
      error_column: event.colno,
      sw_context: 'service_worker',
      timestamp: Date.now(),
    };

    await serviceWorkerAnalytics.trackServiceWorkerEvent('extension_error', errorParams);
  } catch (error) {
    console.error('[Service Worker Analytics] Error tracking failed:', error);
  }
});

// Export the analytics instance
export { serviceWorkerAnalytics };
export default serviceWorkerAnalytics;
