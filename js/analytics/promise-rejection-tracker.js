/**
 * Unhandled Promise Rejection Tracker
 * Comprehensive tracking of unhandled promise rejections across all extension contexts
 *
 * Handles rejection tracking in:
 * - Service Worker context
 * - Content Script context
 * - Popup/Options page context
 * - Background script context (if any)
 */

import eventTracker from './event-tracker.js';

/**
 * Promise Rejection Tracker Class
 * Manages unhandled promise rejection detection and reporting
 */
class PromiseRejectionTracker {
  constructor() {
    this.isInitialized = false;
    this.rejectionCount = 0;
    this.recentRejections = new Map(); // Store recent rejections to prevent duplicates
    this.maxRecentRejections = 10;
    this.duplicateTimeWindow = 5000; // 5 seconds to consider duplicates

    // Detect the current context
    this.context = this.detectContext();

    // Initialize tracking
    this.initialize();
  }

  /**
   * Detect the current execution context
   * @returns {string} The context type
   */
  detectContext() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
      return 'service_worker';
    } else if (typeof chrome !== 'undefined' && chrome.runtime && !chrome.runtime.onInstalled) {
      return 'content_script';
    } else if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.protocol === 'chrome-extension:'
    ) {
      return 'extension_page';
    } else if (typeof window !== 'undefined') {
      return 'web_page';
    } else {
      return 'unknown';
    }
  }

  /**
   * Initialize the tracker
   */
  initialize() {
    try {
      if (this.isInitialized) {
        return;
      }

      // Register unhandled rejection listener
      this.registerRejectionListener();

      // Register handled rejection listener (for when rejections are later handled)
      this.registerRejectionHandledListener();

      this.isInitialized = true;

      console.log(`[Promise Rejection Tracker] Initialized in ${this.context} context`);
    } catch (initError) {
      console.error('[Promise Rejection Tracker] Initialization failed:', initError);
    }
  }

  /**
   * Register the unhandled rejection event listener
   */
  registerRejectionListener() {
    const handleRejection = event => {
      this.handleUnhandledRejection(event);
    };

    if (typeof window !== 'undefined') {
      // Browser/popup/options context
      window.addEventListener('unhandledrejection', handleRejection);
    } else if (typeof self !== 'undefined') {
      // Service worker context
      self.addEventListener('unhandledrejection', handleRejection);
    }
  }

  /**
   * Register the rejection handled event listener
   */
  registerRejectionHandledListener() {
    const handleRejectionHandled = event => {
      this.handleRejectionHandled(event);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('rejectionhandled', handleRejectionHandled);
    } else if (typeof self !== 'undefined') {
      self.addEventListener('rejectionhandled', handleRejectionHandled);
    }
  }

  /**
   * Handle unhandled promise rejection
   * @param {PromiseRejectionEvent} event - The rejection event
   */
  async handleUnhandledRejection(event) {
    try {
      this.rejectionCount++;

      // Extract error information
      const errorInfo = this.extractErrorInfo(event.reason);

      // Check for duplicates
      const isDuplicate = this.isDuplicateRejection(errorInfo);

      if (isDuplicate) {
        console.log('[Promise Rejection Tracker] Duplicate rejection detected, skipping');
        return;
      }

      // Store this rejection to detect future duplicates
      this.storeRejection(errorInfo);

      // Create comprehensive error parameters
      const rejectionParams = {
        // Error details
        error_type: 'unhandled_promise_rejection',
        error_message: errorInfo.message,
        error_stack: errorInfo.stack,
        error_name: errorInfo.name,

        // Context information
        context: this.context,
        rejection_count: this.rejectionCount,

        // Timing information
        timestamp: Date.now(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',

        // Promise-specific details
        promise_rejection_reason: typeof event.reason,
        promise_handled: false,

        // Extension-specific details
        extension_version: this.getExtensionVersion(),
        page_url: this.getCurrentPageUrl(),

        // Browser state
        online_status: typeof navigator !== 'undefined' ? navigator.onLine : true,

        // Additional context based on environment
        ...this.getContextSpecificInfo(),
      };

      // Track the rejection
      await this.trackRejection(rejectionParams);

      // Log for debugging
      console.error('[Promise Rejection Tracker] Unhandled rejection:', {
        reason: event.reason,
        context: this.context,
        count: this.rejectionCount,
      });
    } catch (trackingError) {
      // Don't let tracking errors break the application
      console.error('[Promise Rejection Tracker] Failed to track rejection:', trackingError);
    }
  }

  /**
   * Handle when a previously unhandled rejection is later handled
   * @param {PromiseRejectionEvent} event - The rejection handled event
   */
  async handleRejectionHandled(event) {
    try {
      const errorInfo = this.extractErrorInfo(event.reason);

      const handledParams = {
        error_type: 'promise_rejection_handled',
        error_message: errorInfo.message,
        context: this.context,
        timestamp: Date.now(),
        original_rejection_was_tracked: true,
      };

      await this.trackRejection(handledParams);

      console.log('[Promise Rejection Tracker] Rejection was later handled:', event.reason);
    } catch (handlingError) {
      console.error(
        '[Promise Rejection Tracker] Failed to track handled rejection:',
        handlingError
      );
    }
  }

  /**
   * Extract error information from rejection reason
   * @param {any} reason - The rejection reason
   * @returns {Object} Structured error information
   */
  extractErrorInfo(reason) {
    if (reason instanceof Error) {
      return {
        message: this.sanitizeErrorMessage(reason.message),
        stack: this.sanitizeStackTrace(reason.stack),
        name: reason.name || 'Error',
      };
    } else if (typeof reason === 'string') {
      return {
        message: this.sanitizeErrorMessage(reason),
        stack: '',
        name: 'String',
      };
    } else if (typeof reason === 'object' && reason !== null) {
      return {
        message: this.sanitizeErrorMessage(reason.toString()),
        stack: this.sanitizeStackTrace(reason.stack || ''),
        name: reason.name || 'Object',
      };
    } else {
      return {
        message: this.sanitizeErrorMessage(String(reason)),
        stack: '',
        name: typeof reason,
      };
    }
  }

  /**
   * Check if this rejection is a duplicate of a recent one
   * @param {Object} errorInfo - Error information
   * @returns {boolean} True if duplicate
   */
  isDuplicateRejection(errorInfo) {
    const key = `${errorInfo.name}:${errorInfo.message}`;
    const now = Date.now();

    const existing = this.recentRejections.get(key);
    if (existing && now - existing.timestamp < this.duplicateTimeWindow) {
      existing.count++;
      return true;
    }

    return false;
  }

  /**
   * Store rejection info to detect duplicates
   * @param {Object} errorInfo - Error information
   */
  storeRejection(errorInfo) {
    const key = `${errorInfo.name}:${errorInfo.message}`;
    const now = Date.now();

    this.recentRejections.set(key, {
      timestamp: now,
      count: 1,
      errorInfo,
    });

    // Clean up old entries
    this.cleanupOldRejections(now);
  }

  /**
   * Clean up old rejection entries
   * @param {number} currentTime - Current timestamp
   */
  cleanupOldRejections(currentTime) {
    for (const [key, value] of this.recentRejections.entries()) {
      if (currentTime - value.timestamp > this.duplicateTimeWindow) {
        this.recentRejections.delete(key);
      }
    }

    // Also limit the total number of stored rejections
    if (this.recentRejections.size > this.maxRecentRejections) {
      const entries = Array.from(this.recentRejections.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest entries
      const toRemove = entries.slice(0, entries.length - this.maxRecentRejections);
      toRemove.forEach(([key]) => this.recentRejections.delete(key));
    }
  }

  /**
   * Get context-specific information
   * @returns {Object} Context-specific data
   */
  getContextSpecificInfo() {
    switch (this.context) {
      case 'service_worker':
        return {
          sw_registration_scope:
            typeof self !== 'undefined' && self.registration ? self.registration.scope : 'unknown',
          sw_state:
            typeof self !== 'undefined' && self.registration
              ? self.registration.active?.state
              : 'unknown',
        };

      case 'content_script':
        return {
          content_script_url: this.getCurrentPageUrl(),
          content_script_title: typeof document !== 'undefined' ? document.title : 'unknown',
          content_script_ready_state:
            typeof document !== 'undefined' ? document.readyState : 'unknown',
        };

      case 'extension_page':
        return {
          extension_page_url: this.getCurrentPageUrl(),
          extension_page_title: typeof document !== 'undefined' ? document.title : 'unknown',
        };

      default:
        return {};
    }
  }

  /**
   * Track the rejection using the analytics system
   * @param {Object} params - Rejection parameters
   */
  async trackRejection(params) {
    try {
      return await eventTracker.trackEvent('extension_error', params);
    } catch (trackingError) {
      console.error('[Promise Rejection Tracker] Analytics tracking failed:', trackingError);
      // Try to store in local storage as backup
      await this.storeRejectionLocally(params);
    }
  }

  /**
   * Store rejection locally as backup when analytics fails
   * @param {Object} params - Rejection parameters
   */
  async storeRejectionLocally(params) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const key = `rejection_backup_${Date.now()}`;
        await chrome.storage.local.set({ [key]: params });

        // Clean up old backup entries (keep only last 5)
        const result = await chrome.storage.local.get(null);
        const backupKeys = Object.keys(result).filter(k => k.startsWith('rejection_backup_'));

        if (backupKeys.length > 5) {
          const sortedKeys = backupKeys.sort();
          const toRemove = sortedKeys.slice(0, sortedKeys.length - 5);

          for (const key of toRemove) {
            await chrome.storage.local.remove(key);
          }
        }
      }
    } catch (storageError) {
      console.error('[Promise Rejection Tracker] Local storage backup failed:', storageError);
    }
  }

  /**
   * Get the current extension version
   * @returns {string} Extension version
   */
  getExtensionVersion() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
        return chrome.runtime.getManifest().version;
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get the current page URL
   * @returns {string} Current URL (sanitized)
   */
  getCurrentPageUrl() {
    try {
      if (typeof window !== 'undefined' && window.location) {
        // Remove query parameters and fragments for privacy
        return `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
      } else if (typeof self !== 'undefined' && self.location) {
        return `${self.location.protocol}//${self.location.host}${self.location.pathname}`;
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Sanitize error messages to remove sensitive information
   * @param {string} message - Raw error message
   * @returns {string} Sanitized message
   */
  sanitizeErrorMessage(message) {
    if (!message || typeof message !== 'string') return 'Unknown error';

    return message
      .replace(/(?:file|chrome-extension):\/\/[^\s]+/g, '[FILE_PATH]')
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_ADDRESS]')
      .substring(0, 300); // Limit length
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
      .slice(0, 8) // Limit to first 8 lines
      .map(line => line.replace(/(?:file|chrome-extension):\/\/[^\s]+/g, '[FILE_PATH]'))
      .map(line => line.replace(/https?:\/\/[^\s]+/g, '[URL]'))
      .join('\n')
      .substring(0, 800); // Limit total length
  }

  /**
   * Get current tracking statistics
   * @returns {Object} Current stats
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      context: this.context,
      rejectionCount: this.rejectionCount,
      recentRejectionsCount: this.recentRejections.size,
    };
  }

  /**
   * Manually track a custom promise rejection
   * @param {any} reason - The rejection reason
   * @param {string} source - Source identifier
   */
  async trackCustomRejection(reason, source = 'manual') {
    const customEvent = {
      reason,
      source,
      timestamp: Date.now(),
    };

    await this.handleUnhandledRejection(customEvent);
  }
}

// Create and export singleton instance
const promiseRejectionTracker = new PromiseRejectionTracker();

// Export the tracker instance
export { promiseRejectionTracker };
export default promiseRejectionTracker;
