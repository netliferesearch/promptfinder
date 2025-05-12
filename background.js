
/**
 * Background script for PromptFinder extension
 * Handles browser compatibility and UI mode selection using pure feature detection
 */

/**
 * Check if the Side Panel API is supported and functional
 * This uses pure feature detection without any browser-specific checks
 * @returns {boolean} True if Side Panel API is supported and functional
 */
function isSidePanelSupported() {
  try {
    if (typeof chrome.sidePanel === 'undefined') {
      console.log('Side Panel API not available');
      return false;
    }
    
    if (typeof chrome.sidePanel.setOptions !== 'function' || 
        typeof chrome.sidePanel.open !== 'function') {
      console.log('Side Panel API methods not available');
      return false;
    }
    
    console.log('Side Panel API fully supported');
    return true;
  } catch (error) {
    console.error('Error checking Side Panel API support:', error);
    return false;
  }
}

/**
 * Set up the appropriate UI mode based on feature detection
 */
function setupUIMode() {
  try {
    if (isSidePanelSupported()) {
      console.log('Side Panel API supported - enabling sidebar mode');
      chrome.sidePanel.setOptions({
        enabled: true,
        path: 'sidepanel.html'
      });
      chrome.action.setPopup({ popup: '' });
    } else {
      console.log('Side Panel API not supported - using popup mode');
      chrome.action.setPopup({ popup: 'popup.html' });
    }
  } catch (error) {
    console.error('Error setting up UI mode:', error);
    chrome.action.setPopup({ popup: 'popup.html' });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  setupUIMode();
});

chrome.action.onClicked.addListener((tab) => {
  try {
    if (isSidePanelSupported()) {
      console.log('Opening side panel');
      chrome.sidePanel.open({ tabId: tab.id });
    } else {
      console.log('Action clicked but popup should handle this automatically');
    }
  } catch (error) {
    console.error('Error handling action click:', error);
    chrome.action.setPopup({ popup: 'popup.html' });
  }
});

chrome.runtime.onStartup.addListener(() => {
  setupUIMode();
});
