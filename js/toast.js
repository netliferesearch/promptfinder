// Toast notification system for PromptFinder
// Usage: showToast('Message', { type: 'success'|'error'|'info', duration: ms })

window.showToast = function (message, { type = 'info', duration = 3000 } = {}) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  // Remove existing toasts if you want only one at a time
  container.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.tabIndex = 0;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" aria-label="Dismiss">&times;</button>
  `;

  // Dismiss logic
  toast.querySelector('.toast-close').onclick = () => {
    if (container.contains(toast)) container.removeChild(toast);
  };
  toast.onkeydown = e => {
    if (e.key === 'Escape') if (container.contains(toast)) container.removeChild(toast);
  };

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto-dismiss
  setTimeout(() => {
    if (container.contains(toast)) container.removeChild(toast);
  }, duration);
};
