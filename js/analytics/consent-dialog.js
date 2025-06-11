// Analytics Consent Dialog Management
document.addEventListener('DOMContentLoaded', function () {
  const consentDialog = document.getElementById('analytics-consent-dialog');
  const acceptBtn = document.getElementById('accept-analytics');
  const declineBtn = document.getElementById('decline-analytics');

  // Check if consent has already been given
  const storedConsent = localStorage.getItem('analytics_consent');
  const analyticsDisabled = localStorage.getItem('analytics_disabled');

  if (!storedConsent && !analyticsDisabled) {
    // Show consent dialog after a short delay
    setTimeout(() => {
      consentDialog.style.display = 'flex';
    }, 1000);
  }

  // Handle accept button
  acceptBtn.addEventListener('click', function () {
    window.grantAnalyticsConsent();
    consentDialog.style.display = 'none';

    // Show success toast
    if (window.showToast) {
      window.showToast('Analytics enabled. Thank you!', 'success');
    }
  });

  // Handle decline button
  declineBtn.addEventListener('click', function () {
    window.denyAnalyticsConsent();
    consentDialog.style.display = 'none';

    // Show confirmation toast
    if (window.showToast) {
      window.showToast('Analytics disabled. You can change this anytime in settings.', 'info');
    }
  });

  // Handle privacy policy link
  document.getElementById('privacy-policy-link').addEventListener('click', function (e) {
    e.preventDefault();
    // Open privacy policy - you can customize this URL
    chrome.tabs.create({ url: 'https://your-website.com/privacy-policy' });
  });
});
