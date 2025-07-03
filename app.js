import { textManager, getText } from './js/text-constants.js';
import {
  loginUser,
  signupUser,
  signInWithGoogle,
  logoutUser,
  onAuthStateChanged,
  sendEmailVerification,
  checkEmailVerified,
} from './js/promptData.js';

import * as Utils from './js/utils.js';
// Lazy load these heavy modules
// import * as UI from './js/ui.js';
// import * as PromptDataModule from './js/promptData.js';
// import { initializeConnectionMonitoring } from './js/firebase-connection-handler.js';
// import { Analytics } from './js/analytics/analytics.js';
// import PageTracker from './js/analytics/page-tracker.js';

// Module cache for lazy loading
const lazyModules = {
  UI: null,
  PromptDataModule: null,
  Analytics: null,
  PageTracker: null,
  ConnectionMonitoring: null,
};

/**
 * Lazy load UI module when needed
 */
async function loadUI() {
  if (!lazyModules.UI) {
    console.log('🔄 Lazy loading UI module...');
    lazyModules.UI = await import('./js/ui.js');
    console.log('✅ UI module loaded');
  }
  return lazyModules.UI;
}

/**
 * Lazy load PromptData module when needed
 */
async function loadPromptDataModule() {
  if (!lazyModules.PromptDataModule) {
    console.log('🔄 Lazy loading PromptData module...');
    lazyModules.PromptDataModule = await import('./js/promptData.js');
    console.log('✅ PromptData module loaded');
  }
  return lazyModules.PromptDataModule;
}

/**
 * Lazy load Analytics when user starts interacting
 */
async function loadAnalytics() {
  if (!lazyModules.Analytics) {
    console.log('🔄 Lazy loading Analytics modules...');
    const [analyticsModule, pageTrackerModule] = await Promise.all([
      import('./js/analytics/analytics.js'),
      import('./js/analytics/page-tracker.js'),
    ]);

    lazyModules.Analytics = new analyticsModule.Analytics();
    lazyModules.PageTracker = new pageTrackerModule.default(lazyModules.Analytics);

    // Make analytics available globally for debugging
    window.DebugAnalytics = lazyModules.Analytics;
    window.DebugPageTracker = lazyModules.PageTracker;

    console.log('✅ Analytics modules loaded');
  }
  return {
    analytics: lazyModules.Analytics,
    pageTracker: lazyModules.PageTracker,
  };
}

/**
 * Lazy load Firebase connection monitoring
 */
async function loadConnectionMonitoring() {
  if (!lazyModules.ConnectionMonitoring) {
    console.log('🔄 Lazy loading Firebase connection monitoring...');
    lazyModules.ConnectionMonitoring = await import('./js/firebase-connection-handler.js');
    console.log('✅ Firebase connection monitoring loaded');
  }
  return lazyModules.ConnectionMonitoring;
}

// Initialize with minimal overhead
let analytics = null;
let pageTracker = null;

// Delay analytics initialization until first user interaction
function initializeAnalyticsOnDemand() {
  if (!analytics) {
    loadAnalytics()
      .then(({ analytics: a, pageTracker: pt }) => {
        analytics = a;
        pageTracker = pt;

        // Initialize page tracking
        pageTracker.init().catch(error => {
          console.warn('Failed to initialize page tracking:', error);
        });
      })
      .catch(error => {
        console.warn('Failed to lazy load analytics:', error);
      });
  }
}

// Early PromptData access for debugging (keep minimal)
loadPromptDataModule().then(module => {
  window.DebugPromptData = module;
});

/**
 * Safely track analytics events with lazy loading
 */
async function trackAnalyticsEvent(trackingFunction, ...args) {
  try {
    initializeAnalyticsOnDemand();
    if (analytics && typeof analytics[trackingFunction] === 'function') {
      analytics[trackingFunction](...args);
    }
  } catch (error) {
    console.warn(`Failed to track ${trackingFunction}:`, error);
  }
}

let mainContentElement, authViewElement, authErrorMessageElement;

async function showAuthView() {
  if (mainContentElement) mainContentElement.classList.add('hidden');
  if (authViewElement) authViewElement.classList.remove('hidden');
  if (authErrorMessageElement) {
    authErrorMessageElement.textContent = '';
    authErrorMessageElement.classList.add('hidden');
  }

  // Enable scrolling for auth view using class-based approach (better compatibility)
  document.body.classList.add('auth-view-active');

  // Hide FAB if present
  const addPromptFabEl = document.getElementById('add-prompt-fab');
  if (addPromptFabEl) addPromptFabEl.hidden = true;
  // Ensure main auth card elements are visible when showing auth view
  const authBackToListButton = document.getElementById('auth-back-to-list-button');
  const authTitle = document.querySelector('.auth-card h2.auth-title');
  const authSubtext = document.querySelector('.auth-card p.auth-subtext');
  if (authBackToListButton) authBackToListButton.style.display = '';
  if (authTitle) authTitle.style.display = '';
  if (authSubtext) authSubtext.style.display = '';

  // Track page view for auth (lazy load analytics)
  initializeAnalyticsOnDemand();
  if (pageTracker) {
    pageTracker.trackNavigation('auth', { method: 'programmatic', trigger: 'system' });
  }
}
window.showAuthViewGlobally = showAuthView;

window.handleAuthRequiredAction = actionDescription => {
  // Use toast notification for all auth-required actions
  const message = textManager.format('AUTH_ACTION_REQUIRED', { action: actionDescription });
  if (typeof window.showToast === 'function') {
    window.showToast(message, {
      type: 'info',
      duration: 5000,
    });
  } else {
    // fallback for environments without toast
    Utils.handleError(message, {
      userVisible: true,
      type: 'info',
      timeout: 5000,
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const resetPasswordForm = document.getElementById('reset-password-form');
  const resetPasswordBackButton = document.getElementById('reset-password-back-button');
  const resetPasswordEmailInput = document.getElementById('reset-password-email');
  const resetPasswordMessage = document.getElementById('reset-password-message');
  const forgotPasswordLink = document.getElementById('forgot-password-link');

  // Show password reset form
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', e => {
      e.preventDefault();
      if (loginForm) loginForm.classList.add('hidden');
      if (resetPasswordForm) {
        resetPasswordForm.classList.remove('hidden');
        resetPasswordMessage.classList.add('hidden');
        resetPasswordEmailInput.value = loginEmailInput.value || '';
      }
      // Hide the main auth card elements that should not be visible during password reset
      const authBackToListButton = document.getElementById('auth-back-to-list-button');
      const authTitle = document.querySelector('.auth-card h2.auth-title');
      const authSubtext = document.querySelector('.auth-card p.auth-subtext');
      if (authBackToListButton) authBackToListButton.style.display = 'none';
      if (authTitle) authTitle.style.display = 'none';
      if (authSubtext) authSubtext.style.display = 'none';
    });
  }

  // Back to sign in from reset form
  if (resetPasswordBackButton) {
    resetPasswordBackButton.addEventListener('click', () => {
      if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
      if (resetPasswordMessage) resetPasswordMessage.classList.add('hidden');
      // Restore the main auth card elements
      const authBackToListButton = document.getElementById('auth-back-to-list-button');
      const authTitle = document.querySelector('.auth-card h2.auth-title');
      const authSubtext = document.querySelector('.auth-card p.auth-subtext');
      if (authBackToListButton) authBackToListButton.style.display = '';
      if (authTitle) authTitle.style.display = '';
      if (authSubtext) authSubtext.style.display = '';
    });
  }

  // Handle password reset submit
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = resetPasswordEmailInput.value.trim();

      if (!email) {
        if (typeof window.showToast === 'function') {
          window.showToast(getText('EMAIL') + ' is required.', { type: 'error', duration: 5000 });
        }
        return;
      }

      try {
        const PromptDataModule = await loadPromptDataModule();
        await PromptDataModule.sendResetPasswordEmail(email);
        if (typeof window.showToast === 'function') {
          window.showToast(getText('RESET_PASSWORD_SUCCESS'), { type: 'success', duration: 10000 });
        }
      } catch (error) {
        if (typeof window.showToast === 'function') {
          const errorMessage = getText('RESET_PASSWORD_ERROR').replace(
            '{{message}}',
            error.message
          );
          window.showToast(errorMessage, {
            type: 'error',
            duration: 6000,
          });
        }
      }
    });
  }
  console.info('DesignPrompts extension initialized successfully (app.js - v9 modular)');

  // Initialize Firebase connection monitoring lazily
  loadConnectionMonitoring()
    .then(connectionModule => {
      connectionModule.initializeConnectionMonitoring();
    })
    .catch(error => {
      console.warn('Failed to initialize connection monitoring:', error);
    });

  mainContentElement = document.getElementById('main-content');
  authViewElement = document.getElementById('auth-view');
  authErrorMessageElement = document.getElementById('auth-error-message');

  const accountButton = document.getElementById('account-button');
  const accountButtonIcon = accountButton ? accountButton.querySelector('i') : null;
  const cancelAuthButton = document.getElementById('cancel-auth-button');
  const addPromptButtonMain = document.getElementById('add-prompt-button');

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const signupDisplayNameInput = document.getElementById('signup-display-name');
  const signupEmailInput = document.getElementById('signup-email');
  const signupPasswordInput = document.getElementById('signup-password');

  // Track form start times for funnel analysis
  if (loginEmailInput) {
    loginEmailInput.addEventListener('focus', () => {
      if (!window.loginFormStartTime) {
        window.loginFormStartTime = Date.now();
        // Track registration funnel - login form started (lazy load analytics)
        trackAnalyticsEvent('trackRegistrationFunnel', {
          step: 'login_started',
          stepNumber: 1,
          method: 'email',
        });
      }
    });
  }

  if (signupDisplayNameInput) {
    signupDisplayNameInput.addEventListener('focus', () => {
      if (!window.signupFormStartTime) {
        window.signupFormStartTime = Date.now();
        // Track registration funnel - signup form started (lazy load analytics)
        trackAnalyticsEvent('trackRegistrationFunnel', {
          step: 'signup_started',
          stepNumber: 1,
          method: 'email',
        });
      }
    });
  }
  const googleSignInButton = document.getElementById('google-signin-button');

  // Email verification elements
  const emailVerificationSection = document.getElementById('email-verification-section');
  const verificationMessage = document.getElementById('verification-message');
  const checkVerificationButton = document.getElementById('check-verification-button');
  const resendVerificationButton = document.getElementById('resend-verification-button');
  const verificationBackButton = document.getElementById('verification-back-button');

  let currentUser = null;

  function showMainContentView() {
    if (authViewElement) authViewElement.classList.add('hidden');
    if (mainContentElement) mainContentElement.classList.remove('hidden');

    // Restore original popup constraints using class-based approach
    document.body.classList.remove('auth-view-active');

    // Show FAB if user is logged in
    const addPromptFabEl = document.getElementById('add-prompt-fab');
    if (addPromptFabEl && window.firebaseAuthCurrentUser) {
      addPromptFabEl.hidden = false;
    }

    // Track page view for main content (lazy load analytics)
    initializeAnalyticsOnDemand();
    if (pageTracker) {
      pageTracker.trackNavigation('main', { method: 'programmatic', trigger: 'system' });
    }

    // Track onboarding funnel - popup opened (if logged in)
    if (window.firebaseAuthCurrentUser) {
      trackAnalyticsEvent('trackOnboardingFunnel', {
        step: 'popup_opened',
        stepNumber: 2,
        userId: window.firebaseAuthCurrentUser.uid,
        sessionNumber: 1, // This would ideally track actual session count
      });
    }
  }

  async function loadAndRenderPrompts() {
    try {
      console.log('Loading UI module for data display...');
      const UIModule = await loadUI();
      if (UIModule && UIModule.loadAndDisplayData) {
        console.log('Calling UI.loadAndDisplayData from app.js (v9 modular)');
        await UIModule.loadAndDisplayData();
      } else {
        console.warn('UI.loadAndDisplayData function not found. UI may not update.');
      }
    } catch (error) {
      console.error('Failed to load UI module for rendering prompts:', error);
      Utils.handleError('Failed to load interface components', {
        userVisible: true,
        type: 'error',
        timeout: 5000,
      });
    }
  }

  function showEmailVerificationView() {
    if (mainContentElement) mainContentElement.classList.add('hidden');
    if (authViewElement) authViewElement.classList.remove('hidden');
    if (loginForm) loginForm.classList.add('hidden');
    if (signupForm) signupForm.classList.add('hidden');
    if (emailVerificationSection) emailVerificationSection.classList.remove('hidden');
    if (authErrorMessageElement) {
      authErrorMessageElement.textContent = '';
      authErrorMessageElement.classList.add('hidden');
    }
    // Hide FAB if present
    const addPromptFabEl = document.getElementById('add-prompt-fab');
    if (addPromptFabEl) addPromptFabEl.hidden = true;

    // Track page view for email verification (lazy load analytics)
    initializeAnalyticsOnDemand();
    if (pageTracker) {
      pageTracker.trackNavigation('email_verification', {
        method: 'programmatic',
        trigger: 'system',
      });
    }
  }

  function hideAllAuthForms() {
    if (loginForm) loginForm.classList.add('hidden');
    if (signupForm) signupForm.classList.add('hidden');
    if (emailVerificationSection) emailVerificationSection.classList.add('hidden');
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
  }

  function showMainAuthView() {
    hideAllAuthForms();
    if (loginForm) loginForm.classList.remove('hidden');
    // Ensure main auth card elements are visible when showing main auth view
    const authBackToListButton = document.getElementById('auth-back-to-list-button');
    const authTitle = document.querySelector('.auth-card h2.auth-title');
    const authSubtext = document.querySelector('.auth-card p.auth-subtext');
    if (authBackToListButton) authBackToListButton.style.display = '';
    if (authTitle) authTitle.style.display = '';
    if (authSubtext) authSubtext.style.display = '';
  }

  function updateUIAfterAuthStateChange(user) {
    currentUser = user;
    if (user) {
      // Check if user has verified their email (for newly created accounts)
      if (!user.emailVerified) {
        // For users who just signed up or have unverified emails, don't automatically show main content
        // Let the specific login/signup handlers decide the flow
        console.log('User logged in but email not verified:', user.email);
      } else {
        showMainContentView();
      }

      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-user-circle');
        accountButtonIcon.classList.add('fa-sign-out-alt');
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Logout');
      if (addPromptButtonMain) addPromptButtonMain.disabled = false;
      console.log(
        'User is logged in (app.js v9):',
        user.email,
        'Display Name:',
        user.displayName,
        'Email Verified:',
        user.emailVerified
      );

      // Only load prompts if email is verified or if we're showing main content
      if (user.emailVerified || mainContentElement?.classList.contains('hidden') === false) {
        loadAndRenderPrompts();
      }
    } else {
      // Check if we're currently showing the email verification screen
      // If so, don't override it with main content view
      const isShowingEmailVerification =
        emailVerificationSection && !emailVerificationSection.classList.contains('hidden');

      if (!isShowingEmailVerification) {
        showMainContentView();
      }

      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-sign-out-alt');
        accountButtonIcon.classList.add('fa-user-circle');
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Login or Signup');
      if (addPromptButtonMain) addPromptButtonMain.disabled = true;
      console.log('User is logged out (app.js v9)');

      // Only load prompts if we're not showing email verification
      if (!isShowingEmailVerification) {
        loadAndRenderPrompts();
      }
    }
  }

  if (addPromptButtonMain) {
    addPromptButtonMain.addEventListener('click', async () => {
      if (currentUser) {
        try {
          const UIModule = await loadUI();
          if (UIModule && UIModule.openDetachedAddPromptWindow) {
            UIModule.openDetachedAddPromptWindow();
          } else {
            console.error('UI.openDetachedAddPromptWindow is not available.');
          }
        } catch (error) {
          console.error('Failed to load UI module for add prompt:', error);
          Utils.handleError('Failed to load interface for adding prompts', {
            userVisible: true,
            type: 'error',
            timeout: 5000,
          });
        }
      } else {
        if (window.handleAuthRequiredAction) {
          window.handleAuthRequiredAction(getText('ACTION_ADD_PROMPT'));
        }
      }
    });
  }

  if (accountButton) {
    accountButton.addEventListener('click', async () => {
      if (currentUser) {
        // Track logout action (lazy load analytics)
        initializeAnalyticsOnDemand();
        if (analytics && pageTracker) {
          try {
            const sessionDuration = pageTracker.getStatus().sessionDuration;
            const promptsViewed = pageTracker.navigationHistory.filter(
              h => h.page === 'prompt_details'
            ).length;

            analytics.trackLogout({
              userId: currentUser.uid,
              sessionDuration: sessionDuration,
              actionsPerformed: pageTracker.getStatus().navigationHistory,
              promptsViewed: promptsViewed,
              context: 'popup',
            });
          } catch (error) {
            console.warn('Failed to track logout analytics:', error);
          }
        }

        logoutUser().catch(err => console.error('Logout failed via account button:', err));
      } else {
        await showAuthView();
      }
    });
  }

  if (cancelAuthButton) {
    cancelAuthButton.addEventListener('click', () => {
      showMainContentView();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (authErrorMessageElement) authErrorMessageElement.classList.add('hidden');
      const email = loginEmailInput.value;
      const password = loginPasswordInput.value;
      const loginStartTime = Date.now();

      // Track registration funnel - login attempted (lazy load analytics)
      initializeAnalyticsOnDemand();
      if (analytics) {
        analytics.trackRegistrationFunnel({
          step: 'login_attempted',
          stepNumber: 1,
          method: 'email',
          formTime: Date.now() - (window.loginFormStartTime || Date.now()),
        });
      }

      try {
        const userCredential = await loginUser(email, password);
        if (userCredential && userCredential.user) {
          const loginDuration = Date.now() - loginStartTime;

          // Track successful login
          analytics.trackLogin({
            method: 'email',
            userId: userCredential.user.uid,
            emailVerified: userCredential.user.emailVerified,
            displayName: userCredential.user.displayName || '',
            duration: loginDuration,
            isReturningUser: true, // Email/password logins are typically returning users
            context: 'popup',
          });

          // Track registration funnel - login completed
          analytics.trackRegistrationFunnel({
            step: 'login_completed',
            stepNumber: 2,
            userId: userCredential.user.uid,
            method: 'email',
            formTime: loginDuration,
          });

          // Track onboarding funnel - first login (for returning users this marks re-engagement)
          analytics.trackOnboardingFunnel({
            step: 'login_success',
            stepNumber: 1,
            userId: userCredential.user.uid,
            sessionNumber: 1, // This would ideally be tracked across sessions
          });

          loginForm.reset();

          // Check if email is verified
          const isEmailVerified = userCredential.user.emailVerified;
          if (!isEmailVerified) {
            // Show email verification screen for unverified users
            showEmailVerificationView();
            if (verificationMessage) {
              verificationMessage.textContent = textManager.format('VERIFY_EMAIL_MESSAGE', {
                email: userCredential.user.email,
              });
            }
            // Show a toast message about email verification requirement
            if (typeof window.showToast === 'function') {
              window.showToast(getText('EMAIL_VERIFICATION_REQUIRED'), {
                type: 'info',
                duration: 6000,
              });
            }
          }
        }
      } catch (error) {
        const loginDuration = Date.now() - loginStartTime;

        // Track failed login attempt
        analytics.trackError({
          error_type: 'login_failed',
          error_message: error.message || 'Login failed',
          method: 'email',
          duration: loginDuration,
          context: 'popup',
        });

        // Show toast message instead of inline error to avoid duplication
        if (typeof window.showToast === 'function') {
          const errorMessage = error.message || getText('AUTH_LOGIN_FAILED');
          window.showToast(errorMessage, {
            type: 'error',
            duration: 6000,
          });
        } else {
          // Fallback to inline error if toast is not available
          Utils.displayAuthError(
            error.message || getText('AUTH_LOGIN_FAILED'),
            authErrorMessageElement
          );
        }
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (authErrorMessageElement) authErrorMessageElement.classList.add('hidden');
      const displayName = signupDisplayNameInput.value.trim();
      const email = signupEmailInput.value;
      const password = signupPasswordInput.value;
      const signupStartTime = Date.now();

      // Track registration funnel - signup form submitted
      analytics.trackRegistrationFunnel({
        step: 'signup_submitted',
        stepNumber: 1,
        method: 'email',
        formTime: Date.now() - (window.signupFormStartTime || Date.now()),
      });

      if (!displayName) {
        // Track registration funnel - validation error
        analytics.trackRegistrationFunnel({
          step: 'validation_error',
          stepNumber: 1,
          method: 'email',
          validationErrors: ['display_name_required'],
          exitPoint: 'display_name_validation',
        });
        Utils.displayAuthError(getText('FORM_DISPLAY_NAME_REQUIRED'), authErrorMessageElement);
        return;
      }
      if (displayName.includes('@') || displayName.includes('.')) {
        // Track registration funnel - validation error
        analytics.trackRegistrationFunnel({
          step: 'validation_error',
          stepNumber: 1,
          method: 'email',
          validationErrors: ['display_name_invalid'],
          exitPoint: 'display_name_validation',
        });
        Utils.displayAuthError(getText('FORM_DISPLAY_NAME_INVALID'), authErrorMessageElement);
        return;
      }

      try {
        const userCredential = await signupUser(email, password, displayName);
        if (userCredential && userCredential.user) {
          const signupDuration = Date.now() - signupStartTime;

          // Track successful signup
          analytics.trackSignup({
            method: 'email',
            userId: userCredential.user.uid,
            displayName: displayName,
            duration: signupDuration,
            emailVerificationSent: true,
            context: 'popup',
          });

          // Track registration funnel - signup completed
          analytics.trackRegistrationFunnel({
            step: 'signup_completed',
            stepNumber: 2,
            userId: userCredential.user.uid,
            method: 'email',
            formTime: signupDuration,
          });

          // Track activation funnel - new user signup
          analytics.trackActivationFunnel({
            step: 'signup',
            stepNumber: 1,
            userId: userCredential.user.uid,
            trigger: 'user_intent',
            userSegment: 'new_user',
          });

          signupForm.reset();

          // Log out the user immediately after signup to ensure they must verify email
          await logoutUser();

          // Show email verification screen
          showEmailVerificationView();
          if (verificationMessage) {
            verificationMessage.textContent = textManager.format('VERIFY_EMAIL_MESSAGE', {
              email: userCredential.user.email,
            });
          }

          // Show toast message about email verification
          if (typeof window.showToast === 'function') {
            window.showToast(getText('EMAIL_VERIFICATION_SENT'), {
              type: 'success',
              duration: 8000,
            });
          }
        }
      } catch (error) {
        const signupDuration = Date.now() - signupStartTime;

        // Track failed signup attempt
        analytics.trackError({
          error_type: 'signup_failed',
          error_message: error.message || 'Signup failed',
          method: 'email',
          duration: signupDuration,
          context: 'popup',
        });

        Utils.displayAuthError(
          error.message || getText('AUTH_SIGNUP_FAILED'),
          authErrorMessageElement
        );
      }
    });
  }

  if (googleSignInButton) {
    googleSignInButton.addEventListener('click', async () => {
      if (authErrorMessageElement) authErrorMessageElement.classList.add('hidden');
      const googleSigninStartTime = Date.now();

      try {
        const result = await signInWithGoogle();
        if (result && result.user) {
          const googleSigninDuration = Date.now() - googleSigninStartTime;

          // Track successful Google signin/signup
          const isNewUser = result.additionalUserInfo?.isNewUser || false;

          if (isNewUser) {
            // Track as signup for new Google users
            analytics.trackSignup({
              method: 'google',
              userId: result.user.uid,
              displayName: result.user.displayName || '',
              duration: googleSigninDuration,
              emailVerificationSent: false, // Google accounts are pre-verified
              context: 'popup',
            });
          } else {
            // Track as login for existing Google users
            analytics.trackLogin({
              method: 'google',
              userId: result.user.uid,
              emailVerified: result.user.emailVerified,
              displayName: result.user.displayName || '',
              duration: googleSigninDuration,
              isReturningUser: true,
              context: 'popup',
            });
          }
        }
      } catch (error) {
        // Don't track cancelled authentications as errors
        if (
          error &&
          error.message &&
          !error.message.includes('cancelled') &&
          !error.message.includes('popup_closed')
        ) {
          const googleSigninDuration = Date.now() - googleSigninStartTime;

          // Track failed Google signin attempt
          analytics.trackError({
            error_type: 'google_signin_failed',
            error_message: error.message || 'Google signin failed',
            method: 'google',
            duration: googleSigninDuration,
            context: 'popup',
          });
        }

        Utils.displayAuthError(
          error.message || getText('AUTH_GOOGLE_SIGNIN_FAILED'),
          authErrorMessageElement
        );
      }
    });
  }

  // Email verification event handlers
  if (checkVerificationButton) {
    checkVerificationButton.addEventListener('click', async () => {
      try {
        const isVerified = await checkEmailVerified();
        if (isVerified) {
          // Track successful email verification
          analytics.trackCustomEvent('email_verification_success', {
            context: 'popup',
            verification_method: 'manual_check',
          });

          if (typeof window.showToast === 'function') {
            window.showToast(getText('EMAIL_VERIFICATION_SUCCESS'), {
              type: 'success',
              duration: 5000,
            });
          }
          // User verified - they can now log in normally
          // Show login form so they can sign in with their verified account
          showMainAuthView();

          // Show additional toast with instructions
          if (typeof window.showToast === 'function') {
            setTimeout(() => {
              window.showToast('Great! Now you can sign in with your verified account.', {
                type: 'info',
                duration: 6000,
              });
            }, 2000);
          }
        } else {
          // Track email verification still pending
          analytics.trackCustomEvent('email_verification_pending', {
            context: 'popup',
            verification_method: 'manual_check',
          });

          if (typeof window.showToast === 'function') {
            window.showToast(getText('EMAIL_NOT_VERIFIED_YET'), {
              type: 'warning',
              duration: 5000,
            });
          }
        }
      } catch (error) {
        // Track email verification check error
        analytics.trackError({
          error_type: 'email_verification_check_failed',
          error_message: error.message || 'Email verification check failed',
          context: 'popup',
        });

        if (typeof window.showToast === 'function') {
          const errorMessage = textManager.format('EMAIL_VERIFICATION_CHECK_ERROR', {
            message: error.message,
          });
          window.showToast(errorMessage, {
            type: 'error',
            duration: 5000,
          });
        }
      }
    });
  }

  if (resendVerificationButton) {
    resendVerificationButton.addEventListener('click', async () => {
      try {
        await sendEmailVerification();
        if (typeof window.showToast === 'function') {
          window.showToast(getText('EMAIL_VERIFICATION_RESENT'), {
            type: 'success',
            duration: 5000,
          });
        }
      } catch (error) {
        if (typeof window.showToast === 'function') {
          const errorMessage = textManager.format('EMAIL_VERIFICATION_RESEND_ERROR', {
            message: error.message,
          });
          window.showToast(errorMessage, {
            type: 'error',
            duration: 5000,
          });
        }
      }
    });
  }

  if (verificationBackButton) {
    verificationBackButton.addEventListener('click', async () => {
      // If there's a current user who hasn't verified their email, log them out
      if (currentUser && !currentUser.emailVerified) {
        try {
          await logoutUser();
        } catch (error) {
          console.error('Error logging out from verification screen:', error);
        }
      }
      // Return to main content view (logged out state)
      showMainContentView();
    });
  }

  // Navigation between signup and login forms
  const showSignupLink = document.getElementById('show-signup-link');
  const showLoginLink = document.getElementById('show-login-link');
  const showSignupRow = document.getElementById('show-signup-row');

  if (showSignupLink) {
    showSignupLink.addEventListener('click', e => {
      e.preventDefault();
      hideAllAuthForms();
      if (signupForm) signupForm.classList.remove('hidden');
      if (showSignupRow) showSignupRow.style.display = 'none';
    });
  }

  if (showLoginLink) {
    showLoginLink.addEventListener('click', e => {
      e.preventDefault();
      showMainAuthView();
      if (showSignupRow) showSignupRow.style.display = '';
    });
  }

  onAuthStateChanged(updateUIAfterAuthStateChange);

  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PROMPT_ADDED_OR_MODIFIED') {
        console.log(
          'Message received (app.js v9): PROMPT_ADDED_OR_MODIFIED. Refreshing prompt list.'
        );
        loadAndRenderPrompts();
        sendResponse({ status: 'success', message: 'Prompt list refresh triggered in popup.' });
        return true;
      }
      return false;
    });
  }

  // Initialize UI lazily when needed
  loadUI()
    .then(UIModule => {
      if (UIModule && UIModule.initializeUI) {
        UIModule.initializeUI();
      } else {
        console.error('UI.initializeUI module/function not found.');
      }
    })
    .catch(error => {
      console.error('Failed to lazy load UI module during initialization:', error);
    });
});
