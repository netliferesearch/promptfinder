// CSS Migration Helper Script
// This script will help with migrating the old CSS to the new modular CSS structure

document.addEventListener('DOMContentLoaded', function () {
  // Add the old CSS files as fallbacks during transition
  // This ensures the extension keeps working while we're migrating
  // const oldCssFiles = ['popup.css']; // These are file names
  // Note: add-prompt.css and edit-prompt.css have been removed as those pages are now integrated into the main UI
  const head = document.querySelector('head');

  // Always include popup.css as all functionality is now integrated into the main UI
  const cssToInclude = '../css/pages/popup.css'; // Default for all pages

  // Only include the specific old CSS file that's relevant for this page
  const fallbackLink = document.createElement('link');
  fallbackLink.rel = 'stylesheet';
  fallbackLink.href = cssToInclude;
  fallbackLink.dataset.fallback = 'true';
  head.appendChild(fallbackLink);

  // Function to check for CSS issues
  function checkCssIssues() {
    // Check if our new CSS classes are being applied correctly
    const elementsToCheck = [
      { selector: '.pf-header', property: 'background-color' },
      { selector: 'form input', property: 'border-radius' },
      { selector: '.form-buttons button', property: 'border-radius' },
    ];

    elementsToCheck.forEach(item => {
      const element = document.querySelector(item.selector);
      if (element) {
        // const computedStyle = window.getComputedStyle(element);
        // console.log(`${item.selector} ${item.property}: ${computedStyle[item.property]}`);
      } else {
        // console.log(`Element not found: ${item.selector}`);
      }
    });

    // The results can be manually checked to ensure the new CSS is being applied
  }

  // Run the check after a slight delay
  setTimeout(checkCssIssues, 1000);
});
