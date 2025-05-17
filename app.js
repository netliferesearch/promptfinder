import {
  loginUser,
  signupUser,
  signInWithGoogle,
  logoutUser,
  onAuthStateChanged,
} from './js/promptData.js';

import * as Utils from './js/utils.js';
import * as UI from './js/ui.js';
import * as PromptDataModule from './js/promptData.js'; // Import the whole module for debugging

// TEMPORARY: Expose PromptData for console debugging
window.DebugPromptData = PromptDataModule;

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder extension initialized successfully (app.js - v9 modular)');

  const mainContent = document.getElementById('main-content');
  const authView = document.getElementById('auth-view');
  const accountButton = document.getElementById('account-button');
  const accountButtonIcon = accountButton ? accountButton.querySelector('i') : null;
  const cancelAuthButton = document.getElementById('cancel-auth-button');
  const generalErrorMessageElement = document.getElementById('error-message');
  const confirmationMessageElement = document.getElementById('confirmation-message');
  const addPromptButtonMain = document.getElementById('add-prompt-button');

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const signupDisplayNameInput = document.getElementById('signup-display-name');
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
      console.log('User is logged in (app.js v9):', user.email, 'Display Name:', user.displayName);
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
      } else {
        Utils.showConfirmationMessage('Please login to add a prompt.', {
          specificErrorElement: generalErrorMessageElement,
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
      const displayName = signupDisplayNameInput.value.trim();
      const email = signupEmailInput.value;
      const password = signupPasswordInput.value;

      if (!displayName) {
        Utils.displayAuthError('Please enter a display name.', authErrorMessage);
        return;
      }
      if (displayName.includes('@') || displayName.includes('.')) {
        Utils.displayAuthError('Display name cannot be an email address.', authErrorMessage);
        return;
      }

      try {
        const userCredential = await signupUser(email, password, displayName);
        if (userCredential && userCredential.user) {
          signupForm.reset();
          Utils.showConfirmationMessage('Signup successful! You are now logged in.', {
            specificErrorElement: confirmationMessageElement,
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
      } catch (error) {
        Utils.displayAuthError(error.message || 'Google Sign-In failed.', authErrorMessage);
      }
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

  if (UI && UI.initializeUI) {
    UI.initializeUI();
  } else {
    console.error('UI.initializeUI module/function not found.');
  }
});
