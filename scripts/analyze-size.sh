#!/bin/bash
# Script to optimize the final extension package and analyze size

set -e

EXTENSION_ZIP="promptfinder.zip"
PACKAGE_DIR="package"
ANALYSIS_DIR="size-analysis"

# Check if the extension zip exists
if [ ! -f "$EXTENSION_ZIP" ]; then
  echo "Extension package $EXTENSION_ZIP not found. Run 'npm run package' first."
  exit 1
fi

# Create analysis directory
mkdir -p "$ANALYSIS_DIR"

# Output file sizes before optimization
echo "Size analysis before optimization:"
du -h "$EXTENSION_ZIP" | tee "$ANALYSIS_DIR/before-size.txt"

# Get file sizes breakdown
echo "\nFile size breakdown:" | tee -a "$ANALYSIS_DIR/before-size.txt"
unzip -l "$EXTENSION_ZIP" | sort -nrk 1 | head -20 | tee -a "$ANALYSIS_DIR/before-size.txt"

# Special targets for optimization:
echo "\nMain optimization targets:" | tee "$ANALYSIS_DIR/optimization-targets.txt"
echo "1. JS files - Combined size" | tee -a "$ANALYSIS_DIR/optimization-targets.txt"
du -ch "$PACKAGE_DIR/js/"*.js "$PACKAGE_DIR/pages/"*.js | tee -a "$ANALYSIS_DIR/optimization-targets.txt"

echo "2. CSS files - Combined size" | tee -a "$ANALYSIS_DIR/optimization-targets.txt"
du -ch "$PACKAGE_DIR/css/"*.css | tee -a "$ANALYSIS_DIR/optimization-targets.txt"

echo "3. Images - Combined size" | tee -a "$ANALYSIS_DIR/optimization-targets.txt"
du -ch "$PACKAGE_DIR/icons/"*.png | tee -a "$ANALYSIS_DIR/optimization-targets.txt"

# Check the HTML file sizes
echo "4. HTML files - Combined size" | tee -a "$ANALYSIS_DIR/optimization-targets.txt"
du -ch "$PACKAGE_DIR/pages/"*.html | tee -a "$ANALYSIS_DIR/optimization-targets.txt"

echo "\nComplete size analysis saved to $ANALYSIS_DIR directory"

# Suggestions for further optimization
echo "\nSuggestions for further optimization:" | tee "$ANALYSIS_DIR/optimization-suggestions.txt"

# Check if Firebase SDK is large
FIREBASE_SIZE=$(du -h "$PACKAGE_DIR/js/firebase-init.js" | cut -f1)
echo "1. Firebase SDK size: $FIREBASE_SIZE" | tee -a "$ANALYSIS_DIR/optimization-suggestions.txt"
echo "   Consider using Firebase SDK lite versions or lazy loading Firebase components" | tee -a "$ANALYSIS_DIR/optimization-suggestions.txt"

# Check if there are large JS libraries
echo "2. Large JS libraries in the bundle:" | tee -a "$ANALYSIS_DIR/optimization-suggestions.txt"
for js_file in "$PACKAGE_DIR/js/"*.js "$PACKAGE_DIR/pages/"*.js; do
  if [ -f "$js_file" ]; then
    SIZE=$(du -h "$js_file" | cut -f1)
    echo "   - $(basename "$js_file"): $SIZE" | tee -a "$ANALYSIS_DIR/optimization-suggestions.txt"
    
    # Check for specific libraries in the JS files
    for lib in "firebase" "lodash" "jquery" "moment" "prismjs"; do
      if grep -q "$lib" "$js_file"; then
        echo "     * Contains $lib library - consider tree shaking or lazy loading" | tee -a "$ANALYSIS_DIR/optimization-suggestions.txt"
      fi
    done
  fi
done

# Check if there are large icon files
echo "3. Image optimization:" | tee -a "$ANALYSIS_DIR/optimization-suggestions.txt"
for img in "$PACKAGE_DIR/icons/"*.png; do
  if [ -f "$img" ]; then
    SIZE=$(du -h "$img" | cut -f1)
    DIMENSIONS=$(identify -format "%wx%h" "$img" 2>/dev/null || echo "Unknown")
    echo "   - $(basename "$img"): $SIZE ($DIMENSIONS)" | tee -a "$ANALYSIS_DIR/optimization-suggestions.txt"
  fi
done

echo "\nOptimization analysis complete. See $ANALYSIS_DIR directory for details."
echo "You can run 'npm run package' again after making optimizations to see the difference."
