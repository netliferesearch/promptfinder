/**
 * Page Tracker for PromptFinder Chrome Extension
 *
 * Tracks page views and navigation events within the extension popup
 * using GA4 analytics standards
 */

// import { GA4_EVENTS } from './event-schema.js'; // Unused

/**
 * Page Tracker Class
 * Manages page view tracking for extension popup and pages
 */
class PageTracker {
  constructor(analytics) {
    this.analytics = analytics;
    this.currentPage = null;
    this.sessionStartTime = Date.now();
    this.lastPageStartTime = Date.now();
    this.initialized = false;
    this.navigationHistory = [];
  }

  /**
   * Initialize page tracking
   * Call this when the popup or extension page loads
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      // Track initial page load
      await this.trackInitialPageLoad();

      // Set up navigation monitoring
      this.setupNavigationTracking();

      // Set up visibility change tracking
      this.setupVisibilityTracking();

      this.initialized = true;
      console.log('[PageTracker] Initialized successfully');
    } catch (error) {
      console.error('[PageTracker] Initialization failed:', error);
    }
  }

  /**
   * Track the initial page load
   */
  async trackInitialPageLoad() {
    const pageInfo = this.getPageInfo();

    // Track extension startup
    await this.analytics.trackExtensionStartup({
      version: this.getExtensionVersion(),
      browserInfo: this.getBrowserInfo(),
      installType: 'existing', // Could be enhanced to detect new installs
      context: pageInfo.context,
    });

    // Track initial page view
    await this.trackPageView(pageInfo.page, {
      isInitialLoad: true,
      loadTime: Date.now() - this.sessionStartTime,
    });
  }

  /**
   * Track a page view event
   * @param {string} pageName - Name of the page/view
   * @param {Object} options - Additional tracking options
   */
  async trackPageView(pageName, options = {}) {
    const previousPage = this.currentPage;
    const now = Date.now();

    // Track engagement time on previous page
    if (previousPage && this.lastPageStartTime) {
      const engagementTime = now - this.lastPageStartTime;
      await this.analytics.trackEngagement({
        duration: engagementTime,
        type: 'page_view',
        context: this.getPageInfo().context,
        previousPage: previousPage,
        customParameters: {
          page_engagement_ms: engagementTime,
          page_name: previousPage,
        },
      });
    }

    // Update current page tracking
    this.currentPage = pageName;
    this.lastPageStartTime = now;

    // Add to navigation history
    this.navigationHistory.push({
      page: pageName,
      timestamp: now,
      previousPage: previousPage,
    });

    // Keep history manageable (last 20 navigations)
    if (this.navigationHistory.length > 20) {
      this.navigationHistory = this.navigationHistory.slice(-20);
    }

    // Get page information
    const pageInfo = this.getPageInfo();

    // Track the page view
    const result = await this.analytics.trackPageView({
      title: this.getPageTitle(pageName),
      url: pageInfo.url,
      referrer: options.referrer || '',
      extensionPage: pageName,
      customParameters: {
        context: pageInfo.context,
        page_name: pageName,
        previous_page: previousPage || '',
        session_duration_ms: now - this.sessionStartTime,
        navigation_depth: this.navigationHistory.length,
        is_initial_load: options.isInitialLoad || false,
        load_time_ms: options.loadTime || 0,
        user_agent: this.getBrowserInfo(),
      },
    });

    console.log(`[PageTracker] Tracked page view: ${pageName}`);
    return result;
  }

  /**
   * Track navigation between views within the popup
   * @param {string} viewName - Name of the view being navigated to
   * @param {Object} options - Navigation options
   */
  async trackNavigation(viewName, options = {}) {
    const navigationData = {
      from: this.currentPage || 'unknown',
      to: viewName,
      method: options.method || 'click', // click, keyboard, programmatic
      trigger: options.trigger || 'user', // user, system, auto
      context: this.getPageInfo().context,
    };

    // Track navigation event
    await this.analytics.trackCustomEvent('navigation', {
      navigation_from: navigationData.from,
      navigation_to: navigationData.to,
      navigation_method: navigationData.method,
      navigation_trigger: navigationData.trigger,
      context: navigationData.context,
      session_duration_ms: Date.now() - this.sessionStartTime,
    });

    // Track the new page view
    await this.trackPageView(viewName, {
      navigationMethod: navigationData.method,
      navigationTrigger: navigationData.trigger,
    });

    console.log(`[PageTracker] Tracked navigation: ${navigationData.from} → ${navigationData.to}`);
  }

  /**
   * Track tab switching within the popup
   * @param {string} tabName - Name of the tab
   * @param {Object} options - Tab options
   */
  async trackTabSwitch(tabName, options = {}) {
    const tabData = {
      tab: tabName,
      previousTab: options.previousTab || '',
      method: options.method || 'click',
      context: this.getPageInfo().context,
    };

    await this.analytics.trackCustomEvent('tab_switch', {
      tab_name: tabData.tab,
      previous_tab: tabData.previousTab,
      switch_method: tabData.method,
      context: tabData.context,
      session_duration_ms: Date.now() - this.sessionStartTime,
    });

    console.log(`[PageTracker] Tracked tab switch: ${tabData.previousTab} → ${tabData.tab}`);
  }

  /**
   * Track popup interactions (open/close)
   * @param {string} action - Action type (open, close)
   * @param {Object} options - Interaction options
   */
  async trackPopupInteraction(action, options = {}) {
    const interactionData = {
      action: action,
      duration: options.duration || Date.now() - this.sessionStartTime,
      interactions: this.navigationHistory.length,
      promptsViewed: options.promptsViewed || 0,
      pagesVisited: new Set(this.navigationHistory.map(h => h.page)).size,
    };

    await this.analytics.trackPopupInteraction(interactionData);

    console.log(`[PageTracker] Tracked popup interaction: ${action}`);
  }

  /**
   * Get current page information
   * @returns {Object} Page information
   */
  getPageInfo() {
    const url =
      typeof window !== 'undefined' && window.location
        ? window.location.href
        : 'chrome-extension://unknown';

    const pathname =
      typeof window !== 'undefined' && window.location ? window.location.pathname : '/unknown';

    // Determine context and page based on URL and DOM state
    let context = 'popup';
    let page = 'main';

    try {
      // Check if we're in the popup
      if (pathname.includes('popup.html') || pathname.includes('popup')) {
        context = 'popup';

        // Determine current view within popup
        const authView = document.getElementById('auth-view');
        const mainContent = document.getElementById('main-content');
        const promptDetails = document.getElementById('prompt-details-section');

        if (authView && !authView.classList.contains('hidden')) {
          // Check specific auth state
          const emailVerification = document.getElementById('email-verification-section');
          const resetPassword = document.getElementById('reset-password-form');

          if (emailVerification && !emailVerification.classList.contains('hidden')) {
            page = 'email_verification';
          } else if (resetPassword && !resetPassword.classList.contains('hidden')) {
            page = 'password_reset';
          } else {
            page = 'auth';
          }
        } else if (promptDetails && !promptDetails.classList.contains('hidden')) {
          page = 'prompt_details';
        } else if (mainContent && !mainContent.classList.contains('hidden')) {
          page = 'main';
        }
      } else if (pathname.includes('options')) {
        context = 'options';
        page = 'options';
      } else if (pathname.includes('background') || pathname.includes('service-worker')) {
        context = 'service_worker';
        page = 'background';
      }
    } catch (error) {
      console.warn('[PageTracker] Error determining page info:', error);
    }

    return {
      url: url,
      context: context,
      page: page,
      pathname: pathname,
    };
  }

  /**
   * Get page title for a given page name
   * @param {string} pageName - Page name
   * @returns {string} Page title
   */
  getPageTitle(pageName) {
    const titles = {
      main: 'PromptFinder - Browse Prompts',
      auth: 'PromptFinder - Sign In',
      email_verification: 'PromptFinder - Verify Email',
      password_reset: 'PromptFinder - Reset Password',
      prompt_details: 'PromptFinder - Prompt Details',
      options: 'PromptFinder - Options',
      background: 'PromptFinder - Background',
    };

    return titles[pageName] || `PromptFinder - ${pageName}`;
  }

  /**
   * Get extension version
   * @returns {string} Extension version
   */
  getExtensionVersion() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
        return chrome.runtime.getManifest().version;
      }
    } catch (error) {
      console.warn('[PageTracker] Could not get extension version:', error);
    }
    return 'unknown';
  }

  /**
   * Get browser information
   * @returns {string} Browser info
   */
  getBrowserInfo() {
    try {
      if (typeof navigator !== 'undefined') {
        const userAgent = navigator.userAgent;
        // Extract browser name and version
        if (userAgent.includes('Chrome/')) {
          const match = userAgent.match(/Chrome\/([0-9.]+)/);
          return match ? `Chrome/${match[1]}` : 'Chrome/unknown';
        } else if (userAgent.includes('Firefox/')) {
          const match = userAgent.match(/Firefox\/([0-9.]+)/);
          return match ? `Firefox/${match[1]}` : 'Firefox/unknown';
        } else if (userAgent.includes('Safari/')) {
          const match = userAgent.match(/Safari\/([0-9.]+)/);
          return match ? `Safari/${match[1]}` : 'Safari/unknown';
        }
      }
    } catch (error) {
      console.warn('[PageTracker] Could not get browser info:', error);
    }
    return 'unknown';
  }

  /**
   * Set up navigation tracking for DOM changes
   */
  setupNavigationTracking() {
    try {
      // Monitor auth view changes
      const authView = document.getElementById('auth-view');
      const mainContent = document.getElementById('main-content');

      if (authView && mainContent) {
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const target = mutation.target;

              // Detect view changes
              if (target.id === 'auth-view' && !target.classList.contains('hidden')) {
                this.trackPageView('auth');
              } else if (target.id === 'main-content' && !target.classList.contains('hidden')) {
                this.trackPageView('main');
              }
            }
          });
        });

        observer.observe(authView, { attributes: true, attributeFilter: ['class'] });
        observer.observe(mainContent, { attributes: true, attributeFilter: ['class'] });
      }

      // Monitor prompt details view changes
      const promptDetails = document.getElementById('prompt-details-section');
      if (promptDetails) {
        const detailsObserver = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const target = mutation.target;

              if (target.id === 'prompt-details-section') {
                if (!target.classList.contains('hidden')) {
                  this.trackPageView('prompt_details');
                } else {
                  this.trackPageView('main');
                }
              }
            }
          });
        });

        detailsObserver.observe(promptDetails, { attributes: true, attributeFilter: ['class'] });
      }
    } catch (error) {
      console.warn('[PageTracker] Could not set up navigation tracking:', error);
    }
  }

  /**
   * Set up visibility change tracking
   */
  setupVisibilityTracking() {
    try {
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            // Popup is hidden/closed
            this.trackPopupInteraction('hide', {
              duration: Date.now() - this.sessionStartTime,
              promptsViewed: this.navigationHistory.filter(h => h.page === 'prompt_details').length,
            });
          } else {
            // Popup is visible/opened
            this.trackPopupInteraction('show', {
              duration: 0,
            });
          }
        });
      }
    } catch (error) {
      console.warn('[PageTracker] Could not set up visibility tracking:', error);
    }
  }

  /**
   * Get tracking status and statistics
   * @returns {Object} Tracking status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      currentPage: this.currentPage,
      sessionDuration: Date.now() - this.sessionStartTime,
      navigationHistory: this.navigationHistory.length,
      pagesVisited: new Set(this.navigationHistory.map(h => h.page)).size,
      lastActivity: this.lastPageStartTime,
    };
  }

  /**
   * Reset tracking state (useful for testing)
   */
  reset() {
    this.currentPage = null;
    this.sessionStartTime = Date.now();
    this.lastPageStartTime = Date.now();
    this.navigationHistory = [];
    this.initialized = false;
  }
}

export default PageTracker;
