/**
 * Google Analytics 4 gtag Integration for DesignPrompts Chrome Extension
 * Bridges the DesignPrompts analytics implementation with GA4 Measurement Protocol API
 *
 * Handles the actual sending of events to GA4
 */

/**
 * Chrome Extension Analytics Integration Class
 */
class GtagIntegration {
  constructor() {
    this.isInitialized = false;
    this.consentGranted = false;
    this.measurementId = 'G-NS4KTS6DW6'; // Production measurement ID
    this.apiSecret = 'EoT-jYQSSZONfT5S-WzSAA'; // API secret for Measurement Protocol
    this.initPromise = null;
    this.clientId = null;
  }

  /**
   * Initialize Chrome extension analytics integration
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInit();
    return this.initPromise;
  }

  /**
   * Perform initialization
   * @private
   */
  async _performInit() {
    try {
      // Wait for Chrome extension analytics to be available
      await this._waitForChromeAnalytics();

      // Check consent status
      this._checkConsentStatus();

      // Get or generate client ID
      this.clientId = this._getClientId();

      this.isInitialized = true;
      console.log('[ChromeAnalytics] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[ChromeAnalytics] Initialization failed:', error);
      this.isInitialized = true; // Mark as initialized to prevent loops
      return false;
    }
  }

  /**
   * Wait for Chrome extension analytics to be available
   * @private
   */
  async _waitForChromeAnalytics() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds

      const checkAnalytics = () => {
        if (typeof window !== 'undefined' && typeof window.sendAnalyticsEvent === 'function') {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Chrome extension analytics not available after waiting'));
        } else {
          attempts++;
          setTimeout(checkAnalytics, 100);
        }
      };

      checkAnalytics();
    });
  }

  /**
   * Check current consent status
   * @private
   */
  _checkConsentStatus() {
    if (typeof window !== 'undefined') {
      this.consentGranted = window.analytics_consent_granted || false;

      // Listen for consent changes
      window.addEventListener('analytics_consent_changed', event => {
        this.consentGranted = event.detail.granted;
      });
    }
  }

  /**
   * Get or generate client ID
   * @private
   */
  _getClientId() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      let clientId = localStorage.getItem('ga_client_id');
      if (!clientId) {
        clientId = Date.now().toString() + Math.random().toString(36).substr(2);
        localStorage.setItem('ga_client_id', clientId);
      }
      return clientId;
    }
    return 'unknown-client';
  }

  /**
   * Send event to Chrome extension analytics
   * @param {string} eventName - Event name
   * @param {Object} parameters - Event parameters
   * @returns {Promise<boolean>} Success status
   */
  async sendEvent(eventName, parameters = {}) {
    try {
      await this.init();

      // Check if analytics is disabled
      if (typeof window !== 'undefined' && window.analytics_disabled) {
        console.log('[ChromeAnalytics] Analytics disabled, skipping event');
        return false;
      }

      // Only send events if consent is granted
      if (!this.consentGranted) {
        console.log('[ChromeAnalytics] Analytics consent not granted, skipping event');
        return false;
      }

      if (typeof window !== 'undefined' && typeof window.sendAnalyticsEvent === 'function') {
        // Clean and prepare parameters
        const cleanParameters = this._cleanParameters(parameters);

        // Send event via Chrome extension analytics
        window.sendAnalyticsEvent(eventName, cleanParameters);

        console.log(`[ChromeAnalytics] Event sent: ${eventName}`, cleanParameters);
        return true;
      } else {
        console.warn('[ChromeAnalytics] Chrome extension analytics not available');
        return false;
      }
    } catch (error) {
      console.error('[ChromeAnalytics] Failed to send event:', error);
      return false;
    }
  }

  /**
   * Send page view event
   * @param {Object} pageData - Page view data
   * @returns {Promise<boolean>} Success status
   */
  async sendPageView(pageData = {}) {
    try {
      await this.init();

      if (!this.consentGranted) {
        console.log('[GtagIntegration] Analytics consent not granted, skipping page view');
        return false;
      }

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        const cleanPageData = this._cleanParameters(pageData);

        window.gtag('config', this.measurementId, {
          page_title: cleanPageData.page_title || document.title,
          page_location: cleanPageData.page_location || window.location.href,
          custom_map: cleanPageData.custom_map || {},
        });

        console.log('[GtagIntegration] Page view sent', cleanPageData);
        return true;
      } else {
        console.warn('[GtagIntegration] gtag not available for page view');
        return false;
      }
    } catch (error) {
      console.error('[ChromeAnalytics] Failed to send page view:', error);
      return false;
    }
  }

  /**
   * Set user properties
   * @param {Object} properties - User properties
   * @returns {Promise<boolean>} Success status
   */
  async setUserProperties(properties = {}) {
    try {
      await this.init();

      if (!this.consentGranted) {
        console.log('[GtagIntegration] Analytics consent not granted, skipping user properties');
        return false;
      }

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        const cleanProperties = this._cleanParameters(properties);

        window.gtag('config', this.measurementId, {
          user_properties: cleanProperties,
        });

        console.log('[GtagIntegration] User properties set', cleanProperties);
        return true;
      } else {
        console.warn('[GtagIntegration] gtag not available for user properties');
        return false;
      }
    } catch (error) {
      console.error('[ChromeAnalytics] Failed to set user properties:', error);
      return false;
    }
  }

  /**
   * Clean and validate parameters
   * @private
   * @param {Object} parameters - Raw parameters
   * @returns {Object} Cleaned parameters
   */
  _cleanParameters(parameters) {
    const cleaned = {};

    for (const [key, value] of Object.entries(parameters)) {
      // Skip undefined, null, or empty values
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Ensure key is a valid string
      const cleanKey = String(key).replace(/[^a-zA-Z0-9_]/g, '_');

      // Clean value based on type
      let cleanValue = value;
      if (typeof value === 'string') {
        // Truncate long strings and remove special characters
        cleanValue = value.substring(0, 100).replace(/[^\w\s\-_.@]/g, '');
      } else if (typeof value === 'number') {
        // Ensure number is finite
        cleanValue = isFinite(value) ? value : 0;
      } else if (typeof value === 'boolean') {
        cleanValue = value;
      } else {
        // Convert other types to string
        cleanValue = String(value).substring(0, 100);
      }

      cleaned[cleanKey] = cleanValue;
    }

    return cleaned;
  }

  /**
   * Grant analytics consent
   */
  grantConsent() {
    this.consentGranted = true;

    if (typeof window !== 'undefined') {
      window.analytics_consent_granted = true;

      // Dispatch consent change event
      window.dispatchEvent(
        new CustomEvent('analytics_consent_changed', {
          detail: { granted: true },
        })
      );

      // Update gtag consent
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      }
    }
  }

  /**
   * Deny analytics consent
   */
  denyConsent() {
    this.consentGranted = false;

    if (typeof window !== 'undefined') {
      window.analytics_consent_granted = false;

      // Dispatch consent change event
      window.dispatchEvent(
        new CustomEvent('analytics_consent_changed', {
          detail: { granted: false },
        })
      );

      // Update gtag consent
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
        });
      }
    }
  }

  /**
   * Check if gtag is available
   * @returns {boolean} True if gtag is available
   */
  isGtagAvailable() {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
  }

  /**
   * Get current status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      consentGranted: this.consentGranted,
      gtagAvailable: this.isGtagAvailable(),
      measurementId: this.measurementId,
    };
  }
}

// Create and export singleton instance
const gtagIntegration = new GtagIntegration();

export default gtagIntegration;
