/**
 * User Property Manager
 *
 * Manages user properties for GA4 analytics including account age,
 * user type classification, and preferences tracking
 */

import { USER_PROPERTIES } from './event-schema.js';

/**
 * User Property Manager Class
 * Handles persistence and calculation of user properties
 */
class UserPropertyManager {
  constructor() {
    this.initialized = false;
    this.userProperties = {};
    this.storageKey = 'pf_user_properties';
  }

  /**
   * Initialize the user property manager
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    if (this.initialized) {
      return true;
    }

    try {
      await this.loadUserProperties();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[UserPropertyManager] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Load user properties from storage
   * @private
   * @returns {Promise<void>}
   */
  async loadUserProperties() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(this.storageKey);
        this.userProperties = result[this.storageKey] || {};
      } else {
        // Fallback for non-extension environments
        this.userProperties = {};
      }
    } catch (error) {
      console.error('[UserPropertyManager] Failed to load user properties:', error);
      this.userProperties = {};
    }
  }

  /**
   * Save user properties to storage
   * @private
   * @returns {Promise<void>}
   */
  async saveUserProperties() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({
          [this.storageKey]: this.userProperties,
        });
      }
    } catch (error) {
      console.error('[UserPropertyManager] Failed to save user properties:', error);
    }
  }

  /**
   * Set account installation date (called once on first install)
   * @returns {Promise<void>}
   */
  async setInstallDate() {
    await this.init();

    if (!this.userProperties.extension_install_date) {
      this.userProperties.extension_install_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      await this.saveUserProperties();
    }
  }

  /**
   * Calculate and update account age in days
   * @returns {Promise<number>} Account age in days
   */
  async updateAccountAge() {
    await this.init();

    const installDate = this.userProperties.extension_install_date;
    if (!installDate) {
      // Set install date if not set and return 0
      await this.setInstallDate();
      return 0;
    }

    const today = new Date();
    const install = new Date(installDate);
    const diffTime = Math.abs(today - install);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.userProperties.account_age_days = diffDays;
    await this.saveUserProperties();

    return diffDays;
  }

  /**
   * Update last active date
   * @returns {Promise<void>}
   */
  async updateLastActiveDate() {
    await this.init();

    this.userProperties.last_active_date = new Date().toISOString().split('T')[0];
    await this.saveUserProperties();
  }

  /**
   * Update total prompts created counter
   * @param {number} increment - Amount to increment (default 1)
   * @returns {Promise<number>} New total
   */
  async updatePromptsCreated(increment = 1) {
    await this.init();

    const current = this.userProperties.total_prompts_created || 0;
    const newTotal = current + increment;

    this.userProperties.total_prompts_created = newTotal;
    await this.saveUserProperties();

    return newTotal;
  }

  /**
   * Update total prompts favorited counter
   * @param {number} increment - Amount to increment (default 1)
   * @returns {Promise<number>} New total
   */
  async updatePromptsFavorited(increment = 1) {
    await this.init();

    const current = this.userProperties.total_prompts_favorited || 0;
    const newTotal = current + increment;

    this.userProperties.total_prompts_favorited = newTotal;
    await this.saveUserProperties();

    return newTotal;
  }

  /**
   * Classify user type based on their activity
   * @returns {Promise<string>} User type classification
   */
  async calculateUserType() {
    await this.init();

    const accountAge = this.userProperties.account_age_days || 0;
    const promptsCreated = this.userProperties.total_prompts_created || 0;
    const promptsFavorited = this.userProperties.total_prompts_favorited || 0;

    let userType = 'new';

    if (accountAge >= 30) {
      if (promptsCreated >= 10 || promptsFavorited >= 20) {
        userType = 'power_user';
      } else if (promptsCreated >= 5 || promptsFavorited >= 10) {
        userType = 'active';
      } else {
        userType = 'returning';
      }
    } else if (accountAge >= 7) {
      if (promptsCreated >= 3 || promptsFavorited >= 5) {
        userType = 'engaged';
      } else {
        userType = 'returning';
      }
    }

    this.userProperties.user_type = userType;
    await this.saveUserProperties();

    return userType;
  }

  /**
   * Add a category to preferred categories
   * @param {string} category - Category to add
   * @returns {Promise<Array>} Updated preferred categories
   */
  async addPreferredCategory(category) {
    await this.init();

    const categories = this.userProperties.preferred_categories || [];

    // Add category if not already present
    if (!categories.includes(category)) {
      categories.push(category);

      // Keep only top 10 most recent categories
      if (categories.length > 10) {
        categories.shift();
      }
    } else {
      // Move to end if already present (most recent)
      const index = categories.indexOf(category);
      categories.splice(index, 1);
      categories.push(category);
    }

    this.userProperties.preferred_categories = categories;
    await this.saveUserProperties();

    return categories;
  }

  /**
   * Get all current user properties
   * @returns {Promise<Object>} Current user properties
   */
  async getUserProperties() {
    await this.init();

    // Update dynamic properties
    await this.updateAccountAge();
    await this.updateLastActiveDate();
    await this.calculateUserType();

    return { ...this.userProperties };
  }

  /**
   * Get specific user property
   * @param {string} propertyName - Property name
   * @returns {Promise<*>} Property value
   */
  async getUserProperty(propertyName) {
    await this.init();

    if (propertyName === 'account_age_days') {
      return await this.updateAccountAge();
    }

    if (propertyName === 'user_type') {
      return await this.calculateUserType();
    }

    return this.userProperties[propertyName];
  }

  /**
   * Set a custom user property
   * @param {string} propertyName - Property name
   * @param {*} value - Property value
   * @returns {Promise<void>}
   */
  async setUserProperty(propertyName, value) {
    await this.init();

    // Validate property exists in schema
    if (!USER_PROPERTIES[propertyName]) {
      console.warn(`[UserPropertyManager] Unknown user property: ${propertyName}`);
      return;
    }

    this.userProperties[propertyName] = value;
    await this.saveUserProperties();
  }

  /**
   * Clear all user properties (for testing or reset)
   * @returns {Promise<void>}
   */
  async clearUserProperties() {
    this.userProperties = {};
    await this.saveUserProperties();
  }
}

// Create and export singleton instance
const userPropertyManager = new UserPropertyManager();
export default userPropertyManager;
