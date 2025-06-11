// Chrome Extension Analytics using Measurement Protocol API
(function () {
  'use strict';

  const POPUP_MEASUREMENT_ID = 'G-NS4KTS6DW6';
  const POPUP_API_SECRET = 'EoT-jYQSSZONfT5S-WzSAA'; // Your API secret for server-side events

  // Analytics privacy functions
  window.analytics_consent_granted = false;
  window.analytics_disabled = false;

  // Generate or retrieve client ID
  function getClientId() {
    let clientId = localStorage.getItem('ga_client_id');
    if (!clientId) {
      clientId = Date.now().toString() + Math.random().toString(36).substr(2);
      localStorage.setItem('ga_client_id', clientId);
    }
    return clientId;
  }

  // Send event to GA4 via Measurement Protocol
  window.sendAnalyticsEvent = function (eventName, parameters = {}) {
    if (!window.analytics_consent_granted || window.analytics_disabled) {
      return;
    }

    const event = {
      client_id: getClientId(),
      events: [
        {
          name: eventName,
          params: {
            engagement_time_msec: 100,
            session_id: Date.now().toString(),
            ...parameters,
          },
        },
      ],
    };

    // Send to GA4 Measurement Protocol
    fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${POPUP_MEASUREMENT_ID}&api_secret=${POPUP_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    ).catch(error => {
      // Silently fail - don't disrupt user experience
      console.debug('Analytics event failed:', error);
    });
  };

  window.grantAnalyticsConsent = function () {
    window.analytics_consent_granted = true;
    localStorage.setItem('analytics_consent', 'granted');

    // Send initial page view
    window.sendAnalyticsEvent('page_view', {
      page_title: 'PromptFinder Extension',
      page_location: 'chrome-extension://popup',
    });
  };

  window.denyAnalyticsConsent = function () {
    window.analytics_consent_granted = false;
    localStorage.setItem('analytics_consent', 'denied');
  };

  window.disableAnalytics = function () {
    window.analytics_disabled = true;
    window.analytics_consent_granted = false;
    localStorage.setItem('analytics_disabled', 'true');
  };

  // Check for existing consent
  const storedConsent = localStorage.getItem('analytics_consent');
  const analyticsDisabled = localStorage.getItem('analytics_disabled');

  if (analyticsDisabled === 'true') {
    window.disableAnalytics();
  } else if (storedConsent === 'granted') {
    window.grantAnalyticsConsent();
  }
})();
