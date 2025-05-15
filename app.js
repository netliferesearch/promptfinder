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
  
  const addPromptSection = document.getElementById('add-prompt-section');
  const addPromptForm = document.getElementById('add-prompt-form'); // Form within popup.html
  const promptTitleInput = document.getElementById('prompt-title');
  const promptTextInput = document.getElementById('prompt-text');
  const promptCategoryInput = document.getElementById('prompt-category');
  const promptTagsInput = document.getElementById('prompt-tags');
  const promptPrivateCheckbox = document.getElementById('prompt-private');
  const cancelAddPromptButton = document.getElementById('cancel-add-prompt');
  const addPromptButtonMain = document.getElementById('add-prompt-button'); // The button in main view


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
    if (addPromptSection) addPromptSection.classList.add('hidden'); // Hide add prompt if open
    if (mainContent) mainContent.classList.add('hidden');
    if (authView) authView.classList.remove('hidden');
    if (authErrorMessage) {
        authErrorMessage.textContent = '';
        authErrorMessage.classList.add('hidden');
    }
  }

  function showMainContentView() {
    if (authView) authView.classList.add('hidden');
    if (addPromptSection) addPromptSection.classList.add('hidden'); // Hide add prompt if open
    if (mainContent) mainContent.classList.remove('hidden');
  }
  
  function showAddPromptView() {
    if (authView) authView.classList.add('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    if (addPromptSection) addPromptSection.classList.remove('hidden');
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
    } else {
      showMainContentView(); 
      if (accountButtonIcon) {
        accountButtonIcon.classList.remove('fa-sign-out-alt');
        accountButtonIcon.classList.add('fa-user-circle');
      }
      if (accountButton) accountButton.setAttribute('aria-label', 'Login or Signup');
      if (addPromptButtonMain) addPromptButtonMain.disabled = true; // Disable add prompt if not logged in
      console.log("User is logged out");
    }
  }

  if (addPromptButtonMain) {
    addPromptButtonMain.addEventListener('click', () => {
        if (currentUser) {
            showAddPromptView();
        } else {
            Utils.showConfirmationMessage('Please login to add a prompt.', { 
                messageElement: generalErrorMessageElement, // Use general error for this
                type: 'error' 
            });
            // Or, alternatively, redirect to auth view: showAuthView();
        }
    });
  }

  if (cancelAddPromptButton) {
    cancelAddPromptButton.addEventListener('click', () => {
        showMainContentView();
        addPromptForm.reset();
    });
  }

  if (addPromptForm) {
    addPromptForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!currentUser) {
            Utils.handleError("You must be logged in to add prompts.", {messageElement: generalErrorMessageElement, userVisible: true, type: 'error'});
            showAuthView(); // Redirect to login
            return;
        }

        const promptData = {
            title: promptTitleInput.value,
            text: promptTextInput.value,
            category: promptCategoryInput.value,
            tags: promptTagsInput.value ? promptTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            isPrivate: promptPrivateCheckbox.checked,
            targetAiTools: [] // Placeholder for now
        };

        const newPrompt = await PromptData.addPrompt(promptData);
        if (newPrompt) {
            Utils.showConfirmationMessage('Prompt added successfully!', { messageElement: confirmationMessageElement });
            addPromptForm.reset();
            showMainContentView();
            // TODO: Refresh prompt list in UI (call a UI function)
            if (UI && UI.renderPrompts) {
                // This assumes UI.renderPrompts will call loadPrompts itself or be passed the new list
                // UI.loadAndRenderPrompts(); // Example of how UI might handle it
            }
        } else {
            // Error already handled by PromptData.addPrompt's call to Utils.handleError for Firestore issues
            // but we might want a specific message if it returned null due to no user (already checked above)
             Utils.handleError("Failed to add prompt. Please try again.", {messageElement: generalErrorMessageElement, userVisible: true, type: 'error'});
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

  if (UI && UI.initializeUI) {
    UI.initializeUI(); // This might need to be called after auth state is known if it loads prompts
  } else {
    console.error("PromptFinder.UI module not found.");
  }

  if (window.firebaseAuth) {
      updateUIAfterAuthStateChange(window.firebaseAuth.currentUser);
  }
});
