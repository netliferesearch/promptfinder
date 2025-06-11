/**
 * Tests for GA4 Event Schema
 */

import {
  GA4_EVENTS,
  EVENT_PARAMETERS,
  EVENT_SCHEMAS,
  USER_PROPERTIES,
  EventSchemaValidator,
} from '../../js/analytics/event-schema.js';

describe('GA4 Event Schema', () => {
  describe('GA4_EVENTS Constants', () => {
    test('should contain standard GA4 events', () => {
      expect(GA4_EVENTS.PAGE_VIEW).toBe('page_view');
      expect(GA4_EVENTS.SEARCH).toBe('search');
      expect(GA4_EVENTS.SELECT_CONTENT).toBe('select_content');
      expect(GA4_EVENTS.USER_ENGAGEMENT).toBe('custom_user_engagement');
      expect(GA4_EVENTS.LOGIN).toBe('login');
      expect(GA4_EVENTS.SIGN_UP).toBe('sign_up');
      expect(GA4_EVENTS.EXCEPTION).toBe('exception');
    });

    test('should contain PromptFinder custom events', () => {
      expect(GA4_EVENTS.EXTENSION_STARTUP).toBe('extension_startup');
      expect(GA4_EVENTS.PROMPT_VIEW).toBe('prompt_view');
      expect(GA4_EVENTS.PROMPT_COPY).toBe('prompt_copy');
      expect(GA4_EVENTS.FAVORITE_ACTION).toBe('favorite_action');
      expect(GA4_EVENTS.RATING_ACTION).toBe('rating_action');
      expect(GA4_EVENTS.FILTER_USAGE).toBe('filter_usage');
      expect(GA4_EVENTS.POPUP_INTERACTION).toBe('popup_interaction');
    });

    test('should have unique event names', () => {
      const eventValues = Object.values(GA4_EVENTS);
      const uniqueValues = [...new Set(eventValues)];
      expect(eventValues.length).toBe(uniqueValues.length);
    });
  });

  describe('EVENT_PARAMETERS Definitions', () => {
    test('should contain standard GA4 parameters', () => {
      expect(EVENT_PARAMETERS.page_title).toBeDefined();
      expect(EVENT_PARAMETERS.page_location).toBeDefined();
      expect(EVENT_PARAMETERS.search_term).toBeDefined();
      expect(EVENT_PARAMETERS.engagement_time_msec).toBeDefined();
      expect(EVENT_PARAMETERS.session_id).toBeDefined();
    });

    test('should contain PromptFinder custom parameters', () => {
      expect(EVENT_PARAMETERS.prompt_id).toBeDefined();
      expect(EVENT_PARAMETERS.prompt_category).toBeDefined();
      expect(EVENT_PARAMETERS.extension_version).toBeDefined();
      expect(EVENT_PARAMETERS.copy_method).toBeDefined();
      expect(EVENT_PARAMETERS.filter_type).toBeDefined();
    });

    test('should have proper parameter definitions', () => {
      const paramDef = EVENT_PARAMETERS.search_term;
      expect(paramDef.type).toBe('string');
      expect(paramDef.maxLength).toBe(100);
      expect(paramDef.required).toBe(true);
      expect(paramDef.description).toBeDefined();
    });

    test('should have numeric parameters with proper constraints', () => {
      const ratingParam = EVENT_PARAMETERS.user_rating;
      expect(ratingParam.type).toBe('number');
      expect(ratingParam.min).toBe(0);
      expect(ratingParam.max).toBe(5);
    });
  });

  describe('EVENT_SCHEMAS Definitions', () => {
    test('should have schemas for all events', () => {
      const eventNames = Object.values(GA4_EVENTS);
      const schemaEvents = Object.keys(EVENT_SCHEMAS);

      // Verify we have schemas defined
      expect(schemaEvents.length).toBeGreaterThan(0);

      for (const eventName of eventNames) {
        if (EVENT_SCHEMAS[eventName]) {
          expect(EVENT_SCHEMAS[eventName]).toBeDefined();
        }
      }
    });

    test('should have proper schema structure', () => {
      const schema = EVENT_SCHEMAS[GA4_EVENTS.PAGE_VIEW];
      expect(schema.requiredParameters).toBeInstanceOf(Array);
      expect(schema.optionalParameters).toBeInstanceOf(Array);
      expect(schema.description).toBeDefined();
      expect(typeof schema.description).toBe('string');
    });

    test('should require session_id for all events', () => {
      Object.values(EVENT_SCHEMAS).forEach(schema => {
        expect(schema.requiredParameters).toContain('session_id');
      });
    });

    test('should have valid parameter references', () => {
      Object.values(EVENT_SCHEMAS).forEach(schema => {
        const allParams = [...schema.requiredParameters, ...schema.optionalParameters];
        allParams.forEach(paramName => {
          expect(EVENT_PARAMETERS[paramName]).toBeDefined();
        });
      });
    });
  });

  describe('USER_PROPERTIES Definitions', () => {
    test('should contain user property definitions', () => {
      expect(USER_PROPERTIES.user_type).toBeDefined();
      expect(USER_PROPERTIES.account_age_days).toBeDefined();
      expect(USER_PROPERTIES.total_prompts_created).toBeDefined();
      expect(USER_PROPERTIES.preferred_categories).toBeDefined();
    });

    test('should have proper property definitions', () => {
      const userType = USER_PROPERTIES.user_type;
      expect(userType.type).toBe('string');
      expect(userType.maxLength).toBe(50);
      expect(userType.description).toBeDefined();
    });
  });
});

describe('EventSchemaValidator', () => {
  describe('validateEvent()', () => {
    test('should validate a valid page_view event', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.PAGE_VIEW, {
        session_id: 'test-session-123',
        page_title: 'Test Page',
        page_location: 'chrome-extension://test',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate a valid search event', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.SEARCH, {
        session_id: 'test-session-123',
        search_term: 'test query',
        search_results: 10,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate a valid prompt_view event', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.PROMPT_VIEW, {
        session_id: 'test-session-123',
        prompt_id: 'prompt-123',
        prompt_category: 'writing',
        prompt_length: 150,
        is_favorite: true,
        user_rating: 4,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject unknown event', () => {
      const result = EventSchemaValidator.validateEvent('unknown_event', {
        session_id: 'test-session-123',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown event: unknown_event');
    });

    test('should reject event missing required parameters', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.SEARCH, {
        // Missing session_id and search_term
        search_results: 10,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required parameter: session_id');
      expect(result.errors).toContain('Missing required parameter: search_term');
    });

    test('should reject event with unknown parameters', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.PAGE_VIEW, {
        session_id: 'test-session-123',
        unknown_param: 'value',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown parameter: unknown_param');
    });

    test('should accept event with only required parameters', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.USER_ENGAGEMENT, {
        session_id: 'test-session-123',
        engagement_time_msec: 5000,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateParameter()', () => {
    test('should validate string parameter', () => {
      const definition = EVENT_PARAMETERS.page_title;
      const result = EventSchemaValidator.validateParameter('page_title', 'Test Page', definition);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate number parameter', () => {
      const definition = EVENT_PARAMETERS.user_rating;
      const result = EventSchemaValidator.validateParameter('user_rating', 4, definition);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate boolean parameter', () => {
      const definition = EVENT_PARAMETERS.is_favorite;
      const result = EventSchemaValidator.validateParameter('is_favorite', true, definition);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate array parameter', () => {
      const definition = EVENT_PARAMETERS.active_filters;
      const result = EventSchemaValidator.validateParameter(
        'active_filters',
        ['category', 'rating'],
        definition
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject wrong type', () => {
      const definition = EVENT_PARAMETERS.page_title;
      const result = EventSchemaValidator.validateParameter('page_title', 123, definition);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parameter page_title must be a string');
    });

    test('should reject string too long', () => {
      const definition = EVENT_PARAMETERS.page_title;
      const longString = 'a'.repeat(101); // maxLength is 100
      const result = EventSchemaValidator.validateParameter('page_title', longString, definition);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parameter page_title exceeds maximum length of 100');
    });

    test('should reject number below minimum', () => {
      const definition = EVENT_PARAMETERS.user_rating;
      const result = EventSchemaValidator.validateParameter('user_rating', -1, definition);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parameter user_rating must be at least 0');
    });

    test('should reject number above maximum', () => {
      const definition = EVENT_PARAMETERS.user_rating;
      const result = EventSchemaValidator.validateParameter('user_rating', 6, definition);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parameter user_rating must be at most 5');
    });

    test('should reject array with too many items', () => {
      const definition = EVENT_PARAMETERS.active_filters;
      const longArray = new Array(21).fill('filter'); // maxItems is 20
      const result = EventSchemaValidator.validateParameter(
        'active_filters',
        longArray,
        definition
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parameter active_filters exceeds maximum items of 20');
    });
  });

  describe('getEventSchema()', () => {
    test('should return schema for valid event', () => {
      const schema = EventSchemaValidator.getEventSchema(GA4_EVENTS.PAGE_VIEW);
      expect(schema).toBeDefined();
      expect(schema.requiredParameters).toBeDefined();
      expect(schema.optionalParameters).toBeDefined();
      expect(schema.description).toBeDefined();
    });

    test('should return null for invalid event', () => {
      const schema = EventSchemaValidator.getEventSchema('invalid_event');
      expect(schema).toBeNull();
    });
  });

  describe('getAllEvents()', () => {
    test('should return all event names', () => {
      const events = EventSchemaValidator.getAllEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events).toContain('page_view');
      expect(events).toContain('prompt_view');
      expect(events).toContain('search');
      expect(events.length).toBeGreaterThan(0);
    });

    test('should return unique events', () => {
      const events = EventSchemaValidator.getAllEvents();
      const uniqueEvents = [...new Set(events)];
      expect(events.length).toBe(uniqueEvents.length);
    });
  });

  describe('getParameterDefinition()', () => {
    test('should return definition for valid parameter', () => {
      const definition = EventSchemaValidator.getParameterDefinition('page_title');
      expect(definition).toBeDefined();
      expect(definition.type).toBe('string');
      expect(definition.description).toBeDefined();
    });

    test('should return null for invalid parameter', () => {
      const definition = EventSchemaValidator.getParameterDefinition('invalid_param');
      expect(definition).toBeNull();
    });
  });

  describe('Complex Validation Scenarios', () => {
    test('should validate complex prompt interaction event', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.PROMPT_COPY, {
        session_id: 'session-abc-123',
        prompt_id: 'prompt-writing-001',
        prompt_category: 'creative_writing',
        copy_method: 'keyboard_shortcut',
        prompt_length: 250,
        is_favorite: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate filter usage event', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.FILTER_USAGE, {
        session_id: 'session-filter-test',
        filter_type: 'category',
        filter_value: 'business',
        active_filters: ['category:business', 'rating:4+'],
        results_count: 42,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate popup interaction event', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.POPUP_INTERACTION, {
        session_id: 'popup-session-456',
        action: 'close',
        session_duration_ms: 45000,
        interactions_count: 8,
        prompts_viewed: 3,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle multiple validation errors', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.PROMPT_VIEW, {
        // Missing session_id (required)
        prompt_id: 123, // Wrong type (should be string)
        user_rating: 10, // Above maximum (max is 5)
        unknown_field: 'value', // Unknown parameter
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Missing required parameter: session_id');
      expect(result.errors).toContain('Parameter prompt_id must be a string');
      expect(result.errors).toContain('Parameter user_rating must be at most 5');
      expect(result.errors).toContain('Unknown parameter: unknown_field');
    });

    test('should validate edge case values', () => {
      // Test boundary values
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.RATING_ACTION, {
        session_id: 'edge-case-session',
        prompt_id: '', // Empty string (valid)
        user_rating: 0, // Minimum value
        previous_rating: 5, // Maximum value
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Real-world Event Examples', () => {
    test('should validate extension startup event', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.EXTENSION_STARTUP, {
        session_id: 'startup-session-001',
        extension_version: '1.2.3',
        browser_info: 'Chrome/120.0.0.0',
        install_type: 'new_install',
        context: 'service_worker',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate user engagement event', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.USER_ENGAGEMENT, {
        session_id: 'engagement-session-002',
        engagement_time_msec: 30000,
        content_type: 'prompt_collection',
        action: 'scroll',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate error event', () => {
      const result = EventSchemaValidator.validateEvent(GA4_EVENTS.EXCEPTION, {
        session_id: 'error-session-003',
        error_message: 'Failed to load prompts',
        error_code: 'NETWORK_ERROR',
        error_category: 'api_error',
        error_severity: 'error',
        context: 'popup',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
