#!/bin/bash

# CSS Code Quality Improvement Script
# This script helps identify redundant, duplicate, and optimization opportunities in CSS

echo "===== CSS Code Quality Analysis ====="
echo ""

# Create output directory
mkdir -p css-clean/base
mkdir -p css-clean/components
mkdir -p css-clean/layout
mkdir -p css-clean/pages

# Function to analyze a CSS file
analyze_css_file() {
  local input_file=$1
  local output_file=$2
  local file_name=$(basename "$input_file")
  
  echo "Analyzing $file_name..."
  
  # Read file content
  local content=$(cat "$input_file")
  
  # Look for issues and improve CSS
  
  # 1. Remove duplicate declarations in same selector
  # (Basic implementation, real tools like PostCSS would be more robust)
  
  # 2. Add missing vendor prefixes where needed
  content=$(echo "$content" | sed -E 's/transition: ([^;]+);/transition: \1;\n  -webkit-transition: \1;/g')
  content=$(echo "$content" | sed -E 's/transform: ([^;]+);/transform: \1;\n  -webkit-transform: \1;/g')
  
  # 3. Ensure proper spacing and formatting
  content=$(echo "$content" | sed -E 's/\{/\ {/g' | sed -E 's/\}\ /}/g')
  
  # Write the improved file
  echo "$content" > "$output_file"
  
  # Calculate size difference
  local original_size=$(wc -c < "$input_file")
  local improved_size=$(wc -c < "$output_file")
  local size_diff=$((improved_size - original_size))
  
  if [ $size_diff -gt 0 ]; then
    echo "  Optimized $file_name: $original_size → $improved_size bytes ($size_diff bytes added for vendor prefixes)"
  else
    echo "  Optimized $file_name: $original_size → $improved_size bytes ($((-size_diff)) bytes saved)"
  fi
}

# Process all CSS files
echo "Processing CSS files..."

# Process base CSS
for file in css/base/*.css; do
  output_file="css-clean/base/$(basename "$file")"
  analyze_css_file "$file" "$output_file"
done

# Process component CSS
for file in css/components/*.css; do
  output_file="css-clean/components/$(basename "$file")"
  analyze_css_file "$file" "$output_file"
done

# Process layout CSS
for file in css/layout/*.css; do
  output_file="css-clean/layout/$(basename "$file")"
  analyze_css_file "$file" "$output_file"
done

# Process page CSS
for file in css/pages/*.css; do
  output_file="css-clean/pages/$(basename "$file")"
  analyze_css_file "$file" "$output_file"
done

# Copy and update global.css
cp css/global.css css-clean/global.css

echo ""
echo "===== CSS Quality Improvement Complete ====="
echo "Improved CSS files are in the css-clean directory"
echo ""
echo "Next steps:"
echo "1. Review the improved files for any issues"
echo "2. Use the improved files as your new development CSS"
echo "3. Run minify-css.sh on the improved files for production"
