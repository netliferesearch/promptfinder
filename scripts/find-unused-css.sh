#!/bin/bash

# CSS Usage Analyzer for PromptFinder
# This script identifies unused CSS classes in the codebase

echo "===== CSS Usage Analysis ====="
echo ""

# Create report file
REPORT="unused-css-report.txt"
echo "CSS Usage Analysis Report" > $REPORT
echo "Generated: $(date)" >> $REPORT
echo "-----------------------------------" >> $REPORT
echo "" >> $REPORT

# Extract CSS classes from HTML and JS files
echo "Extracting CSS classes from HTML and JS files..."

# From HTML files
HTML_CLASSES=$(grep -o 'class="[^"]*"' *.html | sed 's/class="//;s/"$//' | tr ' ' '\n' | sort | uniq)
HTML_CLASS_COUNT=$(echo "$HTML_CLASSES" | wc -l | xargs)
echo "Found $HTML_CLASS_COUNT unique classes in HTML files"

# From JS files (classList.add, className)
JS_CLASSES=$(grep -o -E "classList.add\(['\"][^'\"]+['\"]" *.js js/*.js 2>/dev/null | 
             sed "s/classList.add(['\"]//;s/['\"])*//" | sort | uniq)
JS_CLASS2=$(grep -o -E "className\s*=\s*['\"][^'\"]+['\"]" *.js js/*.js 2>/dev/null | 
            sed "s/.*className\s*=\s*['\"]//;s/['\"].*//" | sort | uniq)

# Combine all JS classes
ALL_JS_CLASSES=$(echo -e "$JS_CLASSES\n$JS_CLASS2" | sort | uniq)
JS_CLASS_COUNT=$(echo "$ALL_JS_CLASSES" | wc -l | xargs)
echo "Found $JS_CLASS_COUNT unique classes in JS files"

# Save all used classes
ALL_USED_CLASSES=$(echo -e "$HTML_CLASSES\n$ALL_JS_CLASSES" | sort | uniq)
USED_CLASS_COUNT=$(echo "$ALL_USED_CLASSES" | wc -l | xargs)
echo "Total: $USED_CLASS_COUNT unique used classes"
echo "$ALL_USED_CLASSES" > used-classes.txt

echo "" >> $REPORT
echo "## Used CSS Classes" >> $REPORT
echo "- HTML files: $HTML_CLASS_COUNT classes" >> $REPORT
echo "- JS files: $JS_CLASS_COUNT classes" >> $REPORT
echo "- Total unique: $USED_CLASS_COUNT classes" >> $REPORT
echo "" >> $REPORT

# Extract defined CSS classes from CSS files
echo ""
echo "Analyzing CSS files for defined classes..."

DEFINED_CLASSES=""
CSS_FILE_COUNT=0
TOTAL_CLASS_COUNT=0

echo "## CSS Class Analysis" >> $REPORT
echo "" >> $REPORT

# Process all CSS files
find css -name "*.css" -type f | while read -r css_file; do
  # Extract class selectors
  FILE_CLASSES=$(grep -o -E '^\.[a-zA-Z0-9_-]+' "$css_file" | sed 's/^\.//')
  FILE_CLASS_COUNT=$(echo "$FILE_CLASSES" | grep -v "^$" | wc -l | xargs)
  TOTAL_CLASS_COUNT=$((TOTAL_CLASS_COUNT + FILE_CLASS_COUNT))
  CSS_FILE_COUNT=$((CSS_FILE_COUNT + 1))
  
  # Add to defined classes
  DEFINED_CLASSES="$DEFINED_CLASSES
$FILE_CLASSES"
  
  # Report on file
  echo "### $(basename "$css_file") ($FILE_CLASS_COUNT classes)" >> $REPORT
  
  # Find potentially unused classes
  UNUSED_CLASSES=""
  UNUSED_COUNT=0
  
  while read -r class; do
    if [ -z "$class" ]; then continue; fi
    if ! grep -q "^$class$" used-classes.txt; then
      UNUSED_CLASSES="$UNUSED_CLASSES
$class"
      UNUSED_COUNT=$((UNUSED_COUNT + 1))
    fi
  done <<< "$FILE_CLASSES"
  
  if [ $UNUSED_COUNT -gt 0 ]; then
    echo "- Potentially unused classes: $UNUSED_COUNT" >> $REPORT
    echo "  ```" >> $REPORT
    echo "$UNUSED_CLASSES" | grep -v "^$" | sort | uniq | sed 's/^/  /' >> $REPORT
    echo "  ```" >> $REPORT
  fi
  
  echo "" >> $REPORT
done

# Calculate overall statistics
ALL_DEFINED_CLASSES=$(echo "$DEFINED_CLASSES" | sort | uniq | grep -v "^$")
DEFINED_CLASS_COUNT=$(echo "$ALL_DEFINED_CLASSES" | wc -l | xargs)

echo "$ALL_DEFINED_CLASSES" > defined-classes.txt

# Find all unused classes
UNUSED_CLASSES=""
UNUSED_COUNT=0

while read -r class; do
  if [ -z "$class" ]; then continue; fi
  if ! grep -q "^$class$" used-classes.txt; then
    UNUSED_CLASSES="$UNUSED_CLASSES
$class"
    UNUSED_COUNT=$((UNUSED_COUNT + 1))
  fi
done <<< "$ALL_DEFINED_CLASSES"

# Calculate usage percentage
USAGE_PERCENT=$(echo "scale=2; ($DEFINED_CLASS_COUNT - $UNUSED_COUNT) / $DEFINED_CLASS_COUNT * 100" | bc)

# Summary stats
echo "## Summary" >> $REPORT
echo "" >> $REPORT
echo "- Total CSS files: $CSS_FILE_COUNT" >> $REPORT
echo "- Total defined classes: $DEFINED_CLASS_COUNT" >> $REPORT
echo "- Total used classes: $USED_CLASS_COUNT" >> $REPORT
echo "- Potentially unused classes: $UNUSED_COUNT" >> $REPORT
echo "- CSS usage efficiency: $USAGE_PERCENT%" >> $REPORT
echo "" >> $REPORT

echo "## All Potentially Unused Classes" >> $REPORT
echo "" >> $REPORT
echo "```" >> $REPORT
echo "$UNUSED_CLASSES" | grep -v "^$" | sort | uniq >> $REPORT
echo "```" >> $REPORT

# Clean up
rm used-classes.txt defined-classes.txt

echo ""
echo "===== Analysis Complete ====="
echo "CSS files analyzed: $CSS_FILE_COUNT"
echo "Defined classes: $DEFINED_CLASS_COUNT"
echo "Used classes: $USED_CLASS_COUNT"
echo "Potentially unused classes: $UNUSED_COUNT"
echo "CSS usage efficiency: $USAGE_PERCENT%"
echo ""
echo "See $REPORT for detailed analysis and a list of potentially unused classes"
echo "Review unused classes carefully before removal - they might be dynamically generated"
