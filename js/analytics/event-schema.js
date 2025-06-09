/**
 * GA4 Event Schema for PromptFinder Chrome Extension
 *
 * This file defines the complete event schema using GA4 recommended event names
 * and parameters. It provides validation, type definitions, and documentation
 * for all events tracked in the PromptFinder extension.
 *
 * Reference: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */

/**
 * GA4 Recommended Events for PromptFinder
 * Using standard GA4 event names where applicable, with custom events for
 * PromptFinder-specific functionality
 */
export const GA4_EVENTS = {
  // =============================================
  // STANDARD GA4 EVENTS
  // =============================================

  // User navigation and engagement
  PAGE_VIEW: 'page_view',
  SEARCH: 'search',
  SELECT_CONTENT: 'select_content',
  USER_ENGAGEMENT: 'user_engagement',

  // Authentication events
  LOGIN: 'login',
  SIGN_UP: 'sign_up',

  // Content interaction events
  SHARE: 'share',
  SELECT_ITEM: 'select_item',

  // Error and debugging events
  EXCEPTION: 'exception',

  // =============================================
  // PROMPTFINDER CUSTOM EVENTS
  // =============================================

  // Extension lifecycle
  EXTENSION_STARTUP: 'extension_startup',
  EXTENSION_SHUTDOWN: 'extension_shutdown',

  // Prompt interactions
  PROMPT_VIEW: 'prompt_view',
  PROMPT_COPY: 'prompt_copy',
  PROMPT_CREATE: 'prompt_create',
  PROMPT_EDIT: 'prompt_edit',
  PROMPT_DELETE: 'prompt_delete',

  // User preference actions
  FAVORITE_ACTION: 'favorite_action',
  RATING_ACTION: 'rating_action',

  // Filter and search actions
  FILTER_USAGE: 'filter_usage',
  SORT_USAGE: 'sort_usage',

  // UI interactions
  POPUP_INTERACTION: 'popup_interaction',
  TAB_SWITCH: 'tab_switch',
  NAVIGATION: 'navigation',

  // Performance and conversion
  CONVERSION: 'conversion',
  PERFORMANCE_TIMING: 'performance_timing',

  // Funnel tracking events
  FUNNEL_REGISTRATION: 'funnel_registration',
  FUNNEL_ONBOARDING: 'funnel_onboarding',
  FUNNEL_PROMPT_ENGAGEMENT: 'funnel_prompt_engagement',
  FUNNEL_CONTENT_CREATION: 'funnel_content_creation',
  FUNNEL_ACTIVATION: 'funnel_activation',
};

/**
 * Event parameter definitions with validation rules
 */
export const EVENT_PARAMETERS = {
  // =============================================
  // STANDARD GA4 PARAMETERS
  // =============================================

  // Page view parameters
  page_title: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'The title of the page',
  },
  page_location: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'The URL of the page',
  },
  page_referrer: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'The referrer URL',
  },

  // Search parameters
  search_term: {
    type: 'string',
    maxLength: 100,
    required: true,
    description: 'The search query',
  },
  search_results: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Number of search results returned',
  },

  // Content selection parameters
  content_type: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Type of content selected',
  },
  content_id: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'Unique identifier for the content',
  },

  // Authentication parameters
  method: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Login/signup method (email, google, etc.)',
  },

  // Engagement parameters
  engagement_time_msec: {
    type: 'number',
    min: 0,
    required: true,
    description: 'Time engaged in milliseconds',
  },

  // Session parameters (automatically added)
  session_id: {
    type: 'string',
    maxLength: 100,
    required: true,
    description: 'Session identifier',
  },
  user_id: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'User identifier',
  },

  // =============================================
  // PROMPTFINDER CUSTOM PARAMETERS
  // =============================================

  // Extension parameters
  extension_version: {
    type: 'string',
    maxLength: 20,
    required: false,
    description: 'Version of the extension',
  },
  browser_info: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'Browser information',
  },
  install_type: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Type of installation (new, update)',
  },
  context: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Extension context (popup, content_script, service_worker)',
  },

  // Prompt parameters
  prompt_id: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'Unique identifier for the prompt',
  },
  prompt_category: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Category of the prompt',
  },
  prompt_type: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Type of prompt (text, template, etc.)',
  },
  prompt_length: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Character length of the prompt content',
  },
  view_source: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Source of the view (search, favorites, direct)',
  },
  is_favorite: {
    type: 'boolean',
    required: false,
    description: 'Whether the prompt is favorited by the user',
  },
  user_rating: {
    type: 'number',
    min: 0,
    max: 5,
    required: false,
    description: 'User rating for the prompt (1-5)',
  },
  copy_method: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Method used to copy (button, keyboard, context_menu)',
  },

  // Action parameters
  action: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'The specific action taken',
  },
  previous_rating: {
    type: 'number',
    min: 0,
    max: 5,
    required: false,
    description: 'Previous rating value before change',
  },
  total_favorites: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Total number of favorites for content',
  },

  // Filter parameters
  filter_type: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Type of filter applied',
  },
  filter_value: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'Value of the filter',
  },
  active_filters: {
    type: 'array',
    maxItems: 20,
    required: false,
    description: 'List of currently active filters',
  },
  results_count: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Number of results after filtering',
  },

  // UI interaction parameters
  session_duration_ms: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Duration of the session in milliseconds',
  },
  interactions_count: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Number of interactions in the session',
  },
  prompts_viewed: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Number of prompts viewed in the session',
  },

  // Error parameters
  error_message: {
    type: 'string',
    maxLength: 200,
    required: false,
    description: 'Error message',
  },
  error_code: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Error code or type',
  },
  error_category: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Category of error',
  },
  error_severity: {
    type: 'string',
    maxLength: 20,
    required: false,
    description: 'Severity level (info, warning, error, critical)',
  },
  error_stack: {
    type: 'string',
    maxLength: 1000,
    required: false,
    description: 'Error stack trace (truncated)',
  },

  // Conversion parameters
  conversion_id: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'Conversion goal identifier',
  },
  conversion_value: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Value of the conversion',
  },
  conversion_currency: {
    type: 'string',
    maxLength: 3,
    required: false,
    description: 'Currency code (USD, EUR, etc.)',
  },
  conversion_type: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Type of conversion (goal, transaction, etc.)',
  },

  // Performance parameters
  timing_category: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Category of timing measurement',
  },
  timing_value: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Timing value in milliseconds',
  },
  timing_label: {
    type: 'string',
    maxLength: 100,
    required: false,
    description: 'Label for the timing measurement',
  },

  // Funnel tracking parameters
  funnel_step: {
    type: 'string',
    maxLength: 50,
    required: true,
    description: 'Current step in the funnel',
  },
  step_number: {
    type: 'number',
    min: 1,
    required: false,
    description: 'Sequential number of the funnel step',
  },
  funnel_name: {
    type: 'string',
    maxLength: 50,
    required: true,
    description: 'Name/identifier of the funnel',
  },
  signup_method: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Method used for signup (email, google, etc.)',
  },
  form_completion_time_ms: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Time spent filling out a form in milliseconds',
  },
  validation_errors: {
    type: 'array',
    maxItems: 10,
    required: false,
    description: 'List of validation errors encountered',
  },
  exit_point: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Point where user exited the funnel',
  },
  time_since_registration_ms: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Time elapsed since user registration in milliseconds',
  },
  session_number: {
    type: 'number',
    min: 1,
    required: false,
    description: 'Sequential session number for the user',
  },
  prompts_available: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Number of prompts available to the user',
  },
  interaction_type: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'Type of user interaction (view, search, filter, etc.)',
  },
  view_duration_ms: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Time spent viewing content in milliseconds',
  },
  engagement_depth: {
    type: 'string',
    maxLength: 20,
    required: false,
    description: 'Depth of user engagement (surface, medium, deep)',
  },
  creation_trigger: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'What triggered the content creation action',
  },
  form_completion_percentage: {
    type: 'number',
    min: 0,
    max: 100,
    required: false,
    description: 'Percentage of form completion (0-100)',
  },
  time_spent_ms: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Time spent on current activity in milliseconds',
  },
  field_interactions: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Number of form field interactions',
  },
  draft_saved: {
    type: 'boolean',
    required: false,
    description: 'Whether a draft was saved during the process',
  },
  activation_trigger: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'What triggered the activation event',
  },
  time_to_value_ms: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Time from signup to achieving value in milliseconds',
  },
  actions_completed: {
    type: 'number',
    min: 0,
    required: false,
    description: 'Number of actions completed in the funnel',
  },
  value_moments_achieved: {
    type: 'array',
    maxItems: 10,
    required: false,
    description: 'List of value moments the user has achieved',
  },
  user_segment: {
    type: 'string',
    maxLength: 50,
    required: false,
    description: 'User segment classification',
  },
};

/**
 * Event schema definitions mapping events to their required and optional parameters
 */
export const EVENT_SCHEMAS = {
  [GA4_EVENTS.PAGE_VIEW]: {
    requiredParameters: ['session_id'],
    optionalParameters: [
      'page_title',
      'page_location',
      'page_referrer',
      'context',
      'extension_version',
    ],
    description: 'Tracks page views within the extension',
  },

  [GA4_EVENTS.SEARCH]: {
    requiredParameters: ['session_id', 'search_term'],
    optionalParameters: ['search_results', 'results_count', 'engagement_time_msec'],
    description: 'Tracks search queries and results',
  },

  [GA4_EVENTS.SELECT_CONTENT]: {
    requiredParameters: ['session_id'],
    optionalParameters: ['content_type', 'content_id', 'prompt_id', 'prompt_category'],
    description: 'Tracks content selection and prompt interactions',
  },

  [GA4_EVENTS.USER_ENGAGEMENT]: {
    requiredParameters: ['session_id', 'engagement_time_msec'],
    optionalParameters: ['content_type', 'action'],
    description: 'Tracks user engagement duration and interactions',
  },

  [GA4_EVENTS.LOGIN]: {
    requiredParameters: ['session_id'],
    optionalParameters: ['method'],
    description: 'Tracks user login events',
  },

  [GA4_EVENTS.SIGN_UP]: {
    requiredParameters: ['session_id'],
    optionalParameters: ['method'],
    description: 'Tracks user signup events',
  },

  [GA4_EVENTS.EXTENSION_STARTUP]: {
    requiredParameters: ['session_id'],
    optionalParameters: ['extension_version', 'browser_info', 'install_type', 'context'],
    description: 'Tracks extension startup and initialization',
  },

  [GA4_EVENTS.PROMPT_VIEW]: {
    requiredParameters: ['session_id'],
    optionalParameters: [
      'prompt_id',
      'prompt_category',
      'prompt_type',
      'prompt_length',
      'view_source',
      'is_favorite',
      'user_rating',
    ],
    description: 'Tracks prompt views and usage',
  },

  [GA4_EVENTS.PROMPT_COPY]: {
    requiredParameters: ['session_id'],
    optionalParameters: [
      'prompt_id',
      'prompt_category',
      'copy_method',
      'prompt_length',
      'is_favorite',
    ],
    description: 'Tracks prompt copy actions',
  },

  [GA4_EVENTS.FAVORITE_ACTION]: {
    requiredParameters: ['session_id'],
    optionalParameters: ['prompt_id', 'action', 'prompt_category', 'total_favorites'],
    description: 'Tracks favorite/unfavorite actions',
  },

  [GA4_EVENTS.RATING_ACTION]: {
    requiredParameters: ['session_id'],
    optionalParameters: ['prompt_id', 'user_rating', 'previous_rating', 'prompt_category'],
    description: 'Tracks prompt rating actions',
  },

  [GA4_EVENTS.FILTER_USAGE]: {
    requiredParameters: ['session_id'],
    optionalParameters: ['filter_type', 'filter_value', 'active_filters', 'results_count'],
    description: 'Tracks filter usage and search refinement',
  },

  [GA4_EVENTS.POPUP_INTERACTION]: {
    requiredParameters: ['session_id'],
    optionalParameters: ['action', 'session_duration_ms', 'interactions_count', 'prompts_viewed'],
    description: 'Tracks popup window interactions',
  },

  [GA4_EVENTS.EXCEPTION]: {
    requiredParameters: ['session_id'],
    optionalParameters: [
      'error_message',
      'error_code',
      'error_category',
      'error_severity',
      'error_stack',
      'context',
    ],
    description: 'Tracks errors and exceptions',
  },

  [GA4_EVENTS.CONVERSION]: {
    requiredParameters: ['session_id'],
    optionalParameters: [
      'conversion_id',
      'conversion_value',
      'conversion_currency',
      'conversion_type',
    ],
    description: 'Tracks conversion goals and achievements',
  },

  [GA4_EVENTS.FUNNEL_REGISTRATION]: {
    requiredParameters: ['session_id', 'funnel_step', 'funnel_name'],
    optionalParameters: [
      'step_number',
      'user_id',
      'signup_method',
      'form_completion_time_ms',
      'validation_errors',
      'exit_point',
    ],
    description: 'Tracks user registration funnel steps',
  },

  [GA4_EVENTS.FUNNEL_ONBOARDING]: {
    requiredParameters: ['session_id', 'funnel_step', 'funnel_name'],
    optionalParameters: [
      'step_number',
      'user_id',
      'time_since_registration_ms',
      'session_number',
      'prompts_available',
      'interaction_type',
    ],
    description: 'Tracks user onboarding funnel steps',
  },

  [GA4_EVENTS.FUNNEL_PROMPT_ENGAGEMENT]: {
    requiredParameters: ['session_id', 'funnel_step', 'funnel_name'],
    optionalParameters: [
      'step_number',
      'prompt_id',
      'prompt_category',
      'view_duration_ms',
      'prompt_length',
      'user_rating',
      'is_favorite',
      'engagement_depth',
    ],
    description: 'Tracks prompt engagement funnel steps',
  },

  [GA4_EVENTS.FUNNEL_CONTENT_CREATION]: {
    requiredParameters: ['session_id', 'funnel_step', 'funnel_name'],
    optionalParameters: [
      'step_number',
      'user_id',
      'creation_trigger',
      'form_completion_percentage',
      'time_spent_ms',
      'field_interactions',
      'draft_saved',
    ],
    description: 'Tracks content creation funnel steps',
  },

  [GA4_EVENTS.FUNNEL_ACTIVATION]: {
    requiredParameters: ['session_id', 'funnel_step', 'funnel_name'],
    optionalParameters: [
      'step_number',
      'user_id',
      'activation_trigger',
      'time_to_value_ms',
      'actions_completed',
      'value_moments_achieved',
      'user_segment',
    ],
    description: 'Tracks user activation funnel steps',
  },
};

/**
 * User properties that can be set for enhanced analytics
 */
export const USER_PROPERTIES = {
  user_type: {
    type: 'string',
    maxLength: 50,
    description: 'Type of user (free, premium, admin, etc.)',
  },
  account_age_days: {
    type: 'number',
    min: 0,
    description: 'Age of user account in days',
  },
  total_prompts_created: {
    type: 'number',
    min: 0,
    description: 'Total number of prompts created by user',
  },
  total_prompts_favorited: {
    type: 'number',
    min: 0,
    description: 'Total number of prompts favorited by user',
  },
  preferred_categories: {
    type: 'array',
    maxItems: 10,
    description: "User's most used prompt categories",
  },
  extension_install_date: {
    type: 'string',
    maxLength: 50,
    description: 'Date when extension was installed',
  },
  last_active_date: {
    type: 'string',
    maxLength: 50,
    description: 'Date of last activity',
  },
};

/**
 * Validation functions for event schema
 */
export class EventSchemaValidator {
  /**
   * Validate an event against its schema
   * @param {string} eventName - The event name
   * @param {Object} parameters - Event parameters
   * @returns {Object} Validation result with isValid and errors
   */
  static validateEvent(eventName, parameters = {}) {
    const schema = EVENT_SCHEMAS[eventName];
    if (!schema) {
      return {
        isValid: false,
        errors: [`Unknown event: ${eventName}`],
      };
    }

    const errors = [];
    const providedParams = Object.keys(parameters);

    // Check required parameters
    for (const requiredParam of schema.requiredParameters) {
      if (!providedParams.includes(requiredParam)) {
        errors.push(`Missing required parameter: ${requiredParam}`);
      }
    }

    // Validate provided parameters
    for (const [paramName, paramValue] of Object.entries(parameters)) {
      const paramDef = EVENT_PARAMETERS[paramName];
      if (!paramDef) {
        errors.push(`Unknown parameter: ${paramName}`);
        continue;
      }

      const validation = this.validateParameter(paramName, paramValue, paramDef);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single parameter
   * @param {string} paramName - Parameter name
   * @param {*} value - Parameter value
   * @param {Object} definition - Parameter definition
   * @returns {Object} Validation result
   */
  static validateParameter(paramName, value, definition) {
    const errors = [];

    // Type validation
    if (definition.type === 'string' && typeof value !== 'string') {
      errors.push(`Parameter ${paramName} must be a string`);
    } else if (definition.type === 'number' && typeof value !== 'number') {
      errors.push(`Parameter ${paramName} must be a number`);
    } else if (definition.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Parameter ${paramName} must be a boolean`);
    } else if (definition.type === 'array' && !Array.isArray(value)) {
      errors.push(`Parameter ${paramName} must be an array`);
    }

    // String length validation
    if (
      definition.type === 'string' &&
      definition.maxLength &&
      value.length > definition.maxLength
    ) {
      errors.push(`Parameter ${paramName} exceeds maximum length of ${definition.maxLength}`);
    }

    // Number range validation
    if (definition.type === 'number') {
      if (definition.min !== undefined && value < definition.min) {
        errors.push(`Parameter ${paramName} must be at least ${definition.min}`);
      }
      if (definition.max !== undefined && value > definition.max) {
        errors.push(`Parameter ${paramName} must be at most ${definition.max}`);
      }
    }

    // Array length validation
    if (definition.type === 'array' && definition.maxItems && value.length > definition.maxItems) {
      errors.push(`Parameter ${paramName} exceeds maximum items of ${definition.maxItems}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get the schema for a specific event
   * @param {string} eventName - The event name
   * @returns {Object|null} Event schema or null if not found
   */
  static getEventSchema(eventName) {
    return EVENT_SCHEMAS[eventName] || null;
  }

  /**
   * Get all available events
   * @returns {Array} List of all event names
   */
  static getAllEvents() {
    return Object.values(GA4_EVENTS);
  }

  /**
   * Get parameter definition
   * @param {string} paramName - Parameter name
   * @returns {Object|null} Parameter definition or null if not found
   */
  static getParameterDefinition(paramName) {
    return EVENT_PARAMETERS[paramName] || null;
  }
}

/**
 * Export the complete event schema for use in other modules
 */
export default {
  GA4_EVENTS,
  EVENT_PARAMETERS,
  EVENT_SCHEMAS,
  USER_PROPERTIES,
  EventSchemaValidator,
};
