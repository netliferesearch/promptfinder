
/**
 * Background script for PromptFinder extension
 * Handles browser compatibility and UI mode selection
 */

function isSidePanelSupported() {
  return typeof chrome.sidePanel !== 'undefined';
}

function isArcBrowser() {
  return navigator.userAgent.includes('Arc/');
}

function setupUIMode() {
  if (isSidePanelSupported() && !isArcBrowser()) {
    console.log('Side Panel API supported - enabling sidebar mode');
    chrome.sidePanel.setOptions({
      enabled: true,
      path: 'sidepanel.html'
    });
    chrome.action.setPopup({ popup: '' });
  } else {
    console.log('Using popup mode for this browser');
    chrome.action.setPopup({ popup: 'popup.html' });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  setupUIMode();
});

chrome.action.onClicked.addListener((tab) => {
  if (isSidePanelSupported() && !isArcBrowser()) {
    console.log('Opening side panel');
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    console.log('Action clicked but popup should handle this automatically');
  }
});

chrome.runtime.onStartup.addListener(() => {
  setupUIMode();
});
