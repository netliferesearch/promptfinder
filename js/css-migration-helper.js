// CSS Migration Helper Script
// This script will help with migrating the old CSS to the new modular CSS structure

document.addEventListener('DOMContentLoaded', function () {
  console.log('CSS Migration Helper loaded');

  // Add the old CSS files as fallbacks during transition
  // This ensures the extension keeps working while we're migrating
  // const oldCssFiles = ['popup.css', 'add-prompt.css', 'edit-prompt.css']; // These are file names
  const head = document.querySelector('head');

  // Determine which old CSS file to include based on the current page
  const currentPage = window.location.pathname;
  let cssToInclude = '../css/pages/popup.css'; // Default

  if (currentPage.includes('add-prompt.html')) {
    cssToInclude = '../css/pages/add-prompt.css';
  } else if (currentPage.includes('edit-prompt.html')) {
    cssToInclude = '../css/pages/edit-prompt.css';
  }

  // Only include the specific old CSS file that's relevant for this page
  const fallbackLink = document.createElement('link');
  fallbackLink.rel = 'stylesheet';
  fallbackLink.href = cssToInclude;
  fallbackLink.dataset.fallback = 'true';
  head.appendChild(fallbackLink);

  // Function to check for CSS issues
  function checkCssIssues() {
    console.log('Checking for CSS migration issues...');

    // Check if our new CSS classes are being applied correctly
    const elementsToCheck = [
      { selector: '.pf-header', property: 'background-color' },
      { selector: 'form input', property: 'border-radius' },
      { selector: '.form-buttons button', property: 'border-radius' },
    ];

    let issuesDetected = false;

    elementsToCheck.forEach(item => {
      const element = document.querySelector(item.selector);
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        console.log(`${item.selector} ${item.property}: ${computedStyle[item.property]}`);
      } else {
        console.log(`Element not found: ${item.selector}`);
      }
    });

    // The results can be manually checked to ensure the new CSS is being applied
  }

  // Run the check after a slight delay
  setTimeout(checkCssIssues, 1000);
});
