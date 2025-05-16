import {
  loginUser,
  signupUser,
  signInWithGoogle,
  logoutUser,
  onAuthStateChanged,
} from './js/promptData.js';

import * as Utils from './js/utils.js';

// Placeholder for UI module - ui.js will need to be refactored to ES Modules
// For now, we'll assume it will export initializeUI and loadAndDisplayData
import * as UI from './js/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder extension initialized successfully (app.js - v9 modular)');

  // UI Elements
  const mainContent = document.getElementById('main-content');
  const authView = document.getElementById('auth-view');
  const accountButton = document.getElementById('account-button');
  const accountButtonIcon = accountButton ? accountButton.querySelector('i') : null;
  const cancelAuthButton = document.getElementById('cancel-auth-button');
  const generalErrorMessageElement = document.getElementById('error-message');
  const confirmationMessageElement = document.getElementById('confirmation-message');
  const addPromptButtonMain = document.getElementById('add-prompt-button');

  // Auth Forms
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const signupEmailInput = document.getElementById('signup-email');
  const signupPasswordInput = document.getElementById('signup-password');
  const authErrorMessage = document.getElementById('auth-error-message');
  const googleSignInButton = document.getElementById('google-signin-button');

  let currentUser = null;

  function showAuthView() {
    if (mainContent) mainContent.classList.add('hidden');
    if (authView) authView.classList.remove('hidden');
    if (authErrorMessage) {
      authErrorMessage.textContent = '';
      authErrorMessage.classList.add('hidden');
    }
  }

  function showMainContentView() {
    if (authView) authView.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
  }

  async function loadAndRenderPrompts() {
    if (UI && UI.loadAndDisplayData) {
      console.log('Calling UI.loadAndDisplayData from app.js (v9 modular)');
      await UI.loadAndDisplayData();
    } else {
      console.warn('UI.loadAndDisplayData function not found. UI may not update.');
    }
  }

  function updateUIAfterAuthStateChange(user) {
    currentUser = user;
    if (user) {
      showMainContentView();
      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-user-circle');
        accountButtonIcon.classList.add('fa-sign-out-alt');
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Logout');
      if (addPromptButtonMain) addPromptButtonMain.disabled = false;
      console.log('User is logged in (app.js v9):', user.email);
      loadAndRenderPrompts();
    } else {
      showMainContentView();
      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-sign-out-alt');
        accountButtonIcon.classList.add('fa-user-circle');
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Login or Signup');
      if (addPromptButtonMain) addPromptButtonMain.disabled = true;
      console.log('User is logged out (app.js v9)');
      loadAndRenderPrompts();
    }
  }

  if (addPromptButtonMain) {
    addPromptButtonMain.addEventListener('click', () => {
      if (currentUser) {
        console.log('Add prompt button clicked by logged-in user (app.js v9).');
        // The UI module (specifically initializeUI and its event listeners) should handle opening the window.
        // If not, a direct call could be: chrome.windows.create({ url: 'pages/add-prompt.html', type: 'popup', width: 400, height: 600 });
        // but it's better if UI.js manages its own component interactions.
        // Typically UI.addPromptButtonEl?.addEventListener('click', openDetachedAddPromptWindow); in UI.js
      } else {
        Utils.showConfirmationMessage('Please login to add a prompt.', {
          specificErrorElement: generalErrorMessageElement, // Use specificErrorElement for clarity
          type: 'error',
        });
      }
    });
  }

  if (accountButton) {
    accountButton.addEventListener('click', () => {
      if (currentUser) {
        logoutUser().catch(err => console.error('Logout failed via account button:', err));
      } else {
        showAuthView();
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
      if (authErrorMessage) authErrorMessage.classList.add('hidden');
      const email = loginEmailInput.value;
      const password = loginPasswordInput.value;
      try {
        const userCredential = await loginUser(email, password);
        if (userCredential && userCredential.user) {
          loginForm.reset();
          // onAuthStateChanged will handle UI update
        } else {
          // This case should ideally not happen if loginUser rejects on failure
          Utils.displayAuthError('Login failed. Unknown reason.', authErrorMessage);
        }
      } catch (error) {
        Utils.displayAuthError(
          error.message || 'Login failed. Please try again.',
          authErrorMessage
        );
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (authErrorMessage) authErrorMessage.classList.add('hidden');
      const email = signupEmailInput.value;
      const password = signupPasswordInput.value;
      try {
        const userCredential = await signupUser(email, password);
        if (userCredential && userCredential.user) {
          signupForm.reset();
          // onAuthStateChanged will handle UI update
          Utils.showConfirmationMessage('Signup successful! You are now logged in.', {
            specificErrorElement: confirmationMessageElement, // Use specificErrorElement for clarity
            timeout: 5000,
          });
        }
      } catch (error) {
        Utils.displayAuthError(
          error.message || 'Signup failed. Please try again.',
          authErrorMessage
        );
      }
    });
  }

  if (googleSignInButton) {
    googleSignInButton.addEventListener('click', async () => {
      if (authErrorMessage) authErrorMessage.classList.add('hidden');
      try {
        await signInWithGoogle();
        // onAuthStateChanged will handle UI update
      } catch (error) {
        Utils.displayAuthError(error.message || 'Google Sign-In failed.', authErrorMessage);
      }
    });
  }

  // Setup Firebase auth state listener
  onAuthStateChanged(updateUIAfterAuthStateChange);

  // Message listener for updates from other parts of the extension
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
      return false; // Important for async sendResponse or if not handling the message
    });
  }

  // Initial UI setup using the (to be refactored) UI module
  if (UI && UI.initializeUI) {
    UI.initializeUI();
  } else {
    console.error('UI.initializeUI module/function not found.');
  }

  // The onAuthStateChanged listener will call updateUIAfterAuthStateChange,
  // which in turn calls loadAndRenderPrompts. So, an explicit call to
  // updateUIAfterAuthStateChange(auth.currentUser) immediately might be redundant
  // if onAuthStateChanged fires quickly. However, it ensures the UI reflects
  // the synchronous currentUser state if already available before the listener fires.
  // For v9, auth is imported, so we can check auth.currentUser directly.
  // However, it's better to rely on onAuthStateChanged for the initial state as well.
  // The onAuthStateChanged callback will be invoked with the current user when it's registered.
});
