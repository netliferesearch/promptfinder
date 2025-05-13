// popup.js

document.addEventListener('DOMContentLoaded', () => {
  // Initialize using our modular structure
  window.PromptFinder.UI.initializeUI();

  // All functionality has been migrated to the modular structure

  // Temporary test listener moved inside DOMContentLoaded
  document.body.addEventListener('click', function (event) {
    if (event.target.tagName === 'I' && event.target.classList.contains('fa')) {
      // console.log('Direct click on FA i tag detected!', event.target);
    }
  });

  // console.info('PromptFinder extension initialized via modular architecture');
}); // End of DOMContentLoaded listener
