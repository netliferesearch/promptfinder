/**
 * PromptFinder Extension - Utility Functions
 * Contains shared utility functions for the extension.
 */

/**
 * Centralized error/message handling function
 * @param {string} messageOrHtml - The message (text or HTML) to display
 * @param {Object} options - Configuration options
 * @param {boolean} options.userVisible - Whether to show to user (default: true)
 * @param {number} options.timeout - How long to show in ms (default: 5000 for errors, 0 for info with link)
 * @param {'error'|'warning'|'info'|'success'} options.type - Type of message (default: 'error')
 * @param {Error} [options.originalError] - Original error object for logging
 * @param {HTMLElement} [options.specificErrorElement] - DOM element to show message in
 * @param {boolean} [options.isHtml] - Whether messageOrHtml is HTML (default: false)
 * @param {string} [options.linkId] - ID of element within HTML to make clickable
 * @param {Function} [options.onClickAction] - Function to call on link click
 */
export const handleError = (messageOrHtml, options = {}) => {
  const defaultTimeout =
    options.type === 'info' && options.linkId ? 0 : options.type === 'success' ? 3000 : 5000;
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
  // If no specificErrorElement and toast is available, use toast for user-visible errors
  if (
    userVisible &&
    !specificErrorElement &&
    typeof window !== 'undefined' &&
    typeof window.showToast === 'function'
  ) {
    window.showToast(messageOrHtml, { type, duration: timeout });
    return;
  }

  let consoleMethod = console.error; // Default to error
  if (type === 'warning') {
    consoleMethod = console.warn;
  } else if (type === 'info' || type === 'success') {
    consoleMethod = console.info; // Use console.info for success and info types
  }

  if (originalError) {
    consoleMethod(messageOrHtml, originalError.message, originalError.stack);
  } else {
    consoleMethod(messageOrHtml);
  }

  const targetElement = specificErrorElement;

  if (userVisible && targetElement && typeof document !== 'undefined') {
    const typeStyles = {
      error: { bgColor: '#f8d7da', textColor: '#721c24', borderColor: '#f5c6cb' },
      warning: { bgColor: '#fff3cd', textColor: '#856404', borderColor: '#ffeeba' },
      info: { bgColor: '#d1ecf1', textColor: '#0c5460', borderColor: '#bee5eb' },
      success: { bgColor: '#d4edda', textColor: '#155724', borderColor: '#c3e6cb' }, // Added success style
    };
    const style = typeStyles[type] || typeStyles.error;
    try {
      targetElement.style.backgroundColor = style.bgColor;
      targetElement.style.color = style.textColor;
      targetElement.style.borderColor = style.borderColor;
      targetElement.style.padding = 'var(--spacing-sm, 8px)';
      targetElement.style.marginBottom = 'var(--spacing-md, 16px)';
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
    handleError(message, { userVisible: true, type: 'error' });
  }
};

export const showConfirmationMessage = (message, options = {}) => {
  // Use toast if available, otherwise fallback to old method
  if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    window.showToast(message, { type: 'success', duration: options.timeout || 3000 });
  } else {
    const {
      timeout = 3000,
      specificErrorElement = typeof document !== 'undefined'
        ? document.getElementById('confirmation-message')
        : null,
      type = 'success',
    } = options;
    if (specificErrorElement) {
      handleError(message, {
        specificErrorElement: specificErrorElement,
        type: type,
        timeout: timeout,
        userVisible: true,
      });
    } else {
      console.info('Confirmation:', message);
    }
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
