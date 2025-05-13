#!/bin/bash

# CSS finalization script for PromptFinder
# This script updates the HTML files to use new CSS classes directly

echo "Starting CSS finalization process..."

# === Popup.html === #
echo "Updating popup.html..."

# Update the header section
sed -i '' 's/class="pf-header"/class="pf-header"/' popup.html

# Update add prompt button
sed -i '' 's/id="add-prompt-button"/id="add-prompt-button" class="button button-primary"/' popup.html

# Update filter/sort buttons
sed -i '' 's/id="filter-button"/id="filter-button" class="button button-secondary button-sm"/' popup.html
sed -i '' 's/id="sort-button"/id="sort-button" class="button button-secondary button-sm"/' popup.html

# === Add-prompt.html === #
echo "Updating add-prompt.html..."

# Update form elements
sed -i '' 's/id="prompt-title"/id="prompt-title" class="form-input"/' add-prompt.html
sed -i '' 's/id="prompt-text"/id="prompt-text" class="form-textarea"/' add-prompt.html
sed -i '' 's/id="prompt-category"/id="prompt-category" class="form-input"/' add-prompt.html
sed -i '' 's/id="prompt-tags"/id="prompt-tags" class="form-input"/' add-prompt.html

# Update form buttons
sed -i '' 's/<button type="submit">/<button type="submit" class="button button-primary">/' add-prompt.html
sed -i '' 's/id="cancel-add-prompt"/id="cancel-add-prompt" class="button button-cancel"/' add-prompt.html

# === Edit-prompt.html === #
echo "Updating edit-prompt.html..."

# Update form elements
sed -i '' 's/id="prompt-title"/id="prompt-title" class="form-input"/' edit-prompt.html
sed -i '' 's/id="prompt-text"/id="prompt-text" class="form-textarea"/' edit-prompt.html
sed -i '' 's/id="prompt-category"/id="prompt-category" class="form-input"/' edit-prompt.html
sed -i '' 's/id="prompt-tags"/id="prompt-tags" class="form-input"/' edit-prompt.html

# Update form buttons
sed -i '' 's/<button type="submit">/<button type="submit" class="button button-primary">/' edit-prompt.html
sed -i '' 's/id="cancel-edit-prompt"/id="cancel-edit-prompt" class="button button-cancel"/' edit-prompt.html
sed -i '' 's/id="delete-prompt-button"/id="delete-prompt-button" class="button button-danger"/' edit-prompt.html

echo "CSS finalization complete!"
