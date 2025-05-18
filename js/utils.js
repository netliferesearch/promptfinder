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
 * Centralized error/message handling function
 * @param {string} messageOrHtml - The message (text or HTML) to display
 * @param {Object} options - Configuration options
 * @param {boolean} options.userVisible - Whether to show to user (default: true)
 * @param {number} options.timeout - How long to show in ms (default: 5000 for errors, 0 for info with link)
 * @param {'error'|'warning'|'info'} options.type - Type of message (default: 'error')
 * @param {Error} [options.originalError] - Original error object for logging
 * @param {HTMLElement} [options.specificErrorElement] - DOM element to show message in
 * @param {boolean} [options.isHtml] - Whether messageOrHtml is HTML (default: false)
 * @param {string} [options.linkId] - ID of element within HTML to make clickable
 * @param {Function} [options.onClickAction] - Function to call on link click
 */
export const handleError = (messageOrHtml, options = {}) => {
  const defaultTimeout = options.type === 'info' && options.linkId ? 0 : 5000; // No auto-hide for info with link
  const {
    userVisible = true,
    timeout = defaultTimeout,
    type = 'error',
    originalError = null,
    specificErrorElement = typeof document !== 'undefined'
      ? document.getElementById('error-message')
      : null,
    isHtml = false,
    linkId = null,
    onClickAction = null,
  } = options;

  const consoleMethod = type === 'warning' ? 'warn' : type === 'info' ? 'info' : 'error';

  if (originalError) {
    console[consoleMethod](messageOrHtml, originalError.message, originalError.stack);
  } else {
    console[consoleMethod](messageOrHtml);
  }

  const targetElement = specificErrorElement;

  if (userVisible && targetElement && typeof document !== 'undefined') {
    const typeStyles = {
      error: { bgColor: '#f8d7da', textColor: '#721c24', borderColor: '#f5c6cb' },
      warning: { bgColor: '#fff3cd', textColor: '#856404', borderColor: '#ffeeba' },
      info: { bgColor: '#d1ecf1', textColor: '#0c5460', borderColor: '#bee5eb' },
    };
    const style = typeStyles[type] || typeStyles.error;
    try {
      targetElement.style.backgroundColor = style.bgColor;
      targetElement.style.color = style.textColor;
      targetElement.style.borderColor = style.borderColor;
      targetElement.style.padding = 'var(--spacing-sm, 8px)'; // Ensure padding
      targetElement.style.marginBottom = 'var(--spacing-md, 16px)'; // Ensure margin
      targetElement.style.borderRadius = 'var(--border-radius-md, 16px)';

      if (isHtml) {
        targetElement.innerHTML = messageOrHtml;
        if (linkId && onClickAction) {
          const linkElement = targetElement.querySelector(`#${linkId}`);
          if (linkElement) {
            linkElement.addEventListener('click', e => {
              e.preventDefault();
              onClickAction();
              targetElement.classList.add('hidden');
              if (targetElement.dataset.messageTimeoutId) {
                clearTimeout(targetElement.dataset.messageTimeoutId);
                delete targetElement.dataset.messageTimeoutId;
              }
            });
          }
        }
      } else {
        targetElement.textContent = messageOrHtml;
      }

      targetElement.classList.remove('hidden');

      if (targetElement.dataset.messageTimeoutId) {
        clearTimeout(targetElement.dataset.messageTimeoutId);
      }

      if (timeout > 0) {
        // Only set timeout if it's greater than 0
        targetElement.dataset.messageTimeoutId = setTimeout(() => {
          targetElement.classList.add('hidden');
          delete targetElement.dataset.messageTimeoutId;
        }, timeout);
      }
    } catch (domError) {
      console.error('Error manipulating DOM in handleError:', domError);
    }
  } else if (userVisible && !targetElement) {
    console.warn('handleError: userVisible is true, but no targetElement found or specified.');
  }
};

/**
 * Displays an authentication-specific error message in a dedicated auth error element.
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
    console.error('Auth error display element not found. Message:', message);
    // Fallback to general handleError if no specific element provided for auth error
    handleError(message, { userVisible: true, type: 'error' });
  }
};

// showConfirmationMessage might need similar enhancements if it's to contain links
// For now, keeping it simple for text-only confirmations.
export const showConfirmationMessage = (message, options = {}) => {
  const {
    timeout = 3000, // Defaulted to 3s, was 2s
    specificErrorElement = typeof document !== 'undefined'
      ? document.getElementById('confirmation-message')
      : null,
    type = 'success', // Default to success styling for confirmations
  } = options;

  // Re-using handleError's logic for styling and display if specificErrorElement is used.
  // This centralizes message display logic a bit more.
  if (specificErrorElement) {
    handleError(message, {
      specificErrorElement: specificErrorElement,
      type: type,
      timeout: timeout,
      userVisible: true,
    });
  } else {
    // Fallback or alternative display method if no specificErrorElement
    console.log('Confirmation:', message); // Simple console log if no element
  }
};

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
        '/': '&#x2F;',
      }[s] || s
    );
  });
};
