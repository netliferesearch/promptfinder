#!/bin/bash

# CSS Optimization & Minification Script for PromptFinder
# This script analyzes CSS usage and creates minified versions

echo "===== CSS Optimization & Minification ====="
echo ""

# Create necessary directories
echo "Creating directories for optimized CSS..."
mkdir -p css-min/base
mkdir -p css-min/components
mkdir -p css-min/layout
mkdir -p css-min/pages

# Create a report file
REPORT="css-optimization-report.txt"
echo "CSS Optimization Report" > $REPORT
echo "Generated: $(date)" >> $REPORT
echo "-----------------------------------" >> $REPORT
echo "" >> $REPORT

# Function to minify a CSS file
minify_css() {
  local input_file=$1
  local output_file=$2
  
  # Basic CSS minification:
  # 1. Remove comments
  # 2. Remove leading/trailing whitespace
  # 3. Remove spaces around braces, colons, semicolons
  # 4. Replace multiple spaces with single space
  cat "$input_file" | \
    sed -e '/\/\*.*\*\//d' \
        -e 's/^[ \t]*//g' \
        -e 's/[ \t]*$//g' \
        -e 's/  */ /g' \
        -e 's/{ /{/g' \
        -e 's/ {/{/g' \
        -e 's/} /}/g' \
        -e 's/ }/}/g' \
        -e 's/; /;/g' \
        -e 's/: /:/g' > "$output_file"
  
  # Calculate size reduction
  local original_size=$(wc -c < "$input_file")
  local minified_size=$(wc -c < "$output_file")
  local reduction=$(echo "scale=2; ($original_size - $minified_size) / $original_size * 100" | bc)
  
  echo "Minified $(basename "$input_file"): ${original_size} → ${minified_size} bytes (${reduction}% reduction)"
  echo "$(basename "$input_file"): ${original_size} → ${minified_size} bytes (${reduction}% reduction)" >> $REPORT
}

# Function to identify unused rules in a file
analyze_css_file() {
  local file=$1
  local filename=$(basename "$file")
  
  echo "" >> $REPORT
  echo "## Potential optimizations for $filename:" >> $REPORT
  
  # Find potentially unused classes based on simple patterns
  # This is a basic heuristic and will need manual review
  
  # Look for classes that appear to be one-offs (good candidates for consolidation)
  local unique_patterns=$(grep -o '^\.[a-zA-Z0-9_-]*--[a-zA-Z0-9_-]*' "$file" | sort | uniq)
  local unique_count=$(echo "$unique_patterns" | grep -v "^$" | wc -l | xargs)
  
  if [ "$unique_count" -gt 0 ]; then
    echo "  * Found $unique_count potential one-off utility classes:" >> $REPORT
    echo "$unique_patterns" | sed 's/^/    - /' >> $REPORT
    echo "" >> $REPORT
  fi
  
  # Look for duplicated property patterns (candidates for variables)
  local color_values=$(grep -o '#[0-9a-fA-F]\{3,6\}' "$file" | sort)
  local color_dupes=$(echo "$color_values" | uniq -d)
  local color_dupe_count=$(echo "$color_dupes" | grep -v "^$" | wc -l | xargs)
  
  if [ "$color_dupe_count" -gt 0 ]; then
    echo "  * Found $color_dupe_count hardcoded colors used multiple times:" >> $REPORT
    echo "$color_dupes" | sed 's/^/    - /' >> $REPORT
    echo "    Consider replacing with CSS variables" >> $REPORT
    echo "" >> $REPORT
  fi
}

echo "Analyzing and minifying CSS files..."

# Process each CSS directory
for dir in base components layout pages; do
  echo ""
  echo "Processing $dir CSS files..."
  for file in css/$dir/*.css; do
    # Analyze the file
    analyze_css_file "$file"
    
    # Minify the file
    output_file="css-min/$dir/$(basename "$file")"
    minify_css "$file" "$output_file"
  done
done

# Create minified global.css that imports all minified files
echo "Creating minified global.css..."

# Copy the original global.css but update paths to point to minified versions
sed 's/\.\/base/\.\/base/g; s/\.\/components/\.\/components/g; s/\.\/layout/\.\/layout/g;' css/global.css > css-min/global.css

# Final statistics
TOTAL_ORIG_SIZE=$(find css -name "*.css" -type f -exec wc -c {} \; | awk '{total += $1} END {print total}')
TOTAL_MIN_SIZE=$(find css-min -name "*.css" -type f -exec wc -c {} \; | awk '{total += $1} END {print total}')
TOTAL_REDUCTION=$(echo "scale=2; ($TOTAL_ORIG_SIZE - $TOTAL_MIN_SIZE) / $TOTAL_ORIG_SIZE * 100" | bc)

echo ""
echo "===== Optimization Complete ====="
echo "Original CSS size: $TOTAL_ORIG_SIZE bytes"
echo "Minified CSS size: $TOTAL_MIN_SIZE bytes"
echo "Total reduction: $TOTAL_REDUCTION%"
echo ""
echo "Minified CSS files are in the css-min directory"
echo "See $REPORT for optimization suggestions"
echo ""
echo "To use minified CSS in production:"
echo "1. Update HTML files to point to css-min/ instead of css/"
echo "2. Or use the switch-css-env.sh script to switch between dev/prod versions"
