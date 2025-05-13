#!/bin/bash

# CSS Optimization Script for PromptFinder
# This script creates minified versions of all CSS files

echo "Starting CSS optimization process..."

# Create necessary directories for optimized CSS
mkdir -p css-optimized/base
mkdir -p css-optimized/components
mkdir -p css-optimized/layout
mkdir -p css-optimized/pages

# Function to minify a CSS file using sed
minify_css() {
  local input_file=$1
  local output_file=$2
  
  # Basic CSS minification using sed:
  # - Remove comments
  # - Remove whitespace
  # - Consolidate multiple spaces
  sed -e 's!/\*.*\*/!!g' -e 's/^[ \t]*//g' -e 's/[ \t]*$//g' -e 's/  */ /g' -e 's/{ /{/g' -e 's/ {/{/g' -e 's/ }/}/g' -e 's/; /;/g' -e 's/: /:/g' "$input_file" > "$output_file"
  
  local original_size=$(stat -f%z "$input_file")
  local minified_size=$(stat -f%z "$output_file")
  local reduction=$(echo "scale=2; (1 - $minified_size / $original_size) * 100" | bc)
  
  echo "Minified $(basename $input_file): $original_size bytes → $minified_size bytes ($reduction% reduction)"
}

# Process all CSS files
find_and_minify() {
  local dir=$1
  local output_dir=$2
  
  find "$dir" -name "*.css" -type f | while read -r file; do
    # Get the relative path and create output path
    local base_name=$(basename "$file")
    local relative_path=${file#$dir/}
    local output_path="$output_dir/$relative_path"
    
    # Create containing directory if it doesn't exist
    mkdir -p "$(dirname "$output_path")"
    
    # Minify the file
    minify_css "$file" "$output_path"
  done
}

# Process all CSS directories
find_and_minify "css/base" "css-optimized/base"
find_and_minify "css/components" "css-optimized/components"
find_and_minify "css/layout" "css-optimized/layout"
find_and_minify "css/pages" "css-optimized/pages"

# Create optimized global.css that imports minified files
cat > css-optimized/global.css << EOL
/* Optimized global CSS file */
@import './base/variables.css';
@import './base/reset.css';
@import './base/utilities.css';
@import './components/forms.css';
@import './components/buttons.css';
@import './components/tabs.css';
@import './components/cards.css';
@import './layout/containers.css';
@import './layout/header.css';
EOL

echo "CSS optimization complete! Optimized CSS files are in the css-optimized directory."
echo "To use the optimized CSS, update your HTML files to reference css-optimized/ instead of css/"
