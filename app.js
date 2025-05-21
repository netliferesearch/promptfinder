import {
  loginUser,
  signupUser,
  signInWithGoogle,
  logoutUser,
  onAuthStateChanged,
} from './js/promptData.js';

import * as Utils from './js/utils.js';
import * as UI from './js/ui.js';
import * as PromptDataModule from './js/promptData.js';

window.DebugPromptData = PromptDataModule;

let mainContentElement, authViewElement, authErrorMessageElement;

function showAuthView() {
  if (mainContentElement) mainContentElement.classList.add('hidden');
  if (authViewElement) authViewElement.classList.remove('hidden');
  if (authErrorMessageElement) {
    authErrorMessageElement.textContent = '';
    authErrorMessageElement.classList.add('hidden');
  }
  // Hide FAB if present
  const addPromptFabEl = document.getElementById('add-prompt-fab');
  if (addPromptFabEl) addPromptFabEl.hidden = true;
}
window.showAuthViewGlobally = showAuthView;

window.handleAuthRequiredAction = actionDescription => {
  // Use toast notification for all auth-required actions
  if (typeof window.showToast === 'function') {
    window.showToast(`Please login or create an account to ${actionDescription}.`, {
      type: 'info',
      duration: 5000,
    });
  } else {
    // fallback for environments without toast
    Utils.handleError(`Please login or create an account to ${actionDescription}.`, {
      userVisible: true,
      type: 'info',
      timeout: 5000,
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder extension initialized successfully (app.js - v9 modular)');

  mainContentElement = document.getElementById('main-content');
  authViewElement = document.getElementById('auth-view');
  authErrorMessageElement = document.getElementById('auth-error-message');

  const accountButton = document.getElementById('account-button');
  const accountButtonIcon = accountButton ? accountButton.querySelector('i') : null;
  const cancelAuthButton = document.getElementById('cancel-auth-button');
  const confirmationMessageElement = document.getElementById('confirmation-message');
  const addPromptButtonMain = document.getElementById('add-prompt-button');

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const signupDisplayNameInput = document.getElementById('signup-display-name');
  const signupEmailInput = document.getElementById('signup-email');
  const signupPasswordInput = document.getElementById('signup-password');
  const googleSignInButton = document.getElementById('google-signin-button');

  let currentUser = null;

  function showMainContentView() {
    if (authViewElement) authViewElement.classList.add('hidden');
    if (mainContentElement) mainContentElement.classList.remove('hidden');
    // Show FAB if user is logged in
    const addPromptFabEl = document.getElementById('add-prompt-fab');
    if (addPromptFabEl && window.firebaseAuthCurrentUser) {
      addPromptFabEl.hidden = false;
    }
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
        if (UI && UI.openDetachedAddPromptWindow) {
          UI.openDetachedAddPromptWindow();
        } else {
          console.error('UI.openDetachedAddPromptWindow is not available.');
        }
      } else {
        if (window.handleAuthRequiredAction) {
          window.handleAuthRequiredAction('add a new prompt');
        }
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
      if (authErrorMessageElement) authErrorMessageElement.classList.add('hidden');
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
          authErrorMessageElement
        );
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

      if (!displayName) {
        Utils.displayAuthError('Please enter a display name.', authErrorMessageElement);
        return;
      }
      if (displayName.includes('@') || displayName.includes('.')) {
        Utils.displayAuthError('Display name cannot be an email address.', authErrorMessageElement);
        return;
      }

      try {
        const userCredential = await signupUser(email, password, displayName);
        if (userCredential && userCredential.user) {
          signupForm.reset();
          Utils.showConfirmationMessage('Signup successful! You are now logged in.', {
            specificErrorElement: confirmationMessageElement,
            timeout: 5000,
            type: 'success',
          });
        }
      } catch (error) {
        Utils.displayAuthError(
          error.message || 'Signup failed. Please try again.',
          authErrorMessageElement
        );
      }
    });
  }

  if (googleSignInButton) {
    googleSignInButton.addEventListener('click', async () => {
      if (authErrorMessageElement) authErrorMessageElement.classList.add('hidden');
      try {
        await signInWithGoogle();
      } catch (error) {
        Utils.displayAuthError(error.message || 'Google Sign-In failed.', authErrorMessageElement);
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
