/**
 * Conversion Funnel Tracking Tests
 *
 * Tests for GA4 funnel tracking events in PromptFinder:
 * - Registration funnel (signup to verification)
 * - Onboarding funnel (first login to first interaction)
 * - Prompt engagement funnel (view to copy/favorite)
 * - Content creation funnel (intent to saved prompt)
 * - User activation funnel (signup to value realization)
 */

import { jest } from '@jest/globals';

describe('Funnel Tracking', () => {
  let Analytics, analytics;
  let mockEventTracker, mockClientManager, mockSessionManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup mocks
    mockEventTracker = {
      trackEvent: jest.fn().mockResolvedValue(true),
      trackConversion: jest.fn().mockResolvedValue(true),
      flush: jest.fn().mockResolvedValue(true),
    };

    mockClientManager = {
      getOrCreateClientId: jest.fn().mockResolvedValue('test-client-id'),
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

  describe('Registration Funnel', () => {
    test('should track signup started', async () => {
      const funnelData = {
        step: 'signup_started',
        stepNumber: 1,
        method: 'email',
      };

      await analytics.trackRegistrationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_registration', {
        funnel_step: 'signup_started',
        step_number: 1,
        funnel_name: 'user_registration',
        user_id: '',
        signup_method: 'email',
        form_completion_time_ms: 0,
        validation_errors: [],
        exit_point: null,
      });
    });

    test('should track signup form validation errors', async () => {
      const funnelData = {
        step: 'validation_error',
        stepNumber: 1,
        method: 'email',
        validationErrors: ['display_name_required', 'email_invalid'],
        exitPoint: 'form_validation',
        formTime: 15000,
      };

      await analytics.trackRegistrationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_registration', {
        funnel_step: 'validation_error',
        step_number: 1,
        funnel_name: 'user_registration',
        user_id: '',
        signup_method: 'email',
        form_completion_time_ms: 15000,
        validation_errors: ['display_name_required', 'email_invalid'],
        exit_point: 'form_validation',
      });
    });

    test('should track signup completion', async () => {
      const funnelData = {
        step: 'signup_completed',
        stepNumber: 2,
        userId: 'user123',
        method: 'email',
        formTime: 45000,
      };

      await analytics.trackRegistrationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_registration', {
        funnel_step: 'signup_completed',
        step_number: 2,
        funnel_name: 'user_registration',
        user_id: 'user123',
        signup_method: 'email',
        form_completion_time_ms: 45000,
        validation_errors: [],
        exit_point: null,
      });
    });

    test('should track Google signup', async () => {
      const funnelData = {
        step: 'signup_completed',
        stepNumber: 1,
        userId: 'user456',
        method: 'google',
        formTime: 5000, // Much faster with Google
      };

      await analytics.trackRegistrationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_registration', {
        funnel_step: 'signup_completed',
        step_number: 1,
        funnel_name: 'user_registration',
        user_id: 'user456',
        signup_method: 'google',
        form_completion_time_ms: 5000,
        validation_errors: [],
        exit_point: null,
      });
    });
  });

  describe('Onboarding Funnel', () => {
    test('should track first login', async () => {
      const funnelData = {
        step: 'login_success',
        stepNumber: 1,
        userId: 'user789',
        timeSinceRegistration: 300000, // 5 minutes
        sessionNumber: 1,
      };

      await analytics.trackOnboardingFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_onboarding', {
        funnel_step: 'login_success',
        step_number: 1,
        funnel_name: 'user_onboarding',
        user_id: 'user789',
        time_since_registration_ms: 300000,
        session_number: 1,
        prompts_available: 0,
        interaction_type: null,
      });
    });

    test('should track popup opened', async () => {
      const funnelData = {
        step: 'popup_opened',
        stepNumber: 2,
        userId: 'user789',
        sessionNumber: 1,
        promptsAvailable: 150,
      };

      await analytics.trackOnboardingFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_onboarding', {
        funnel_step: 'popup_opened',
        step_number: 2,
        funnel_name: 'user_onboarding',
        user_id: 'user789',
        time_since_registration_ms: 0,
        session_number: 1,
        prompts_available: 150,
        interaction_type: null,
      });
    });

    test('should track first interaction', async () => {
      const funnelData = {
        step: 'first_interaction',
        stepNumber: 3,
        userId: 'user789',
        interactionType: 'view',
        promptsAvailable: 150,
        sessionNumber: 1,
      };

      await analytics.trackOnboardingFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_onboarding', {
        funnel_step: 'first_interaction',
        step_number: 3,
        funnel_name: 'user_onboarding',
        user_id: 'user789',
        time_since_registration_ms: 0,
        session_number: 1,
        prompts_available: 150,
        interaction_type: 'view',
      });
    });
  });

  describe('Prompt Engagement Funnel', () => {
    test('should track prompt viewed', async () => {
      const funnelData = {
        step: 'viewed',
        stepNumber: 1,
        promptId: 'prompt-123',
        promptCategory: 'writing',
        promptLength: 250,
        isFavorite: false,
        userRating: 0,
        engagementDepth: 'surface',
      };

      await analytics.trackPromptEngagementFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_prompt_engagement', {
        funnel_step: 'viewed',
        step_number: 1,
        funnel_name: 'prompt_engagement',
        prompt_id: 'prompt-123',
        prompt_category: 'writing',
        view_duration_ms: 0,
        prompt_length: 250,
        user_rating: 0,
        is_favorite: false,
        engagement_depth: 'surface',
      });
    });

    test('should track prompt read with duration', async () => {
      const funnelData = {
        step: 'read',
        stepNumber: 2,
        promptId: 'prompt-123',
        promptCategory: 'writing',
        viewDuration: 15000, // 15 seconds
        promptLength: 250,
        engagementDepth: 'medium',
      };

      await analytics.trackPromptEngagementFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_prompt_engagement', {
        funnel_step: 'read',
        step_number: 2,
        funnel_name: 'prompt_engagement',
        prompt_id: 'prompt-123',
        prompt_category: 'writing',
        view_duration_ms: 15000,
        prompt_length: 250,
        user_rating: 0,
        is_favorite: false,
        engagement_depth: 'medium',
      });
    });

    test('should track prompt copied', async () => {
      const funnelData = {
        step: 'copied',
        stepNumber: 3,
        promptId: 'prompt-123',
        promptCategory: 'writing',
        promptLength: 250,
        isFavorite: false,
        userRating: 0,
        engagementDepth: 'deep',
      };

      await analytics.trackPromptEngagementFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_prompt_engagement', {
        funnel_step: 'copied',
        step_number: 3,
        funnel_name: 'prompt_engagement',
        prompt_id: 'prompt-123',
        prompt_category: 'writing',
        view_duration_ms: 0,
        prompt_length: 250,
        user_rating: 0,
        is_favorite: false,
        engagement_depth: 'deep',
      });
    });

    test('should track prompt favorited', async () => {
      const funnelData = {
        step: 'favorited',
        stepNumber: 4,
        promptId: 'prompt-123',
        promptCategory: 'writing',
        isFavorite: true,
        userRating: 0,
        engagementDepth: 'deep',
      };

      await analytics.trackPromptEngagementFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_prompt_engagement', {
        funnel_step: 'favorited',
        step_number: 4,
        funnel_name: 'prompt_engagement',
        prompt_id: 'prompt-123',
        prompt_category: 'writing',
        view_duration_ms: 0,
        prompt_length: 0,
        user_rating: 0,
        is_favorite: true,
        engagement_depth: 'deep',
      });
    });

    test('should track prompt rated', async () => {
      const funnelData = {
        step: 'rated',
        stepNumber: 5,
        promptId: 'prompt-123',
        promptCategory: 'writing',
        isFavorite: true,
        userRating: 5,
        engagementDepth: 'deep',
      };

      await analytics.trackPromptEngagementFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_prompt_engagement', {
        funnel_step: 'rated',
        step_number: 5,
        funnel_name: 'prompt_engagement',
        prompt_id: 'prompt-123',
        prompt_category: 'writing',
        view_duration_ms: 0,
        prompt_length: 0,
        user_rating: 5,
        is_favorite: true,
        engagement_depth: 'deep',
      });
    });
  });

  describe('Content Creation Funnel', () => {
    test('should track creation intent', async () => {
      const funnelData = {
        step: 'intent',
        stepNumber: 1,
        userId: 'user456',
        trigger: 'inspiration',
      };

      await analytics.trackContentCreationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_content_creation', {
        funnel_step: 'intent',
        step_number: 1,
        funnel_name: 'content_creation',
        user_id: 'user456',
        creation_trigger: 'inspiration',
        form_completion_percentage: 0,
        time_spent_ms: 0,
        field_interactions: 0,
        draft_saved: false,
      });
    });

    test('should track form opened', async () => {
      const funnelData = {
        step: 'form_opened',
        stepNumber: 2,
        userId: 'user456',
        trigger: 'fab_button',
      };

      await analytics.trackContentCreationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_content_creation', {
        funnel_step: 'form_opened',
        step_number: 2,
        funnel_name: 'content_creation',
        user_id: 'user456',
        creation_trigger: 'fab_button',
        form_completion_percentage: 0,
        time_spent_ms: 0,
        field_interactions: 0,
        draft_saved: false,
      });
    });

    test('should track form filled with progress', async () => {
      const funnelData = {
        step: 'form_filled',
        stepNumber: 3,
        userId: 'user456',
        trigger: 'fab_button',
        formCompletion: 75, // 75% complete
        timeSpent: 180000, // 3 minutes
        fieldInteractions: 25,
        draftSaved: true,
      };

      await analytics.trackContentCreationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_content_creation', {
        funnel_step: 'form_filled',
        step_number: 3,
        funnel_name: 'content_creation',
        user_id: 'user456',
        creation_trigger: 'fab_button',
        form_completion_percentage: 75,
        time_spent_ms: 180000,
        field_interactions: 25,
        draft_saved: true,
      });
    });

    test('should track prompt saved', async () => {
      const funnelData = {
        step: 'saved',
        stepNumber: 6,
        userId: 'user456',
        trigger: 'form_submit',
        timeSpent: 300000, // 5 minutes total
        draftSaved: false, // No draft needed since completed
      };

      await analytics.trackContentCreationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_content_creation', {
        funnel_step: 'saved',
        step_number: 6,
        funnel_name: 'content_creation',
        user_id: 'user456',
        creation_trigger: 'form_submit',
        form_completion_percentage: 0,
        time_spent_ms: 300000,
        field_interactions: 0,
        draft_saved: false,
      });
    });
  });

  describe('User Activation Funnel', () => {
    test('should track new user signup', async () => {
      const funnelData = {
        step: 'signup',
        stepNumber: 1,
        userId: 'new-user-123',
        trigger: 'user_intent',
        userSegment: 'new_user',
      };

      await analytics.trackActivationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_activation', {
        funnel_step: 'signup',
        step_number: 1,
        funnel_name: 'user_activation',
        user_id: 'new-user-123',
        activation_trigger: 'user_intent',
        time_to_value_ms: 0,
        actions_completed: 0,
        value_moments_achieved: [],
        user_segment: 'new_user',
      });
    });

    test('should track first value moment', async () => {
      const funnelData = {
        step: 'value_moment',
        stepNumber: 3,
        userId: 'new-user-123',
        trigger: 'prompt_copy',
        valueMomentsAchieved: ['prompt_copied'],
        actionsCompleted: 1,
        timeToValue: 900000, // 15 minutes to first value
      };

      await analytics.trackActivationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_activation', {
        funnel_step: 'value_moment',
        step_number: 3,
        funnel_name: 'user_activation',
        user_id: 'new-user-123',
        activation_trigger: 'prompt_copy',
        time_to_value_ms: 900000,
        actions_completed: 1,
        value_moments_achieved: ['prompt_copied'],
        user_segment: 'new_user',
      });
    });

    test('should track multiple value moments', async () => {
      const funnelData = {
        step: 'value_moment',
        stepNumber: 4,
        userId: 'new-user-123',
        trigger: 'prompt_creation',
        valueMomentsAchieved: ['prompt_copied', 'prompt_favorited', 'prompt_created'],
        actionsCompleted: 3,
        timeToValue: 1800000, // 30 minutes to creation
        userSegment: 'power_user',
      };

      await analytics.trackActivationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_activation', {
        funnel_step: 'value_moment',
        step_number: 4,
        funnel_name: 'user_activation',
        user_id: 'new-user-123',
        activation_trigger: 'prompt_creation',
        time_to_value_ms: 1800000,
        actions_completed: 3,
        value_moments_achieved: ['prompt_copied', 'prompt_favorited', 'prompt_created'],
        user_segment: 'power_user',
      });
    });

    test('should track user retention milestone', async () => {
      const funnelData = {
        step: 'retention',
        stepNumber: 5,
        userId: 'new-user-123',
        trigger: 'return_visit',
        actionsCompleted: 10,
        userSegment: 'retained_user',
      };

      await analytics.trackActivationFunnel(funnelData);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith('funnel_activation', {
        funnel_step: 'retention',
        step_number: 5,
        funnel_name: 'user_activation',
        user_id: 'new-user-123',
        activation_trigger: 'return_visit',
        time_to_value_ms: 0,
        actions_completed: 10,
        value_moments_achieved: [],
        user_segment: 'retained_user',
      });
    });
  });

  describe('Cross-Funnel Analysis', () => {
    test('should track complete user journey through multiple funnels', async () => {
      const userId = 'journey-user-456';

      // 1. Registration: Signup started
      await analytics.trackRegistrationFunnel({
        step: 'signup_started',
        stepNumber: 1,
        method: 'email',
      });

      // 2. Registration: Signup completed
      await analytics.trackRegistrationFunnel({
        step: 'signup_completed',
        stepNumber: 2,
        userId: userId,
        method: 'email',
        formTime: 45000,
      });

      // 3. Activation: New user signup
      await analytics.trackActivationFunnel({
        step: 'signup',
        stepNumber: 1,
        userId: userId,
        trigger: 'user_intent',
        userSegment: 'new_user',
      });

      // 4. Onboarding: First login
      await analytics.trackOnboardingFunnel({
        step: 'login_success',
        stepNumber: 1,
        userId: userId,
        sessionNumber: 1,
      });

      // 5. Onboarding: First interaction
      await analytics.trackOnboardingFunnel({
        step: 'first_interaction',
        stepNumber: 3,
        userId: userId,
        interactionType: 'view',
        promptsAvailable: 100,
      });

      // 6. Prompt Engagement: Viewed
      await analytics.trackPromptEngagementFunnel({
        step: 'viewed',
        stepNumber: 1,
        promptId: 'first-prompt',
        promptCategory: 'writing',
        engagementDepth: 'surface',
      });

      // 7. Prompt Engagement: Copied
      await analytics.trackPromptEngagementFunnel({
        step: 'copied',
        stepNumber: 3,
        promptId: 'first-prompt',
        promptCategory: 'writing',
        engagementDepth: 'deep',
      });

      // 8. Activation: First value moment
      await analytics.trackActivationFunnel({
        step: 'value_moment',
        stepNumber: 3,
        userId: userId,
        trigger: 'prompt_copy',
        valueMomentsAchieved: ['prompt_copied'],
        actionsCompleted: 1,
      });

      // Verify all funnel events were tracked
      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(8);

      const calls = mockEventTracker.trackEvent.mock.calls;
      expect(calls[0][0]).toBe('funnel_registration');
      expect(calls[1][0]).toBe('funnel_registration');
      expect(calls[2][0]).toBe('funnel_activation');
      expect(calls[3][0]).toBe('funnel_onboarding');
      expect(calls[4][0]).toBe('funnel_onboarding');
      expect(calls[5][0]).toBe('funnel_prompt_engagement');
      expect(calls[6][0]).toBe('funnel_prompt_engagement');
      expect(calls[7][0]).toBe('funnel_activation');

      // Verify user progression through steps
      expect(calls[0][1].funnel_step).toBe('signup_started');
      expect(calls[1][1].funnel_step).toBe('signup_completed');
      expect(calls[2][1].funnel_step).toBe('signup');
      expect(calls[7][1].funnel_step).toBe('value_moment');
    });

    test('should track funnel abandonment scenarios', async () => {
      // User starts signup but abandons
      await analytics.trackRegistrationFunnel({
        step: 'signup_started',
        stepNumber: 1,
        method: 'email',
      });

      await analytics.trackRegistrationFunnel({
        step: 'validation_error',
        stepNumber: 1,
        method: 'email',
        validationErrors: ['password_weak'],
        exitPoint: 'password_field',
      });

      // User opens content creation form but doesn't complete
      await analytics.trackContentCreationFunnel({
        step: 'form_opened',
        stepNumber: 2,
        userId: 'abandon-user',
        trigger: 'fab_button',
      });

      await analytics.trackContentCreationFunnel({
        step: 'form_filled',
        stepNumber: 3,
        userId: 'abandon-user',
        formCompletion: 40, // Only 40% complete before abandoning
        timeSpent: 60000, // 1 minute
        fieldInteractions: 5,
        draftSaved: true,
      });

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(4);

      // Verify abandonment tracking
      const abandonmentCall = mockEventTracker.trackEvent.mock.calls[1];
      expect(abandonmentCall[1].exit_point).toBe('password_field');

      const partialFormCall = mockEventTracker.trackEvent.mock.calls[3];
      expect(partialFormCall[1].form_completion_percentage).toBe(40);
      expect(partialFormCall[1].draft_saved).toBe(true);
    });
  });

  describe('Default Values and Error Handling', () => {
    test('should use default values for all funnel methods', async () => {
      await analytics.trackRegistrationFunnel();
      await analytics.trackOnboardingFunnel();
      await analytics.trackPromptEngagementFunnel();
      await analytics.trackContentCreationFunnel();
      await analytics.trackActivationFunnel();

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(5);

      // All calls should have default funnel_step and funnel_name
      const calls = mockEventTracker.trackEvent.mock.calls;
      calls.forEach(call => {
        expect(call[1]).toMatchObject({
          funnel_step: 'unknown',
          funnel_name: expect.any(String),
        });
      });
    });

    test('should handle null/undefined data gracefully', async () => {
      await analytics.trackRegistrationFunnel(null);
      await analytics.trackOnboardingFunnel(undefined);
      await analytics.trackPromptEngagementFunnel(null);

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(3);

      // Should not throw errors and should use defaults
      const calls = mockEventTracker.trackEvent.mock.calls;
      calls.forEach(call => {
        expect(call[1].funnel_step).toBe('unknown');
      });
    });

    test('should handle EventTracker errors gracefully', async () => {
      mockEventTracker.trackEvent.mockRejectedValue(new Error('Network error'));

      // All funnel methods should handle errors
      for (const method of [
        'trackRegistrationFunnel',
        'trackOnboardingFunnel',
        'trackPromptEngagementFunnel',
        'trackContentCreationFunnel',
        'trackActivationFunnel',
      ]) {
        await expect(analytics[method]({ step: 'test' })).rejects.toThrow('Network error');
      }

      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(5);
    });

    test('should initialize analytics before tracking any funnel event', async () => {
      const initSpy = jest.spyOn(analytics, 'init').mockResolvedValue();

      await analytics.trackRegistrationFunnel({ step: 'test' });
      await analytics.trackOnboardingFunnel({ step: 'test' });
      await analytics.trackPromptEngagementFunnel({ step: 'test' });
      await analytics.trackContentCreationFunnel({ step: 'test' });
      await analytics.trackActivationFunnel({ step: 'test' });

      expect(initSpy).toHaveBeenCalledTimes(5);
      expect(mockEventTracker.trackEvent).toHaveBeenCalledTimes(5);
    });
  });

  describe('Performance and Timing Analysis', () => {
    test('should track timing metrics for registration funnel', async () => {
      // Track quick signup
      await analytics.trackRegistrationFunnel({
        step: 'signup_completed',
        stepNumber: 2,
        userId: 'quick-user',
        method: 'google',
        formTime: 5000, // 5 seconds
      });

      // Track slow signup
      await analytics.trackRegistrationFunnel({
        step: 'signup_completed',
        stepNumber: 2,
        userId: 'slow-user',
        method: 'email',
        formTime: 120000, // 2 minutes
      });

      const calls = mockEventTracker.trackEvent.mock.calls;
      expect(calls[0][1].form_completion_time_ms).toBe(5000);
      expect(calls[1][1].form_completion_time_ms).toBe(120000);
    });

    test('should track timing metrics for content creation funnel', async () => {
      await analytics.trackContentCreationFunnel({
        step: 'saved',
        stepNumber: 6,
        userId: 'creator-user',
        timeSpent: 600000, // 10 minutes
      });

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith(
        'funnel_content_creation',
        expect.objectContaining({
          time_spent_ms: 600000,
        })
      );
    });

    test('should track time to value in activation funnel', async () => {
      await analytics.trackActivationFunnel({
        step: 'value_moment',
        stepNumber: 3,
        userId: 'value-user',
        timeToValue: 1200000, // 20 minutes to value
        valueMomentsAchieved: ['prompt_copied'],
      });

      expect(mockEventTracker.trackEvent).toHaveBeenCalledWith(
        'funnel_activation',
        expect.objectContaining({
          time_to_value_ms: 1200000,
          value_moments_achieved: ['prompt_copied'],
        })
      );
    });
  });
});
