// purgecss.config.mjs
export default {
  content: [
    'pages/popup.html', // Specific file
  ],
  css: [
    'css/pages/popup.css', // Specific file
  ],
  safelist: {
    standard: [
      'active',
      'hidden',
      'button',
      'button-primary',
      'form-input',
      'pf-header',
      'controls',
      'actions',
      'add-prompt-bar',
      'confirmation-message',
      'error-message',
      'tabs',
      'cards-container',
      'filter-panel',
    ], // Keep a decent safelist
  },
  output: 'css-purged/specific-test/popup.css', // Specific output file
};
