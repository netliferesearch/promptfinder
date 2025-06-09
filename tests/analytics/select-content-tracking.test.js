/**
 * Select Content Tracking Tests
 *
 * Tests for GA4 select_content event tracking in PromptFinder.
 * Covers all prompt interactions: view details, copy, favorite, rate, edit, create, delete, expand text.
 */

import { jest } from '@jest/globals';

describe('Select Content Event Tracking', () => {
  let Analytics, analytics;
  let mockEventTracker, mockClientManager, mockSessionManager;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Mock the dependencies
    mockEventTracker = {
      trackEvent: jest.fn().mockResolvedValue(true),
      trackPageView: jest.fn().mockResolvedValue(true),
      trackSearch: jest.fn().mockResolvedValue(true),
      trackEngagement: jest.fn().mockResolvedValue(true),
      trackConversion: jest.fn().mockResolvedValue(true),
      trackError: jest.fn().mockResolvedValue(true),
      flush: jest.fn().mockResolvedValue(true),
      clearQueue: jest.fn(),
      getQueueStatus: jest.fn().mockReturnValue({ length: 0, processing: false }),
      setDebugMode: jest.fn(),
    };

    mockClientManager = {
      getOrCreateClientId: jest.fn().mockResolvedValue('test-client-id'),
      getCurrentClientId: jest.fn().mockReturnValue('test-client-id'),
    };

    mockSessionManager = {
      getOrCreateSessionId: jest.fn().mockResolvedValue('test-session-id'),
      getCurrentSessionId: jest.fn().mockReturnValue('test-session-id'),
    };

    // Import Analytics class
    const module = await import('../../js/analytics/analytics.js');
    Analytics = module.Analytics;

    // Create analytics instance with mocked dependencies
    analytics = new Analytics({
      eventTracker: mockEventTracker,
      clientManager: mockClientManager,
      sessionManager: mockSessionManager,
    });

    // Mock window.DebugAnalytics
    global.window = { DebugAnalytics: analytics };
  });

  afterEach(() => {
    delete global.window;
  });

  describe('trackContentSelection method', () => {
    test('should track basic content selection with required parameters', async () => {
      const contentData = {
        contentType: 'prompt',
        contentId: 'test-prompt-id',
        promptId: 'test-prompt-id',
        promptCategory: 'writing',
        source: 'prompt_list',
        method: 'click',
      };

      await analytics.trackContentSelection(contentData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'test-prompt-id',
        prompt_id: 'test-prompt-id',
        prompt_category: 'writing',
        selection_source: 'prompt_list',
        selection_method: 'click',
        user_rating: 0,
        is_favorite: false,
        view_duration_ms: 0,
      });
    });

    test('should track content selection with all optional parameters', async () => {
      const contentData = {
        contentType: 'prompt',
        contentId: 'test-prompt-id',
        promptId: 'test-prompt-id',
        promptCategory: 'coding',
        source: 'prompt_details',
        method: 'copy',
        userRating: 5,
        isFavorite: true,
        viewDuration: 15000,
      };

      await analytics.trackContentSelection(contentData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'test-prompt-id',
        prompt_id: 'test-prompt-id',
        prompt_category: 'coding',
        selection_source: 'prompt_details',
        selection_method: 'copy',
        user_rating: 5,
        is_favorite: true,
        view_duration_ms: 15000,
      });
    });

    test('should use default values for missing parameters', async () => {
      await analytics.trackContentSelection({});

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: '',
        prompt_id: '',
        prompt_category: 'unknown',
        selection_source: 'unknown',
        selection_method: 'click',
        user_rating: 0,
        is_favorite: false,
        view_duration_ms: 0,
      });
    });
  });

  describe('Prompt Interaction Tracking', () => {
    test('should track prompt details view selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'prompt-123',
        promptId: 'prompt-123',
        promptCategory: 'writing',
        source: 'prompt_list',
        method: 'click',
        userRating: 3,
        isFavorite: false,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'prompt-123',
        prompt_id: 'prompt-123',
        prompt_category: 'writing',
        selection_source: 'prompt_list',
        selection_method: 'click',
        user_rating: 3,
        is_favorite: false,
        view_duration_ms: 0,
      });
    });

    test('should track prompt copy selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'prompt-456',
        promptId: 'prompt-456',
        promptCategory: 'coding',
        source: 'prompt_details',
        method: 'copy',
        userRating: 0,
        isFavorite: true,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'prompt-456',
        prompt_id: 'prompt-456',
        prompt_category: 'coding',
        selection_source: 'prompt_details',
        selection_method: 'copy',
        user_rating: 0,
        is_favorite: true,
        view_duration_ms: 0,
      });
    });

    test('should track favorite add selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'prompt-789',
        promptId: 'prompt-789',
        promptCategory: 'business',
        source: 'prompt_list',
        method: 'favorite_add',
        userRating: 4,
        isFavorite: true,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'prompt-789',
        prompt_id: 'prompt-789',
        prompt_category: 'business',
        selection_source: 'prompt_list',
        selection_method: 'favorite_add',
        user_rating: 4,
        is_favorite: true,
        view_duration_ms: 0,
      });
    });

    test('should track favorite remove selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'prompt-999',
        promptId: 'prompt-999',
        promptCategory: 'marketing',
        source: 'prompt_details',
        method: 'favorite_remove',
        userRating: 2,
        isFavorite: false,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'prompt-999',
        prompt_id: 'prompt-999',
        prompt_category: 'marketing',
        selection_source: 'prompt_details',
        selection_method: 'favorite_remove',
        user_rating: 2,
        is_favorite: false,
        view_duration_ms: 0,
      });
    });

    test('should track rating selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'prompt-555',
        promptId: 'prompt-555',
        promptCategory: 'creative',
        source: 'prompt_details',
        method: 'rating',
        userRating: 5,
        isFavorite: true,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'prompt-555',
        prompt_id: 'prompt-555',
        prompt_category: 'creative',
        selection_source: 'prompt_details',
        selection_method: 'rating',
        user_rating: 5,
        is_favorite: true,
        view_duration_ms: 0,
      });
    });
  });

  describe('Prompt Management Tracking', () => {
    test('should track prompt creation selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'new-prompt-id',
        promptId: 'new-prompt-id',
        promptCategory: 'writing',
        source: 'prompt_form',
        method: 'create',
        userRating: 0,
        isFavorite: false,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'new-prompt-id',
        prompt_id: 'new-prompt-id',
        prompt_category: 'writing',
        selection_source: 'prompt_form',
        selection_method: 'create',
        user_rating: 0,
        is_favorite: false,
        view_duration_ms: 0,
      });
    });

    test('should track prompt edit selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'edit-prompt-id',
        promptId: 'edit-prompt-id',
        promptCategory: 'coding',
        source: 'prompt_details',
        method: 'edit',
        userRating: 3,
        isFavorite: true,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'edit-prompt-id',
        prompt_id: 'edit-prompt-id',
        prompt_category: 'coding',
        selection_source: 'prompt_details',
        selection_method: 'edit',
        user_rating: 3,
        is_favorite: true,
        view_duration_ms: 0,
      });
    });

    test('should track prompt delete selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'delete-prompt-id',
        promptId: 'delete-prompt-id',
        promptCategory: 'business',
        source: 'prompt_details',
        method: 'delete',
        userRating: 2,
        isFavorite: false,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'delete-prompt-id',
        prompt_id: 'delete-prompt-id',
        prompt_category: 'business',
        selection_source: 'prompt_details',
        selection_method: 'delete',
        user_rating: 2,
        is_favorite: false,
        view_duration_ms: 0,
      });
    });
  });

  describe('Text Expansion Tracking', () => {
    test('should track text expansion selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'expand-prompt-id',
        promptId: 'expand-prompt-id',
        promptCategory: 'creative',
        source: 'prompt_details',
        method: 'expand_text',
        userRating: 4,
        isFavorite: true,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'expand-prompt-id',
        prompt_id: 'expand-prompt-id',
        prompt_category: 'creative',
        selection_source: 'prompt_details',
        selection_method: 'expand_text',
        user_rating: 4,
        is_favorite: true,
        view_duration_ms: 0,
      });
    });

    test('should track text collapse selection', async () => {
      const promptData = {
        contentType: 'prompt',
        contentId: 'collapse-prompt-id',
        promptId: 'collapse-prompt-id',
        promptCategory: 'technical',
        source: 'prompt_details',
        method: 'collapse_text',
        userRating: 5,
        isFavorite: false,
      };

      await analytics.trackContentSelection(promptData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: 'collapse-prompt-id',
        prompt_id: 'collapse-prompt-id',
        prompt_category: 'technical',
        selection_source: 'prompt_details',
        selection_method: 'collapse_text',
        user_rating: 5,
        is_favorite: false,
        view_duration_ms: 0,
      });
    });
  });

  describe('Source Context Tracking', () => {
    test('should track selections from different sources', async () => {
      const sources = [
        'prompt_list',
        'prompt_details',
        'prompt_form',
        'search_results',
        'favorites_tab',
        'private_tab',
      ];

      for (const source of sources) {
        await analytics.trackContentSelection({
          contentType: 'prompt',
          contentId: 'test-id',
          promptId: 'test-id',
          promptCategory: 'test',
          source: source,
          method: 'click',
        });

        expect(mockEventTracker.trackEvent).toHaveBeenCalledWith(
          'select_content',
          expect.objectContaining({
            selection_source: source,
          })
        );
      }

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(sources.length);
    });

    test('should track selections with different methods', async () => {
      const methods = [
        'click',
        'copy',
        'favorite_add',
        'favorite_remove',
        'rating',
        'create',
        'edit',
        'delete',
        'expand_text',
        'collapse_text',
      ];

      for (const method of methods) {
        await analytics.trackContentSelection({
          contentType: 'prompt',
          contentId: 'test-id',
          promptId: 'test-id',
          promptCategory: 'test',
          source: 'prompt_details',
          method: method,
        });

        expect(mockEventTracker.trackEvent).toHaveBeenCalledWith(
          'select_content',
          expect.objectContaining({
            selection_method: method,
          })
        );
      }

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(methods.length);
    });
  });

  describe('Error Handling', () => {
    test('should handle EventTracker errors gracefully', async () => {
      mockEventTracker.trackEvent.mockRejectedValueOnce(new Error('Network error'));

      const result = await analytics
        .trackContentSelection({
          contentType: 'prompt',
          contentId: 'test-id',
          promptId: 'test-id',
          promptCategory: 'test',
          source: 'prompt_list',
          method: 'click',
        })
        .catch(() => false);

      expect(result).toBe(false);
      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(1);
    });

    test('should handle invalid content data gracefully', async () => {
      const invalidData = null;

      await analytics.trackContentSelection(invalidData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('select_content', {
        content_type: 'prompt',
        content_id: '',
        prompt_id: '',
        prompt_category: 'unknown',
        selection_source: 'unknown',
        selection_method: 'click',
        user_rating: 0,
        is_favorite: false,
        view_duration_ms: 0,
      });
    });
  });

  describe('Analytics Initialization', () => {
    test('should initialize analytics before tracking', async () => {
      const initSpy = jest.spyOn(analytics, 'init').mockResolvedValue();

      await analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'test-id',
      });

      expect(initSpy).toHaveBeenCalled();
      expect(mockEventTracker.trackEvent).toHaveBeenCalled();
    });

    test('should handle initialization errors', async () => {
      jest.spyOn(analytics, 'init').mockRejectedValueOnce(new Error('Init failed'));

      const promise = analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'test-id',
      });

      await expect(promise).rejects.toThrow('Init failed');
    });
  });

  describe('Integration Scenarios', () => {
    test('should track complete user interaction flow', async () => {
      // User views prompt
      await analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'flow-test-id',
        promptId: 'flow-test-id',
        promptCategory: 'writing',
        source: 'prompt_list',
        method: 'click',
        userRating: 0,
        isFavorite: false,
      });

      // User expands text
      await analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'flow-test-id',
        promptId: 'flow-test-id',
        promptCategory: 'writing',
        source: 'prompt_details',
        method: 'expand_text',
        userRating: 0,
        isFavorite: false,
      });

      // User rates prompt
      await analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'flow-test-id',
        promptId: 'flow-test-id',
        promptCategory: 'writing',
        source: 'prompt_details',
        method: 'rating',
        userRating: 4,
        isFavorite: false,
      });

      // User favorites prompt
      await analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'flow-test-id',
        promptId: 'flow-test-id',
        promptCategory: 'writing',
        source: 'prompt_details',
        method: 'favorite_add',
        userRating: 4,
        isFavorite: true,
      });

      // User copies prompt
      await analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'flow-test-id',
        promptId: 'flow-test-id',
        promptCategory: 'writing',
        source: 'prompt_details',
        method: 'copy',
        userRating: 4,
        isFavorite: true,
      });

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(5);

      // Verify progression through interaction states
      const calls = mockEventTracker.trackEvent.mock.calls;
      expect(calls[0][1].selection_method).toBe('click');
      expect(calls[1][1].selection_method).toBe('expand_text');
      expect(calls[2][1].selection_method).toBe('rating');
      expect(calls[2][1].user_rating).toBe(4);
      expect(calls[3][1].selection_method).toBe('favorite_add');
      expect(calls[3][1].is_favorite).toBe(true);
      expect(calls[4][1].selection_method).toBe('copy');
    });

    test('should track content management workflow', async () => {
      // User creates new prompt
      await analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'new-prompt-workflow',
        promptId: 'new-prompt-workflow',
        promptCategory: 'coding',
        source: 'prompt_form',
        method: 'create',
        userRating: 0,
        isFavorite: false,
      });

      // User edits the prompt
      await analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'new-prompt-workflow',
        promptId: 'new-prompt-workflow',
        promptCategory: 'coding',
        source: 'prompt_details',
        method: 'edit',
        userRating: 0,
        isFavorite: false,
      });

      // User eventually deletes the prompt
      await analytics.trackContentSelection({
        contentType: 'prompt',
        contentId: 'new-prompt-workflow',
        promptId: 'new-prompt-workflow',
        promptCategory: 'coding',
        source: 'prompt_details',
        method: 'delete',
        userRating: 0,
        isFavorite: false,
      });

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(3);

      const calls = mockEventTracker.trackEvent.mock.calls;
      expect(calls[0][1].selection_method).toBe('create');
      expect(calls[1][1].selection_method).toBe('edit');
      expect(calls[2][1].selection_method).toBe('delete');
    });
  });
});
