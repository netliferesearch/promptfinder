/**
 * CSS Class Helper for PromptFinder
 *
 * This script applies the modular CSS classes to elements in the DOM.
 */

document.addEventListener('DOMContentLoaded', function () {
  // Apply button classes
  document.querySelectorAll('button:not([class*="button-"])').forEach(button => {
    // Skip buttons that already have the right classes
    if (button.classList.contains('button')) return;

    // Determine button type
    if (button.type === 'submit' || button.id === 'add-prompt-button') {
      button.classList.add('button', 'button-primary');
    } else if (button.id === 'delete-prompt-button') {
      button.classList.add('button', 'button-danger');
    } else if (
      button.id === 'cancel-add-prompt' ||
      button.textContent.includes('Cancel') ||
      button.textContent.includes('Close')
    ) {
      button.classList.add('button', 'button-cancel');
    } else {
      button.classList.add('button', 'button-secondary');
    }
  });

  // Apply form input classes
  document.querySelectorAll('input[type="text"], textarea').forEach(input => {
    if (input.type === 'text') {
      input.classList.add('form-input');
    } else if (input.tagName.toLowerCase() === 'textarea') {
      input.classList.add('form-textarea');
    }
  });

  // Apply form group structure
  document.querySelectorAll('label').forEach(label => {
    if (!label.getAttribute('for')) return;

    const input = document.getElementById(label.getAttribute('for'));
    if (!input) return;

    const parent = input.parentElement;
    if (!parent) return;

    parent.classList.add('form-group');
    label.classList.add('form-label');
  });
});
