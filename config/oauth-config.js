/* eslint-env browser */
/* global chrome, console */

// OAuth2 configuration for cross-browser compatibility
// Chrome reads OAuth2 from manifest.json (required for chrome.identity API)
// Firefox shows a warning for manifest oauth2 but uses this fallback config
// This ensures OAuth authentication works across both browsers

export const OAUTH2_CONFIG = {
  client_id: '1003470911937-your-oauth-client-id.apps.googleusercontent.com',
  scopes: ['openid', 'email', 'profile'],
};

// Function to get OAuth2 config in a cross-browser compatible way
export function getOAuth2Config() {
  // Try to get from manifest first (Chrome)
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    try {
      const manifest = chrome.runtime.getManifest();
      if (manifest && manifest.oauth2) {
        console.debug('Using OAuth2 config from manifest (Chrome)');
        return manifest.oauth2;
      }
    } catch (error) {
      console.debug('Could not read OAuth2 from manifest, using fallback config:', error);
    }
  }

  // Fallback to our config (Firefox and other browsers)
  console.debug('Using fallback OAuth2 config (Firefox/other browsers)');
  return OAUTH2_CONFIG;
}
