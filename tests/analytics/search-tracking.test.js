/**
 * Tests for Search Event Tracking
 * Tests the search, filter, and sort tracking functionality
 */

// Mock the dependencies using proper Jest mock pattern
jest.mock('../../js/analytics/event-tracker.js', () => ({
  __esModule: true,
  default: {
    trackEvent: jest.fn().mockResolvedValue(true),
    trackSearch: jest.fn().mockResolvedValue(true),
    trackError: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../js/analytics/client-manager.js', () => ({
  __esModule: true,
  default: {
    getOrCreateClientId: jest.fn().mockResolvedValue('test-client-id'),
  },
}));

jest.mock('../../js/analytics/session-manager.js', () => ({
  __esModule: true,
  default: {
    getOrCreateSessionId: jest.fn().mockResolvedValue('test-session-id'),
  },
}));

jest.mock('../../js/analytics/config.js', () => ({
  isValidEnvironment: jest.fn().mockReturnValue(true),
}));

import { Analytics } from '../../js/analytics/analytics.js';
import eventTracker from '../../js/analytics/event-tracker.js';

describe('Search Event Tracking', () => {
  let analytics;

  beforeEach(() => {
    jest.clearAllMocks();
    analytics = new Analytics();
  });

  describe('Prompt Search Tracking', () => {
    test('should track basic search with query and results', async () => {
      const searchData = {
        query: 'test query',
        resultsCount: 5,
        searchType: 'client_filter',
        duration: 150,
        activeTab: 'all',
      };

      const result = await analytics.trackPromptSearch(searchData);

      expect(result).toBe(true);
      expect(eventTracker.trackSearch).toHaveBeenCalledWith({
        query: 'test query',
        results_count: 5,
        category: 'prompt_search',
        type: 'client_filter',
        filters_used: [],
        search_duration_ms: 150,
        customParameters: {
          has_filters: false,
          query_length: 10,
        },
      });
    });

    test('should track server-side search with server duration', async () => {
      const searchData = {
        query: 'machine learning',
        resultsCount: 12,
        searchType: 'server_search',
        duration: 200,
        serverDuration: 180,
        totalResults: 12,
        activeTab: 'all',
      };

      const result = await analytics.trackPromptSearch(searchData);

      expect(result).toBe(true);
      expect(eventTracker.trackSearch).toHaveBeenCalledWith({
        query: 'machine learning',
        results_count: 12,
        category: 'prompt_search',
        type: 'server_search',
        filters_used: [],
        search_duration_ms: 200,
        customParameters: {
          has_filters: false,
          query_length: 16,
        },
      });
    });

    test('should track search with multiple filters', async () => {
      const searchData = {
        query: 'writing prompts',
        resultsCount: 3,
        searchType: 'client_filter',
        filtersUsed: ['category', 'minRating', 'yourPromptsOnly'],
        duration: 75,
        activeTab: 'private',
        sortBy: 'averageRating',
        sortDir: 'desc',
      };

      const result = await analytics.trackPromptSearch(searchData);

      expect(result).toBe(true);
      expect(eventTracker.trackSearch).toHaveBeenCalledWith({
        query: 'writing prompts',
        results_count: 3,
        category: 'prompt_search',
        type: 'client_filter',
        filters_used: ['category', 'minRating', 'yourPromptsOnly'],
        search_duration_ms: 75,
        customParameters: {
          has_filters: true,
          query_length: 15,
        },
      });
    });

    test('should track search with empty query', async () => {
      const searchData = {
        query: '',
        resultsCount: 0,
        searchType: 'client_filter',
        duration: 5,
      };

      const result = await analytics.trackPromptSearch(searchData);

      expect(result).toBe(true);
      expect(eventTracker.trackSearch).toHaveBeenCalledWith({
        query: '',
        results_count: 0,
        category: 'prompt_search',
        type: 'client_filter',
        filters_used: [],
        search_duration_ms: 5,
        customParameters: {
          has_filters: false,
          query_length: 0,
        },
      });
    });

    test('should track search with default values when no data provided', async () => {
      const result = await analytics.trackPromptSearch();

      expect(result).toBe(true);
      expect(eventTracker.trackSearch).toHaveBeenCalledWith({
        query: '',
        results_count: 0,
        category: 'prompt_search',
        type: 'text',
        filters_used: [],
        search_duration_ms: 0,
        customParameters: {
          has_filters: false,
          query_length: 0,
        },
      });
    });
  });

  describe('Filter Usage Tracking', () => {
    test('should track filter usage with type and value', async () => {
      const filterData = {
        type: 'category',
        value: 'writing',
        activeFilters: ['category'],
        resultsCount: 8,
        context: 'popup',
      };

      const result = await analytics.trackFilterUsage(filterData);

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('filter_usage', {
        filter_type: 'category',
        filter_value: 'writing',
        active_filters: ['category'],
        results_count: 8,
      });
    });

    test('should track multiple filter usage', async () => {
      const filterData = {
        type: 'min_rating',
        value: '4',
        activeFilters: ['category', 'min_rating', 'tag'],
        resultsCount: 2,
        context: 'popup',
      };

      const result = await analytics.trackFilterUsage(filterData);

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('filter_usage', {
        filter_type: 'min_rating',
        filter_value: '4',
        active_filters: ['category', 'min_rating', 'tag'],
        results_count: 2,
      });
    });

    test('should track boolean filter usage', async () => {
      const filterData = {
        type: 'your_prompts_only',
        value: 'enabled',
        activeFilters: ['your_prompts_only'],
        resultsCount: 15,
        context: 'popup',
      };

      const result = await analytics.trackFilterUsage(filterData);

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('filter_usage', {
        filter_type: 'your_prompts_only',
        filter_value: 'enabled',
        active_filters: ['your_prompts_only'],
        results_count: 15,
      });
    });

    test('should track filter usage with default values', async () => {
      const result = await analytics.trackFilterUsage();

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('filter_usage', {
        filter_type: 'unknown',
        filter_value: '',
        active_filters: [],
        results_count: 0,
      });
    });
  });

  describe('Custom Search Events', () => {
    test('should track sort usage events', async () => {
      const result = await analytics.trackCustomEvent('sort_usage', {
        sort_by: 'averageRating',
        sort_dir: 'desc',
        context: 'popup',
      });

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith(
        'sort_usage',
        {
          sort_by: 'averageRating',
          sort_dir: 'desc',
          context: 'popup',
        },
        {}
      );
    });

    test('should track sort direction change events', async () => {
      const result = await analytics.trackCustomEvent('sort_direction_change', {
        sort_by: 'createdAt',
        sort_dir: 'asc',
        context: 'popup',
      });

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith(
        'sort_direction_change',
        {
          sort_by: 'createdAt',
          sort_dir: 'asc',
          context: 'popup',
        },
        {}
      );
    });

    test('should track search no results events', async () => {
      const result = await analytics.trackCustomEvent('search_no_results', {
        search_term: 'nonexistent query',
        active_tab: 'all',
        context: 'popup',
      });

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith(
        'search_no_results',
        {
          search_term: 'nonexistent query',
          active_tab: 'all',
          context: 'popup',
        },
        {}
      );
    });

    test('should track search error events', async () => {
      const result = await analytics.trackError({
        message: 'Network timeout',
        code: 'search_timeout',
        category: 'search_error',
        severity: 'error',
        context: 'search_input',
        userAction: 'server_search',
        version: '1.0.0',
      });

      expect(result).toBe(true);
      expect(eventTracker.trackError).toHaveBeenCalledWith({
        message: 'Network timeout',
        code: 'search_timeout',
        category: 'search_error',
        severity: 'error',
        stack: undefined,
        customParameters: {
          context: 'search_input',
          user_action: 'server_search',
          extension_version: '1.0.0',
        },
      });
    });
  });

  describe('Search Performance Tracking', () => {
    test('should track search with performance metrics', async () => {
      const searchData = {
        query: 'AI prompts',
        resultsCount: 25,
        searchType: 'server_search',
        duration: 300,
        serverDuration: 250,
        totalResults: 25,
        activeTab: 'all',
        filtersUsed: [],
      };

      const result = await analytics.trackPromptSearch(searchData);

      expect(result).toBe(true);
      expect(eventTracker.trackSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'AI prompts',
          results_count: 25,
          search_duration_ms: 300,
          type: 'server_search',
        })
      );
    });

    test('should track fast searches separately from slow searches', async () => {
      // Fast search
      await analytics.trackPromptSearch({
        query: 'quick',
        resultsCount: 1,
        searchType: 'client_filter',
        duration: 10,
      });

      expect(eventTracker.trackSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          search_duration_ms: 10,
        })
      );

      // Slow search
      await analytics.trackPromptSearch({
        query: 'complex search query',
        resultsCount: 100,
        searchType: 'server_search',
        duration: 2000,
      });

      expect(eventTracker.trackSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          search_duration_ms: 2000,
        })
      );
    });
  });

  describe('Search Context Tracking', () => {
    test('should track search context with different tabs', async () => {
      const tabs = ['all', 'favs', 'private'];

      for (const tab of tabs) {
        await analytics.trackPromptSearch({
          query: `test query in ${tab}`,
          resultsCount: 5,
          searchType: 'client_filter',
          activeTab: tab,
        });

        expect(eventTracker.trackSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            query: `test query in ${tab}`,
          })
        );
      }

      expect(eventTracker.trackSearch).toHaveBeenCalledTimes(3);
    });

    test('should track search with different search types', async () => {
      const searchTypes = ['client_filter', 'server_search', 'text'];

      for (const type of searchTypes) {
        await analytics.trackPromptSearch({
          query: 'test query',
          resultsCount: 5,
          searchType: type,
        });

        expect(eventTracker.trackSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: type,
          })
        );
      }

      expect(eventTracker.trackSearch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Analytics Initialization', () => {
    test('should initialize analytics before tracking search', async () => {
      const analytics = new Analytics();
      const initSpy = jest.spyOn(analytics, 'init');

      await analytics.trackPromptSearch({ query: 'test' });

      expect(initSpy).toHaveBeenCalled();
    });

    test('should initialize analytics before tracking filter usage', async () => {
      const analytics = new Analytics();
      const initSpy = jest.spyOn(analytics, 'init');

      await analytics.trackFilterUsage({ type: 'category', value: 'test' });

      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle search tracking failure gracefully', async () => {
      eventTracker.trackSearch.mockResolvedValueOnce(false);

      const result = await analytics.trackPromptSearch({
        query: 'test query',
        resultsCount: 5,
      });

      expect(result).toBe(false);
      expect(eventTracker.trackSearch).toHaveBeenCalled();
    });

    test('should handle filter tracking failure gracefully', async () => {
      eventTracker.trackEvent.mockResolvedValueOnce(false);

      const result = await analytics.trackFilterUsage({
        type: 'category',
        value: 'test',
      });

      expect(result).toBe(false);
      expect(eventTracker.trackEvent).toHaveBeenCalled();
    });

    test('should handle custom event tracking failure gracefully', async () => {
      eventTracker.trackEvent.mockResolvedValueOnce(false);

      const result = await analytics.trackCustomEvent('sort_usage', {
        sort_by: 'title',
        sort_dir: 'asc',
      });

      expect(result).toBe(false);
      expect(eventTracker.trackEvent).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    test('should track complete search and filter flow', async () => {
      // 1. User performs search
      await analytics.trackPromptSearch({
        query: 'AI writing',
        resultsCount: 50,
        searchType: 'server_search',
        duration: 200,
      });

      // 2. User applies category filter
      await analytics.trackFilterUsage({
        type: 'category',
        value: 'writing',
        activeFilters: ['category'],
        resultsCount: 20,
      });

      // 3. User changes sort order
      await analytics.trackCustomEvent('sort_usage', {
        sort_by: 'averageRating',
        sort_dir: 'desc',
      });

      // 4. User gets no results with new filters
      await analytics.trackCustomEvent('search_no_results', {
        search_term: 'AI writing',
        active_tab: 'all',
      });

      expect(eventTracker.trackSearch).toHaveBeenCalledTimes(1);
      expect(eventTracker.trackEvent).toHaveBeenCalledTimes(3);
    });

    test('should track search refinement workflow', async () => {
      // Initial broad search
      await analytics.trackPromptSearch({
        query: 'marketing',
        resultsCount: 100,
        searchType: 'server_search',
        filtersUsed: [],
      });

      // Refined search with filters
      await analytics.trackPromptSearch({
        query: 'marketing',
        resultsCount: 15,
        searchType: 'client_filter',
        filtersUsed: ['category', 'minRating'],
      });

      // Further refinement
      await analytics.trackPromptSearch({
        query: 'marketing email',
        resultsCount: 5,
        searchType: 'server_search',
        filtersUsed: ['category', 'minRating'],
      });

      expect(eventTracker.trackSearch).toHaveBeenCalledTimes(3);

      // Check that has_filters is correctly tracked
      const calls = eventTracker.trackSearch.mock.calls;
      expect(calls[0][0].customParameters.has_filters).toBe(false);
      expect(calls[1][0].customParameters.has_filters).toBe(true);
      expect(calls[2][0].customParameters.has_filters).toBe(true);
    });
  });
});
