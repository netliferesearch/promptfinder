/**
 * PromptFinder Chrome Extension - Main Entry Point
 *
 * This file serves as the entry point for the extension's popup UI.
 * Using namespace pattern for Chrome extension compatibility.
 */

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder extension initialized successfully');

  // The PromptFinder.UI.initializeUI() is called in popup.js

  // Once migration is complete, we'll move all initialization here and
  // make popup.js just a thin wrapper that uses our modular structure.
});
