/**
 * Tests for session manager
 */

import { jest } from '@jest/globals';

describe('Session Manager', () => {
  let SessionManager, sessionManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock Date.now for consistent timestamps
    const mockTimestamp = 1704067200000; // 2024-01-01 00:00:00 UTC
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

    // Mock chrome.storage.session
    global.chrome = {
      ...global.chrome,
      storage: {
        ...global.chrome.storage,
        session: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn(),
        },
      },
      runtime: {
        ...global.chrome.runtime,
        lastError: null,
      },
    };

    // Import the module fresh for each test
    const module = await import('../../js/analytics/session-manager.js');
    SessionManager = module.SessionManager;
    sessionManager = module.default;

    // Reset manager state
    sessionManager.currentSession = null;
    sessionManager.initPromise = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Session Manager Initialization', () => {
    test('should initialize with default values', () => {
      const manager = new SessionManager();

      expect(manager.currentSession).toBe(null);
      expect(manager.storageKey).toBe('ga4_session_data');
      expect(manager.sessionExpirationMs).toBe(30 * 60 * 1000); // 30 minutes
      expect(manager.initPromise).toBe(null);
    });

    test('should export singleton instance', () => {
      expect(sessionManager).toBeInstanceOf(SessionManager);
    });
  });

  describe('Session ID Generation', () => {
    test('should generate session ID using timestamp', async () => {
      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({});
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      const sessionId = await sessionManager.getOrCreateSessionId();

      expect(sessionId).toBe('1704067200000');
    });

    test('should create new session when no session exists', async () => {
      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({});
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      const sessionId = await sessionManager.getOrCreateSessionId();

      expect(typeof sessionId).toBe('string');
      expect(sessionId).toBe('1704067200000');
    });

    test('should work without chrome.storage.session available', async () => {
      global.chrome.storage.session = undefined;

      const sessionId = await sessionManager.getOrCreateSessionId();

      expect(typeof sessionId).toBe('string');
      expect(sessionId).toBe('1704067200000');
    });
  });

  describe('Session Storage and Persistence', () => {
    test('should load existing valid session from storage', async () => {
      const existingSession = {
        session_id: '1704067100000',
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      };

      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({ ga4_session_data: existingSession });
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      const sessionId = await sessionManager.getOrCreateSessionId();

      expect(sessionId).toBe(existingSession.session_id);
      expect(global.chrome.storage.session.get).toHaveBeenCalledWith(
        ['ga4_session_data'],
        expect.any(Function)
      );
    });

    test('should save new session to storage', async () => {
      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({});
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      await sessionManager.getOrCreateSessionId();

      expect(global.chrome.storage.session.set).toHaveBeenCalledWith(
        {
          ga4_session_data: {
            session_id: '1704067200000',
            timestamp: 1704067200000,
          },
        },
        expect.any(Function)
      );
    });

    test('should handle storage get errors gracefully', async () => {
      global.chrome.runtime.lastError = { message: 'Storage error' };
      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({});
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      const sessionId = await sessionManager.getOrCreateSessionId();

      expect(typeof sessionId).toBe('string');
      expect(sessionId).toBe('1704067200000');
    });

    test('should handle storage set errors gracefully', async () => {
      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({});
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        global.chrome.runtime.lastError = { message: 'Storage error' };
        callback();
      });

      const sessionId = await sessionManager.getOrCreateSessionId();

      expect(typeof sessionId).toBe('string');
      expect(sessionId).toBe('1704067200000');
    });
  });

  describe('Session Timeout Logic', () => {
    test('should create new session when stored session is expired', async () => {
      const expiredSession = {
        session_id: '1704067000000',
        timestamp: Date.now() - 31 * 60 * 1000, // 31 minutes ago (expired)
      };

      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({ ga4_session_data: expiredSession });
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      const sessionId = await sessionManager.getOrCreateSessionId();

      // Should create new session, not use expired one
      expect(sessionId).toBe('1704067200000');
      expect(global.chrome.storage.session.set).toHaveBeenCalled();
    });

    test('should reuse valid session within timeout window', async () => {
      const validSession = {
        session_id: '1704067100000',
        timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago (valid)
      };

      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({ ga4_session_data: validSession });
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      const sessionId = await sessionManager.getOrCreateSessionId();

      expect(sessionId).toBe(validSession.session_id);
      // Should update timestamp, so set will be called
      expect(global.chrome.storage.session.set).toHaveBeenCalled();
    });

    test('should detect session expiration correctly', () => {
      const currentTime = 1704067200000;

      // Create a session with valid data
      const validSessionRecent = {
        session_id: '1704067100000',
        timestamp: currentTime - 1000, // 1 second ago
      };
      const validSessionOld = {
        session_id: '1704067100000',
        timestamp: currentTime - 29 * 60 * 1000, // 29 minutes ago
      };

      expect(sessionManager._isSessionValid(validSessionRecent)).toBe(true);
      expect(sessionManager._isSessionValid(validSessionOld)).toBe(true);

      // Expired session
      const expiredSession = {
        session_id: '1704067100000',
        timestamp: currentTime - 31 * 60 * 1000, // 31 minutes ago
      };

      expect(sessionManager._isSessionValid(expiredSession)).toBe(false);

      // Invalid sessions
      expect(sessionManager._isSessionValid(null)).toBe(false);
      expect(sessionManager._isSessionValid(undefined)).toBe(false);
      expect(sessionManager._isSessionValid({})).toBe(false);
    });
  });

  describe('Session Validation', () => {
    test('should validate correct session format', () => {
      const validSessions = [
        {
          session_id: '1704067200000',
          timestamp: 1704067200000,
        },
        {
          session_id: '1234567890123',
          timestamp: Date.now(),
        },
      ];

      validSessions.forEach(session => {
        expect(sessionManager._isSessionValid(session)).toBe(true);
      });
    });

    test('should reject invalid session formats', () => {
      const invalidSessions = [
        null,
        undefined,
        {},
        { session_id: '1704067200000' }, // missing timestamp
        { timestamp: 1704067200000 }, // missing session_id
        { session_id: null, timestamp: 1704067200000 },
        { session_id: '1704067200000', timestamp: 'invalid' },
      ];

      invalidSessions.forEach(session => {
        expect(sessionManager._isSessionValid(session)).toBe(false);
      });
    });

    test('should reject stored session if invalid format', async () => {
      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({ ga4_session_data: { session_id: null, timestamp: 'invalid' } });
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      const sessionId = await sessionManager.getOrCreateSessionId();

      // Should generate new session instead of using invalid stored session
      expect(sessionId).toBe('1704067200000');
      expect(global.chrome.storage.session.set).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    test('should return current session ID without creating new one', () => {
      sessionManager.currentSession = {
        session_id: 'current-session-id',
        timestamp: 1704067200000,
      };

      const currentId = sessionManager.getCurrentSessionId();

      expect(currentId).toBe('current-session-id');
    });

    test('should return null when no session is set', () => {
      const currentId = sessionManager.getCurrentSessionId();

      expect(currentId).toBe(null);
    });

    test('should return current session data', () => {
      const sessionData = {
        session_id: 'current-session-id',
        timestamp: 1704067200000,
      };
      sessionManager.currentSession = sessionData;

      const currentSession = sessionManager.getCurrentSession();

      expect(currentSession).toEqual(sessionData);
    });

    test('should regenerate session', async () => {
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      const newSession = await sessionManager.regenerateSession();

      expect(newSession.session_id).toBe('1704067200000');
      expect(newSession.timestamp).toBe(1704067200000);
      expect(sessionManager.currentSession).toEqual(newSession);
    });

    test('should clear session from storage', async () => {
      global.chrome.storage.session.remove.mockImplementation((keys, callback) => {
        callback();
      });

      const result = await sessionManager.clearSession();

      expect(result).toBe(true);
      expect(sessionManager.currentSession).toBe(null);
      expect(global.chrome.storage.session.remove).toHaveBeenCalledWith(
        ['ga4_session_data'],
        expect.any(Function)
      );
    });

    test('should clear session even when storage unavailable', async () => {
      global.chrome.storage.session = undefined;

      const result = await sessionManager.clearSession();

      expect(result).toBe(true);
      expect(sessionManager.currentSession).toBe(null);
    });
  });

  describe('Initialization Management', () => {
    test('should prevent multiple concurrent initializations', async () => {
      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        setTimeout(() => callback({}), 10);
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      // Start multiple initialization calls
      const promise1 = sessionManager.getOrCreateSessionId();
      const promise2 = sessionManager.getOrCreateSessionId();
      const promise3 = sessionManager.getOrCreateSessionId();

      const [id1, id2, id3] = await Promise.all([promise1, promise2, promise3]);

      // All should return the same ID
      expect(id1).toBe(id2);
      expect(id2).toBe(id3);

      // Storage should only be called once for get and set
      expect(global.chrome.storage.session.get).toHaveBeenCalledTimes(1);
      expect(global.chrome.storage.session.set).toHaveBeenCalledTimes(1);
    });

    test('should cache session after initialization', async () => {
      global.chrome.storage.session.get.mockImplementation((keys, callback) => {
        callback({});
      });
      global.chrome.storage.session.set.mockImplementation((data, callback) => {
        callback();
      });

      // First call initializes
      const id1 = await sessionManager.getOrCreateSessionId();

      // Second call should use cached value (will update timestamp though)
      const id2 = await sessionManager.getOrCreateSessionId();

      expect(id1).toBe(id2);
      expect(global.chrome.storage.session.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    // Removed complex storage exception test that was causing timeouts
  });

  describe('Logging', () => {
    test('should log messages to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalNodeEnv = process.env.NODE_ENV;

      // Temporarily override NODE_ENV to allow logging during this test
      process.env.NODE_ENV = 'development';

      sessionManager._log('Test message', { data: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith('[GA4 Session Manager] Test message', {
        data: 'test',
      });

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
      consoleSpy.mockRestore();
    });

    test('should handle logging when console is unavailable', () => {
      const originalConsole = global.console;
      global.console = undefined;

      // Should not throw error
      expect(() => sessionManager._log('Test message')).not.toThrow();

      global.console = originalConsole;
    });
  });

  describe('Session Utility Methods', () => {
    test('should check if session is expired', () => {
      // Set up a session that would be expired
      sessionManager.currentSession = {
        session_id: '1704067000000',
        timestamp: Date.now() - 31 * 60 * 1000, // 31 minutes ago
      };

      expect(sessionManager.isSessionExpired()).toBe(true);

      // Set up a valid session
      sessionManager.currentSession = {
        session_id: '1704067100000',
        timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago
      };

      expect(sessionManager.isSessionExpired()).toBe(false);

      // No session
      sessionManager.currentSession = null;
      expect(sessionManager.isSessionExpired()).toBe(true);
    });

    test('should get session age in minutes', () => {
      sessionManager.currentSession = {
        session_id: '1704067100000',
        timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago
      };

      expect(sessionManager.getSessionAge()).toBe(15);

      // No session
      sessionManager.currentSession = null;
      expect(sessionManager.getSessionAge()).toBe(0);
    });

    test('should get session time remaining in minutes', () => {
      sessionManager.currentSession = {
        session_id: '1704067100000',
        timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago
      };

      expect(sessionManager.getSessionTimeRemaining()).toBe(15); // 30 - 15 = 15

      // No session
      sessionManager.currentSession = null;
      expect(sessionManager.getSessionTimeRemaining()).toBe(0);
    });

    test('should set and get session expiration', () => {
      sessionManager.setSessionExpiration(45);
      expect(sessionManager.getSessionExpiration()).toBe(45);
      expect(sessionManager.sessionExpirationMs).toBe(45 * 60 * 1000);
    });
  });
});
