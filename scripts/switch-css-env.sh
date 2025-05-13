#!/bin/bash

# CSS Environment Switcher for PromptFinder
# This script switches between development and production CSS

echo "CSS Environment Switcher"
echo "======================="
echo

# Function to update CSS references in HTML files
update_css_refs() {
  local environment=$1
  local css_dir=$2
  local html_files=("popup.html" "add-prompt.html" "edit-prompt.html")
  
  for file in "${html_files[@]}"; do
    echo "Updating $file to use $environment CSS..."
    
    # Update the global.css reference
    sed -i '' "s|href=\"css/global.css\"|href=\"$css_dir/global.css\"|g" "$file"
    
    # Update page-specific CSS references
    local page_name=$(basename "$file" .html)
    sed -i '' "s|href=\"css/pages/$page_name.css\"|href=\"$css_dir/pages/$page_name.css\"|g" "$file"
    
    echo "✓ Updated $file"
  done
  
  echo "All HTML files updated to use $environment CSS!"
}

# Main menu
PS3="Select an option: "
options=("Switch to production CSS (minified)" "Switch to development CSS" "Cancel")
selected=""

select opt in "${options[@]}"; do
  case $opt in
    "Switch to production CSS (minified)")
      echo
      echo "Switching to production CSS..."
      
      # Check if minified CSS exists
      if [ ! -d "css-min" ]; then
        echo "Error: Minified CSS not found!"
        echo "Please run ./minify-css.sh first to create minified CSS."
        exit 1
      fi
      
      update_css_refs "production" "css-min"
      selected="production"
      break
      ;;
    "Switch to development CSS")
      echo
      echo "Switching to development CSS..."
      update_css_refs "development" "css"
      selected="development"
      break
      ;;
    "Cancel")
      echo
      echo "Operation cancelled."
      exit 0
      ;;
    *)
      echo "Invalid option. Please try again."
      ;;
  esac
done

# Create an indicator file to track the current CSS environment
echo "{\"environment\": \"$selected\", \"timestamp\": \"$(date)\"}" > css-environment.json

echo
echo "Done! PromptFinder is now using $selected CSS."
if [ "$selected" == "production" ]; then
  echo "Note: If you make changes to CSS, remember to run minify-css.sh again."
fi
