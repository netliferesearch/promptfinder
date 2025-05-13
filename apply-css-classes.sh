#!/bin/bash

# CSS Class Application Script for PromptFinder
# This script updates HTML files to use our new CSS classes directly

echo "Starting CSS class application process..."

# Function to apply classes to common elements
apply_classes() {
  local file=$1
  
  # Add CSS classes feedback
  echo "Applying CSS classes to $file..."
  
  # Form elements
  sed -i '' 's/<div id="add-prompt-form">/<div id="add-prompt-form" class="form">/' $file
  sed -i '' 's/<div id="edit-prompt-form">/<div id="edit-prompt-form" class="form">/' $file
  
  # Form groups - won't catch all, but gets many common patterns
  sed -i '' 's/<div>\s*<label for="prompt-title">/<div class="form-group"><label class="form-label" for="prompt-title">/' $file
  sed -i '' 's/<div>\s*<label for="prompt-text">/<div class="form-group"><label class="form-label" for="prompt-text">/' $file
  sed -i '' 's/<div>\s*<label for="prompt-category">/<div class="form-group"><label class="form-label" for="prompt-category">/' $file
  sed -i '' 's/<div>\s*<label for="prompt-tags">/<div class="form-group"><label class="form-label" for="prompt-tags">/' $file
  
  # Checkboxes
  sed -i '' 's/<div>\s*<input type="checkbox"/<div class="form-group form-group--row"><input class="form-checkbox" type="checkbox"/' $file
  
  # Buttons
  sed -i '' 's/<button type="submit">/<button type="submit" class="button button-primary">/' $file
  sed -i '' 's/<button type="button" id="cancel-add-prompt">/<button type="button" id="cancel-add-prompt" class="button button-cancel">/' $file
  sed -i '' 's/<button type="button" id="cancel-edit-prompt">/<button type="button" id="cancel-edit-prompt" class="button button-cancel">/' $file
  sed -i '' 's/<button type="button" id="delete-prompt-button">/<button type="button" id="delete-prompt-button" class="button button-danger">/' $file
  sed -i '' 's/<button id="add-prompt-button">/<button id="add-prompt-button" class="button button-primary">/' $file
  sed -i '' 's/<button id="filter-button">/<button id="filter-button" class="button button-secondary button-sm">/' $file
  sed -i '' 's/<button id="sort-button">/<button id="sort-button" class="button button-secondary button-sm">/' $file
  
  # Headers
  sed -i '' 's/class="pf-header"/class="pf-header"/' $file
  
  echo "Applied CSS classes to $file"
}

# Apply to all HTML files
apply_classes "popup.html"
apply_classes "add-prompt.html"
apply_classes "edit-prompt.html"

echo "CSS class application complete!"
echo ""
echo "Next steps:"
echo "1. Test the application to ensure all styles are applied correctly"
echo "2. When ready, run cleanup-css.sh to remove old CSS files"
