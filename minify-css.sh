#!/bin/bash

# CSS Minification Script for PromptFinder
# This script minifies all CSS files and creates a production-ready version

echo "Starting CSS minification process..."

# Create necessary directories
mkdir -p css-min/base
mkdir -p css-min/components
mkdir -p css-min/layout
mkdir -p css-min/pages

# Function to minify a CSS file
minify_css() {
  local input_file=$1
  local output_file=$2
  
  # Basic CSS minification using sed:
  # 1. Remove comments
  # 2. Remove leading/trailing whitespace from lines
  # 3. Replace multiple spaces with a single space
  # 4. Remove spaces before/after brackets, colons, semicolons
  cat "$input_file" | \
    sed -e 's!/\*[^*]*\*\+\([^/][^*]*\*\+\)*/!!g' \
        -e 's/^[ \t]*//g' \
        -e 's/[ \t]*$//g' \
        -e 's/  */ /g' \
        -e 's/{ /{/g' \
        -e 's/ {/{/g' \
        -e 's/} /}/g' \
        -e 's/ }/}/g' \
        -e 's/; /;/g' \
        -e 's/: /:/g' > "$output_file"
  
  # Calculate file size reduction
  local original_size=$(wc -c < "$input_file")
  local minified_size=$(wc -c < "$output_file")
  local reduction=$(echo "scale=2; ($original_size - $minified_size) / $original_size * 100" | bc)
  
  echo "Minified $(basename "$input_file"): $original_size → $minified_size bytes ($reduction% reduction)"
}

# Process CSS files in each directory
echo "Processing base CSS files..."
for file in css/base/*.css; do
  minify_css "$file" "css-min/base/$(basename "$file")"
done

echo "Processing component CSS files..."
for file in css/components/*.css; do
  minify_css "$file" "css-min/components/$(basename "$file")"
done

echo "Processing layout CSS files..."
for file in css/layout/*.css; do
  minify_css "$file" "css-min/layout/$(basename "$file")"
done

echo "Processing page CSS files..."
for file in css/pages/*.css; do
  minify_css "$file" "css-min/pages/$(basename "$file")"
done

# Create a minified global.css
echo "Creating minified global.css..."
minify_css "css/global.css" "css-min/global.css"

# Create a README file in the minified directory
cat > css-min/README.md << 'EOL'
# PromptFinder Minified CSS

This directory contains minified versions of the CSS files for production use.
The CSS structure is preserved but files have been optimized to reduce file size.

## Directory Structure
- `/base`: Foundation styles (variables, reset, utilities)
- `/components`: Reusable UI components (buttons, forms, etc.)
- `/layout`: Layout structures
- `/pages`: Page-specific styles
- `global.css`: Main CSS entry point

## Updating

When making changes to CSS, always modify the original files in the `/css` directory,
then run the minification script again to update these files.
EOL

echo "CSS minification complete! Minified CSS files are in the css-min directory."
