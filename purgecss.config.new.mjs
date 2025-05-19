// filepath: /Users/tor-andershansen/Desktop/Projects/promptfinder/purgecss.config.mjs
// purgecss.config.mjs
export default {
  content: [
    'pages/*.html', // All HTML files in pages folder
    'js/*.js', // All JS files in js folder
    'app.js', // Main app.js
    'pages/*.js', // All JS files in pages folder
  ],
  css: [
    'css/global.css', // Global CSS file
    'css/pages/*.css', // Page-specific CSS files
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
    ],
    // Add patterns that should be kept
    patterns: [/^tab-/, /^card-/, /^form-/, /^btn-/, /^modal-/],
  },
  // Remove unused keyframes and fontfaces
  keyframes: true,
  fontFace: true,
  // Minimize the output CSS
  rejected: true, // Log removed selectors
  // Output CSS to the specified directory
  output: 'dist/css-purged/',
};
