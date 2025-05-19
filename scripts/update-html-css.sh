#!/bin/bash
# This script updates all HTML files to use consolidated CSS

set -e

# Directory containing HTML files
PAGES_DIR="pages"

# Function to update HTML file
update_html_file() {
  local file="$1"
  echo "Updating $file..."
  
  # Create a temporary file
  local tmp_file="$file.tmp"
  
  # Replace multiple CSS links with consolidated ones
  cat "$file" | sed '
    # Remove all individual CSS imports
    /<link rel="stylesheet" href="..\/css\/base\//d;
    /<link rel="stylesheet" href="..\/css\/components\//d;
    /<link rel="stylesheet" href="..\/css\/layout\//d;
    
    # Replace global CSS with consolidated ones 
    /<link rel="stylesheet" href="..\/css\/global.css"/c\
    <link rel="stylesheet" href="../css/base.css" />\
    <link rel="stylesheet" href="../css/components.css" />\
    <link rel="stylesheet" href="../css/layout.css" />
  ' > "$tmp_file"
  
  # Replace the original file
  mv "$tmp_file" "$file"
  
  echo "Updated $file successfully"
}

# Process all HTML files
for html_file in "$PAGES_DIR"/*.html; do
  update_html_file "$html_file"
done

echo "All HTML files updated to use consolidated CSS"
