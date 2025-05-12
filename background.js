
/**
 * Background script for PromptFinder extension
 * Handles browser compatibility and UI mode selection
 */

function isSidePanelSupported() {
  return typeof chrome.sidePanel !== 'undefined';
}

chrome.runtime.onInstalled.addListener(() => {
  if (isSidePanelSupported()) {
    console.log('Side Panel API supported - enabling sidebar mode');
    chrome.sidePanel.setOptions({
      enabled: true,
      path: 'sidepanel.html'
    });
  } else {
    console.log('Side Panel API not supported - using popup mode');
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (isSidePanelSupported()) {
    console.log('Opening side panel');
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    console.log('Side Panel API not supported - popup will be used automatically');
  }
});
