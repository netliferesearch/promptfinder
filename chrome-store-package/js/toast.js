// Toast notification system for PromptFinder
// Usage: showToast('Message', { type: 'success'|'error'|'info', duration: ms })

window.showToast = function (message, { type = 'info', duration = 3000 } = {}) {
  // For Chrome extension popup, ALWAYS use document.body to avoid hidden parent issues
  const targetParent = document.body;

  let container = document.getElementById('toast-container');

  // If container exists but is in wrong parent, move it or recreate it
  if (container) {
    const containerParent = container.parentElement;

    // If container is not in document.body, move it or recreate it
    if (containerParent !== targetParent) {
      container.remove();
      container = null; // Force recreation
    }
  }

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');

    // Use the most reliable positioning approach for Chrome extensions
    container.style.cssText = `
      position: fixed !important;
      top: 10px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      pointer-events: none !important;
      width: calc(100% - 40px) !important;
      max-width: 320px !important;
    `;

    targetParent.appendChild(container);
  }

  // Remove existing toasts if you want only one at a time
  container.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.tabIndex = 0;

  // Use inline styles to override any CSS issues
  toast.style.cssText = `
    min-width: 220px !important;
    max-width: 90vw !important;
    margin-top: 0.5rem !important;
    background: ${type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#1565c0'} !important;
    color: #fff !important;
    border-radius: 6px !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
    padding: 0.75rem 1.5rem 0.75rem 1rem !important;
    display: flex !important;
    align-items: center !important;
    font-size: 1rem !important;
    opacity: 0 !important;
    transform: translateY(-10px) !important;
    pointer-events: auto !important;
    transition: opacity 0.3s, transform 0.3s !important;
    outline: none !important;
    position: relative !important;
  `;

  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" aria-label="Dismiss" style="margin-left: 1rem; background: none; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; pointer-events: auto;">&times;</button>
  `;

  // Dismiss logic
  toast.querySelector('.toast-close').onclick = () => {
    if (container.contains(toast)) container.removeChild(toast);
  };
  toast.onkeydown = e => {
    if (e.key === 'Escape') if (container.contains(toast)) container.removeChild(toast);
  };

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Auto-dismiss
  setTimeout(() => {
    if (container.contains(toast)) {
      container.removeChild(toast);
    }
  }, duration);
};
