#!/bin/bash

# Advanced CSS Optimization Script for PromptFinder
# This script analyzes and optimizes CSS files by identifying unused rules

echo "Starting advanced CSS optimization process..."

# Create optimization directory
mkdir -p css-optimized/base
mkdir -p css-optimized/components
mkdir -p css-optimized/layout
mkdir -p css-optimized/pages

# Create an analysis report file
report_file="css-optimization-report.md"
echo "# CSS Optimization Report" > "$report_file"
echo "" >> "$report_file"
echo "Generated on $(date)" >> "$report_file"
echo "" >> "$report_file"

# Function to analyze and optimize CSS by removing potentially unused selectors
analyze_css() {
  local file="$1"
  local basename=$(basename "$file")
  local out_dir=$(echo "$(dirname "$file")" | sed 's/css\//css-optimized\//')
  local optimized_file="$out_dir/$basename"
  local html_files="popup.html add-prompt.html edit-prompt.html"
  local js_files=$(find . -name "*.js" -not -path "./node_modules/*")
  
  echo "## $basename" >> "$report_file"
  echo "" >> "$report_file"
  
  # Extract all CSS selectors from the file (very basic extraction)
  local selectors=$(grep -oE '^\.[a-zA-Z][a-zA-Z0-9_-]+' "$file" | sort | uniq)
  local total_selectors=$(echo "$selectors" | wc -l | xargs)
  local unused_count=0
  local used_selectors=""
  
  echo "Total selectors found: $total_selectors" >> "$report_file"
  echo "" >> "$report_file"
  echo "### Potentially Unused Selectors" >> "$report_file"
  echo "" >> "$report_file"
  
  # Check each selector against HTML and JS files
  echo "$selectors" | while read -r selector; do
    if [[ -z "$selector" ]]; then continue; fi
    
    # Remove the leading dot for grep
    local class_name=${selector:1}
    
    # Check in HTML files
    local html_found=false
    for html in $html_files; do
      if grep -q "class="[^"]*$class_name" "$html" || \
         grep -q "classList.add(['"]$class_name['"]" "$html" || \
         grep -q "className.*=.*['"]$class_name['"]" "$html"; then
        html_found=true
        break
      fi
    done
    
    # Check in JS files if not found in HTML
    local js_found=false
    if [[ "$html_found" == "false" ]]; then
      for js in $js_files; do
        if grep -q "classList.add(['"]$class_name['"]" "$js" || \
           grep -q "className.*=.*['"]$class_name['"]" "$js" || \
           grep -q "class="[^"]*$class_name" "$js"; then
          js_found=true
          break
        fi
      done
    fi
    
    # If selector not found, mark as potentially unused
    if [[ "$html_found" == "false" && "$js_found" == "false" ]]; then
      echo "- \`$selector\`" >> "$report_file"
      unused_count=$((unused_count + 1))
    else
      used_selectors="$used_selectors$selector
"
    fi
  done
  
  # Calculate usage statistics
  local percent_unused=$(echo "scale=2; ($unused_count / $total_selectors) * 100" | bc)
  
  echo "" >> "$report_file"
  echo "**Statistics for $basename**:" >> "$report_file"
  echo "- Total selectors: $total_selectors" >> "$report_file"
  echo "- Potentially unused: $unused_count ($percent_unused%)" >> "$report_file"
  echo "" >> "$report_file"
  
  # Copy the original file (for now)
  # In a real optimization, you would create a new file without the unused selectors
  mkdir -p "$out_dir"
  cp "$file" "$optimized_file"
  
  # For simplicity, we'll just note the unused selectors in the report
  # A proper implementation would remove the selectors and their rules
  
  echo "Analyzed $basename - Found $unused_count potentially unused selectors ($percent_unused%)"
}

# Process all CSS files
process_directory() {
  local dir=$1
  
  find "$dir" -name "*.css" -type f | while read -r file; do
    analyze_css "$file"
  done
}

# Process each CSS directory
process_directory "css/base"
process_directory "css/components"
process_directory "css/layout"
process_directory "css/pages"

# Create the global.css file
cp css/global.css css-optimized/global.css

echo "CSS optimization analysis completed! See $report_file for details."
echo "Note: This script identifies potentially unused selectors but doesn't automatically remove them."
echo "Manual review of the report is recommended before removing any CSS rules."
