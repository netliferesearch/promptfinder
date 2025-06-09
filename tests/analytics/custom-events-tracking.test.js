/**
 * Custom Events Tracking Tests
 *
 * Tests for custom GA4 events in PromptFinder: prompt_copy, favorite_action, rating_action,
 * prompt_create, prompt_edit, prompt_delete.
 */

import { jest } from '@jest/globals';
import { Analytics } from '../../js/analytics/analytics.js';
import { EventTracker } from '../../js/analytics/event-tracker.js';

// Mock dependencies
jest.mock('../../js/analytics/event-tracker.js');
jest.mock('../../js/analytics/config.js', () => ({
  isValidEnvironment: jest.fn().mockReturnValue(true),
  getAnalyticsConfig: jest.fn().mockReturnValue({
    measurementId: 'G-TEST123',
    apiSecret: 'test-secret',
  }),
}));

describe('Custom Events Tracking', () => {
  let analytics;
  let mockEventTracker;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock EventTracker
    mockEventTracker = {
      trackEvent: jest.fn().mockResolvedValue(true),
      isInitialized: jest.fn().mockReturnValue(true),
    };

    EventTracker.mockImplementation(() => mockEventTracker);

    // Create analytics instance with mocked dependencies
    analytics = new Analytics({
      eventTracker: mockEventTracker,
      clientManager: {
        getOrCreateClientId: jest.fn().mockResolvedValue('test-client-id'),
      },
      sessionManager: {
        getOrCreateSessionId: jest.fn().mockResolvedValue('test-session-id'),
      },
    });

    // Mock window.DebugAnalytics
    global.window = { DebugAnalytics: analytics };
  });

  afterEach(() => {
    delete global.window;
  });

  describe('Prompt Copy Events', () => {
    test('should track basic prompt copy event', async () => {
      const promptData = {
        id: 'prompt-123',
        category: 'writing',
        copyMethod: 'button',
        content: 'Write a compelling blog post about...',
        isFavorite: false,
      };

      await analytics.trackPromptCopy(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_copy', {
        prompt_id: 'prompt-123',
        prompt_category: 'writing',
        copy_method: 'button',
        prompt_length: 37, // Length of content string
        is_favorite: false,
      });
    });

    test('should track prompt copy with all optional fields', async () => {
      const promptData = {
        id: 'prompt-456',
        category: 'coding',
        copyMethod: 'keyboard',
        content: 'Create a function that calculates fibonacci sequence efficiently',
        isFavorite: true,
      };

      await analytics.trackPromptCopy(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_copy', {
        prompt_id: 'prompt-456',
        prompt_category: 'coding',
        copy_method: 'keyboard',
        prompt_length: 64, // Length of content string
        is_favorite: true,
      });
    });

    test('should use default values for missing prompt copy data', async () => {
      await analytics.trackPromptCopy({});

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_copy', {
        prompt_id: '',
        prompt_category: 'unknown',
        copy_method: 'button',
        prompt_length: 0,
        is_favorite: false,
      });
    });
  });

  describe('Favorite Action Events', () => {
    test('should track favorite add action', async () => {
      const favoriteData = {
        promptId: 'prompt-789',
        action: 'add',
        category: 'business',
        totalFavorites: 42,
      };

      await analytics.trackFavoriteAction(favoriteData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('favorite_action', {
        prompt_id: 'prompt-789',
        action: 'add',
        prompt_category: 'business',
        total_favorites: 42,
      });
    });

    test('should track favorite remove action', async () => {
      const favoriteData = {
        promptId: 'prompt-999',
        action: 'remove',
        category: 'creative',
        totalFavorites: 23,
      };

      await analytics.trackFavoriteAction(favoriteData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('favorite_action', {
        prompt_id: 'prompt-999',
        action: 'remove',
        prompt_category: 'creative',
        total_favorites: 23,
      });
    });

    test('should use default values for missing favorite data', async () => {
      await analytics.trackFavoriteAction({});

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('favorite_action', {
        prompt_id: '',
        action: 'add',
        prompt_category: 'unknown',
        total_favorites: 0,
      });
    });
  });

  describe('Rating Action Events', () => {
    test('should track rating change from 0 to 5', async () => {
      const ratingData = {
        promptId: 'prompt-555',
        rating: 5,
        previousRating: 0,
        category: 'marketing',
      };

      await analytics.trackRatingAction(ratingData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('rating_action', {
        prompt_id: 'prompt-555',
        user_rating: 5,
        previous_rating: 0,
        prompt_category: 'marketing',
      });
    });

    test('should track rating change from existing rating', async () => {
      const ratingData = {
        promptId: 'prompt-777',
        rating: 3,
        previousRating: 5,
        category: 'technical',
      };

      await analytics.trackRatingAction(ratingData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('rating_action', {
        prompt_id: 'prompt-777',
        user_rating: 3,
        previous_rating: 5,
        prompt_category: 'technical',
      });
    });

    test('should use default values for missing rating data', async () => {
      await analytics.trackRatingAction({});

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('rating_action', {
        prompt_id: '',
        user_rating: 0,
        previous_rating: 0,
        prompt_category: 'unknown',
      });
    });
  });

  describe('Prompt Creation Events', () => {
    test('should track comprehensive prompt creation', async () => {
      const promptData = {
        id: 'new-prompt-123',
        category: 'planning',
        type: 'text',
        content: 'Plan a comprehensive marketing strategy for a new product launch',
        isPrivate: false,
        tags: ['marketing', 'strategy', 'planning'],
        targetAiTools: ['ChatGPT', 'Claude'],
        creationMethod: 'form',
        timeToCreate: 120000, // 2 minutes
      };

      await analytics.trackPromptCreate(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_create', {
        prompt_id: 'new-prompt-123',
        prompt_category: 'planning',
        prompt_type: 'text',
        prompt_length: 64,
        is_private: false,
        tags_count: 3,
        ai_tools_count: 2,
        creation_method: 'form',
        time_to_create_ms: 120000,
      });
    });

    test('should track minimal prompt creation with defaults', async () => {
      const promptData = {
        id: 'minimal-prompt',
        category: 'general',
      };

      await analytics.trackPromptCreate(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_create', {
        prompt_id: 'minimal-prompt',
        prompt_category: 'general',
        prompt_type: 'text',
        prompt_length: 0,
        is_private: false,
        tags_count: 0,
        ai_tools_count: 0,
        creation_method: 'form',
        time_to_create_ms: 0,
      });
    });

    test('should track private prompt creation', async () => {
      const promptData = {
        id: 'private-prompt',
        category: 'personal',
        content: 'Personal journaling prompt for reflection',
        isPrivate: true,
        tags: ['personal', 'reflection'],
        targetAiTools: ['GPT-4'],
        timeToCreate: 60000,
      };

      await analytics.trackPromptCreate(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_create', {
        prompt_id: 'private-prompt',
        prompt_category: 'personal',
        prompt_type: 'text',
        prompt_length: 41,
        is_private: true,
        tags_count: 2,
        ai_tools_count: 1,
        creation_method: 'form',
        time_to_create_ms: 60000,
      });
    });
  });

  describe('Prompt Edit Events', () => {
    test('should track comprehensive prompt edit', async () => {
      const promptData = {
        id: 'edit-prompt-123',
        category: 'writing',
        type: 'text',
        changesMade: ['title', 'content', 'tags'],
        contentLengthBefore: 150,
        contentLengthAfter: 200,
        editDuration: 180000, // 3 minutes
        version: 2,
      };

      await analytics.trackPromptEdit(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_edit', {
        prompt_id: 'edit-prompt-123',
        prompt_category: 'writing',
        prompt_type: 'text',
        changes_made: ['title', 'content', 'tags'],
        content_length_before: 150,
        content_length_after: 200,
        edit_duration_ms: 180000,
        version_number: 2,
      });
    });

    test('should track minimal prompt edit', async () => {
      await analytics.trackPromptEdit({
        id: 'simple-edit',
        category: 'coding',
      });

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_edit', {
        prompt_id: 'simple-edit',
        prompt_category: 'coding',
        prompt_type: 'text',
        changes_made: [],
        content_length_before: 0,
        content_length_after: 0,
        edit_duration_ms: 0,
        version_number: 1,
      });
    });

    test('should track content length change in edit', async () => {
      const promptData = {
        id: 'length-change-prompt',
        category: 'business',
        changesMade: ['content'],
        contentLengthBefore: 500,
        contentLengthAfter: 300,
        editDuration: 45000,
      };

      await analytics.trackPromptEdit(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_edit', {
        prompt_id: 'length-change-prompt',
        prompt_category: 'business',
        prompt_type: 'text',
        changes_made: ['content'],
        content_length_before: 500,
        content_length_after: 300,
        edit_duration_ms: 45000,
        version_number: 1,
      });
    });
  });

  describe('Prompt Delete Events', () => {
    test('should track comprehensive prompt deletion', async () => {
      const promptData = {
        id: 'delete-prompt-123',
        category: 'outdated',
        ageDays: 180, // 6 months old
        usageCount: 25,
        favoritesCount: 8,
        userRating: 3,
        deleteReason: 'cleanup',
        contentLength: 350,
      };

      await analytics.trackPromptDelete(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_delete', {
        prompt_id: 'delete-prompt-123',
        prompt_category: 'outdated',
        prompt_age_days: 180,
        usage_count: 25,
        favorites_count: 8,
        user_rating: 3,
        delete_reason: 'cleanup',
        content_length: 350,
      });
    });

    test('should track user-initiated prompt deletion', async () => {
      const promptData = {
        id: 'user-delete-prompt',
        category: 'writing',
        ageDays: 30,
        usageCount: 2,
        favoritesCount: 0,
        userRating: 0,
        deleteReason: 'user_choice',
        contentLength: 120,
      };

      await analytics.trackPromptDelete(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_delete', {
        prompt_id: 'user-delete-prompt',
        prompt_category: 'writing',
        prompt_age_days: 30,
        usage_count: 2,
        favorites_count: 0,
        user_rating: 0,
        delete_reason: 'user_choice',
        content_length: 120,
      });
    });

    test('should use default values for missing delete data', async () => {
      await analytics.trackPromptDelete({ id: 'minimal-delete' });

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('prompt_delete', {
        prompt_id: 'minimal-delete',
        prompt_category: 'unknown',
        prompt_age_days: 0,
        usage_count: 0,
        favorites_count: 0,
        user_rating: 0,
        delete_reason: 'unknown',
        content_length: 0,
      });
    });
  });

  describe('Cross-Event Analysis', () => {
    test('should track complete prompt lifecycle', async () => {
      // 1. Create prompt
      await analytics.trackPromptCreate({
        id: 'lifecycle-prompt',
        category: 'productivity',
        content: 'Organize daily tasks efficiently',
        tags: ['productivity', 'organization'],
        targetAiTools: ['ChatGPT'],
        timeToCreate: 90000,
      });

      // 2. Copy prompt
      await analytics.trackPromptCopy({
        id: 'lifecycle-prompt',
        category: 'productivity',
        copyMethod: 'button',
        content: 'Organize daily tasks efficiently',
        isFavorite: false,
      });

      // 3. Favorite prompt
      await analytics.trackFavoriteAction({
        promptId: 'lifecycle-prompt',
        action: 'add',
        category: 'productivity',
        totalFavorites: 1,
      });

      // 4. Rate prompt
      await analytics.trackRatingAction({
        promptId: 'lifecycle-prompt',
        rating: 5,
        previousRating: 0,
        category: 'productivity',
      });

      // 5. Edit prompt
      await analytics.trackPromptEdit({
        id: 'lifecycle-prompt',
        category: 'productivity',
        changesMade: ['content'],
        contentLengthBefore: 32,
        contentLengthAfter: 45,
        editDuration: 120000,
      });

      // Verify all events were tracked
      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(5);

      const calls = mockEventTracker.trackEvent.mock.calls;
      expect(calls[0][0]).toBe('prompt_create');
      expect(calls[1][0]).toBe('prompt_copy');
      expect(calls[2][0]).toBe('favorite_action');
      expect(calls[3][0]).toBe('rating_action');
      expect(calls[4][0]).toBe('prompt_edit');
    });

    test('should track different copy methods', async () => {
      const methods = ['button', 'keyboard', 'context_menu'];

      for (const method of methods) {
        await analytics.trackPromptCopy({
          id: 'test-prompt',
          category: 'test',
          copyMethod: method,
          content: 'Test content',
        });
      }

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(3);

      const calls = mockEventTracker.trackEvent.mock.calls;
      calls.forEach((call, index) => {
        expect(call[1].copy_method).toBe(methods[index]);
      });
    });

    test('should track different delete reasons', async () => {
      const reasons = ['user_choice', 'cleanup', 'policy_violation'];

      for (const reason of reasons) {
        await analytics.trackPromptDelete({
          id: `delete-test-${reason}`,
          category: 'test',
          deleteReason: reason,
        });
      }

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(3);

      const calls = mockEventTracker.trackEvent.mock.calls;
      calls.forEach((call, index) => {
        expect(call[1].delete_reason).toBe(reasons[index]);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle EventTracker errors gracefully for all custom events', async () => {
      mockEventTracker.trackEvent.mockRejectedValue(new Error('Network error'));

      // Test all custom event methods
      const promises = [
        analytics.trackPromptCopy({ id: 'test' }),
        analytics.trackFavoriteAction({ promptId: 'test' }),
        analytics.trackRatingAction({ promptId: 'test' }),
        analytics.trackPromptCreate({ id: 'test' }),
        analytics.trackPromptEdit({ id: 'test' }),
        analytics.trackPromptDelete({ id: 'test' }),
      ];

      // All should reject but not throw
      for (const promise of promises) {
        await expect(promise).rejects.toThrow('Network error');
      }

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(6);
    });

    test('should handle null/undefined data gracefully', async () => {
      // Test with null data
      await analytics.trackPromptCopy(null);
      await analytics.trackFavoriteAction(undefined);
      await analytics.trackRatingAction(null);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(3);

      // All calls should have used default values
      const calls = mockEventTracker.trackEvent.mock.calls;
      calls.forEach(call => {
        expect(call[1]).toMatchObject({
          prompt_id: expect.any(String),
        });
      });
    });
  });

  describe('Analytics Initialization', () => {
    test('should initialize analytics before tracking any custom event', async () => {
      const initSpy = jest.spyOn(analytics, 'init').mockResolvedValue();

      await analytics.trackPromptCopy({ id: 'test' });
      await analytics.trackFavoriteAction({ promptId: 'test' });
      await analytics.trackRatingAction({ promptId: 'test' });
      await analytics.trackPromptCreate({ id: 'test' });
      await analytics.trackPromptEdit({ id: 'test' });
      await analytics.trackPromptDelete({ id: 'test' });

      expect(initSpy).toHaveBeenCalledTimes(6);
      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(6);
    });

    test('should handle initialization failures for custom events', async () => {
      jest.spyOn(analytics, 'init').mockRejectedValue(new Error('Init failed'));

      for (const method of ['trackPromptCopy', 'trackFavoriteAction', 'trackRatingAction']) {
        await expect(analytics[method]({ id: 'test' })).rejects.toThrow('Init failed');
      }
    });
  });

  describe('Performance Metrics', () => {
    test('should track performance timing for prompt creation', async () => {
      const performanceData = {
        id: 'perf-test-prompt',
        category: 'performance',
        timeToCreate: 240000, // 4 minutes - slow creation
      };

      await analytics.trackPromptCreate(performanceData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith(
        'prompt_create',
        expect.objectContaining({
          time_to_create_ms: 240000,
        })
      );
    });

    test('should track performance timing for prompt editing', async () => {
      const performanceData = {
        id: 'perf-edit-prompt',
        category: 'performance',
        editDuration: 30000, // 30 seconds - quick edit
      };

      await analytics.trackPromptEdit(performanceData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith(
        'prompt_edit',
        expect.objectContaining({
          edit_duration_ms: 30000,
        })
      );
    });
  });
});
