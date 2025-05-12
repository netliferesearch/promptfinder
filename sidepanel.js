/**
 * Sidebar panel script for PromptFinder extension
 * Handles initialization and sidebar-specific functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder sidebar panel initialized');
  
  window.PromptFinder.UI.initializeUI();
  
  setupSidebarListeners();
});

/**
 * Set up sidebar-specific event listeners
 */
function setupSidebarListeners() {
  window.addEventListener('resize', () => {
    adjustUIForSidebarWidth();
  });
  
  adjustUIForSidebarWidth();
}

/**
 * Adjust UI elements based on sidebar width
 */
function adjustUIForSidebarWidth() {
  const sidebarWidth = window.innerWidth;
  const container = document.querySelector('.sidebar-container');
  
  if (sidebarWidth < 350) {
    container.classList.add('narrow-sidebar');
    container.classList.remove('wide-sidebar');
  } else if (sidebarWidth > 500) {
    container.classList.add('wide-sidebar');
    container.classList.remove('narrow-sidebar');
  } else {
    container.classList.remove('narrow-sidebar', 'wide-sidebar');
  }
  
  console.log(`Sidebar width adjusted: ${sidebarWidth}px`);
}
