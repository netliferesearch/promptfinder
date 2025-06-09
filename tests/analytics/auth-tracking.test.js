/**
 * Tests for Authentication Event Tracking
 * Tests the login, signup, and logout tracking functionality
 */

// Mock the dependencies using proper Jest mock pattern
jest.mock('../../js/analytics/event-tracker.js', () => ({
  __esModule: true,
  default: {
    trackEvent: jest.fn().mockResolvedValue(true),
    trackCustomEvent: jest.fn().mockResolvedValue(true),
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

describe('Authentication Event Tracking', () => {
  let analytics;

  beforeEach(() => {
    jest.clearAllMocks();
    analytics = new Analytics();
  });

  describe('Login Tracking', () => {
    test('should track email login with all parameters', async () => {
      const loginData = {
        method: 'email',
        userId: 'user123',
        emailVerified: true,
        displayName: 'John Doe',
        duration: 1500,
        isReturningUser: true,
        context: 'popup',
      };

      const result = await analytics.trackLogin(loginData);

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('login', {
        method: 'email',
        user_id: 'user123',
        email_verified: true,
        display_name: 'John Doe',
        login_duration_ms: 1500,
        is_returning_user: true,
        context: 'popup',
      });
    });

    test('should track Google login with correct parameters', async () => {
      const loginData = {
        method: 'google',
        userId: 'google-user123',
        emailVerified: true,
        displayName: 'Jane Smith',
        duration: 800,
        isReturningUser: true,
        context: 'popup',
      };

      const result = await analytics.trackLogin(loginData);

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('login', {
        method: 'google',
        user_id: 'google-user123',
        email_verified: true,
        display_name: 'Jane Smith',
        login_duration_ms: 800,
        is_returning_user: true,
        context: 'popup',
      });
    });

    test('should track login with default values when no data provided', async () => {
      const result = await analytics.trackLogin();

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('login', {
        method: 'email',
        user_id: '',
        email_verified: false,
        display_name: '',
        login_duration_ms: 0,
        is_returning_user: false,
        context: 'popup',
      });
    });
  });

  describe('Signup Tracking', () => {
    test('should track email signup with all parameters', async () => {
      const signupData = {
        method: 'email',
        userId: 'newuser123',
        displayName: 'Alice Johnson',
        duration: 2000,
        emailVerificationSent: true,
        context: 'popup',
      };

      const result = await analytics.trackSignup(signupData);

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('sign_up', {
        method: 'email',
        user_id: 'newuser123',
        display_name: 'Alice Johnson',
        signup_duration_ms: 2000,
        email_verification_sent: true,
        context: 'popup',
      });
    });

    test('should track Google signup with correct parameters', async () => {
      const signupData = {
        method: 'google',
        userId: 'google-newuser123',
        displayName: 'Bob Wilson',
        duration: 1200,
        emailVerificationSent: false, // Google accounts are pre-verified
        context: 'popup',
      };

      const result = await analytics.trackSignup(signupData);

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('sign_up', {
        method: 'google',
        user_id: 'google-newuser123',
        display_name: 'Bob Wilson',
        signup_duration_ms: 1200,
        email_verification_sent: false,
        context: 'popup',
      });
    });

    test('should track signup with default values when no data provided', async () => {
      const result = await analytics.trackSignup();

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('sign_up', {
        method: 'email',
        user_id: '',
        display_name: '',
        signup_duration_ms: 0,
        email_verification_sent: false,
        context: 'popup',
      });
    });
  });

  describe('Logout Tracking', () => {
    test('should track logout with all parameters', async () => {
      const logoutData = {
        userId: 'user123',
        sessionDuration: 300000, // 5 minutes
        actionsPerformed: 15,
        promptsViewed: 5,
        context: 'popup',
      };

      const result = await analytics.trackLogout(logoutData);

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('logout', {
        user_id: 'user123',
        session_duration_ms: 300000,
        actions_performed: 15,
        prompts_viewed: 5,
        context: 'popup',
      });
    });

    test('should track logout with default values when no data provided', async () => {
      const result = await analytics.trackLogout();

      expect(result).toBe(true);
      expect(eventTracker.trackEvent).toHaveBeenCalledWith('logout', {
        user_id: '',
        session_duration_ms: 0,
        actions_performed: 0,
        prompts_viewed: 0,
        context: 'popup',
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle login tracking failure gracefully', async () => {
      eventTracker.trackEvent.mockResolvedValueOnce(false); // EventTracker returns false on error

      const result = await analytics.trackLogin({
        method: 'email',
        userId: 'user123',
      });

      expect(result).toBe(false);
      expect(eventTracker.trackEvent).toHaveBeenCalled();
    });

    test('should handle signup tracking failure gracefully', async () => {
      eventTracker.trackEvent.mockResolvedValueOnce(false); // EventTracker returns false on error

      const result = await analytics.trackSignup({
        method: 'email',
        userId: 'newuser123',
      });

      expect(result).toBe(false);
      expect(eventTracker.trackEvent).toHaveBeenCalled();
    });

    test('should handle logout tracking failure gracefully', async () => {
      eventTracker.trackEvent.mockResolvedValueOnce(false); // EventTracker returns false on error

      const result = await analytics.trackLogout({
        userId: 'user123',
      });

      expect(result).toBe(false);
      expect(eventTracker.trackEvent).toHaveBeenCalled();
    });
  });

  describe('Analytics Initialization', () => {
    test('should initialize analytics before tracking login', async () => {
      const analytics = new Analytics();
      const initSpy = jest.spyOn(analytics, 'init');

      await analytics.trackLogin({ method: 'email' });

      expect(initSpy).toHaveBeenCalled();
    });

    test('should initialize analytics before tracking signup', async () => {
      const analytics = new Analytics();
      const initSpy = jest.spyOn(analytics, 'init');

      await analytics.trackSignup({ method: 'email' });

      expect(initSpy).toHaveBeenCalled();
    });

    test('should initialize analytics before tracking logout', async () => {
      const analytics = new Analytics();
      const initSpy = jest.spyOn(analytics, 'init');

      await analytics.trackLogout({ userId: 'user123' });

      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    test('should track complete authentication flow', async () => {
      // 1. User signs up
      await analytics.trackSignup({
        method: 'email',
        userId: 'newuser123',
        displayName: 'Test User',
        duration: 2000,
        emailVerificationSent: true,
      });

      // 2. User logs in after email verification
      await analytics.trackLogin({
        method: 'email',
        userId: 'newuser123',
        emailVerified: true,
        displayName: 'Test User',
        duration: 1000,
        isReturningUser: true,
      });

      // 3. User logs out
      await analytics.trackLogout({
        userId: 'newuser123',
        sessionDuration: 180000,
        actionsPerformed: 10,
        promptsViewed: 3,
      });

      expect(eventTracker.trackEvent).toHaveBeenCalledTimes(3); // signup, login, and logout
    });

    test('should track Google authentication flow', async () => {
      // New Google user - signup
      await analytics.trackSignup({
        method: 'google',
        userId: 'google-user123',
        displayName: 'Google User',
        duration: 800,
        emailVerificationSent: false,
      });

      // Same user returns - login
      await analytics.trackLogin({
        method: 'google',
        userId: 'google-user123',
        emailVerified: true,
        displayName: 'Google User',
        duration: 500,
        isReturningUser: true,
      });

      expect(eventTracker.trackEvent).toHaveBeenCalledWith(
        'sign_up',
        expect.objectContaining({ method: 'google' })
      );
      expect(eventTracker.trackEvent).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({ method: 'google' })
      );
    });
  });
});
