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
  
  // Removed references to #add-prompt-section and its form elements from app.js
  // as that form is primarily handled by add-prompt.html and add-prompt.js
  // const addPromptSection = document.getElementById('add-prompt-section');
  // const addPromptForm = document.getElementById('add-prompt-form');
  // const cancelAddPromptButton = document.getElementById('cancel-add-prompt'); 
  const addPromptButtonMain = document.getElementById('add-prompt-button'); // The button in main popup view

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
    // if (addPromptSection) addPromptSection.classList.add('hidden'); // No longer needed here
    if (mainContent) mainContent.classList.add('hidden');
    if (authView) authView.classList.remove('hidden');
    if (authErrorMessage) {
        authErrorMessage.textContent = '';
        authErrorMessage.classList.add('hidden');
    }
  }

  function showMainContentView() {
    if (authView) authView.classList.add('hidden');
    // if (addPromptSection) addPromptSection.classList.add('hidden'); // No longer needed here
    if (mainContent) mainContent.classList.remove('hidden');
  }
  
  // showAddPromptView function is removed as add-prompt.html handles its own view.

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
    } else {
      showMainContentView(); 
      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-sign-out-alt');
        accountButtonIcon.classList.add('fa-user-circle');
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Login or Signup');
      if (addPromptButtonMain) addPromptButtonMain.disabled = true; 
      console.log("User is logged out");
    }
  }

  // The #add-prompt-button in popup.html should be handled by UI.js to open pages/add-prompt.html
  // Removing direct click handler for it from app.js to avoid conflict if UI.js does it.
  // If UI.js doesn't handle it, it needs to be added there or back here based on its actual behavior.
  // For now, we assume UI.initializeUI() wires up the #add-prompt-button to open the separate page.

  // Removed event listener for #cancel-add-prompt as it's not in popup.html anymore.
  // Removed submit listener for #add-prompt-form from popup.html as it's handled by add-prompt.js.

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
      if (result && result.user) {
        // Success: onAuthStateChanged will handle UI update and view switch
      } else if (result instanceof Error) {
        // Error already displayed by signInWithGoogle or Utils.displayAuthError
      } else {
        Utils.displayAuthError('Google Sign-In failed. Unknown error.', authErrorMessage);
      }
    });
  }

  if (PromptData && PromptData.onAuthStateChanged) {
    PromptData.onAuthStateChanged(updateUIAfterAuthStateChange);
  } else {
    console.error("PromptData.onAuthStateChanged not found. Firebase Auth might not be initialized correctly.");
    updateUIAfterAuthStateChange(null); 
  }
  
  // Listener for messages from other parts of the extension (e.g., add-prompt.js)
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'PROMPT_ADDED_OR_MODIFIED') {
            console.log('Message received: PROMPT_ADDED_OR_MODIFIED. Refreshing prompt list.');
            // TODO: Call the function in UI.js to reload and render prompts from Firestore
            // Example: if (UI && UI.loadAndRenderPrompts) UI.loadAndRenderPrompts();
            // For now, just log. This will be crucial when loadPrompts is refactored.
            if (UI && UI.loadAndDisplayData) { // Assuming a generic function name for now
                UI.loadAndDisplayData();
            }
            sendResponse({ status: "success", message: "Prompt list refresh triggered in popup." });
            return true; // Indicates you wish to send a response asynchronously (if needed)
        }
    });
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
