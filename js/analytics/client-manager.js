/**
 * GA4 Analytics Client Manager
 *
 * Manages client ID generation and persistence for Google Analytics 4
 * Uses crypto.randomUUID() for unique ID generation and chrome.storage.local for persistence
 */

/**
 * Client Manager Class
 * Handles client ID generation, storage, and retrieval
 */
class ClientManager {
  constructor() {
    this.clientId = null;
    this.storageKey = 'ga4_client_id';
    this.initPromise = null;
  }

  /**
   * Initialize the client manager
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._loadOrCreateClientId();
    return this.initPromise;
  }

  /**
   * Get or create a client ID
   * @returns {Promise<string>} The client ID
   */
  async getOrCreateClientId() {
    // Ensure initialization is complete
    await this.init();
    return this.clientId;
  }

  /**
   * Load existing client ID from storage or create a new one
   * @private
   * @returns {Promise<void>}
   */
  async _loadOrCreateClientId() {
    try {
      // First, try to load existing client ID from storage
      const existingClientId = await this._loadClientIdFromStorage();

      if (existingClientId && this._isValidClientId(existingClientId)) {
        this.clientId = existingClientId;
        this._log('Loaded existing client ID from storage');
        return;
      }

      // If no valid client ID exists, create a new one
      const newClientId = await this._generateClientId();
      await this._saveClientIdToStorage(newClientId);
      this.clientId = newClientId;
      this._log('Generated and saved new client ID');
    } catch (error) {
      this._log('Error managing client ID:', error);
      // Fallback to a new ID without storage if there are issues
      this.clientId = await this._generateClientId();
    }
  }

  /**
   * Generate a new client ID using crypto.randomUUID()
   * @private
   * @returns {Promise<string>} Generated client ID
   */
  async _generateClientId() {
    try {
      // Use crypto.randomUUID() if available (modern browsers and service workers)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }

      // Fallback for environments where crypto.randomUUID is not available
      if (typeof self !== 'undefined' && self.crypto && self.crypto.randomUUID) {
        return self.crypto.randomUUID();
      }

      // Additional fallback using crypto.getRandomValues if randomUUID is not available
      return this._generateClientIdFallback();
    } catch (error) {
      this._log('Error generating client ID with crypto.randomUUID(), using fallback:', error);
      return this._generateClientIdFallback();
    }
  }

  /**
   * Fallback client ID generation using crypto.getRandomValues
   * @private
   * @returns {string} Generated client ID in UUID format
   */
  _generateClientIdFallback() {
    try {
      // Generate a UUID v4 using crypto.getRandomValues
      const array = new Uint8Array(16);
      const cryptoObj = typeof crypto !== 'undefined' ? crypto : self.crypto;

      if (cryptoObj && cryptoObj.getRandomValues) {
        cryptoObj.getRandomValues(array);

        // Set version (4) and variant bits according to RFC 4122
        array[6] = (array[6] & 0x0f) | 0x40; // Version 4
        array[8] = (array[8] & 0x3f) | 0x80; // Variant 10

        // Convert to UUID string format
        const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
      }

      // Last resort fallback using Math.random (not cryptographically secure)
      this._log('Warning: Using Math.random fallback for client ID generation');
      return this._generateClientIdMathRandom();
    } catch (error) {
      this._log('Error in fallback client ID generation:', error);
      return this._generateClientIdMathRandom();
    }
  }

  /**
   * Math.random based client ID generation (last resort)
   * @private
   * @returns {string} Generated client ID
   */
  _generateClientIdMathRandom() {
    // Generate a pseudo-UUID using Math.random (not secure, but functional)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Load client ID from chrome.storage.local
   * @private
   * @returns {Promise<string|null>} Stored client ID or null
   */
  async _loadClientIdFromStorage() {
    return new Promise(resolve => {
      if (!this._isChromeStorageAvailable()) {
        resolve(null);
        return;
      }

      try {
        chrome.storage.local.get([this.storageKey], result => {
          if (chrome.runtime.lastError) {
            this._log('Error loading client ID from storage:', chrome.runtime.lastError);
            resolve(null);
            return;
          }

          const clientId = result[this.storageKey];
          resolve(clientId || null);
        });
      } catch (error) {
        this._log('Error accessing chrome.storage.local:', error);
        resolve(null);
      }
    });
  }

  /**
   * Save client ID to chrome.storage.local
   * @private
   * @param {string} clientId - Client ID to save
   * @returns {Promise<boolean>} Success status
   */
  async _saveClientIdToStorage(clientId) {
    return new Promise(resolve => {
      if (!this._isChromeStorageAvailable()) {
        resolve(false);
        return;
      }

      try {
        chrome.storage.local.set({ [this.storageKey]: clientId }, () => {
          if (chrome.runtime.lastError) {
            this._log('Error saving client ID to storage:', chrome.runtime.lastError);
            resolve(false);
            return;
          }

          this._log('Client ID saved to storage successfully');
          resolve(true);
        });
      } catch (error) {
        this._log('Error accessing chrome.storage.local for save:', error);
        resolve(false);
      }
    });
  }

  /**
   * Check if chrome.storage.local is available
   * @private
   * @returns {boolean} Whether chrome.storage.local is available
   */
  _isChromeStorageAvailable() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  /**
   * Validate client ID format
   * @private
   * @param {string} clientId - Client ID to validate
   * @returns {boolean} Whether the client ID is valid
   */
  _isValidClientId(clientId) {
    if (!clientId || typeof clientId !== 'string') {
      return false;
    }

    // Check for basic UUID format (with or without hyphens)
    const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
    return uuidRegex.test(clientId);
  }

  /**
   * Get current client ID (without generating new one)
   * @returns {string|null} Current client ID or null if not initialized
   */
  getCurrentClientId() {
    return this.clientId;
  }

  /**
   * Force regeneration of client ID (useful for testing or privacy reset)
   * @returns {Promise<string>} New client ID
   */
  async regenerateClientId() {
    try {
      const newClientId = await this._generateClientId();
      await this._saveClientIdToStorage(newClientId);
      this.clientId = newClientId;
      this._log('Client ID regenerated successfully');
      return newClientId;
    } catch (error) {
      this._log('Error regenerating client ID:', error);
      throw error;
    }
  }

  /**
   * Clear stored client ID (for privacy/reset purposes)
   * @returns {Promise<boolean>} Success status
   */
  async clearClientId() {
    return new Promise(resolve => {
      if (!this._isChromeStorageAvailable()) {
        this.clientId = null;
        resolve(true);
        return;
      }

      try {
        chrome.storage.local.remove([this.storageKey], () => {
          if (chrome.runtime.lastError) {
            this._log('Error clearing client ID from storage:', chrome.runtime.lastError);
            resolve(false);
            return;
          }

          this.clientId = null;
          this._log('Client ID cleared from storage');
          resolve(true);
        });
      } catch (error) {
        this._log('Error accessing chrome.storage.local for clear:', error);
        this.clientId = null;
        resolve(false);
      }
    });
  }

  /**
   * Log messages (in development mode)
   * @private
   * @param {string} message - Message to log
   * @param {*} data - Optional data to log
   */
  _log(message, data = null) {
    // Only log in development environments
    // This could be enhanced to check config.enableConsoleLogging if needed
    if (typeof console !== 'undefined' && console.log) {
      const prefix = '[GA4 Client Manager]';
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }
}

// Create singleton instance
const clientManager = new ClientManager();

// Export singleton instance and class
export { clientManager as default, ClientManager };
