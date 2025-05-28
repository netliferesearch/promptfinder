/* eslint-env browser */
/* global chrome, console */

// OAuth2 configuration for cross-browser compatibility
// This file contains OAuth2 settings that would normally be in manifest.json
// but are Chrome-specific and cause warnings in Firefox

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
        return manifest.oauth2;
      }
    } catch {
      console.debug('Could not read OAuth2 from manifest, using fallback config');
    }
  }

  // Fallback to our config (Firefox and other browsers)
  return OAUTH2_CONFIG;
}
