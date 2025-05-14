/**
 * PromptFinder Chrome Extension - Main Entry Point
 *
 * This file serves as the entry point for the extension's popup UI.
 */

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder extension initialized successfully');

  const mainContent = document.getElementById('main-content');
  const authView = document.getElementById('auth-view');
  const accountButton = document.getElementById('account-button');
  const cancelAuthButton = document.getElementById('cancel-auth-button');
  // const settingsButton = document.getElementById('settings-button'); // For future settings view

  function showAuthView() {
    if (mainContent) mainContent.classList.add('hidden');
    if (authView) authView.classList.remove('hidden');
  }

  function showMainContentView() {
    if (authView) authView.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
  }

  // Initial state: show main content (assuming logged out for now, will be updated by auth state)
  showMainContentView(); 

  if (accountButton) {
    accountButton.addEventListener('click', () => {
      // For now, always show auth view. Later, this will depend on auth state.
      // If user is logged in, it might show a profile dropdown/logout.
      // If user is logged out, it shows the login/signup form.
      showAuthView();
    });
  }

  if (cancelAuthButton) {
    cancelAuthButton.addEventListener('click', () => {
      showMainContentView();
    });
  }

  // Initialize the rest of the UI module
  // We might need to pass references or have UI.js get these elements too.
  if (window.PromptFinder && window.PromptFinder.UI) {
    window.PromptFinder.UI.initializeUI();
  } else {
    console.error("PromptFinder.UI module not found.");
  }
});
