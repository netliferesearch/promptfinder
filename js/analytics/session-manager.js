/**
 * GA4 Analytics Session Manager
 *
 * Manages session ID generation and persistence for Google Analytics 4
 * Uses chrome.storage.session for temporary session storage with timeout logic
 * Based on Chrome Extension GA4 documentation recommendations
 */

import { SESSION_EXPIRATION_IN_MIN } from './config.js';

/**
 * Session Manager Class
 * Handles session ID generation, storage, timeout management, and retrieval
 */
class SessionManager {
  constructor() {
    this.currentSession = null;
    this.storageKey = 'ga4_session_data';
    this.sessionExpirationMs = SESSION_EXPIRATION_IN_MIN * 60 * 1000; // Convert to milliseconds
    this.initPromise = null;
  }

  /**
   * Initialize the session manager
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._loadOrCreateSession();
    return this.initPromise;
  }

  /**
   * Get or create a session ID
   * @returns {Promise<string>} The session ID
   */
  async getOrCreateSessionId() {
    // Ensure initialization is complete
    await this.init();

    // Check if current session is still valid
    if (this._isSessionValid(this.currentSession)) {
      return this.currentSession.session_id;
    }

    // Session expired or invalid, create new one
    await this._createNewSession();
    return this.currentSession.session_id;
  }

  /**
   * Load existing session from storage or create a new one
   * @private
   * @returns {Promise<void>}
   */
  async _loadOrCreateSession() {
    try {
      // First, try to load existing session from storage
      const existingSession = await this._loadSessionFromStorage();

      if (existingSession && this._isSessionValid(existingSession)) {
        this.currentSession = existingSession;
        this._log('Loaded existing session from storage');
        // Update timestamp since we're accessing the session
        await this._updateSessionTimestamp();
        return;
      }

      // If no valid session exists, create a new one
      await this._createNewSession();
    } catch (error) {
      this._log('Error managing session:', error);
      // Fallback to creating a new session without storage if there are issues
      this.currentSession = this._generateSessionData();
    }
  }

  /**
   * Create a new session
   * @private
   * @returns {Promise<void>}
   */
  async _createNewSession() {
    this.currentSession = this._generateSessionData();
    await this._saveSessionToStorage(this.currentSession);
    this._log('Created new session:', this.currentSession.session_id);
  }

  /**
   * Generate new session data
   * @private
   * @returns {Object} Session data object
   */
  _generateSessionData() {
    const currentTimeInMs = Date.now();
    return {
      session_id: currentTimeInMs.toString(),
      timestamp: currentTimeInMs,
    };
  }

  /**
   * Check if a session is valid (not expired)
   * @private
   * @param {Object} session - Session data object
   * @returns {boolean} Whether the session is valid
   */
  _isSessionValid(session) {
    if (!session || typeof session !== 'object') {
      return false;
    }

    if (!session.session_id || typeof session.session_id !== 'string') {
      return false;
    }

    if (!session.timestamp || typeof session.timestamp !== 'number' || session.timestamp <= 0) {
      return false;
    }

    const currentTimeInMs = Date.now();
    const sessionAge = currentTimeInMs - session.timestamp;

    // Check if session has expired
    if (sessionAge > this.sessionExpirationMs) {
      this._log(`Session expired. Age: ${Math.round(sessionAge / 60000)} minutes`);
      return false;
    }

    return true;
  }

  /**
   * Update session timestamp to keep it alive
   * @private
   * @returns {Promise<void>}
   */
  async _updateSessionTimestamp() {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.timestamp = Date.now();
    await this._saveSessionToStorage(this.currentSession);
    this._log('Session timestamp updated');
  }

  /**
   * Load session data from chrome.storage.session
   * @private
   * @returns {Promise<Object|null>} Stored session data or null
   */
  async _loadSessionFromStorage() {
    return new Promise(resolve => {
      if (!this._isChromeStorageSessionAvailable()) {
        resolve(null);
        return;
      }

      try {
        chrome.storage.session.get([this.storageKey], result => {
          if (chrome.runtime.lastError) {
            this._log('Error loading session from storage:', chrome.runtime.lastError);
            resolve(null);
            return;
          }

          const sessionData = result[this.storageKey];
          resolve(sessionData || null);
        });
      } catch (error) {
        this._log('Error accessing chrome.storage.session:', error);
        resolve(null);
      }
    });
  }

  /**
   * Save session data to chrome.storage.session
   * @private
   * @param {Object} sessionData - Session data to save
   * @returns {Promise<boolean>} Success status
   */
  async _saveSessionToStorage(sessionData) {
    return new Promise(resolve => {
      if (!this._isChromeStorageSessionAvailable()) {
        resolve(false);
        return;
      }

      try {
        chrome.storage.session.set({ [this.storageKey]: sessionData }, () => {
          if (chrome.runtime.lastError) {
            this._log('Error saving session to storage:', chrome.runtime.lastError);
            resolve(false);
            return;
          }

          this._log('Session saved to storage successfully');
          resolve(true);
        });
      } catch (error) {
        this._log('Error accessing chrome.storage.session for save:', error);
        resolve(false);
      }
    });
  }

  /**
   * Check if chrome.storage.session is available
   * @private
   * @returns {boolean} Whether chrome.storage.session is available
   */
  _isChromeStorageSessionAvailable() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session;
  }

  /**
   * Get current session ID (without creating new one)
   * @returns {string|null} Current session ID or null if not initialized
   */
  getCurrentSessionId() {
    return this.currentSession ? this.currentSession.session_id : null;
  }

  /**
   * Get current session data
   * @returns {Object|null} Current session data or null if not initialized
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Force creation of a new session (useful for testing or session reset)
   * @returns {Promise<Object>} New session data
   */
  async regenerateSession() {
    try {
      await this._createNewSession();
      this._log('Session regenerated successfully');
      return this.currentSession;
    } catch (error) {
      this._log('Error regenerating session:', error);
      throw error;
    }
  }

  /**
   * Clear stored session (for privacy/reset purposes)
   * @returns {Promise<boolean>} Success status
   */
  async clearSession() {
    return new Promise(resolve => {
      if (!this._isChromeStorageSessionAvailable()) {
        this.currentSession = null;
        resolve(true);
        return;
      }

      try {
        chrome.storage.session.remove([this.storageKey], () => {
          if (chrome.runtime.lastError) {
            this._log('Error clearing session from storage:', chrome.runtime.lastError);
            resolve(false);
            return;
          }

          this.currentSession = null;
          this._log('Session cleared from storage');
          resolve(true);
        });
      } catch (error) {
        this._log('Error accessing chrome.storage.session for clear:', error);
        this.currentSession = null;
        resolve(false);
      }
    });
  }

  /**
   * Check if current session is expired
   * @returns {boolean} Whether the current session is expired
   */
  isSessionExpired() {
    return !this._isSessionValid(this.currentSession);
  }

  /**
   * Get session age in minutes
   * @returns {number} Session age in minutes, or 0 if no session
   */
  getSessionAge() {
    if (!this.currentSession || !this.currentSession.timestamp) {
      return 0;
    }
    return Math.round((Date.now() - this.currentSession.timestamp) / (60 * 1000));
  }

  /**
   * Get remaining time before session expires (in minutes)
   * @returns {number} Remaining time in minutes, or 0 if expired/no session
   */
  getSessionTimeRemaining() {
    if (!this.currentSession) {
      return 0;
    }

    const sessionAgeMinutes = this.getSessionAge();
    const sessionExpirationMinutes = this.sessionExpirationMs / (60 * 1000);
    const timeRemaining = sessionExpirationMinutes - sessionAgeMinutes;
    return Math.max(0, Math.round(timeRemaining));
  }

  /**
   * Set custom session expiration time
   * @param {number} minutes - Expiration time in minutes
   */
  setSessionExpiration(minutes) {
    this.sessionExpirationMs = minutes * 60 * 1000;
    this._log(`Session expiration set to ${minutes} minutes`);
  }

  /**
   * Get current session expiration time in minutes
   * @returns {number} Expiration time in minutes
   */
  getSessionExpiration() {
    return this.sessionExpirationMs / (60 * 1000);
  }

  /**
   * Log messages (in development mode)
   * @private
   * @param {string} message - Message to log
   * @param {*} data - Optional data to log
   */
  _log(message, data = null) {
    // Only log in development environments
    // Browser-safe logging - avoid process.env which doesn't exist in browsers
    if (typeof console !== 'undefined' && console.log) {
      const prefix = '[GA4 Session Manager]';
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Export singleton instance and class
export { sessionManager as default, SessionManager };
