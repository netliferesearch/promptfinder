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
  
  /**
   * Central function to load prompts and update the UI.
   * This will be called on auth state changes and after certain actions.
   */
  async function loadAndRenderPrompts() {
    if (UI && UI.loadAndDisplayData) { // Assuming UI.js has this function
        console.log("Calling UI.loadAndDisplayData from app.js");
        await UI.loadAndDisplayData(); 
    } else if (UI && UI.initializeUI && typeof UI.loadPromptsForCurrentState === 'function') { 
        // Fallback if initializeUI is meant to handle it or a more specific func exists
        console.log("Calling UI.loadPromptsForCurrentState from app.js");
        await UI.loadPromptsForCurrentState();
    } else {
        console.warn("UI function to load and render prompts not found. UI may not update.");
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
      console.log("User is logged in:", user.email);
      loadAndRenderPrompts(); // Load prompts for the logged-in user
    } else {
      showMainContentView(); 
      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-sign-out-alt');
        accountButtonIcon.classList.add('fa-user-circle');
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Login or Signup');
      if (addPromptButtonMain) addPromptButtonMain.disabled = true; 
      console.log("User is logged out");
      loadAndRenderPrompts(); // Load public prompts or clear list
    }
  }

  if (addPromptButtonMain) {
    addPromptButtonMain.addEventListener('click', () => {
        if (currentUser) {
            // The actual opening of add-prompt.html is handled by UI.initializeUI or similar
            // This button primarily enables/disables. If it also needs to trigger opening, that logic is in UI.js
            console.log("Add prompt button clicked by logged-in user.");
            // If UI.js doesn't open the window, you might need: chrome.windows.create({ url: 'pages/add-prompt.html', type: 'popup', width: 400, height: 600 });
        } else {
            Utils.showConfirmationMessage('Please login to add a prompt.', { 
                messageElement: generalErrorMessageElement, 
                type: 'error' 
            });
        }
    });
  }

  if (accountButton) {
    accountButton.addEventListener('click', () => {
      if (currentUser) {
        PromptData.logoutUser(); 
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
      if (result && result.user) { 
        loginForm.reset();
      } else if (result instanceof Error) { 
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
      if (result && result.user) { 
        signupForm.reset();
        if (Utils.showConfirmationMessage) {
            Utils.showConfirmationMessage('Signup successful! You are now logged in.', {
                 messageElement: confirmationMessageElement,
                 timeout: 5000 
            });
        }
      } else if (result instanceof Error) { 
        Utils.displayAuthError(result.message, authErrorMessage);
      } else {
        Utils.displayAuthError('Signup failed. Unknown error.', authErrorMessage);
      }
    });
  }

  if (googleSignInButton) {
    googleSignInButton.addEventListener('click', async () => {
      if (authErrorMessage) authErrorMessage.classList.add('hidden');
      const result = await PromptData.signInWithGoogle();
      // UI update will be handled by onAuthStateChanged
    });
  }

  if (PromptData && PromptData.onAuthStateChanged) {
    PromptData.onAuthStateChanged(updateUIAfterAuthStateChange);
  } else {
    console.error("PromptData.onAuthStateChanged not found. Firebase Auth might not be initialized correctly.");
    updateUIAfterAuthStateChange(null); 
  }
  
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'PROMPT_ADDED_OR_MODIFIED') {
            console.log('Message received: PROMPT_ADDED_OR_MODIFIED. Refreshing prompt list.');
            loadAndRenderPrompts();
            sendResponse({ status: "success", message: "Prompt list refresh triggered in popup." });
            return true; 
        }
    });
  }

  // Initial UI setup and data load
  if (UI && UI.initializeUI) {
    UI.initializeUI(); // Sets up general UI event listeners (like add prompt button to open new window)
  } else {
    console.error("PromptFinder.UI module not found.");
  }

  // Initial auth state check and data load
  if (window.firebaseAuth) {
      updateUIAfterAuthStateChange(window.firebaseAuth.currentUser);
      // Note: updateUIAfterAuthStateChange now calls loadAndRenderPrompts,
      // so an additional call here might be redundant if onAuthStateChanged fires quickly.
      // However, if currentUser is already set before listener attaches, this ensures initial load.
  } else {
      // If firebaseAuth isn't ready yet, onAuthStateChanged will handle the first load.
      loadAndRenderPrompts(); // Load public prompts if auth isn't ready
  }
});
