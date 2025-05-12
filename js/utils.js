/**
 * PromptFinder Extension - Utility Functions
 * Contains shared utility functions for the extension.
 * Using namespace pattern for Chrome extension compatibility.
 */

// Create namespace
window.PromptFinder = window.PromptFinder || {};

// Utils module
window.PromptFinder.Utils = (function () {
  /**
   * Promise wrapper for chrome.storage.local.get
   * @param {string|Array|Object} keys - Keys to retrieve from storage
   * @returns {Promise<Object>} - Promise resolving to the retrieved items
   */
  const chromeStorageGet = keys => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, result => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  };

  /**
   * Promise wrapper for chrome.storage.local.set
   * @param {Object} items - Items to store
   * @returns {Promise<void>} - Promise resolving when storage is complete
   */
  const chromeStorageSet = items => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  };

  /**
   * Centralized error handling function
   * @param {string} message - The error message to display
   * @param {Object} options - Configuration options
   * @param {boolean} options.userVisible - Whether to show error to user (default: true)
   * @param {number} options.timeout - How long to show error in ms (default: 5000)
   * @param {'error'|'warning'|'info'} options.type - Type of error (default: 'error')
   * @param {Error} [options.originalError] - Original error object for logging
   * @param {HTMLElement} [options.errorElement] - DOM element to show error in
   */
  const handleError = (message, options = {}) => {
    // Set default options
    const {
      userVisible = true,
      timeout = 5000,
      type = 'error',
      originalError = null,
      errorElement = document.getElementById('error-message'),
    } = options;

    // Always log to console with appropriate method
    if (originalError) {
      console[type](message, originalError);
    } else {
      console[type](message);
    }

    // Only show to user if userVisible is true
    if (userVisible && errorElement) {
      // Set appropriate styling based on error type
      const typeStyles = {
        error: {
          bgColor: '#f8d7da',
          textColor: '#721c24',
          borderColor: '#f5c6cb',
        },
        warning: {
          bgColor: '#fff3cd',
          textColor: '#856404',
          borderColor: '#ffeeba',
        },
        info: {
          bgColor: '#d1ecf1',
          textColor: '#0c5460',
          borderColor: '#bee5eb',
        },
      };

      const style = typeStyles[type] || typeStyles.error;

      // Apply styling
      errorElement.style.backgroundColor = style.bgColor;
      errorElement.style.color = style.textColor;
      errorElement.style.borderColor = style.borderColor;

      // Set content and show
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');

      // Hide after timeout
      setTimeout(() => {
        errorElement.classList.add('hidden');
      }, timeout);
    }
  };

  /**
   * Display a confirmation message to the user
   * @param {string} message - Message to display
   * @param {Object} options - Configuration options
   * @param {number} options.timeout - How long to show message in ms (default: 2000)
   * @param {boolean} options.withButton - Whether to include a dismiss button (default: false)
   * @param {HTMLElement} [options.messageElement] - DOM element to show message in
   */
  const showConfirmationMessage = (message, options = {}) => {
    const {
      timeout = 2000,
      withButton = false,
      messageElement = document.getElementById('confirmation-message'),
    } = options;

    if (messageElement) {
      messageElement.classList.remove('hidden');

      if (withButton) {
        messageElement.innerHTML = `${message} <button class="dismiss-btn">OK</button>`;
        const dismissBtn = messageElement.querySelector('.dismiss-btn');
        if (dismissBtn) {
          dismissBtn.addEventListener('click', () => {
            messageElement.classList.add('hidden');
          });
        }
      } else {
        messageElement.textContent = message;
      }

      // Always set timeout to hide the message
      setTimeout(() => {
        messageElement.classList.add('hidden');
      }, timeout);
    }
  };

  /**
   * Highlights stars in a star rating container
   * @param {number} rating - The rating to highlight (1-5)
   * @param {HTMLElement} container - The container of star elements
   */
  const highlightStars = (rating, container) => {
    if (!container) return;

    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
      const starValue = index + 1;
      const icon = star.querySelector('i');

      // Update ARIA state
      star.setAttribute('aria-checked', starValue <= rating ? 'true' : 'false');

      // Update visual state
      if (starValue <= rating) {
        star.classList.add('filled');
        if (icon) icon.className = 'fas fa-star';
      } else {
        star.classList.remove('filled');
        if (icon) icon.className = 'far fa-star';
      }
    });
  };

  // Return public API
  return {
    chromeStorageGet,
    chromeStorageSet,
    handleError,
    showConfirmationMessage,
    highlightStars,
  };
})();
