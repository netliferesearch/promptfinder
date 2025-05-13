#!/bin/bash

# CSS cleanup script for PromptFinder
# This script helps complete the migration to the new modular CSS structure

echo "Starting CSS cleanup process..."

# Create backup of original CSS files
echo "Creating backups of original CSS files..."
mkdir -p css_backup
cp popup.css css_backup/popup.css.bak
cp add-prompt.css css_backup/add-prompt.css.bak
cp edit-prompt.css css_backup/edit-prompt.css.bak

# Remove the fallback CSS includes from HTML files
echo "Updating HTML files to remove fallback CSS references..."
sed -i '' 's/<!-- Fallback CSS for migration period -->//' popup.html add-prompt.html edit-prompt.html
sed -i '' 's/<link rel="stylesheet" data-fallback="true" href=".*\.css" \/>//' popup.html add-prompt.html edit-prompt.html

# Remove the CSS migration helper script
echo "Removing migration helper references..."
sed -i '' 's/<script src="js\/css-migration-helper\.js"><\/script>//' popup.html add-prompt.html edit-prompt.html

# Remove old CSS files (only after confirming migration is complete)
echo "Do you want to remove the old CSS files? (y/n)"
read answer
if [ "$answer" = "y" ]; then
  echo "Removing old CSS files..."
  rm popup.css add-prompt.css edit-prompt.css
  echo "Old CSS files removed."
else
  echo "Old CSS files preserved. Remove them manually when ready."
fi

# Update CSS class helper
echo "Updating CSS class helper to final version..."
cat > js/css-class-helper.js << 'EOL'
/**
 * CSS Class Helper for PromptFinder
 * 
 * This script applies the modular CSS classes to elements in the DOM.
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('CSS Class Helper loaded');
  
  // Apply button classes
  document.querySelectorAll('button:not([class*="button-"])').forEach(button => {
    // Skip buttons that already have the right classes
    if (button.classList.contains('button')) return;
    
    // Determine button type
    if (button.type === 'submit' || button.id === 'add-prompt-button') {
      button.classList.add('button', 'button-primary');
    } else if (button.id === 'delete-prompt-button') {
      button.classList.add('button', 'button-danger');
    } else if (button.id === 'cancel-add-prompt' || button.textContent.includes('Cancel') || button.textContent.includes('Close')) {
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
EOL

echo "CSS cleanup complete!"
echo "Please check your application to ensure it's working correctly."