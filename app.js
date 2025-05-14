/**
 * PromptFinder Chrome Extension - Main Entry Point
 *
 * This file serves as the entry point for the extension's popup UI.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder extension initialized successfully');

  // UI Elements
  const mainContent = document.getElementById('main-content');
  const authView = document.getElementById('auth-view');
  const accountButton = document.getElementById('account-button');
  const accountButtonIcon = accountButton ? accountButton.querySelector('i') : null;
  const cancelAuthButton = document.getElementById('cancel-auth-button');
  // const settingsButton = document.getElementById('settings-button');

  // Auth Forms
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const signupEmailInput = document.getElementById('signup-email');
  const signupPasswordInput = document.getElementById('signup-password');
  const authErrorMessage = document.getElementById('auth-error-message');
  // const googleSignInButton = document.getElementById('google-signin-button'); // For later

  // Namespace aliases for convenience
  const PromptData = window.PromptFinder.PromptData;
  const UI = window.PromptFinder.UI;
  const Utils = window.PromptFinder.Utils;

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

  function updateUIAfterAuthStateChange(user) {
    currentUser = user;
    if (user) {
      showMainContentView();
      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-user-circle'); 
        accountButtonIcon.classList.add('fa-sign-out-alt');   
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Logout');
      console.log("User is logged in:", user.email);
    } else {
      showMainContentView(); 
      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-sign-out-alt');
        accountButtonIcon.classList.add('fa-user-circle');
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Login or Signup');
      console.log("User is logged out");
    }
  }

  if (accountButton) {
    accountButton.addEventListener('click', () => {
      if (currentUser) {
        PromptData.logoutUser(); // onAuthStateChanged will handle UI update
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
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (authErrorMessage) authErrorMessage.classList.add('hidden');
      const email = loginEmailInput.value;
      const password = loginPasswordInput.value;
      const result = await PromptData.loginUser(email, password);
      if (result && result.user) { // Successfully got UserCredential
        loginForm.reset();
        // onAuthStateChanged will handle UI update and view switch
      } else if (result instanceof Error) { // Got an Error object
        Utils.displayAuthError(result.message, authErrorMessage);
      } else {
         Utils.displayAuthError('Login failed. Unknown error.', authErrorMessage);
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (authErrorMessage) authErrorMessage.classList.add('hidden');
      const email = signupEmailInput.value;
      const password = signupPasswordInput.value;
      const result = await PromptData.signupUser(email, password);
      if (result && result.user) { // Successfully got UserCredential
        signupForm.reset();
        // onAuthStateChanged will handle UI update and view switch
      } else if (result instanceof Error) { // Got an Error object
        Utils.displayAuthError(result.message, authErrorMessage);
      } else {
        Utils.displayAuthError('Signup failed. Unknown error.', authErrorMessage);
      }
    });
  }

  if (PromptData && PromptData.onAuthStateChanged) {
    PromptData.onAuthStateChanged(updateUIAfterAuthStateChange);
  } else {
    console.error("PromptData.onAuthStateChanged not found. Firebase Auth might not be initialized correctly.");
    updateUIAfterAuthStateChange(null); 
  }

  if (UI && UI.initializeUI) {
    UI.initializeUI();
  } else {
    console.error("PromptFinder.UI module not found.");
  }

  if (window.firebaseAuth) {
      updateUIAfterAuthStateChange(window.firebaseAuth.currentUser);
  }
});
