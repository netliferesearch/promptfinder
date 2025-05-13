#!/bin/bash

# CSS Optimization Script for PromptFinder
# This script helps identify and remove unused CSS rules

echo "CSS Optimization Tool"
echo "===================="
echo

# Directory for optimized CSS
OPTIMIZED_DIR="css-optimized"
REPORT_FILE="css-optimization-report.md"

# Ensure we're in the project root
if [ ! -d "css" ] || [ ! -f "popup.html" ]; then
  echo "Error: Please run this script from the project root directory"
  exit 1
fi

# Initialize report file
echo "# CSS Optimization Report" > "$REPORT_FILE"
echo "Generated on $(date)" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

# Create necessary directories
mkdir -p "$OPTIMIZED_DIR/base"
mkdir -p "$OPTIMIZED_DIR/components"
mkdir -p "$OPTIMIZED_DIR/layout"
mkdir -p "$OPTIMIZED_DIR/pages"

# Find all CSS classes used in HTML and JavaScript files
find_used_classes() {
  echo "Finding used CSS classes in HTML and JavaScript files..."
  
  # Extract classes from HTML files
  html_classes=$(grep -o 'class="[^"]*"' *.html | sed 's/class="//;s/"$//' | tr ' ' '\n')
  
  # Extract classes added via JavaScript (with some common patterns)
  js_classes=$(grep -o -E "classList.add\\(['\"]([^'\"]+)['\"]\\)" js/*.js popup.js add-prompt.js edit-prompt.js 2>/dev/null | sed 's/.*classList.add(//' | sed 's/).*//' | sed 's/["\']//g')
  js_classes2=$(grep -o -E "className\\s*=\\s*['\"]([^'\"]+)['\"]" js/*.js popup.js add-prompt.js edit-prompt.js 2>/dev/null | sed 's/.*className\s*=\s*//' | sed 's/["\']//g')
  
  # Combine all found classes
  echo -e "$html_classes\n$js_classes\n$js_classes2" | sort | uniq > used-classes.txt
  
  echo "Found $(wc -l < used-classes.txt) unique CSS classes in use"
}

# Analyze CSS file for unused selectors
analyze_css_file() {
  local file="$1"
  local output_file="$2"
  local used_file="used-classes.txt"
  local file_name=$(basename "$file")
  
  echo "Analyzing $file_name..."
  echo "## $file_name" >> "$REPORT_FILE"
  echo >> "$REPORT_FILE"
  
  # Extract class selectors from CSS file (basic extraction)
  local css_classes=$(grep -o -E '^\.[a-zA-Z0-9_-]+' "$file" | sed 's/^.//')
  local css_class_count=$(echo "$css_classes" | wc -l | xargs)
  
  echo "Total class selectors: $css_class_count" >> "$REPORT_FILE"
  echo >> "$REPORT_FILE"
  
  # Find unused classes
  echo "### Potentially Unused Classes" >> "$REPORT_FILE"
  echo >> "$REPORT_FILE"
  
  local unused_count=0
  
  # Create optimized version by copying original first
  cp "$file" "$output_file"
  
  # Process each CSS class
  for class in $css_classes; do
    if ! grep -q "^$class$" "$used_file"; then
      echo "- \`.$class\`" >> "$REPORT_FILE"
      unused_count=$((unused_count + 1))
      
      # Comment out the unused rule in the optimized file
      # This is a basic implementation and might need manual review
      sed -i '' "s/\.$class {/\/* UNUSED *\/ \.$class {/" "$output_file"
    fi
  done
  
  # Calculate usage statistics
  local percent_unused=0
  if [ $css_class_count -gt 0 ]; then
    percent_unused=$(echo "scale=2; $unused_count / $css_class_count * 100" | bc)
  fi
  
  echo >> "$REPORT_FILE"
  echo "**Summary for $file_name**:" >> "$REPORT_FILE"
  echo "- Total class selectors: $css_class_count" >> "$REPORT_FILE"
  echo "- Potentially unused: $unused_count ($percent_unused%)" >> "$REPORT_FILE"
  echo >> "$REPORT_FILE"
  
  echo "✓ Finished analyzing $file_name: Found $unused_count potentially unused classes"
}

# Find used classes first
find_used_classes

# Process each CSS directory
echo
echo "Analyzing CSS files..."

# Process base CSS
for file in css/base/*.css; do
  output_file="$OPTIMIZED_DIR/base/$(basename "$file")"
  analyze_css_file "$file" "$output_file"
done

# Process component CSS
for file in css/components/*.css; do
  output_file="$OPTIMIZED_DIR/components/$(basename "$file")"
  analyze_css_file "$file" "$output_file"
done

# Process layout CSS
for file in css/layout/*.css; do
  output_file="$OPTIMIZED_DIR/layout/$(basename "$file")"
  analyze_css_file "$file" "$output_file"
done

# Process page CSS
for file in css/pages/*.css; do
  output_file="$OPTIMIZED_DIR/pages/$(basename "$file")"
  analyze_css_file "$file" "$output_file"
done

# Copy global.css
cp css/global.css "$OPTIMIZED_DIR/global.css"

# Clean up
rm used-classes.txt

echo
echo "Optimization analysis complete!"
echo "- Optimized CSS files are in the $OPTIMIZED_DIR directory"
echo "- See $REPORT_FILE for details on potentially unused CSS classes"
echo
echo "Next steps:"
echo "1. Review the report to confirm which CSS classes are truly unused"
echo "2. Remove or comment out the verified unused CSS in the optimized files"
echo "3. Run minify-css.sh to create minified versions for production"
