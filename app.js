/**
 * PromptFinder Chrome Extension - Main Entry Point
 *
 * This file serves as the entry point for the extension's popup UI.
 * Using namespace pattern for Chrome extension compatibility.
 */

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the UI module, which will handle all UI setup and event listeners
  window.PromptFinder.UI.initializeUI();
});
