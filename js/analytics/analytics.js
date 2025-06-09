/**
 * GA4 Analytics Interface
 *
 * High-level interface for Google Analytics 4 tracking in PromptFinder Chrome Extension
 * Provides a simple, unified API for event tracking across all extension contexts
 */

import { isValidEnvironment } from './config.js';
import { promiseRejectionTracker } from './promise-rejection-tracker.js';
import eventTracker from './event-tracker.js';
import clientManager from './client-manager.js';
import sessionManager from './session-manager.js';
import userPropertyManager from './user-property-manager.js';
import analyticsService from './analytics-service.js';

/**
 * Analytics Interface Class
 * Provides simplified methods for common PromptFinder analytics events
 */
class Analytics {
  constructor(dependencies = {}) {
    this.initialized = false;
    this.initPromise = null;
    this._errorHandlersInitialized = false;
    this.eventTracker = dependencies.eventTracker || null;
    this.clientManager = dependencies.clientManager || null;
    this.sessionManager = dependencies.sessionManager || null;
    this.userPropertyManager = dependencies.userPropertyManager || null;
  }

  /**
   * Initialize dependencies
   * @private
   */
  async _initDependencies() {
    // Skip if dependencies were provided in constructor (e.g., during testing)
    if (
      this.eventTracker &&
      this.clientManager &&
      this.sessionManager &&
      this.userPropertyManager
    ) {
      return;
    }

    // Use static imports instead of dynamic imports to avoid code-splitting
    if (!this.eventTracker) {
      this.eventTracker = eventTracker;
    }
    if (!this.clientManager) {
      this.clientManager = clientManager;
    }
    if (!this.sessionManager) {
      this.sessionManager = sessionManager;
    }
    if (!this.userPropertyManager) {
      this.userPropertyManager = userPropertyManager;
    }
    if (!this.analyticsService) {
      this.analyticsService = analyticsService;
    }
  }

  /**
   * Initialize analytics
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
   * @returns {Promise<boolean>} Success status
   */
  async _performInit() {
    try {
      // Always initialize dependencies first, even if environment is invalid
      await this._initDependencies();

      if (!isValidEnvironment()) {
        console.log('[Analytics] Disabled - invalid environment');
        this.initialized = true; // Mark as initialized but with disabled state
        return false;
      }

      // Initialize client and session managers
      await Promise.all([
        this.clientManager.getOrCreateClientId(),
        this.sessionManager.getOrCreateSessionId(),
      ]);

      // Initialize global error handlers
      this._initializeGlobalErrorHandlers();

      this.initialized = true;
      console.log('[Analytics] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
      // Ensure we still mark as initialized to prevent infinite loops
      this.initialized = true;
      return false;
    }
  }

  /**
   * Initialize global error handlers for unhandled exceptions
   * @private
   */
  _initializeGlobalErrorHandlers() {
    // Only initialize once
    if (this._errorHandlersInitialized) {
      return;
    }

    // Check if we're in a valid environment to add error handlers
    if (typeof window === 'undefined') {
      return; // Not in a browser environment
    }

    try {
      // Handle uncaught JavaScript errors
      window.addEventListener('error', async event => {
        try {
          const error = event.error || new Error(event.message || 'Unknown error');
          await this.trackError({
            error_type: 'uncaught_exception',
            error_message: this._sanitizeErrorMessage(
              error.message || event.message || 'Unknown error'
            ),
            error_stack: this._sanitizeStackTrace(error.stack || ''),
            error_name: error.name || 'Error',
            filename: event.filename || 'unknown',
            line_number: event.lineno || 0,
            column_number: event.colno || 0,
            context: 'global_error_handler',
            timestamp: Date.now(),
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          });
        } catch (trackingError) {
          console.error('[Analytics] Failed to track uncaught exception:', trackingError);
        }
      });

      this._errorHandlersInitialized = true;
      console.log('[Analytics] Global error handlers initialized');
    } catch (initError) {
      console.error('[Analytics] Failed to initialize global error handlers:', initError);
    }
  }

  /**
   * Helper method to check if EventTracker is available
   * @private
   * @returns {boolean} True if EventTracker is available
   */
  _isEventTrackerAvailable() {
    if (!this.eventTracker) {
      console.warn('[Analytics] EventTracker not available');
      return false;
    }
    return true;
  }

  /**
   * Enable debug mode for analytics
   * @param {boolean} enabled - Debug mode state
   */
  async setDebugMode(enabled) {
    await this._initDependencies();
    this.eventTracker.setDebugMode(enabled);
    this.analyticsService.setDebugMode(enabled);
  }

  /**
   * Validate event locally in development mode
   * @param {Object} event - Event to validate
   * @param {Object} options - Additional options
   * @returns {Object} Validation result
   */
  async validateEvent(event, options = {}) {
    await this._initDependencies();
    return this.analyticsService.validateEventLocally(event, options);
  }

  /**
   * Send event with development mode validation
   * @param {Object} event - Event to send
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async sendEventWithValidation(event, options = {}) {
    await this.init();

    // Use local validation in development mode
    return await this.analyticsService.sendEventWithValidation(event, options);
  }

  /**
   * Get development mode validation summary
   * @returns {Object} Validation summary and capabilities
   */
  getValidationSummary() {
    return this.analyticsService.getValidationSummary();
  }

  // =============================================
  // PROMPTFINDER-SPECIFIC TRACKING METHODS
  // =============================================

  /**
   * Track extension startup
   * @param {Object} data - Startup data
   * @returns {Promise<boolean>} Success status
   */
  async trackExtensionStartup(data = {}) {
    await this.init();

    return this.eventTracker.trackEvent('extension_startup', {
      extension_version: data.version || 'unknown',
      browser_info: data.browserInfo || 'unknown',
      install_type: data.installType || 'unknown',
      context: data.context || 'unknown',
    });
  }

  /**
   * Track prompt search
   * @param {Object} searchData - Search information
   * @returns {Promise<boolean>} Success status
   */
  async trackPromptSearch(searchData = {}) {
    await this.init();

    return this.eventTracker.trackSearch({
      query: searchData.query || '',
      results_count: searchData.resultsCount || 0,
      category: 'prompt_search',
      type: searchData.searchType || 'text',
      filters_used: searchData.filtersUsed || [],
      search_duration_ms: searchData.duration || 0,
      customParameters: {
        has_filters: (searchData.filtersUsed?.length || 0) > 0,
        query_length: (searchData.query || '').length,
      },
    });
  }

  /**
   * Track filter usage
   * @param {Object} filterData - Filter information
   * @returns {Promise<boolean>} Success status
   */
  async trackFilterUsage(filterData = {}) {
    await this.init();

    return this.eventTracker.trackEvent('filter_usage', {
      filter_type: filterData.type || 'unknown',
      filter_value: String(filterData.value || ''),
      active_filters: filterData.activeFilters || [],
      results_count: filterData.resultsCount || 0,
    });
  }

  /**
   * Track content selection (select_content)
   * @param {Object} contentData - Content selection information
   * @returns {Promise<boolean>} Success status
   */
  async trackContentSelection(contentData = {}) {
    await this.init();

    // Handle null/undefined contentData
    const data = contentData || {};

    return this.eventTracker.trackEvent('select_content', {
      content_type: data.contentType || 'prompt',
      content_id: data.contentId || '',
      prompt_id: data.promptId || '',
      prompt_category: data.promptCategory || 'unknown',
      selection_source: data.source || 'unknown',
      selection_method: data.method || 'click',
      user_rating: data.userRating || 0,
      is_favorite: data.isFavorite || false,
      view_duration_ms: data.viewDuration || 0,
    });
  }

  /**
   * Track prompt view/usage
   * @param {Object} promptData - Prompt information
   * @returns {Promise<boolean>} Success status
   */
  async trackPromptView(promptData = {}) {
    await this.init();

    if (!promptData) promptData = {};

    return this.eventTracker.trackEvent('prompt_view', {
      prompt_id: promptData.id || '',
      prompt_category: promptData.category || 'unknown',
      prompt_type: promptData.type || 'text',
      prompt_length: promptData.content?.length || 0,
      view_source: promptData.source || 'unknown',
      is_favorite: promptData.isFavorite || false,
      user_rating: promptData.userRating || 0,
    });
  }

  /**
   * Track prompt copy action
   * @param {Object} promptData - Prompt information
   * @returns {Promise<boolean>} Success status
   */
  async trackPromptCopy(promptData = {}) {
    await this.init();

    if (!this._isEventTrackerAvailable()) {
      return false;
    }

    // Handle null/undefined promptData
    const data = promptData || {};

    return this.eventTracker.trackEvent('prompt_copy', {
      prompt_id: data.id || '',
      prompt_category: data.category || 'unknown',
      copy_method: data.copyMethod || 'button',
      prompt_length: data.content?.length || 0,
      is_favorite: data.isFavorite || false,
    });
  }

  /**
   * Track favorite action (add/remove)
   * @param {Object} favoriteData - Favorite action data
   * @returns {Promise<boolean>} Success status
   */
  async trackFavoriteAction(favoriteData = {}) {
    await this.init();

    return this.eventTracker.trackEvent('favorite_action', {
      prompt_id: favoriteData.promptId || '',
      action: favoriteData.action || 'add', // 'add' or 'remove'
      prompt_category: favoriteData.category || 'unknown',
      total_favorites: favoriteData.totalFavorites || 0,
    });
  }

  /**
   * Track rating action
   * @param {Object} ratingData - Rating action data
   * @returns {Promise<boolean>} Success status
   */
  async trackRatingAction(ratingData = {}) {
    await this.init();

    if (!this._isEventTrackerAvailable()) {
      return false;
    }

    // Handle null/undefined ratingData
    const data = ratingData || {};

    return this.eventTracker.trackEvent('rating_action', {
      prompt_id: data.promptId || '',
      user_rating: data.rating || 0,
      previous_rating: data.previousRating || 0,
      prompt_category: data.category || 'unknown',
    });
  }

  /**
   * Track rating (alias for trackRatingAction for backward compatibility)
   * @param {Object} ratingData - Rating action data
   * @returns {Promise<boolean>} Success status
   */
  async trackRating(ratingData = {}) {
    return this.trackRatingAction(ratingData);
  }

  /**
   * Track prompt creation
   * @param {Object} promptData - Prompt creation data
   * @returns {Promise<boolean>} Success status
   */
  async trackPromptCreate(promptData = {}) {
    await this.init();

    return this.eventTracker.trackEvent('prompt_create', {
      prompt_id: promptData.id || '',
      prompt_category: promptData.category || 'unknown',
      prompt_type: promptData.type || 'text',
      prompt_length: promptData.content?.length || 0,
      is_private: promptData.isPrivate || false,
      tags_count: promptData.tags?.length || 0,
      ai_tools_count: promptData.targetAiTools?.length || 0,
      creation_method: promptData.creationMethod || 'form',
      time_to_create_ms: promptData.timeToCreate || 0,
    });
  }

  /**
   * Track prompt editing
   * @param {Object} promptData - Prompt edit data
   * @returns {Promise<boolean>} Success status
   */
  async trackPromptEdit(promptData = {}) {
    await this.init();

    return this.eventTracker.trackEvent('prompt_edit', {
      prompt_id: promptData.id || '',
      prompt_category: promptData.category || 'unknown',
      prompt_type: promptData.type || 'text',
      changes_made: promptData.changesMade || [], // ['title', 'description', 'content', 'category', 'tags']
      content_length_before: promptData.contentLengthBefore || 0,
      content_length_after: promptData.contentLengthAfter || 0,
      edit_duration_ms: promptData.editDuration || 0,
      version_number: promptData.version || 1,
    });
  }

  /**
   * Track prompt deletion
   * @param {Object} promptData - Prompt deletion data
   * @returns {Promise<boolean>} Success status
   */
  async trackPromptDelete(promptData = {}) {
    await this.init();

    return this.eventTracker.trackEvent('prompt_delete', {
      prompt_id: promptData.id || '',
      prompt_category: promptData.category || 'unknown',
      prompt_age_days: promptData.ageDays || 0,
      usage_count: promptData.usageCount || 0,
      favorites_count: promptData.favoritesCount || 0,
      user_rating: promptData.userRating || 0,
      delete_reason: promptData.deleteReason || 'unknown', // 'user_choice', 'cleanup', 'policy_violation'
      content_length: promptData.contentLength || 0,
    });
  }

  /**
   * Track user login
   * @param {Object} loginData - Login information
   * @returns {Promise<boolean>} Success status
   */
  async trackLogin(loginData = {}) {
    await this.init();

    return this.eventTracker.trackEvent('login', {
      method: loginData.method || 'email', // 'email', 'google', etc.
      user_id: loginData.userId || '',
      email_verified: loginData.emailVerified || false,
      display_name: loginData.displayName || '',
      login_duration_ms: loginData.duration || 0,
      is_returning_user: loginData.isReturningUser || false,
      context: loginData.context || 'popup',
    });
  }

  /**
   * Track user signup
   * @param {Object} signupData - Signup information
   * @returns {Promise<boolean>} Success status
   */
  async trackSignup(signupData = {}) {
    await this.init();

    return this.eventTracker.trackEvent('sign_up', {
      method: signupData.method || 'email', // 'email', 'google', etc.
      user_id: signupData.userId || '',
      display_name: signupData.displayName || '',
      signup_duration_ms: signupData.duration || 0,
      email_verification_sent: signupData.emailVerificationSent || false,
      context: signupData.context || 'popup',
    });
  }

  /**
   * Track logout action
   * @param {Object} logoutData - Logout information
   * @returns {Promise<boolean>} Success status
   */
  async trackLogout(logoutData = {}) {
    await this.init();

    return this.eventTracker.trackEvent('logout', {
      user_id: logoutData.userId || '',
      session_duration_ms: logoutData.sessionDuration || 0,
      actions_performed: logoutData.actionsPerformed || 0,
      prompts_viewed: logoutData.promptsViewed || 0,
      context: logoutData.context || 'popup',
    });
  }

  /**
   * Track popup open/close
   * @param {Object} popupData - Popup interaction data
   * @returns {Promise<boolean>} Success status
   */
  async trackPopupInteraction(popupData = {}) {
    await this.init();

    return this.eventTracker.trackEvent('popup_interaction', {
      action: popupData.action || 'open', // 'open' or 'close'
      session_duration_ms: popupData.duration || 0,
      interactions_count: popupData.interactions || 0,
      prompts_viewed: popupData.promptsViewed || 0,
    });
  }

  /**
   * Track page view (for extension pages)
   * @param {Object} pageData - Page view data
   * @returns {Promise<boolean>} Success status
   */
  async trackPageView(pageData = {}) {
    await this.init();

    return this.eventTracker.trackPageView({
      title:
        pageData.title ||
        (typeof document !== 'undefined' ? document.title : null) ||
        'Unknown Page',
      url:
        pageData.url ||
        (typeof window !== 'undefined' ? window.location?.href : null) ||
        'chrome-extension://unknown',
      referrer:
        pageData.referrer || (typeof document !== 'undefined' ? document.referrer : null) || '',
      customParameters: {
        extension_page: pageData.extensionPage || 'unknown',
        user_agent: (typeof navigator !== 'undefined' ? navigator.userAgent : null) || 'unknown',
      },
    });
  }

  /**
   * Track user engagement time
   * @param {Object} engagementData - Engagement data
   * @returns {Promise<boolean>} Success status
   */
  async trackEngagement(engagementData = {}) {
    await this.init();

    return this.eventTracker.trackEngagement({
      duration: engagementData.duration || 0,
      type: engagementData.type || 'general',
      value: engagementData.interactions || 1,
      customParameters: {
        context: engagementData.context || 'unknown',
        active_time_ms: engagementData.activeTime || 0,
      },
    });
  }

  /**
   * Track errors with enhanced context and automatic promise rejection handling
   * @param {string|Object} errorTypeOrData - Type of error or error data object
   * @param {Error|string} error - Error object or message (when first param is string)
   * @param {Object} additionalContext - Additional error context (when first param is string)
   */
  async trackError(errorTypeOrData, error, additionalContext = {}) {
    await this.init();

    // Handle both old signature (string, error, context) and new signature (object)
    if (typeof errorTypeOrData === 'object' && errorTypeOrData !== null) {
      // New signature: trackError({ message, code, category, severity, ... })
      const errorData = { ...errorTypeOrData };

      // Transform properties to match event tracker expectations
      const customParameters = {};

      // Move certain properties to customParameters
      if (errorData.context) {
        customParameters.context = errorData.context;
        delete errorData.context;
      }
      if (errorData.userAction) {
        customParameters.user_action = errorData.userAction;
        delete errorData.userAction;
      }
      if (errorData.version) {
        customParameters.extension_version = errorData.version;
        delete errorData.version;
      }

      // Add customParameters if any were created
      if (Object.keys(customParameters).length > 0) {
        errorData.customParameters = customParameters;
      }

      // Ensure stack is present (even if undefined)
      if (!Object.prototype.hasOwnProperty.call(errorData, 'stack')) {
        errorData.stack = undefined;
      }

      return this.eventTracker.trackError(errorData);
    }

    // Old signature: trackError(errorType, error, additionalContext)
    const errorType = errorTypeOrData;
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';

      const errorParams = {
        error_type: errorType,
        error_message: this._sanitizeErrorMessage(errorMessage),
        error_stack: this._sanitizeStackTrace(errorStack),
        error_name: error instanceof Error ? error.name : 'Unknown',
        context: promiseRejectionTracker.getStats().context,
        timestamp: Date.now(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ...additionalContext,
      };

      // Update user activity for error tracking (safely)
      try {
        await this.updateUserActivity({
          action: 'error',
          error_type: errorType,
        });
      } catch (userPropError) {
        console.warn('[Analytics] Failed to update user activity for error:', userPropError);
      }

      return await this.eventTracker.trackEvent('extension_error', errorParams);
    } catch (trackingError) {
      console.error('[Analytics] Error tracking failed:', trackingError);
      return false;
    }
  }

  // =============================================
  // CONVERSION AND BUSINESS METRICS
  // =============================================

  /**
   * Track conversion events
   * @param {Object} conversionData - Conversion data
   * @returns {Promise<boolean>} Success status
   */
  async trackConversion(conversionData = {}) {
    await this.init();

    return this.eventTracker.trackConversion({
      id: conversionData.id || 'prompt_finder_goal',
      value: conversionData.value || 1,
      currency: conversionData.currency || 'USD',
      type: conversionData.type || 'goal',
      customParameters: {
        conversion_category: conversionData.category || 'engagement',
        user_segments: conversionData.userSegments || [],
      },
    });
  }

  // =============================================
  // CONVERSION FUNNEL TRACKING
  // =============================================

  /**
   * Track user registration funnel step
   * @param {Object} funnelData - Funnel step data
   * @returns {Promise<boolean>} Success status
   */
  async trackRegistrationFunnel(funnelData = {}) {
    await this.init();

    // Handle null/undefined funnelData
    const data = funnelData || {};

    return this.eventTracker.trackEvent('funnel_registration', {
      funnel_step: data.step || 'unknown', // 'started', 'form_filled', 'submitted', 'completed', 'verified'
      step_number: data.stepNumber || 1,
      funnel_name: 'user_registration',
      user_id: data.userId || '',
      signup_method: data.method || 'email', // 'email', 'google'
      form_completion_time_ms: data.formTime || 0,
      validation_errors: data.validationErrors || [],
      exit_point: data.exitPoint || null,
    });
  }

  /**
   * Track onboarding funnel step
   * @param {Object} funnelData - Funnel step data
   * @returns {Promise<boolean>} Success status
   */
  async trackOnboardingFunnel(funnelData = {}) {
    await this.init();

    // Handle null/undefined funnelData
    const data = funnelData || {};

    return this.eventTracker.trackEvent('funnel_onboarding', {
      funnel_step: data.step || 'unknown', // 'first_login', 'popup_opened', 'prompts_loaded', 'first_interaction'
      step_number: data.stepNumber || 1,
      funnel_name: 'user_onboarding',
      user_id: data.userId || '',
      time_since_registration_ms: data.timeSinceRegistration || 0,
      session_number: data.sessionNumber || 1,
      prompts_available: data.promptsAvailable || 0,
      interaction_type: data.interactionType || null, // 'view', 'search', 'filter'
    });
  }

  /**
   * Track prompt engagement funnel step
   * @param {Object} funnelData - Funnel step data
   * @returns {Promise<boolean>} Success status
   */
  async trackPromptEngagementFunnel(funnelData = {}) {
    await this.init();

    // Handle null/undefined funnelData
    const data = funnelData || {};

    return this.eventTracker.trackEvent('funnel_prompt_engagement', {
      funnel_step: data.step || 'unknown', // 'viewed', 'read', 'copied', 'favorited', 'rated'
      step_number: data.stepNumber || 1,
      funnel_name: 'prompt_engagement',
      prompt_id: data.promptId || '',
      prompt_category: data.promptCategory || 'unknown',
      view_duration_ms: data.viewDuration || 0,
      prompt_length: data.promptLength || 0,
      user_rating: data.userRating || 0,
      is_favorite: data.isFavorite || false,
      engagement_depth: data.engagementDepth || 'surface', // 'surface', 'medium', 'deep'
    });
  }

  /**
   * Track content creation funnel step
   * @param {Object} funnelData - Funnel step data
   * @returns {Promise<boolean>} Success status
   */
  async trackContentCreationFunnel(funnelData = {}) {
    await this.init();

    // Handle null/undefined funnelData
    const data = funnelData || {};

    return this.eventTracker.trackEvent('funnel_content_creation', {
      funnel_step: data.step || 'unknown', // 'intent', 'form_opened', 'form_filled', 'preview', 'submitted', 'saved'
      step_number: data.stepNumber || 1,
      funnel_name: 'content_creation',
      user_id: data.userId || '',
      creation_trigger: data.trigger || 'unknown', // 'fab_button', 'menu', 'inspiration'
      form_completion_percentage: data.formCompletion || 0,
      time_spent_ms: data.timeSpent || 0,
      field_interactions: data.fieldInteractions || 0,
      draft_saved: data.draftSaved || false,
    });
  }

  /**
   * Track user activation funnel (overall user activation to product value)
   * @param {Object} funnelData - Funnel step data
   * @returns {Promise<boolean>} Success status
   */
  async trackActivationFunnel(funnelData = {}) {
    await this.init();

    // Handle null/undefined funnelData
    const data = funnelData || {};

    return this.eventTracker.trackEvent('funnel_activation', {
      funnel_step: data.step || 'unknown', // 'signup', 'first_login', 'first_action', 'value_moment', 'retention'
      step_number: data.stepNumber || 1,
      funnel_name: 'user_activation',
      user_id: data.userId || '',
      activation_trigger: data.trigger || 'unknown',
      time_to_value_ms: data.timeToValue || 0,
      actions_completed: data.actionsCompleted || 0,
      value_moments_achieved: data.valueMomentsAchieved || [],
      user_segment: data.userSegment || 'new_user',
    });
  }

  // =============================================
  // USER PROPERTY TRACKING
  // =============================================

  /**
   * Set user property
   * @param {string} propertyName - Property name
   * @param {*} value - Property value
   * @returns {Promise<boolean>} Success status
   */
  async setUserProperty(propertyName, value) {
    await this.init();

    try {
      await this.userPropertyManager.setUserProperty(propertyName, value);
      return true;
    } catch (error) {
      console.error('[Analytics] Failed to set user property:', error);
      return false;
    }
  }

  /**
   * Get current user properties
   * @returns {Promise<Object>} Current user properties
   */
  async getUserProperties() {
    await this.init();

    try {
      return await this.userPropertyManager.getUserProperties();
    } catch (error) {
      console.error('[Analytics] Failed to get user properties:', error);
      return {};
    }
  }

  /**
   * Update user activity metrics (called on various user actions)
   * @param {Object} activityData - Activity data
   * @returns {Promise<boolean>} Success status
   */
  async updateUserActivity(activityData = {}) {
    await this.init();

    try {
      // Update last active date
      await this.userPropertyManager.updateLastActiveDate();

      // Update category preferences if provided
      if (activityData.category) {
        await this.userPropertyManager.addPreferredCategory(activityData.category);
      }

      return true;
    } catch (error) {
      console.error('[Analytics] Failed to update user activity:', error);
      return false;
    }
  }

  /**
   * Track prompt creation and update user properties
   * @param {Object} promptData - Prompt data
   * @returns {Promise<boolean>} Success status
   */
  async trackUserPromptCreation(promptData = {}) {
    await this.init();

    try {
      // Update prompt creation counter
      await this.userPropertyManager.updatePromptsCreated();

      // Update activity and category preferences
      await this.updateUserActivity({ category: promptData.category });

      // Track the event with user properties
      const userProperties = await this.userPropertyManager.getUserProperties();

      return this.eventTracker.trackEvent(
        'prompt_create',
        {
          prompt_id: promptData.promptId || '',
          prompt_category: promptData.category || 'unknown',
          prompt_length: promptData.length || 0,
          creation_method: promptData.method || 'manual',
          template_used: promptData.templateUsed || false,
          user_id: promptData.userId || '',
        },
        {
          userProperties,
        }
      );
    } catch (error) {
      console.error('[Analytics] Failed to track user prompt creation:', error);
      return false;
    }
  }

  /**
   * Track favorite action and update user properties
   * @param {Object} favoriteData - Favorite data
   * @returns {Promise<boolean>} Success status
   */
  async trackUserFavoriteAction(favoriteData = {}) {
    await this.init();

    try {
      // Update favorite counter if adding favorite
      if (favoriteData.action === 'add') {
        await this.userPropertyManager.updatePromptsFavorited();
      } else if (favoriteData.action === 'remove') {
        await this.userPropertyManager.updatePromptsFavorited(-1);
      }

      // Update activity and category preferences
      await this.updateUserActivity({ category: favoriteData.promptCategory });

      // Track the event with user properties
      const userProperties = await this.userPropertyManager.getUserProperties();

      return this.eventTracker.trackEvent(
        'favorite_action',
        {
          action: favoriteData.action || 'add',
          prompt_id: favoriteData.promptId || '',
          prompt_category: favoriteData.promptCategory || 'unknown',
          user_id: favoriteData.userId || '',
          source: favoriteData.source || 'prompt_view',
        },
        {
          userProperties,
        }
      );
    } catch (error) {
      console.error('[Analytics] Failed to track user favorite action:', error);
      return false;
    }
  }

  /**
   * Initialize user properties on first extension use
   * @returns {Promise<boolean>} Success status
   */
  async initializeUserProperties() {
    await this.init();

    try {
      // Set install date if not already set
      await this.userPropertyManager.setInstallDate();

      // Update initial properties
      await this.userPropertyManager.updateAccountAge();
      await this.userPropertyManager.updateLastActiveDate();
      await this.userPropertyManager.calculateUserType();

      return true;
    } catch (error) {
      console.error('[Analytics] Failed to initialize user properties:', error);
      return false;
    }
  }

  /**
   * Get user properties for including in events
   * @returns {Promise<Object>} User properties for analytics events
   */
  async getUserPropertiesForEvents() {
    await this.init();

    try {
      return await this.userPropertyManager.getUserProperties();
    } catch (error) {
      console.error('[Analytics] Failed to get user properties for events:', error);
      return {};
    }
  }

  // =============================================
  // HELPER METHODS FOR COMMON USER PROPERTY UPDATES
  // =============================================

  /**
   * Update user engagement level based on action
   * @param {string} actionType - Type of action (view, copy, favorite, create, search)
   * @param {Object} actionData - Action data
   * @returns {Promise<boolean>} Success status
   */
  async updateUserEngagement(actionType, actionData = {}) {
    await this.init();

    try {
      switch (actionType) {
        case 'prompt_create':
          await this.userPropertyManager.updatePromptsCreated();
          break;
        case 'favorite_add':
          await this.userPropertyManager.updatePromptsFavorited();
          break;
        case 'favorite_remove':
          await this.userPropertyManager.updatePromptsFavorited(-1);
          break;
        default:
          // For other actions, just update activity
          break;
      }

      // Always update activity and preferences
      await this.updateUserActivity({ category: actionData.category });

      return true;
    } catch (error) {
      console.error('[Analytics] Failed to update user engagement:', error);
      return false;
    }
  }

  /**
   * Get user classification for analytics
   * @returns {Promise<string>} User type classification
   */
  async getUserType() {
    await this.init();

    try {
      return await this.userPropertyManager.calculateUserType();
    } catch (error) {
      console.error('[Analytics] Failed to get user type:', error);
      return 'unknown';
    }
  }

  /**
   * Get account age in days
   * @returns {Promise<number>} Account age in days
   */
  async getAccountAge() {
    await this.init();

    try {
      return await this.userPropertyManager.updateAccountAge();
    } catch (error) {
      console.error('[Analytics] Failed to get account age:', error);
      return 0;
    }
  }

  /**
   * Add category to user preferences
   * @param {string} category - Category to add to preferences
   * @returns {Promise<Array>} Updated preferred categories
   */
  async addCategoryPreference(category) {
    await this.init();

    try {
      return await this.userPropertyManager.addPreferredCategory(category);
    } catch (error) {
      console.error('[Analytics] Failed to add category preference:', error);
      return [];
    }
  }

  /**
   * Update existing tracking methods to include user properties automatically
   */

  /**
   * Enhanced prompt copy tracking with user properties
   * @param {Object} promptData - Prompt information
   * @returns {Promise<boolean>} Success status
   */
  async trackPromptCopyWithProperties(promptData = {}) {
    await this.init();

    try {
      // Update user activity
      await this.updateUserActivity({ category: promptData.promptCategory });

      // Get current user properties
      const userProperties = await this.getUserPropertiesForEvents();

      return this.eventTracker.trackEvent(
        'prompt_copy',
        {
          prompt_id: promptData.promptId || '',
          prompt_category: promptData.promptCategory || 'unknown',
          prompt_length: promptData.promptLength || 0,
          copy_method: promptData.copyMethod || 'button',
          source: promptData.source || 'prompt_view',
          user_id: promptData.userId || '',
          selection_method: promptData.selectionMethod || 'full_prompt',
        },
        {
          userProperties,
        }
      );
    } catch (error) {
      console.error('[Analytics] Failed to track prompt copy with properties:', error);
      return false;
    }
  }

  /**
   * Enhanced content selection tracking with user properties
   * @param {Object} contentData - Content selection information
   * @returns {Promise<boolean>} Success status
   */
  async trackContentSelectionWithProperties(contentData = {}) {
    await this.init();

    try {
      // Update user activity
      await this.updateUserActivity({ category: contentData.promptCategory });

      // Get current user properties
      const userProperties = await this.getUserPropertiesForEvents();

      return this.eventTracker.trackEvent(
        'select_content',
        {
          content_type: contentData.contentType || 'prompt',
          content_id: contentData.contentId || '',
          prompt_id: contentData.promptId || '',
          prompt_category: contentData.promptCategory || 'unknown',
          selection_source: contentData.source || 'unknown',
          selection_method: contentData.method || 'click',
          user_rating: contentData.userRating || 0,
          is_favorite: contentData.isFavorite || false,
          view_duration_ms: contentData.viewDuration || 0,
        },
        {
          userProperties,
        }
      );
    } catch (error) {
      console.error('[Analytics] Failed to track content selection with properties:', error);
      return false;
    }
  }

  /**
   * Enhanced search tracking with user properties
   * @param {Object} searchData - Search information
   * @returns {Promise<boolean>} Success status
   */
  async trackPromptSearchWithProperties(searchData = {}) {
    await this.init();

    try {
      // Update user activity (searches don't have specific categories)
      await this.updateUserActivity({});

      // Get current user properties
      const userProperties = await this.getUserPropertiesForEvents();

      return this.eventTracker.trackSearch(
        {
          query: searchData.query || '',
          results_count: searchData.resultsCount || 0,
          category: 'prompt_search',
          type: searchData.searchType || 'text',
          filters_used: searchData.filtersUsed || [],
          search_duration_ms: searchData.duration || 0,
          customParameters: {
            has_filters: (searchData.filtersUsed?.length || 0) > 0,
            query_length: (searchData.query || '').length,
          },
        },
        {
          userProperties,
        }
      );
    } catch (error) {
      console.error('[Analytics] Failed to track search with properties:', error);
      return false;
    }
  }

  // =============================================
  // ENGAGEMENT TIME UTILITIES
  // =============================================

  /**
   * Calculate engagement time based on user interaction
   * @param {string} interactionType - Type of interaction
   * @param {Object} timing - Timing data
   * @returns {number} Engagement time in milliseconds
   */
  calculateEngagementTime(interactionType, timing = {}) {
    const startTime = timing.startTime || 0;
    const endTime = timing.endTime || Date.now();

    // If we have actual timing data, use it
    if (startTime && endTime > startTime) {
      const duration = endTime - startTime;
      // Cap at reasonable limits (minimum 100ms, maximum 24 hours)
      return Math.max(100, Math.min(duration, 86400000));
    }

    // Otherwise use defaults based on interaction type
    switch (interactionType) {
      case 'quick_action': // copy, favorite, etc.
        return 500;
      case 'form_interaction': // login, signup
        return 5000;
      case 'content_view': // reading prompts
        return 2000;
      case 'search': // searching
        return 1500;
      case 'creation': // creating content
        return 10000;
      case 'navigation': // page views
        return 1000;
      default:
        return 1000;
    }
  }

  /**
   * Create timing tracker for measuring engagement
   * @returns {Object} Timing tracker
   */
  createTimingTracker() {
    const startTime = Date.now();

    return {
      startTime,
      getEngagementTime() {
        return Date.now() - startTime;
      },
      reset() {
        this.startTime = Date.now();
      },
    };
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Flush all queued events
   * @returns {Promise<boolean>} Success status
   */
  async flush() {
    await this._initDependencies();
    return this.eventTracker.flush();
  }

  /**
   * Clear event queue
   */
  async clearQueue() {
    await this._initDependencies();
    this.eventTracker.clearQueue();
  }

  /**
   * Get comprehensive analytics status including promise rejection tracking
   */
  getStatus() {
    const queueStatus = this.eventTracker.getQueueStatus();
    return {
      initialized: this.initialized,
      environment: isValidEnvironment(),
      isValidEnvironment: isValidEnvironment(),
      isAnalyticsConfigured: isValidEnvironment(),
      clientId: this.clientManager?.clientId || null,
      sessionId: this.sessionManager?.getCurrentSessionId() || null,
      queue: queueStatus,
      eventTrackerStatus: queueStatus,
      clientManagerStatus: {
        hasClientId: Boolean(this.clientManager?.clientId),
        initialized: Boolean(this.clientManager?.clientId),
      },
      sessionManagerStatus: {
        hasSessionId: Boolean(this.sessionManager?.getCurrentSessionId()),
        initialized: Boolean(this.sessionManager?.getCurrentSessionId()),
      },
      userPropertyStatus: {
        initialized: this.userPropertyManager?.initialized || false,
        hasUserProperties: Object.keys(this.userPropertyManager?.userProperties || {}).length > 0,
      },
      promiseTrackingStatus: promiseRejectionTracker.getStats(),
      version: '1.0.0',
    };
  }

  /**
   * Track custom event with automatic initialization
   * @param {string} eventName - Event name
   * @param {Object} parameters - Event parameters
   * @param {Object} options - Options
   * @returns {Promise<boolean>} Success status
   */
  async trackCustomEvent(eventName, parameters = {}, options = {}) {
    await this.init();
    return this.eventTracker.trackEvent(eventName, parameters, options);
  }

  /**
   * Manually track a promise rejection (for testing or custom scenarios)
   * @param {any} reason - Rejection reason
   * @param {string} source - Source identifier
   */
  async trackPromiseRejection(reason, source = 'manual') {
    return await promiseRejectionTracker.trackCustomRejection(reason, source);
  }

  /**
   * Private method to sanitize error messages
   * @param {string} message - Raw error message
   * @returns {string} Sanitized message
   */
  _sanitizeErrorMessage(message) {
    if (!message || typeof message !== 'string') return 'Unknown error';

    return message
      .replace(/(?:file|chrome-extension):\/\/[^\s]+/g, '[FILE_PATH]')
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_ADDRESS]')
      .substring(0, 300);
  }

  /**
   * Private method to sanitize stack traces
   * @param {string} stack - Raw stack trace
   * @returns {string} Sanitized stack trace
   */
  _sanitizeStackTrace(stack) {
    if (!stack || typeof stack !== 'string') return '';

    return stack
      .split('\n')
      .slice(0, 8)
      .map(line => line.replace(/(?:file|chrome-extension):\/\/[^\s]+/g, '[FILE_PATH]'))
      .map(line => line.replace(/https?:\/\/[^\s]+/g, '[URL]'))
      .join('\n')
      .substring(0, 800);
  }

  /**
   * Enable or disable real-time validation for all events
   * @param {boolean} enabled - Whether to enable real-time validation
   */
  async setRealTimeValidation(enabled) {
    await this._initDependencies();

    if (this.eventTracker) {
      this.eventTracker.setRealTimeValidation(enabled);
    }

    if (this.analyticsService) {
      // Real-time validation is automatically enabled in development mode
      // This just controls whether it's triggered for individual events
      const status = enabled ? 'enabled' : 'disabled';
      console.log(`[Analytics] Real-time validation ${status} for all future events`);
    }
  }

  /**
   * Send event with real-time validation
   * @param {Object} event - Event to send
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async sendEventWithRealTimeValidation(event, options = {}) {
    await this.init();
    return await this.analyticsService.sendEventWithRealTimeValidation(event, options);
  }

  /**
   * Validate multiple events using real-time validation
   * @param {Array<Object>} events - Array of events to validate
   * @returns {Promise<Array<Object>>} Validation results
   */
  async batchValidateEvents(events) {
    await this._initDependencies();

    if (this.eventTracker) {
      return await this.eventTracker.batchValidateEvents(events);
    }

    return events.map(event => ({
      event: event.name || 'unknown',
      valid: false,
      error: 'Event tracker not initialized',
    }));
  }

  /**
   * Test real-time validation connectivity
   * @returns {Promise<Object>} Test result
   */
  async testRealTimeValidation() {
    await this._initDependencies();

    if (this.eventTracker) {
      return await this.eventTracker.testRealTimeValidation();
    }

    return {
      success: false,
      error: 'Event tracker not initialized',
    };
  }

  /**
   * Get real-time validation statistics and status
   * @returns {Object} Validation statistics
   */
  async getRealTimeValidationStats() {
    await this._initDependencies();

    if (this.eventTracker) {
      return this.eventTracker.getRealTimeValidationStats();
    }

    return {
      enabled: false,
      error: 'Event tracker not initialized',
    };
  }
}

// Create and export singleton instance
const analytics = new Analytics();

export { Analytics };
export default analytics;
