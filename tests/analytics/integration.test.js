/**
 * Integration Tests for GA4 Analytics System
 *
 * Tests the complete analytics system with minimal mocking
 */

import { jest } from '@jest/globals';

describe('GA4 Analytics Integration', () => {
  let analytics, eventTracker, clientManager, sessionManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock Chrome APIs
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({})),
          set: jest.fn((data, callback) => callback()),
          remove: jest.fn((keys, callback) => callback()),
        },
        session: {
          get: jest.fn((keys, callback) => callback({})),
          set: jest.fn((data, callback) => callback()),
          remove: jest.fn((keys, callback) => callback()),
        },
      },
      runtime: {
        lastError: null,
        getManifest: jest.fn(() => ({ version: '1.0.0' })),
      },
    };

    // Mock crypto
    global.crypto = {
      randomUUID: jest.fn(() => 'test-client-id-1234-5678-9012-123456789012'),
    };

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      })
    );

    // Mock Date.now for consistent timestamps
    const mockTimestamp = 1704067200000; // January 1, 2024 00:00:00 UTC
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

    // Mock environment to be valid
    jest.doMock('../../js/analytics/config.js', () => ({
      MEASUREMENT_ID: 'G-TEST123',
      API_SECRET: 'test-api-secret',
      GA4_ENDPOINT: 'https://www.google-analytics.com/mp/collect',
      isValidEnvironment: () => true,
    }));

    // Import modules and get instances
    const analyticsModule = await import('../../js/analytics/analytics.js');
    const eventTrackerModule = await import('../../js/analytics/event-tracker.js');
    const clientManagerModule = await import('../../js/analytics/client-manager.js');
    const sessionManagerModule = await import('../../js/analytics/session-manager.js');

    analytics = analyticsModule.default;
    eventTracker = eventTrackerModule.default;
    clientManager = clientManagerModule.default;
    sessionManager = sessionManagerModule.default;
  });

  afterEach(() => {
    if (eventTracker && eventTracker.flushTimer) {
      clearTimeout(eventTracker.flushTimer);
    }
  });

  describe('Complete System Flow', () => {
    test('should initialize analytics and track events end-to-end', async () => {
      // Test initialization
      const initResult = await analytics.init();
      expect(initResult).toBe(true);
      expect(analytics.initialized).toBe(true);

      // Enable debug mode to see what's happening
      analytics.setDebugMode(true);

      // Verify client and session IDs were generated
      const clientId = await clientManager.getOrCreateClientId();
      const sessionId = await sessionManager.getOrCreateSessionId();

      expect(clientId).toBeTruthy();
      expect(sessionId).toBeTruthy();

      // Test tracking various events
      const extensionStartupResult = await analytics.trackExtensionStartup({
        version: '1.0.0',
        browserInfo: 'Chrome 91',
        installType: 'new_install',
        context: 'popup',
      });
      expect(extensionStartupResult).toBe(true);

      const searchResult = await analytics.trackPromptSearch({
        query: 'writing prompts',
        resultsCount: 25,
        searchType: 'fuzzy',
        filtersUsed: ['category:writing'],
        duration: 1500,
      });
      expect(searchResult).toBe(true);

      const promptViewResult = await analytics.trackPromptView({
        id: 'prompt-123',
        category: 'writing',
        type: 'creative',
        content: 'Write a short story about...',
        source: 'search_results',
        isFavorite: true,
        userRating: 4,
      });
      expect(promptViewResult).toBe(true);

      // Verify events are queued
      const queueStatus = eventTracker.getQueueStatus();
      expect(queueStatus.queueSize).toBeGreaterThan(0);

      // Test manual flush
      const flushResult = await analytics.flush();
      expect(flushResult).toBe(true);

      // Verify the queue is empty after flush (events were processed)
      const finalQueueStatus = eventTracker.getQueueStatus();
      expect(finalQueueStatus.queueSize).toBe(0);

      // Verify analytics status shows it's working
      const status = analytics.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.clientId).toBeTruthy();
      expect(status.sessionId).toBeTruthy();
    });

    test('should handle errors gracefully', async () => {
      // Make fetch fail
      global.fetch.mockRejectedValue(new Error('Network error'));

      await analytics.init();

      // Track an event (should still succeed even if sending fails)
      const result = await analytics.trackError({
        message: 'Test error',
        code: 'TEST_ERROR',
        category: 'test',
        severity: 'warning',
      });

      expect(result).toBe(true);
    });

    test('should validate event names and parameters', async () => {
      await analytics.init();

      // Test invalid event name (should fail)
      const invalidResult = await eventTracker.trackEvent('invalid-event-name');
      expect(invalidResult).toBe(false);

      // Test valid event name (should succeed)
      const validResult = await eventTracker.trackEvent('valid_event_name', {
        valid_param: 'value',
        numeric_param: 123,
      });
      expect(validResult).toBe(true);
    });

    test('should persist client ID across sessions', async () => {
      await analytics.init();
      const firstClientId = await clientManager.getOrCreateClientId();

      // Create new analytics instance (simulating new session)
      const analyticsModule2 = await import('../../js/analytics/analytics.js');
      const analytics2 = analyticsModule2.default;

      await analytics2.init();
      const secondClientId = await clientManager.getOrCreateClientId();

      expect(firstClientId).toBe(secondClientId);
    });

    test('should generate new session IDs over time', async () => {
      await analytics.init();
      const firstSessionId = await sessionManager.getOrCreateSessionId();

      // Clear the in-memory session to force reload from storage
      sessionManager.currentSession = null;

      // Mock time passage (more than 30 minutes)
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 31 * 60 * 1000);

      const secondSessionId = await sessionManager.getOrCreateSessionId();

      expect(firstSessionId).not.toBe(secondSessionId);

      // Restore Date.now
      Date.now = originalDateNow;
    });

    test('should provide comprehensive status information', async () => {
      await analytics.init();

      const status = analytics.getStatus();

      expect(status).toMatchObject({
        initialized: true,
        environment: true,
        queue: expect.objectContaining({
          queueSize: expect.any(Number),
          maxQueueSize: expect.any(Number),
          isProcessing: expect.any(Boolean),
          batchSize: expect.any(Number),
        }),
        clientId: expect.any(String),
        sessionId: expect.any(String),
      });
    });

    test('should handle invalid environment gracefully', async () => {
      // Mock invalid environment
      jest.doMock('../../js/analytics/config.js', () => ({
        MEASUREMENT_ID: 'G-TEST123',
        API_SECRET: 'test-api-secret',
        GA4_ENDPOINT: 'https://www.google-analytics.com/mp/collect',
        isValidEnvironment: () => false,
      }));

      // Reimport analytics with new config
      jest.resetModules();
      const analyticsModule = await import('../../js/analytics/analytics.js');
      const analytics = new analyticsModule.Analytics();

      const initResult = await analytics.init();
      expect(initResult).toBe(false);

      // Tracking should fail gracefully
      const trackResult = await analytics.trackExtensionStartup();
      expect(trackResult).toBe(false);
    });
  });

  describe('Event Queue Management', () => {
    test('should queue and batch events correctly', async () => {
      await analytics.init();

      // Track multiple events quickly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(analytics.trackCustomEvent(`test_event_${i}`, { index: i }));
      }

      const results = await Promise.all(promises);
      results.forEach(result => expect(result).toBe(true));

      // Check queue status
      const queueStatus = eventTracker.getQueueStatus();
      expect(queueStatus.queueSize).toBe(5);

      // Flush and verify queue is empty
      await analytics.flush();
      const finalQueueStatus = eventTracker.getQueueStatus();
      expect(finalQueueStatus.queueSize).toBe(0);
    });

    test('should handle queue overflow correctly', async () => {
      await analytics.init();

      // Set a small queue size for testing
      eventTracker.maxQueueSize = 3;

      // Add more events than the queue can hold
      for (let i = 0; i < 5; i++) {
        await analytics.trackCustomEvent(`overflow_test_${i}`, { index: i });
      }

      const queueStatus = eventTracker.getQueueStatus();
      expect(queueStatus.queueSize).toBeLessThanOrEqual(3);
    });
  });

  describe('Debug Mode', () => {
    test('should enable and disable debug logging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await analytics.init();

      // Enable debug mode
      analytics.setDebugMode(true);
      await analytics.trackCustomEvent('debug_test');

      // Should have debug logs
      expect(consoleSpy).toHaveBeenCalled();

      // Disable debug mode
      consoleSpy.mockClear();
      analytics.setDebugMode(false);
      await analytics.trackCustomEvent('debug_test_2');

      // Should have fewer or no debug logs
      const debugCallsAfterDisable = consoleSpy.mock.calls.filter(
        call => call[0] && call[0].includes('[GA4')
      );
      expect(debugCallsAfterDisable.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Global Error Handler (Task 5.3)', () => {
    test('should skip error handler initialization in non-browser environment', async () => {
      // Store original window state
      const originalWindow = global.window;

      // Remove window to simulate non-browser environment
      delete global.window;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        // Clear the module cache to get a fresh Analytics class
        jest.resetModules();
        const { Analytics } = await import('../../js/analytics/analytics.js');
        const freshAnalytics = new Analytics();

        await freshAnalytics.init();

        // Should not throw and should not log global error handler initialization
        const initMessages = consoleSpy.mock.calls.filter(
          call => call[0] && call[0].includes('Global error handlers initialized')
        );
        expect(initMessages).toHaveLength(0);

        consoleSpy.mockRestore();
      } finally {
        // Restore original window state
        if (originalWindow) {
          global.window = originalWindow;
        }
      }
    });
  });
});
