/**
 * PromptFinder Extension - Utility Functions
 * Contains shared utility functions for the extension.
 */

/**
 * Promise wrapper for chrome.storage.local.get
 * @param {string|Array|Object} keys - Keys to retrieve from storage
 * @returns {Promise<Object>} - Promise resolving to the retrieved items
 */
export const chromeStorageGet = keys => {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      return reject(new Error('Chrome storage API not available.'));
    }
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
export const chromeStorageSet = items => {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      return reject(new Error('Chrome storage API not available.'));
    }
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
 * @param {HTMLElement} [options.errorElement] - DOM element to show error in (for current document context)
 * @param {HTMLElement} [options.specificErrorElement] - A specific DOM element to target, overrides errorElement if provided
 */
export const handleError = (message, options = {}) => {
  const {
    userVisible = true,
    timeout = 5000,
    type = 'error',
    originalError = null,
    // Default errorElement assumes the calling document has an 'error-message' id
    errorElement = typeof document !== 'undefined'
      ? document.getElementById('error-message')
      : null,
  } = options;

  const consoleMethod = type === 'warning' ? 'warn' : type === 'info' ? 'info' : 'error';

  if (originalError) {
    console[consoleMethod](message, originalError.message, originalError.stack);
  } else {
    console[consoleMethod](message);
  }

  const targetElement = options.specificErrorElement || errorElement;

  if (userVisible && targetElement && typeof document !== 'undefined') {
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
    try {
      targetElement.style.backgroundColor = style.bgColor;
      targetElement.style.color = style.textColor;
      targetElement.style.borderColor = style.borderColor;
      targetElement.textContent = message;
      targetElement.classList.remove('hidden');
      setTimeout(() => {
        targetElement.classList.add('hidden');
      }, timeout);
    } catch (domError) {
      console.error('Error manipulating DOM in handleError:', domError);
    }
  } else if (userVisible && !targetElement) {
    console.warn(
      'handleError: userVisible is true, but no targetElement found or specified to display the error.'
    );
  }
};

/**
 * Displays an authentication-specific error message.
 * @param {string} message - The error message to display.
 * @param {HTMLElement} element - The HTML element where the error should be displayed.
 */
export const displayAuthError = (message, element) => {
  if (element && typeof document !== 'undefined') {
    try {
      element.textContent = message;
      element.classList.remove('hidden');
    } catch (domError) {
      console.error('Error manipulating DOM in displayAuthError:', domError);
    }
  } else {
    console.error(
      'Auth error display element not found or document not available for message:',
      message
    );
    handleError(message, { userVisible: true, type: 'error' });
  }
};

/**
 * Display a confirmation message to the user
 * @param {string} message - Message to display
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - How long to show message in ms (default: 2000)
 * @param {boolean} options.withButton - Whether to include a dismiss button (default: false)
 * @param {HTMLElement} [options.messageElement] - DOM element to show message in (for current document context)
 */
export const showConfirmationMessage = (message, options = {}) => {
  const {
    timeout = 2000,
    withButton = false,
    // Default messageElement assumes the calling document has a 'confirmation-message' id
    messageElement = typeof document !== 'undefined'
      ? document.getElementById('confirmation-message')
      : null,
  } = options;

  if (messageElement && typeof document !== 'undefined') {
    try {
      messageElement.classList.remove('hidden');
      if (withButton) {
        messageElement.innerHTML = `${escapeHTML(message)} <button class="dismiss-btn">OK</button>`;
        const dismissBtn = messageElement.querySelector('.dismiss-btn');
        if (dismissBtn) {
          dismissBtn.addEventListener('click', () => {
            messageElement.classList.add('hidden');
          });
        }
      } else {
        messageElement.textContent = escapeHTML(message);
      }
      // Only set timeout if not expecting a button click to dismiss
      if (!withButton) {
        setTimeout(() => {
          messageElement.classList.add('hidden');
        }, timeout);
      }
    } catch (domError) {
      console.error('Error manipulating DOM in showConfirmationMessage:', domError);
    }
  } else if (!messageElement) {
    console.warn('showConfirmationMessage: No messageElement found or specified.');
  }
};

/**
 * Highlights stars in a star rating container
 * @param {number} rating - The rating to highlight (1-5)
 * @param {HTMLElement} container - The container of star elements
 */
export const highlightStars = (rating, container) => {
  if (!container || typeof document === 'undefined') return;
  try {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
      const starValue = index + 1;
      const icon = star.querySelector('i');
      star.setAttribute('aria-checked', starValue <= rating ? 'true' : 'false');
      if (starValue <= rating) {
        star.classList.add('filled');
        if (icon) icon.className = 'fas fa-star';
      } else {
        star.classList.remove('filled');
        if (icon) icon.className = 'far fa-star';
      }
    });
  } catch (domError) {
    console.error('Error manipulating DOM in highlightStars:', domError);
  }
};

/**
 * Escapes HTML characters in a string.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
export const escapeHTML = str => {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'/]/g, s => {
    return (
      {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;', // '/' is not strictly necessary to escape for HTML, but often done.
      }[s] || s
    );
  });
};
