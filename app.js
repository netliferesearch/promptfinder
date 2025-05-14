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
  const Utils = window.PromptFinder.Utils; // Assuming Utils is also on PromptFinder namespace

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
      // User is logged in
      showMainContentView();
      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-user-circle'); // Logged out icon
        accountButtonIcon.classList.add('fa-sign-out-alt');   // Logged in icon (logout action)
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Logout');
      // TODO: Load user-specific prompts or refresh list
      console.log("User is logged in:", user.email);
    } else {
      // User is logged out
      showMainContentView(); // Or optionally showAuthView() if preferred for logged-out users
      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-sign-out-alt');
        accountButtonIcon.classList.add('fa-user-circle');
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Login or Signup');
      // TODO: Clear any user-specific data from UI
      console.log("User is logged out");
    }
  }

  // --- Event Listeners ---
  if (accountButton) {
    accountButton.addEventListener('click', () => {
      if (currentUser) {
        // If user is logged in, account button acts as logout
        PromptData.logoutUser().then(success => {
          if (success) {
            // Auth state change will trigger UI update via onAuthStateChanged
          } else {
            // Error already handled by PromptData
          }
        });
      } else {
        // If user is logged out, account button shows login/signup view
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
      const userCredential = await PromptData.loginUser(email, password);
      if (userCredential) {
        // Success, onAuthStateChanged will handle UI update and view switch
        loginForm.reset();
      } else {
        if (authErrorMessage && Utils && Utils.displayAuthError) {
            Utils.displayAuthError('Failed to login. Please check your credentials.', authErrorMessage);
        } else if (authErrorMessage) {
            authErrorMessage.textContent = 'Failed to login. Please check your credentials.';
            authErrorMessage.classList.remove('hidden');
        }
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (authErrorMessage) authErrorMessage.classList.add('hidden');
      const email = signupEmailInput.value;
      const password = signupPasswordInput.value;
      const userCredential = await PromptData.signupUser(email, password);
      if (userCredential) {
        // Success, onAuthStateChanged will handle UI update and view switch
        signupForm.reset();
      } else {
        if (authErrorMessage && Utils && Utils.displayAuthError) {
            Utils.displayAuthError('Failed to signup. The email might be in use or password too weak.', authErrorMessage);
        } else if (authErrorMessage) {
            authErrorMessage.textContent = 'Failed to signup. The email might be in use or password too weak.';
            authErrorMessage.classList.remove('hidden');
        }
      }
    });
  }

  // Initialize Firebase Auth State Listener
  if (PromptData && PromptData.onAuthStateChanged) {
    PromptData.onAuthStateChanged(updateUIAfterAuthStateChange);
  } else {
    console.error("PromptData.onAuthStateChanged not found. Firebase Auth might not be initialized correctly.");
    // Fallback UI state if auth listener fails
    updateUIAfterAuthStateChange(null); 
  }

  // Initialize the rest of the UI module
  if (UI && UI.initializeUI) {
    UI.initializeUI();
  } else {
    console.error("PromptFinder.UI module not found.");
  }

  // Initial setup based on current auth state (in case onAuthStateChanged fires before DOMContentLoaded fully finishes)
  // or if firebaseAuth is immediately available and has a currentUser.
  if (window.firebaseAuth) {
      updateUIAfterAuthStateChange(window.firebaseAuth.currentUser);
  }

});
