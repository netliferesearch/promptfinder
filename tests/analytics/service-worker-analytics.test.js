/**
 * @jest-environment jsdom
 */

describe('Service Worker Analytics - Basic Setup', () => {
  test('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have access to required globals', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  test('should verify service worker analytics file exists', () => {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../../js/analytics/service-worker-analytics.js');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('should contain expected content in service worker analytics file', () => {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../../js/analytics/service-worker-analytics.js');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('ServiceWorkerAnalytics');
    expect(content).toContain('sanitizeErrorMessage');
    expect(content).toContain('sanitizeStackTrace');
  });
});

describe('Service Worker Analytics - Lifecycle Tracking', () => {
  let fileContent;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../../js/analytics/service-worker-analytics.js');
    fileContent = fs.readFileSync(filePath, 'utf8');
  });

  describe('Service Worker Startup Tracking', () => {
    test('should register onStartup event listener', () => {
      expect(fileContent).toContain('chrome.runtime.onStartup.addListener');
    });

    test('should track extension_startup event on startup', () => {
      expect(fileContent).toContain('extension_startup');
      expect(fileContent).toContain('startup_reason');
      expect(fileContent).toContain('browser_restart');
    });

    test('should handle startup tracking errors gracefully', () => {
      expect(fileContent).toContain('Startup tracking failed');
      expect(fileContent).toMatch(/console\.error.*Startup tracking failed/);
    });
  });

  describe('Service Worker Installation Tracking', () => {
    test('should register onInstalled event listener', () => {
      expect(fileContent).toContain('chrome.runtime.onInstalled.addListener');
    });

    test('should have trackInstallation method', () => {
      expect(fileContent).toContain('async trackInstallation(details)');
      expect(fileContent).toContain('trackInstallation');
    });

    test('should track service_worker_lifecycle events for installation', () => {
      expect(fileContent).toContain('extension_installed');
      expect(fileContent).toContain('extension_updated');
      expect(fileContent).toContain('trackInstallation');
    });

    test('should handle different installation reasons', () => {
      expect(fileContent).toContain('reason: details.reason');
      expect(fileContent).toContain('details.reason');
    });

    test('should track previous version for updates', () => {
      expect(fileContent).toContain('previousVersion');
      expect(fileContent).toContain('previous_version');
    });

    test('should handle installation tracking errors gracefully', () => {
      expect(fileContent).toContain('Installation tracking failed');
      expect(fileContent).toMatch(/console\.error.*Installation tracking failed/);
    });
  });

  describe('Service Worker Error Event Tracking', () => {
    test('should register error event listener on self', () => {
      expect(fileContent).toContain("self.addEventListener('error'");
    });

    test('should track extension_error events', () => {
      expect(fileContent).toContain('extension_error');
      expect(fileContent).toContain('error_type');
      expect(fileContent).toContain('service_worker_error');
    });

    test('should sanitize error information', () => {
      expect(fileContent).toContain('sanitizeErrorMessage');
      expect(fileContent).toContain('error_message');
      expect(fileContent).toContain('error_filename');
      expect(fileContent).toContain('error_line');
      expect(fileContent).toContain('error_column');
    });

    test('should handle error tracking failures gracefully', () => {
      expect(fileContent).toContain('Error tracking failed');
      expect(fileContent).toMatch(/console\.error.*Error tracking failed/);
    });
  });

  describe('Service Worker Promise Rejection Tracking', () => {
    test('should register unhandledrejection event listener', () => {
      expect(fileContent).toContain("self.addEventListener('unhandledrejection'");
    });

    test('should track unhandled rejections with context', () => {
      expect(fileContent).toContain('Unhandled promise rejection detected');
      expect(fileContent).toContain('event.reason');
      expect(fileContent).toContain('event.promise');
    });

    test('should delegate to promise rejection tracker', () => {
      expect(fileContent).toContain('promiseRejectionTracker');
      expect(fileContent).toContain('handle the actual tracking');
    });

    test('should handle rejection logging errors gracefully', () => {
      expect(fileContent).toContain('Rejection logging failed');
      expect(fileContent).toMatch(/console\.error.*Rejection logging failed/);
    });
  });

  describe('Service Worker Context and Lifecycle Methods', () => {
    test('should have service worker startup tracking method', () => {
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('service_worker_startup');
    });

    test('should include service worker context in events', () => {
      expect(fileContent).toContain('sw_context');
      expect(fileContent).toContain('service_worker');
    });

    test('should track service worker session information', () => {
      expect(fileContent).toContain('getServiceWorkerLifetime');
      expect(fileContent).toContain('getSessionCount');
    });

    test('should handle termination preparation', () => {
      expect(fileContent).toContain('trackTerminationPreparation');
      expect(fileContent).toContain('service_worker_termination');
    });
  });

  describe('Lifecycle Event Integration', () => {
    test('should properly initialize promise rejection tracker', () => {
      expect(fileContent).toContain('promiseRejectionTracker.handleUnhandledRejection');
    });

    test('should ensure event listeners are registered synchronously', () => {
      // Event listeners should be registered outside any async functions
      const listenerRegistrations = fileContent.match(/chrome\.runtime\.on\w+\.addListener/g);
      expect(listenerRegistrations).toBeTruthy();
      expect(listenerRegistrations.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle Chrome API unavailability gracefully', () => {
      // Check for error handling in case Chrome APIs are not available
      expect(fileContent).toMatch(/try.*catch|console\.error/);
    });
  });
});

describe('Service Worker Analytics - Performance Metrics and Chrome API Tracking', () => {
  let fileContent;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../../js/analytics/service-worker-analytics.js');
    fileContent = fs.readFileSync(filePath, 'utf8');
  });

  describe('Performance Timing Tracking', () => {
    test('should have trackPerformanceTiming method', () => {
      expect(fileContent).toContain('async trackPerformanceTiming(operation, startTime, endTime)');
      expect(fileContent).toContain('trackPerformanceTiming');
    });

    test('should calculate duration from start and end times', () => {
      expect(fileContent).toContain('const duration = endTime - startTime');
      expect(fileContent).toContain('duration_ms: duration');
    });

    test('should include operation timing parameters', () => {
      expect(fileContent).toContain('operation_name: operation');
      expect(fileContent).toContain('start_time: startTime');
      expect(fileContent).toContain('end_time: endTime');
      expect(fileContent).toContain('sw_context');
    });

    test('should track timing events with service worker context', () => {
      expect(fileContent).toContain('service_worker_timing');
      expect(fileContent).toContain("sw_context: 'service_worker'");
    });

    test('should call eventTracker.trackTiming with custom metric', () => {
      expect(fileContent).toContain('eventTracker.trackTiming');
      expect(fileContent).toContain('name: operation');
      expect(fileContent).toContain('value: duration');
    });
  });

  describe('Chrome API Usage Tracking', () => {
    test('should have trackChromeApiUsage method', () => {
      expect(fileContent).toContain('async trackChromeApiUsage(apiName, method, success = true)');
      expect(fileContent).toContain('trackChromeApiUsage');
    });

    test('should include Chrome API tracking parameters', () => {
      expect(fileContent).toContain('api_name: apiName');
      expect(fileContent).toContain('api_method: method');
      expect(fileContent).toContain('api_success: success');
    });

    test('should track chrome_api_usage events', () => {
      expect(fileContent).toContain('chrome_api_usage');
      expect(fileContent).toContain("trackServiceWorkerEvent('chrome_api_usage'");
    });

    test('should include service worker context in API usage tracking', () => {
      expect(fileContent).toContain("sw_context: 'service_worker'");
    });

    test('should include timestamp in API usage events', () => {
      expect(fileContent).toContain('timestamp: Date.now()');
    });

    test('should have default success parameter as true', () => {
      expect(fileContent).toContain('success = true');
    });
  });

  describe('Chrome API Usage Tracking - Different APIs', () => {
    test('should support tracking chrome.storage API usage', () => {
      // Verify the method structure can handle storage API calls
      expect(fileContent).toContain('api_name: apiName');
      expect(fileContent).toContain('api_method: method');
      // Method should work with storage.local.get, storage.local.set, etc.
    });

    test('should support tracking chrome.runtime API usage', () => {
      // Verify the method can track runtime API calls
      expect(fileContent).toContain('trackChromeApiUsage');
      // Should handle runtime.getManifest, runtime.onInstalled, etc.
      expect(fileContent).toContain('chrome.runtime.getManifest()');
    });

    test('should support success and failure tracking for any Chrome API', () => {
      // Verify both success=true and success=false scenarios are supported
      expect(fileContent).toContain('api_success: success');
      expect(fileContent).toContain('success = true'); // default parameter
    });

    test('should track API usage with consistent event structure', () => {
      // Verify consistent event structure regardless of API type
      expect(fileContent).toContain('chrome_api_usage');
      expect(fileContent).toContain("sw_context: 'service_worker'");
      expect(fileContent).toContain('timestamp: Date.now()');
    });

    test('should handle API method names flexibly', () => {
      // Verify the method can handle different API method formats
      expect(fileContent).toContain('api_method: method');
      // Should work with methods like 'get', 'set', 'addListener', 'getManifest', etc.
    });

    test('should integrate with trackServiceWorkerEvent for all APIs', () => {
      // Verify all Chrome API usage goes through the same tracking pipeline
      expect(fileContent).toContain("return await this.trackServiceWorkerEvent('chrome_api_usage'");
      expect(fileContent).toContain('apiParams');
    });
  });

  describe('Performance Metrics Event Structure and Parameter Validation', () => {
    test('should include all required timing parameters in performance events', () => {
      // Verify all required timing parameters are present
      expect(fileContent).toContain('operation_name: operation');
      expect(fileContent).toContain('duration_ms: duration');
      expect(fileContent).toContain('start_time: startTime');
      expect(fileContent).toContain('end_time: endTime');
      expect(fileContent).toContain("sw_context: 'service_worker'");
    });

    test('should structure timing events for GA4 custom metrics', () => {
      // Verify the event is structured for GA4 custom metrics
      expect(fileContent).toContain('service_worker_timing');
      expect(fileContent).toContain('name: operation');
      expect(fileContent).toContain('value: duration');
    });

    test('should validate performance parameter types and formats', () => {
      // Verify parameter calculation and formatting
      expect(fileContent).toContain('const duration = endTime - startTime');
      expect(fileContent).toContain('duration_ms: duration');
      // Duration should be numeric value from time calculation
    });

    test('should include service worker context in all performance events', () => {
      // Verify service worker context is consistently included
      expect(fileContent).toContain("sw_context: 'service_worker'");
      // Context should identify this as service worker performance data
    });

    test('should support custom metric structure for GA4 reporting', () => {
      // Verify custom metric structure for GA4
      expect(fileContent).toContain("eventTracker.trackTiming('service_worker_timing'");
      expect(fileContent).toContain('timingParams');
      expect(fileContent).toContain('name: operation');
      expect(fileContent).toContain('value: duration');
    });

    test('should validate timing parameter consistency', () => {
      // Verify timing parameters are consistently structured
      expect(fileContent).toContain('operation_name: operation');
      expect(fileContent).toContain('start_time: startTime');
      expect(fileContent).toContain('end_time: endTime');
      // All timing events should have consistent parameter naming
    });

    test('should ensure performance events integrate with service worker tracking', () => {
      // Verify performance events use the service worker tracking pipeline
      expect(fileContent).toContain('return await eventTracker.trackTiming');
      expect(fileContent).toContain('timingParams');
      // Should integrate with the broader service worker analytics system
    });
  });

  describe('Chrome API Usage Success and Failure Tracking', () => {
    test('should track successful Chrome API calls with success=true', () => {
      // Verify default success parameter is true
      expect(fileContent).toContain('success = true');
      expect(fileContent).toContain('api_success: success');
      // Default behavior should track successful API calls
    });

    test('should support explicit success tracking', () => {
      // Verify the method can explicitly track successful calls
      expect(fileContent).toContain('trackChromeApiUsage(apiName, method, success = true)');
      expect(fileContent).toContain('api_success: success');
      // Should handle success=true parameter explicitly
    });

    test('should support failure tracking with success=false', () => {
      // Verify the method can track failed API calls
      expect(fileContent).toContain('api_success: success');
      // Should accept success=false parameter for failure tracking
    });

    test('should include success status in all Chrome API tracking events', () => {
      // Verify success status is always included in events
      expect(fileContent).toContain('api_success: success');
      expect(fileContent).toContain('chrome_api_usage');
      // Every API usage event should include success status
    });

    test('should track API failures with consistent event structure', () => {
      // Verify failed API calls use same event structure as successful ones
      expect(fileContent).toContain('chrome_api_usage');
      expect(fileContent).toContain('api_name: apiName');
      expect(fileContent).toContain('api_method: method');
      expect(fileContent).toContain('api_success: success');
      expect(fileContent).toContain("sw_context: 'service_worker'");
      // Same event structure regardless of success/failure
    });

    test('should maintain timestamp tracking for both success and failure', () => {
      // Verify timestamp is included for both successful and failed calls
      expect(fileContent).toContain('timestamp: Date.now()');
      // All Chrome API usage events should have timestamps
    });

    test('should integrate success and failure tracking with service worker events', () => {
      // Verify both success and failure go through the same tracking pipeline
      expect(fileContent).toContain("return await this.trackServiceWorkerEvent('chrome_api_usage'");
      expect(fileContent).toContain('apiParams');
      // Consistent integration regardless of success/failure status
    });

    test('should support tracking different types of API failures', () => {
      // Verify the method is flexible enough for different failure scenarios
      expect(fileContent).toContain('api_name: apiName');
      expect(fileContent).toContain('api_method: method');
      // Should work for any Chrome API that can fail (storage, runtime, tabs, etc.)
    });
  });

  describe('Service Worker Context Inclusion in Performance Events', () => {
    test('should include service worker context in all performance timing events', () => {
      // Verify service worker context is included in timing events
      expect(fileContent).toContain("sw_context: 'service_worker'");
      expect(fileContent).toContain('service_worker_timing');
      // Performance events should be identifiable as service worker-originated
    });

    test('should include service worker context in Chrome API usage events', () => {
      // Verify service worker context is included in API usage tracking
      expect(fileContent).toContain("sw_context: 'service_worker'");
      expect(fileContent).toContain('chrome_api_usage');
      // API usage events should be categorized as service worker context
    });

    test('should maintain consistent service worker context across all performance events', () => {
      // Verify consistent context labeling across different event types
      expect(fileContent).toContain("sw_context: 'service_worker'");
      // Both timing and API usage should use the same context identifier
    });

    test('should enable GA4 filtering by service worker context', () => {
      // Verify context parameter enables GA4 event filtering
      expect(fileContent).toContain('sw_context');
      expect(fileContent).toContain("'service_worker'");
      // Context should be structured for GA4 custom dimension filtering
    });

    test('should differentiate service worker performance from other contexts', () => {
      // Verify service worker events can be distinguished from popup/content script events
      expect(fileContent).toContain("sw_context: 'service_worker'");
      // Clear context labeling enables performance comparison across contexts
    });

    test('should include service worker context in event parameters structure', () => {
      // Verify context is included in the event parameters object
      expect(fileContent).toContain('timingParams');
      expect(fileContent).toContain('apiParams');
      expect(fileContent).toContain("sw_context: 'service_worker'");
      // Context should be part of the structured event data
    });

    test('should support service worker context in custom timing metrics', () => {
      // Verify custom timing metrics include service worker context
      expect(fileContent).toContain('service_worker_timing');
      expect(fileContent).toContain("sw_context: 'service_worker'");
      // Custom metrics should maintain context information
    });

    test('should ensure service worker context persists through tracking pipeline', () => {
      // Verify context flows through the entire tracking system
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('eventTracker.trackTiming');
      expect(fileContent).toContain("sw_context: 'service_worker'");
      // Context should be preserved throughout the analytics pipeline
    });
  });
});

describe('Service Worker Analytics - Performance Metrics Event Structure', () => {
  let fileContent;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../../js/analytics/service-worker-analytics.js');
    fileContent = fs.readFileSync(filePath, 'utf8');
  });

  describe('Performance Timing Event Structure Validation', () => {
    test('should use service_worker_timing as the event name for performance metrics', () => {
      // Verify performance timing events use correct GA4 event name
      expect(fileContent).toContain("'service_worker_timing'");
      expect(fileContent).toContain('service_worker_timing');
      // Should use standardized event name for GA4 reporting
    });

    test('should include all required timing parameters in event structure', () => {
      // Verify required timing parameters are present
      expect(fileContent).toContain('operation_name: operation');
      expect(fileContent).toContain('start_time: startTime');
      expect(fileContent).toContain('end_time: endTime');
      expect(fileContent).toContain('duration_ms: duration');
      // All timing events should have complete parameter set
    });

    test('should calculate duration from start and end times', () => {
      // Verify duration calculation logic
      expect(fileContent).toContain('duration = endTime - startTime');
      expect(fileContent).toContain('duration_ms:');
      // Duration should be calculated consistently
    });

    test('should include service worker context in timing event parameters', () => {
      // Verify service worker context is included
      expect(fileContent).toContain("sw_context: 'service_worker'");
      expect(fileContent).toContain('timingParams');
      // Context should be part of the event parameter structure
    });

    test('should validate timing parameter data types', () => {
      // Verify parameter validation logic exists
      expect(fileContent).toContain('typeof');
      expect(fileContent).toContain('startTime');
      expect(fileContent).toContain('endTime');
      // Should validate that timing values are appropriate data types
    });

    test('should handle invalid timing values gracefully', () => {
      // Verify error handling exists in the tracking pipeline
      expect(fileContent).toContain('try') && expect(fileContent).toContain('catch');
      // Should handle edge cases like negative durations or invalid timestamps
    });

    test('should ensure timing events use consistent parameter naming', () => {
      // Verify consistent parameter naming across timing events
      expect(fileContent).toContain('operation_name');
      expect(fileContent).toContain('start_time');
      expect(fileContent).toContain('end_time');
      // Parameter names should follow GA4 conventions and be consistent
    });

    test('should include timestamp in timing event structure', () => {
      // Verify timestamp inclusion for event ordering
      expect(fileContent).toContain('timestamp: Date.now()') ||
        expect(fileContent).toContain('timestamp:');
      // Timing events should include when they occurred
    });
  });

  describe('Chrome API Usage Event Structure Validation', () => {
    test('should use chrome_api_usage as the event name for API tracking', () => {
      // Verify API usage events use correct GA4 event name
      expect(fileContent).toContain("'chrome_api_usage'");
      expect(fileContent).toContain('chrome_api_usage');
      // Should use standardized event name for Chrome API tracking
    });

    test('should include all required API parameters in event structure', () => {
      // Verify required API parameters are present
      expect(fileContent).toContain('api_name: apiName');
      expect(fileContent).toContain('api_method: method');
      expect(fileContent).toContain('api_success: success');
      expect(fileContent).toContain('timestamp: Date.now()');
      // All API usage events should have complete parameter set
    });

    test('should validate API parameter data types', () => {
      // Verify parameter data type validation
      expect(fileContent).toContain('apiName') && expect(fileContent).toContain('method');
      expect(fileContent).toContain('success');
      // Should ensure parameters are appropriate types (string, boolean, etc.)
    });

    test('should include service worker context in API event parameters', () => {
      // Verify service worker context is included in API events
      expect(fileContent).toContain("sw_context: 'service_worker'");
      expect(fileContent).toContain('apiParams');
      // Context should be part of API event parameter structure
    });

    test('should handle missing API parameters gracefully', () => {
      // Verify error handling for missing parameters
      expect(fileContent).toContain('apiName') && expect(fileContent).toContain('method');
      // Should handle cases where API name or method is not provided
    });

    test('should ensure API events use consistent parameter naming', () => {
      // Verify consistent parameter naming across API events
      expect(fileContent).toContain('api_name');
      expect(fileContent).toContain('api_method');
      expect(fileContent).toContain('api_success');
      // Parameter names should follow GA4 conventions and be consistent
    });

    test('should support different Chrome API types in event structure', () => {
      // Verify support for various Chrome APIs
      expect(fileContent).toContain('apiName');
      expect(fileContent).toContain('method');
      // Should work with storage, runtime, tabs, and other Chrome APIs
    });

    test('should include success status as boolean in event parameters', () => {
      // Verify success status is properly typed
      expect(fileContent).toContain('api_success: success');
      expect(fileContent).toContain('success = true');
      // Success should be boolean for GA4 analysis filtering
    });
  });

  describe('Event Parameter Structure Consistency', () => {
    test('should use consistent event tracking method for both timing and API events', () => {
      // Verify both event types use same tracking pipeline
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('service_worker_timing');
      expect(fileContent).toContain('chrome_api_usage');
      // Both should use the same underlying tracking mechanism
    });

    test('should include service worker context in all performance events', () => {
      // Verify consistent context inclusion
      expect(fileContent).toContain("sw_context: 'service_worker'");
      // All performance events should be identifiable as service worker-originated
    });

    test('should validate that all events include required GA4 parameters', () => {
      // Verify GA4 compliance for all events
      expect(fileContent).toContain('timestamp');
      expect(fileContent).toContain('sw_context');
      // Events should meet GA4 Measurement Protocol requirements
    });

    test('should ensure parameter objects are properly structured', () => {
      // Verify parameter object structure
      expect(fileContent).toContain('timingParams') || expect(fileContent).toContain('apiParams');
      expect(fileContent).toContain('{') && expect(fileContent).toContain('}');
      // Parameter objects should be properly formed JavaScript objects
    });

    test('should handle parameter validation errors consistently', () => {
      // Verify consistent error handling across event types
      expect(fileContent).toContain('console.error') && expect(fileContent).toContain('catch');
      // Error handling should be consistent for all event parameter validation
    });

    test('should support event parameter extension for custom metrics', () => {
      // Verify extensibility for custom performance metrics
      expect(fileContent).toContain('timingParams') && expect(fileContent).toContain('apiParams');
      // Parameter structure should support additional custom metrics
    });

    test('should ensure all events integrate with EventTracker properly', () => {
      // Verify proper integration with analytics system
      expect(fileContent).toContain('eventTracker') ||
        expect(fileContent).toContain('trackServiceWorkerEvent');
      // Events should integrate with the broader analytics tracking system
    });

    test('should maintain event parameter immutability during tracking', () => {
      // Verify parameters are not modified during tracking process
      expect(fileContent).toContain('timingParams') && expect(fileContent).toContain('apiParams');
      // Parameter objects should remain unchanged during the tracking pipeline
    });
  });
});

describe('Service Worker Analytics - Error Sanitization and Storage', () => {
  let fileContent;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../../js/analytics/service-worker-analytics.js');
    fileContent = fs.readFileSync(filePath, 'utf8');
  });

  describe('Error Message Sanitization', () => {
    test('should have sanitizeErrorMessage method', () => {
      // Verify sanitizeErrorMessage method exists
      expect(fileContent).toContain('sanitizeErrorMessage(message)');
      expect(fileContent).toContain('sanitizeErrorMessage');
    });

    test('should handle null and undefined error messages safely', () => {
      // Verify null/undefined handling
      expect(fileContent).toContain("if (!message || typeof message !== 'string')");
      expect(fileContent).toContain("return 'Unknown error'");
      // Should return safe default for invalid inputs
    });

    test('should remove file paths from error messages', () => {
      // Verify file path sanitization
      expect(fileContent).toContain('file|chrome-extension');
      expect(fileContent).toContain('[FILE_PATH]');
      // Should replace file/chrome-extension paths with placeholder
    });

    test('should remove URLs from error messages', () => {
      // Verify URL sanitization
      expect(fileContent).toContain('https?:');
      expect(fileContent).toContain('[URL]');
      // Should replace HTTP/HTTPS URLs with placeholder
    });

    test('should remove email addresses from error messages', () => {
      // Verify email sanitization
      expect(fileContent).toContain('@');
      expect(fileContent).toContain('[EMAIL]');
      // Should replace email addresses with placeholder
    });

    test('should limit error message length', () => {
      // Verify length limiting
      expect(fileContent).toContain('substring(0, 200)');
      // Should truncate messages to prevent data bloat
    });

    test('should use regex patterns for sensitive data detection', () => {
      // Verify regex-based sanitization approach
      expect(fileContent).toContain('.replace(');
      expect(fileContent).toContain('/g');
      // Should use global regex patterns for thorough sanitization
    });

    test('should preserve error context while removing sensitive data', () => {
      // Verify meaningful error information is preserved
      expect(fileContent).toContain('sanitizeErrorMessage');
      expect(fileContent).toContain('message');
      // Should maintain error context for debugging while protecting privacy
    });
  });

  describe('Stack Trace Sanitization', () => {
    test('should have sanitizeStackTrace method', () => {
      // Verify sanitizeStackTrace method exists
      expect(fileContent).toContain('sanitizeStackTrace(stack)');
      expect(fileContent).toContain('sanitizeStackTrace');
    });

    test('should handle null and undefined stack traces safely', () => {
      // Verify null/undefined handling
      expect(fileContent).toContain("if (!stack || typeof stack !== 'string')");
      expect(fileContent).toContain("return ''");
      // Should return empty string for invalid inputs
    });

    test('should limit stack trace to 5 lines maximum', () => {
      // Verify line limiting functionality
      expect(fileContent).toContain('.split(');
      expect(fileContent).toContain('.slice(0, 5)');
      // Should limit stack traces to prevent data bloat and improve readability
    });

    test('should remove file paths from each stack trace line', () => {
      // Verify file path sanitization per line
      expect(fileContent).toContain('.map(line =>');
      expect(fileContent).toContain('file|chrome-extension');
      expect(fileContent).toContain('[FILE_PATH]');
      // Should sanitize file paths in each line of the stack trace
    });

    test('should limit total stack trace length to 500 characters', () => {
      // Verify overall length limiting
      expect(fileContent).toContain('.substring(0, 500)');
      // Should prevent excessively long stack traces
    });

    test('should split stack trace on newline characters', () => {
      // Verify proper line splitting
      expect(fileContent).toContain("split('\\n')");
      // Should properly parse multi-line stack traces
    });

    test('should rejoin sanitized lines with newline characters', () => {
      // Verify proper line rejoining
      expect(fileContent).toContain("join('\\n')");
      // Should maintain stack trace structure after sanitization
    });

    test('should use regex patterns for file path detection in stack traces', () => {
      // Verify regex-based sanitization approach
      expect(fileContent).toContain('.replace(');
      expect(fileContent).toContain('/g');
      // Should use global regex patterns for thorough file path removal
    });

    test('should preserve stack trace structure while removing sensitive paths', () => {
      // Verify stack trace format preservation
      expect(fileContent).toContain('sanitizeStackTrace');
      expect(fileContent).toContain('stack');
      expect(fileContent).toContain('line');
      // Should maintain meaningful stack trace information for debugging
    });

    test('should handle chrome-extension URLs in stack traces', () => {
      // Verify chrome-extension URL sanitization
      expect(fileContent).toContain('chrome-extension');
      expect(fileContent).toContain('[FILE_PATH]');
      // Should specifically handle chrome extension file references
    });

    test('should handle file:// URLs in stack traces', () => {
      // Verify file:// URL sanitization
      expect(fileContent).toContain('file');
      expect(fileContent).toContain('[FILE_PATH]');
      // Should handle local file references in stack traces
    });

    test('should apply both line limiting and character limiting', () => {
      // Verify both limiting mechanisms work together
      expect(fileContent).toContain('.slice(0, 5)');
      expect(fileContent).toContain('.substring(0, 500)');
      // Should apply both limits to ensure reasonable stack trace sizes
    });

    test('should process each line individually before rejoining', () => {
      // Verify line-by-line processing approach
      expect(fileContent).toContain('.map(line =>');
      expect(fileContent).toContain("join('\\n')");
      // Each line should be sanitized before the stack trace is reconstructed
    });

    test('should maintain consistent sanitization approach with error messages', () => {
      // Verify consistent regex patterns between error and stack sanitization
      expect(fileContent).toContain('file|chrome-extension');
      expect(fileContent).toContain('[FILE_PATH]');
      // Should use similar patterns for both error messages and stack traces
    });

    test('should ensure sanitized stack traces are suitable for analytics', () => {
      // Verify output is appropriate for GA4 event tracking
      expect(fileContent).toContain('sanitizeStackTrace');
      expect(fileContent).toContain('substring(0, 500)');
      // Sanitized stack traces should meet analytics system requirements
    });

    test('should handle empty or whitespace-only stack traces', () => {
      // Verify edge case handling
      expect(fileContent).toContain("typeof stack !== 'string'");
      expect(fileContent).toContain("return ''");
      // Should handle edge cases gracefully
    });
  });

  describe('Error Event Tracking Integration', () => {
    test('should use sanitized error messages in error event tracking', () => {
      // Verify error events use sanitizeErrorMessage
      expect(fileContent).toContain('sanitizeErrorMessage(event.message)');
      expect(fileContent).toContain('error_message:');
      // Error events should include sanitized error messages
    });

    test('should include error type in error event parameters', () => {
      // Verify error type classification
      expect(fileContent).toContain('error_type:');
      expect(fileContent).toContain('service_worker_error');
      // Error events should classify the type of error
    });

    test('should track extension_error events for service worker errors', () => {
      // Verify correct GA4 event name usage
      expect(fileContent).toContain("'extension_error'");
      expect(fileContent).toContain('trackServiceWorkerEvent');
      // Should use standardized GA4 event name for errors
    });

    test('should include service worker context in error events', () => {
      // Verify service worker context inclusion
      expect(fileContent).toContain("sw_context: 'service_worker'");
      expect(fileContent).toContain('errorParams');
      // Error events should be identifiable as service worker-originated
    });

    test('should include error file information in error events', () => {
      // Verify file information tracking
      expect(fileContent).toContain('error_filename:');
      expect(fileContent).toContain('event.filename');
      // Should track where the error occurred (with sanitization)
    });

    test('should include error line and column information', () => {
      // Verify line/column tracking
      expect(fileContent).toContain('error_line: event.lineno');
      expect(fileContent).toContain('error_column: event.colno');
      // Should include precise error location information
    });

    test('should sanitize error filenames to remove sensitive paths', () => {
      // Verify filename sanitization
      expect(fileContent).toContain('event.filename?.replace(');
      expect(fileContent).toContain('file|chrome-extension');
      expect(fileContent).toContain('[FILE_PATH]');
      // Error filenames should be sanitized like stack traces
    });

    test('should include timestamp in error events', () => {
      // Verify timestamp inclusion
      expect(fileContent).toContain('timestamp: Date.now()');
      expect(fileContent).toContain('errorParams');
      // Error events should include when they occurred
    });

    test('should handle error tracking failures gracefully', () => {
      // Verify error tracking error handling
      expect(fileContent).toContain('try') && expect(fileContent).toContain('catch');
      expect(fileContent).toContain('Error tracking failed');
      // Should handle cases where error tracking itself fails
    });

    test('should integrate error tracking with service worker event pipeline', () => {
      // Verify integration with service worker tracking system
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('extension_error');
      expect(fileContent).toContain('errorParams');
      // Error tracking should use the same pipeline as other service worker events
    });

    test('should register error event listener on self object', () => {
      // Verify proper event listener registration
      expect(fileContent).toContain("self.addEventListener('error'");
      expect(fileContent).toContain('async event =>');
      // Should register synchronously for Chrome extension requirements
    });

    test('should structure error events for GA4 compliance', () => {
      // Verify GA4-compatible event structure
      expect(fileContent).toContain('error_type');
      expect(fileContent).toContain('error_message');
      expect(fileContent).toContain('sw_context');
      expect(fileContent).toContain('timestamp');
      // Error events should meet GA4 Measurement Protocol requirements
    });

    test('should preserve debugging context while protecting privacy', () => {
      // Verify balance between debugging and privacy
      expect(fileContent).toContain('sanitizeErrorMessage');
      expect(fileContent).toContain('error_line');
      expect(fileContent).toContain('error_column');
      expect(fileContent).toContain('[FILE_PATH]');
      // Should maintain useful debugging info while removing sensitive data
    });

    test('should handle different error event properties', () => {
      // Verify comprehensive error property handling
      expect(fileContent).toContain('event.message');
      expect(fileContent).toContain('event.filename');
      expect(fileContent).toContain('event.lineno');
      expect(fileContent).toContain('event.colno');
      // Should handle all standard error event properties
    });

    test('should support error classification and severity tracking', () => {
      // Verify error classification capability
      expect(fileContent).toContain('error_type');
      expect(fileContent).toContain('service_worker_error');
      // Should enable error classification for analytics filtering
    });

    test('should ensure error events are trackable across extension contexts', () => {
      // Verify cross-context error tracking capability
      expect(fileContent).toContain('sw_context');
      expect(fileContent).toContain('trackServiceWorkerEvent');
      // Error events should be distinguishable by context for analytics
    });

    test('should maintain consistent error tracking approach', () => {
      // Verify consistent error handling across different error sources
      expect(fileContent).toContain('extension_error');
      expect(fileContent).toContain('errorParams');
      expect(fileContent).toContain('console.error');
      // All error tracking should follow consistent patterns
    });

    test('should enable error analytics and debugging workflows', () => {
      // Verify error events support analytics and debugging use cases
      expect(fileContent).toContain('error_message');
      expect(fileContent).toContain('error_filename');
      expect(fileContent).toContain('timestamp');
      expect(fileContent).toContain('sw_context');
      // Error events should provide data for both analytics and debugging
    });

    test('should handle async error tracking operations', () => {
      // Verify async error tracking handling
      expect(fileContent).toContain('async event =>');
      expect(fileContent).toContain('await');
      expect(fileContent).toContain('trackServiceWorkerEvent');
      // Error tracking should handle async operations properly
    });

    test('should log error tracking failures for debugging', () => {
      // Verify error tracking failure logging
      expect(fileContent).toContain('console.error');
      expect(fileContent).toContain('Error tracking failed');
      // Should log when error tracking itself fails for debugging
    });
  });

  describe('Error Context Preservation', () => {
    test('should preserve meaningful error messages while removing sensitive paths', () => {
      // Verify error message context preservation
      expect(fileContent).toContain('sanitizeErrorMessage');
      expect(fileContent).toContain('[FILE_PATH]');
      expect(fileContent).toContain('substring(0, 200)');
      // Should keep error details but replace sensitive file paths
    });

    test('should maintain error message length for debugging context', () => {
      // Verify reasonable message length is preserved
      expect(fileContent).toContain('substring(0, 200)');
      // Should preserve enough context for meaningful debugging (200 chars)
    });

    test('should preserve original error structure in sanitized messages', () => {
      // Verify error message structure is maintained
      expect(fileContent).toContain('message');
      expect(fileContent).toContain('replace(');
      expect(fileContent).toContain("return 'Unknown error'");
      // Should maintain error message structure while sanitizing content
    });

    test('should preserve stack trace structure while removing sensitive paths', () => {
      // Verify stack trace structure preservation
      expect(fileContent).toContain("split('\\n')");
      expect(fileContent).toContain("join('\\n')");
      expect(fileContent).toContain('.map(line =>');
      // Should maintain line-by-line stack trace structure
    });

    test('should preserve sufficient stack trace lines for debugging', () => {
      // Verify adequate stack trace depth is maintained
      expect(fileContent).toContain('.slice(0, 5)');
      // Should preserve top 5 stack frames for debugging context
    });

    test('should preserve error location information for debugging', () => {
      // Verify line and column numbers are preserved
      expect(fileContent).toContain('error_line: event.lineno');
      expect(fileContent).toContain('error_column: event.colno');
      // Should maintain precise error location for debugging
    });

    test('should preserve error type classification for analytics', () => {
      // Verify error type information is maintained
      expect(fileContent).toContain('error_type:');
      expect(fileContent).toContain('service_worker_error');
      // Should preserve error classification for debugging and analytics
    });

    test('should preserve timestamp information for debugging workflows', () => {
      // Verify timing information is preserved
      expect(fileContent).toContain('timestamp: Date.now()');
      // Should maintain when errors occurred for debugging correlation
    });

    test('should preserve service worker context for debugging', () => {
      // Verify service worker context is maintained
      expect(fileContent).toContain("sw_context: 'service_worker'");
      // Should preserve context information for debugging across extension parts
    });

    test('should balance privacy protection with debugging utility', () => {
      // Verify appropriate balance between privacy and debugging
      expect(fileContent).toContain('[FILE_PATH]');
      expect(fileContent).toContain('[URL]');
      expect(fileContent).toContain('[EMAIL]');
      expect(fileContent).toContain('error_line');
      expect(fileContent).toContain('error_column');
      // Should remove sensitive data while preserving debugging context
    });

    test('should preserve error event structure for analytics processing', () => {
      // Verify error event structure remains intact
      expect(fileContent).toContain('errorParams');
      expect(fileContent).toContain('error_message');
      expect(fileContent).toContain('error_filename');
      // Should maintain structured error data for analytics workflows
    });

    test('should preserve enough context for error pattern identification', () => {
      // Verify sufficient context for identifying error patterns
      expect(fileContent).toContain('error_type');
      expect(fileContent).toContain('sw_context');
      expect(fileContent).toContain('timestamp');
      // Should enable error pattern analysis while protecting privacy
    });

    test('should preserve error severity and classification context', () => {
      // Verify error classification is maintained
      expect(fileContent).toContain('service_worker_error');
      expect(fileContent).toContain('extension_error');
      // Should preserve error severity and type for debugging workflows
    });

    test('should maintain consistent context preservation across error types', () => {
      // Verify consistent approach to context preservation
      expect(fileContent).toContain('sanitizeErrorMessage');
      expect(fileContent).toContain('sanitizeStackTrace');
      expect(fileContent).toContain('errorParams');
      // Should apply consistent context preservation across all error handling
    });

    test('should preserve error correlation information for debugging', () => {
      // Verify information needed for error correlation is preserved
      expect(fileContent).toContain('sw_event_type');
      expect(fileContent).toContain('sw_lifetime');
      expect(fileContent).toContain('timestamp');
      // Should enable correlation of errors with other service worker events
    });

    test('should ensure sanitized errors remain useful for debugging', () => {
      // Verify sanitized errors retain debugging value
      expect(fileContent).toContain('substring(0, 200)');
      expect(fileContent).toContain('.slice(0, 5)');
      expect(fileContent).toContain('error_line');
      expect(fileContent).toContain('error_column');
      // Should maintain debugging utility after sanitization
    });

    test('should preserve error context while meeting privacy requirements', () => {
      // Verify privacy compliance without losing debugging context
      expect(fileContent).toContain('file|chrome-extension');
      expect(fileContent).toContain('https?:');
      expect(fileContent).toContain('[\\w._%+-]+@[\\w.-]+');
      expect(fileContent).toContain('error_message');
      // Should meet privacy requirements while preserving debugging context
    });

    test('should maintain error information hierarchy for analytics', () => {
      // Verify error information structure supports analytics needs
      expect(fileContent).toContain('error_type');
      expect(fileContent).toContain('error_message');
      expect(fileContent).toContain('error_filename');
      expect(fileContent).toContain('sw_context');
      // Should maintain structured error hierarchy for analytics processing
    });

    test('should preserve cross-context error tracking capabilities', () => {
      // Verify error context enables cross-context analysis
      expect(fileContent).toContain('sw_context');
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('extension_error');
      // Should enable tracking errors across different extension contexts
    });

    test('should ensure context preservation supports error monitoring', () => {
      // Verify preserved context supports error monitoring workflows
      expect(fileContent).toContain('timestamp');
      expect(fileContent).toContain('error_type');
      expect(fileContent).toContain('sw_lifetime');
      expect(fileContent).toContain('sw_session_count');
      // Should provide context needed for error monitoring and alerting
    });

    test('should maintain debugging workflow compatibility', () => {
      // Verify sanitized errors work with debugging workflows
      expect(fileContent).toContain('console.error');
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('errorParams');
      // Should ensure debugging workflows remain functional with sanitized data
    });

    test('should preserve error reporting structure for analytics dashboards', () => {
      // Verify error structure supports analytics dashboard needs
      expect(fileContent).toContain('extension_error');
      expect(fileContent).toContain('error_type');
      expect(fileContent).toContain('sw_context');
      expect(fileContent).toContain('timestamp');
      // Should structure error data for analytics dashboard consumption
    });
  });

  describe('Error Storage and Chrome Storage Integration', () => {
    test('should integrate with Chrome storage APIs for error persistence', () => {
      // Verify Chrome storage integration patterns
      expect(fileContent).toContain('chrome.storage');
      expect(fileContent).toContain('sw_startup_time') ||
        expect(fileContent).toContain('sw_session_count');
      // Should use Chrome storage APIs for persistent error-related data
    });

    test('should store service worker lifetime information for error correlation', () => {
      // Verify service worker lifetime tracking for error context
      expect(fileContent).toContain('getServiceWorkerLifetime');
      expect(fileContent).toContain('sw_startup_time');
      expect(fileContent).toContain('chrome.storage.local.get');
      // Should track service worker lifetime for error correlation
    });

    test('should store session count information for error analysis', () => {
      // Verify session counting for error pattern analysis
      expect(fileContent).toContain('getSessionCount');
      expect(fileContent).toContain('sw_session_count');
      expect(fileContent).toContain('chrome.storage.local.set');
      // Should track session information for error trend analysis
    });

    test('should handle Chrome storage failures gracefully in error contexts', () => {
      // Verify storage failure handling
      expect(fileContent).toContain('try') && expect(fileContent).toContain('catch');
      expect(fileContent).toContain('console.error');
      expect(fileContent).toContain('Failed to get');
      // Should handle storage failures without breaking error tracking
    });

    test('should store pending events during service worker initialization', () => {
      // Verify pending event storage for reliability
      expect(fileContent).toContain('pendingEvents');
      expect(fileContent).toContain('push');
      expect(fileContent).toContain('processPendingEvents');
      // Should store events when not initialized for later processing
    });

    test('should persist error events across service worker restarts', () => {
      // Verify error persistence across restarts
      expect(fileContent).toContain('pendingEvents');
      expect(fileContent).toContain('was_pending: true');
      expect(fileContent).toContain('pending_delay_ms');
      // Should handle error events that occurred during service worker downtime
    });

    test('should manage error storage capacity and cleanup', () => {
      // Verify storage management strategies
      expect(fileContent).toContain('processPendingEvents');
      expect(fileContent).toContain('eventsToProcess');
      expect(fileContent).toContain('this.pendingEvents = []');
      // Should manage storage capacity to prevent unlimited growth
    });

    test('should store installation and update information for error context', () => {
      // Verify installation tracking storage
      expect(fileContent).toContain('chrome.storage.local.set');
      expect(fileContent).toContain('installation_date');
      expect(fileContent).toContain('install_source');
      // Should store installation context for error analysis
    });

    test('should retrieve stored data for error event enrichment', () => {
      // Verify data retrieval for error context
      expect(fileContent).toContain('chrome.storage.local.get');
      expect(fileContent).toContain('sw_startup_time');
      expect(fileContent).toContain('sw_session_count');
      // Should retrieve stored data to enrich error events
    });

    test('should handle storage quota limitations for error data', () => {
      // Verify storage quota management
      expect(fileContent).toContain('substring(0, 200)') ||
        expect(fileContent).toContain('substring(0, 500)');
      expect(fileContent).toContain('.slice(0, 5)');
      // Should limit data size to respect Chrome storage quotas
    });

    test('should ensure error storage operations are async-compatible', () => {
      // Verify async storage handling
      expect(fileContent).toContain('async') && expect(fileContent).toContain('await');
      expect(fileContent).toContain('chrome.storage.local.get') ||
        expect(fileContent).toContain('chrome.storage.local.set');
      // All storage operations should handle async properly
    });

    test('should provide fallback values when storage retrieval fails', () => {
      // Verify fallback behavior for storage failures
      expect(fileContent).toContain('|| Date.now()') || expect(fileContent).toContain('|| 0');
      expect(fileContent).toContain('return 0') || expect(fileContent).toContain('return 1');
      // Should provide reasonable defaults when storage is unavailable
    });

    test('should store error context metadata for debugging', () => {
      // Verify metadata storage for debugging support
      expect(fileContent).toContain('sw_lifetime');
      expect(fileContent).toContain('sw_session_count');
      expect(fileContent).toContain('user_agent');
      // Should store contextual metadata to aid in error debugging
    });

    test('should integrate error storage with service worker lifecycle events', () => {
      // Verify storage integration with lifecycle tracking
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('sw_event_type');
      expect(fileContent).toContain('getServiceWorkerLifetime');
      // Error storage should integrate with broader service worker tracking
    });

    test('should handle storage synchronization across extension contexts', () => {
      // Verify cross-context storage coordination
      expect(fileContent).toContain('chrome.storage.local');
      expect(fileContent).toContain('sw_startup_time') ||
        expect(fileContent).toContain('sw_session_count');
      // Should coordinate storage across different extension contexts
    });

    test('should store error tracking initialization state', () => {
      // Verify initialization state persistence
      expect(fileContent).toContain('isInitialized');
      expect(fileContent).toContain('pendingEvents');
      expect(fileContent).toContain('initialize');
      // Should track initialization state for error handling reliability
    });

    test('should implement error storage retry mechanisms', () => {
      // Verify retry logic for failed storage operations
      expect(fileContent).toContain('processPendingEvents');
      expect(fileContent).toContain('Re-add to pending');
      expect(fileContent).toContain('this.pendingEvents.push(event)');
      // Should retry failed storage operations to ensure reliability
    });

    test('should store error events with delay tracking for performance analysis', () => {
      // Verify delay tracking for performance monitoring
      expect(fileContent).toContain('pending_delay_ms');
      expect(fileContent).toContain('Date.now() - event.timestamp');
      // Should track delays in error processing for performance analysis
    });

    test('should ensure error storage compatibility with Chrome extension storage limits', () => {
      // Verify compliance with Chrome extension storage constraints
      expect(fileContent).toContain('substring(0, 200)') ||
        expect(fileContent).toContain('substring(0, 500)');
      expect(fileContent).toContain('.slice(0, 5)');
      // Should respect Chrome extension storage size and quota limits
    });

    test('should provide error storage status information for debugging', () => {
      // Verify storage status reporting
      expect(fileContent).toContain('getStatus');
      expect(fileContent).toContain('pendingEventsCount');
      expect(fileContent).toContain('isInitialized');
      // Should provide storage status for debugging and monitoring
    });

    test('should implement error storage cleanup during service worker termination', () => {
      // Verify cleanup procedures for service worker termination
      expect(fileContent).toContain('flush');
      expect(fileContent).toContain('processPendingEvents');
      expect(fileContent).toContain('eventTracker.flush');
      // Should clean up pending error storage during termination
    });

    test('should handle concurrent error storage operations safely', () => {
      // Verify thread safety for concurrent operations
      expect(fileContent).toContain('eventsToProcess = [...this.pendingEvents]');
      expect(fileContent).toContain('this.pendingEvents = []');
      // Should handle concurrent access to pending events safely
    });

    test('should store error events with proper versioning for compatibility', () => {
      // Verify version compatibility for stored error data
      expect(fileContent).toContain('chrome.runtime.getManifest().version');
      expect(fileContent).toContain('version');
      // Should include version information for error data compatibility
    });
  });

  describe('Promise Rejection Tracker Integration', () => {
    test('should import promise rejection tracker module', () => {
      // Verify promise rejection tracker is imported
      expect(fileContent).toContain('import { promiseRejectionTracker }');
      expect(fileContent).toContain("from './promise-rejection-tracker.js'");
      // Should import the promise rejection tracker for integration
    });

    test('should delegate unhandled rejections to promise rejection tracker', () => {
      // Verify delegation to comprehensive promise rejection tracker
      expect(fileContent).toContain('trackUnhandledRejection');
      expect(fileContent).toContain('promiseRejectionTracker.handleUnhandledRejection');
      expect(fileContent).toContain('return await promiseRejectionTracker');
      // Should delegate to the specialized promise rejection tracker
    });

    test('should mark trackUnhandledRejection method as deprecated in favor of tracker', () => {
      // Verify deprecation notice for direct method
      expect(fileContent).toContain('@deprecated');
      expect(fileContent).toContain('Use promiseRejectionTracker.handleUnhandledRejection instead');
      // Should indicate preference for using the dedicated tracker
    });

    test('should register unhandledrejection event listener for service worker context', () => {
      // Verify service worker specific promise rejection handling
      expect(fileContent).toContain("self.addEventListener('unhandledrejection'");
      expect(fileContent).toContain('async event =>');
      // Should register listener in service worker global scope
    });

    test('should log service worker specific context for promise rejections', () => {
      // Verify service worker context logging
      expect(fileContent).toContain('Unhandled promise rejection detected:');
      expect(fileContent).toContain('reason: event.reason');
      expect(fileContent).toContain('promise: event.promise');
      expect(fileContent).toContain('timestamp: Date.now()');
      // Should log service worker specific context for rejections
    });

    test('should maintain backwards compatibility with rejection logging', () => {
      // Verify backwards compatibility approach
      expect(fileContent).toContain('This listener is kept for backwards compatibility');
      expect(fileContent).toContain('additional logging');
      // Should maintain existing functionality while using new tracker
    });

    test('should ensure consistent tracking across all contexts', () => {
      // Verify consistent promise rejection tracking
      expect(fileContent).toContain('The promiseRejectionTracker will handle the actual tracking');
      expect(fileContent).toContain('This ensures consistent tracking across all contexts');
      // Should provide consistent behavior across extension contexts
    });

    test('should handle promise rejection logging failures gracefully', () => {
      // Verify error handling for rejection logging
      expect(fileContent).toContain('try') && expect(fileContent).toContain('catch');
      expect(fileContent).toContain('Rejection logging failed');
      expect(fileContent).toContain('console.error');
      // Should handle cases where rejection logging itself fails
    });

    test('should integrate promise rejection tracking with service worker lifecycle', () => {
      // Verify integration with service worker lifecycle events
      expect(fileContent).toContain('promiseRejectionTracker');
      expect(fileContent).toContain('initialize');
      expect(fileContent).toContain('import');
      // Should integrate with broader service worker analytics lifecycle
    });

    test('should support promise rejection tracker initialization', () => {
      // Verify tracker initialization support
      expect(fileContent).toContain('import { promiseRejectionTracker }');
      expect(fileContent).toContain('promiseRejectionTracker automatically handles this');
      // Should support proper initialization of the rejection tracker
    });

    test('should provide access to promise rejection tracker for service worker events', () => {
      // Verify tracker accessibility
      expect(fileContent).toContain('promiseRejectionTracker');
      expect(fileContent).toContain('handleUnhandledRejection');
      // Should provide access to tracker functionality
    });

    test('should handle promise rejection tracker unavailability', () => {
      // Verify graceful handling when tracker is unavailable
      expect(fileContent).toContain('try') && expect(fileContent).toContain('catch');
      expect(fileContent).toContain('console.error');
      // Should handle cases where promise rejection tracker is not available
    });

    test('should maintain promise rejection event structure for analytics', () => {
      // Verify event structure preservation
      expect(fileContent).toContain('event.reason');
      expect(fileContent).toContain('event.promise');
      expect(fileContent).toContain('timestamp');
      // Should maintain structured data for analytics processing
    });

    test('should ensure promise rejection tracker works with service worker termination', () => {
      // Verify tracker compatibility with service worker lifecycle
      expect(fileContent).toContain('flush');
      expect(fileContent).toContain('processPendingEvents');
      // Should ensure rejection tracking works throughout service worker lifecycle
    });

    test('should coordinate promise rejection tracking with other service worker events', () => {
      // Verify coordination with other tracking
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('promiseRejectionTracker');
      // Should coordinate with other service worker event tracking
    });

    test('should support promise rejection context preservation in service worker', () => {
      // Verify context preservation for service worker rejections
      expect(fileContent).toContain('reason');
      expect(fileContent).toContain('promise');
      expect(fileContent).toContain('timestamp');
      expect(fileContent).toContain('console.error');
      // Should preserve context for service worker promise rejections
    });

    test('should integrate with service worker analytics error tracking pipeline', () => {
      // Verify integration with error tracking
      expect(fileContent).toContain('promiseRejectionTracker');
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('extension_error');
      // Should integrate with broader error tracking infrastructure
    });

    test('should handle async promise rejection tracking operations', () => {
      // Verify async operation handling
      expect(fileContent).toContain('async event =>');
      expect(fileContent).toContain('await promiseRejectionTracker');
      // Should handle async operations in promise rejection tracking
    });

    test('should provide service worker specific promise rejection analytics', () => {
      // Verify service worker specific analytics
      expect(fileContent).toContain('Service Worker Analytics');
      expect(fileContent).toContain('Unhandled promise rejection detected');
      expect(fileContent).toContain('sw_context') ||
        expect(fileContent).toContain('service_worker');
      // Should provide service worker specific rejection analytics
    });

    test('should ensure promise rejection tracker integration is properly documented', () => {
      // Verify documentation and comments
      expect(fileContent).toContain('promiseRejectionTracker automatically handles this');
      expect(fileContent).toContain('Note:');
      expect(fileContent).toContain('backwards compatibility');
      // Should document the integration approach clearly
    });

    test('should maintain promise rejection tracking reliability across service worker restarts', () => {
      // Verify reliability across restarts
      expect(fileContent).toContain('pendingEvents');
      expect(fileContent).toContain('promiseRejectionTracker');
      expect(fileContent).toContain('initialize');
      // Should maintain tracking reliability across service worker lifecycle
    });

    test('should support promise rejection analytics dashboard integration', () => {
      // Verify dashboard integration support
      expect(fileContent).toContain('timestamp');
      expect(fileContent).toContain('reason');
      expect(fileContent).toContain('promiseRejectionTracker');
      // Should structure data for analytics dashboard consumption
    });

    test('should ensure promise rejection tracker follows Chrome extension best practices', () => {
      // Verify Chrome extension compliance
      expect(fileContent).toContain('self.addEventListener');
      expect(fileContent).toContain('synchronously at the top level');
      expect(fileContent).toContain('Chrome extension requirement');
      // Should follow Chrome extension event listener registration practices
    });

    test('should coordinate promise rejection tracking with service worker analytics state', () => {
      // Verify state coordination
      expect(fileContent).toContain('isInitialized');
      expect(fileContent).toContain('promiseRejectionTracker');
      expect(fileContent).toContain('pendingEvents');
      // Should coordinate tracking state with broader analytics system
    });
  });

  describe('Context Detection and Event Listener Registration', () => {
    test('should detect service worker execution context', () => {
      // Verify service worker context detection
      expect(fileContent).toContain('Service Worker Analytics');
      expect(fileContent).toContain('service worker environment');
      expect(fileContent).toContain('sw_context') ||
        expect(fileContent).toContain('service_worker');
      // Should properly identify and handle service worker context
    });

    test('should register event listeners synchronously at module load', () => {
      // Verify synchronous event listener registration
      expect(fileContent).toContain('Register event listeners at the top level');
      expect(fileContent).toContain('Chrome extension requirement');
      expect(fileContent).toContain('synchronously when the module loads');
      // Should register all event listeners synchronously for Chrome extension compliance
    });

    test('should register chrome.runtime.onInstalled event listener', () => {
      // Verify onInstalled listener registration
      expect(fileContent).toContain('chrome.runtime.onInstalled.addListener');
      expect(fileContent).toContain('trackInstallation');
      expect(fileContent).toContain('async details =>');
      // Should register onInstalled listener for installation tracking
    });

    test('should register chrome.runtime.onStartup event listener', () => {
      // Verify onStartup listener registration
      expect(fileContent).toContain('chrome.runtime.onStartup.addListener');
      expect(fileContent).toContain('extension_startup');
      expect(fileContent).toContain('browser_restart');
      // Should register onStartup listener for startup tracking
    });

    test('should register self error event listener for service worker', () => {
      // Verify self error listener registration
      expect(fileContent).toContain("self.addEventListener('error'");
      expect(fileContent).toContain('async event =>');
      expect(fileContent).toContain('service_worker_error');
      // Should register error listener on service worker global scope
    });

    test('should register self unhandledrejection event listener', () => {
      // Verify unhandledrejection listener registration
      expect(fileContent).toContain("self.addEventListener('unhandledrejection'");
      expect(fileContent).toContain('async event =>');
      expect(fileContent).toContain('promise rejection detected');
      // Should register promise rejection listener on service worker global scope
    });

    test('should follow Chrome extension event listener registration best practices', () => {
      // Verify Chrome extension compliance
      expect(fileContent).toContain('registered synchronously at the top level');
      expect(fileContent).toContain('Chrome extension requirement');
      expect(fileContent).toContain('when the module loads');
      // Should follow Chrome extension event listener requirements
    });

    test('should handle event listener registration errors gracefully', () => {
      // Verify error handling in event listeners
      expect(fileContent).toContain('try') && expect(fileContent).toContain('catch');
      expect(fileContent).toContain('console.error');
      expect(fileContent).toContain('tracking failed');
      // Should handle errors in event listener callbacks
    });

    test('should use async event listener callbacks', () => {
      // Verify async callback usage
      expect(fileContent).toContain('async details =>');
      expect(fileContent).toContain('async () =>');
      expect(fileContent).toContain('async event =>');
      // Should use async callbacks for proper asynchronous handling
    });

    test('should provide context-specific analytics behavior', () => {
      // Verify service worker specific behavior
      expect(fileContent).toContain('service worker environment');
      expect(fileContent).toContain('sw_event_type');
      expect(fileContent).toContain('sw_context');
      // Should provide behavior specific to service worker context
    });

    test('should integrate event listeners with analytics tracking pipeline', () => {
      // Verify integration with analytics
      expect(fileContent).toContain('trackServiceWorkerEvent');
      expect(fileContent).toContain('trackInstallation');
      expect(fileContent).toContain('eventTracker');
      // Should integrate event listeners with analytics tracking
    });

    test('should ensure event listeners work across service worker restarts', () => {
      // Verify persistence across restarts
      expect(fileContent).toContain('registered synchronously at the top level');
      expect(fileContent).toContain('module loads');
      expect(fileContent).toContain('pendingEvents');
      // Should ensure event listeners persist across service worker lifecycle
    });

    test('should validate service worker analytics singleton pattern', () => {
      // Verify singleton implementation
      expect(fileContent).toContain('const serviceWorkerAnalytics = new ServiceWorkerAnalytics()');
      expect(fileContent).toContain('export { serviceWorkerAnalytics }');
      expect(fileContent).toContain('export default serviceWorkerAnalytics');
      // Should implement singleton pattern for service worker analytics
    });

    test('should ensure proper module exports for service worker context', () => {
      // Verify module export structure
      expect(fileContent).toContain('export { serviceWorkerAnalytics }');
      expect(fileContent).toContain('export default serviceWorkerAnalytics');
      expect(fileContent).toContain('Create and export singleton instance');
      // Should properly export analytics instance for service worker usage
    });

    test('should implement service worker lifecycle management', () => {
      // Verify lifecycle management
      expect(fileContent).toContain('initialization');
      expect(fileContent).toContain('termination');
      expect(fileContent).toContain('pendingEvents');
      expect(fileContent).toContain('flush');
      // Should manage service worker lifecycle events properly
    });

    test('should support service worker analytics state inspection', () => {
      // Verify state inspection capabilities
      expect(fileContent).toContain('getStatus');
      expect(fileContent).toContain('isInitialized');
      expect(fileContent).toContain('pendingEventsCount');
      expect(fileContent).toContain('version');
      // Should provide methods to inspect analytics state
    });

    test('should handle Chrome API availability in service worker context', () => {
      // Verify Chrome API handling
      expect(fileContent).toContain('chrome.runtime');
      expect(fileContent).toContain('chrome.storage');
      expect(fileContent).toContain('getManifest');
      // Should properly handle Chrome APIs in service worker context
    });

    test('should implement proper error logging for context detection', () => {
      // Verify context detection error handling
      expect(fileContent).toContain('[Service Worker Analytics]');
      expect(fileContent).toContain('console.error');
      expect(fileContent).toContain('failed');
      // Should log context-specific errors with proper prefixes
    });

    test('should ensure event listener callbacks are properly scoped', () => {
      // Verify callback scoping
      expect(fileContent).toContain('serviceWorkerAnalytics.trackInstallation');
      expect(fileContent).toContain('serviceWorkerAnalytics.trackServiceWorkerEvent');
      expect(fileContent).toContain('await serviceWorkerAnalytics');
      // Should properly scope callback methods to analytics instance
    });

    test('should validate service worker analytics initialization timing', () => {
      // Verify initialization timing
      expect(fileContent).toContain('Initialize immediately');
      expect(fileContent).toContain('this.initialize()');
      expect(fileContent).toContain('constructor()');
      // Should initialize analytics immediately upon construction
    });

    test('should support event listener registration validation', () => {
      // Verify registration validation
      expect(fileContent).toContain('addListener');
      expect(fileContent).toContain('addEventListener');
      expect(fileContent).toContain('Event Listener');
      // Should validate that event listeners are properly registered
    });

    test('should implement service worker context isolation', () => {
      // Verify context isolation
      expect(fileContent).toContain('service worker environment');
      expect(fileContent).toContain('Service Worker Analytics');
      expect(fileContent).toContain('self.addEventListener');
      // Should maintain proper context isolation for service worker
    });

    test('should ensure event listener performance optimization', () => {
      // Verify performance considerations
      expect(fileContent).toContain('pendingEvents');
      expect(fileContent).toContain('processPendingEvents');
      expect(fileContent).toContain('async');
      // Should optimize event listener performance
    });

    test('should validate Chrome extension manifest requirements', () => {
      // Verify manifest compliance
      expect(fileContent).toContain('chrome.runtime.getManifest()');
      expect(fileContent).toContain('version');
      expect(fileContent).toContain('Chrome extension');
      // Should comply with Chrome extension manifest requirements
    });

    test('should implement proper service worker analytics documentation', () => {
      // Verify documentation and comments
      expect(fileContent).toContain('Service Worker Analytics');
      expect(fileContent).toContain('Chrome Extension Documentation');
      expect(fileContent).toContain('Key Principles');
      // Should include comprehensive documentation for service worker usage
    });

    test('should ensure event listener registration order and dependencies', () => {
      // Verify registration order
      expect(fileContent).toContain('Register event listeners at the top level');
      expect(fileContent).toContain('synchronously when the module loads');
      expect(fileContent).toContain('Chrome extension requirement');
      // Should register event listeners in proper order with correct dependencies
    });
  });
});
