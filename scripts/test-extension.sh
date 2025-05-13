#!/bin/zsh

# PromptFinder Extension Testing Script
# This script performs basic validation of the extension files

echo "===== PromptFinder Extension Test ====="
echo "Running tests on $(date)"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARNING_COUNT=0

# Function to report test outcomes
report_test() {
  local result=$1
  local message=$2
  
  if [[ "$result" == "PASS" ]]; then
    echo "✅ PASS: $message"
    PASS_COUNT=$((PASS_COUNT + 1))
  elif [[ "$result" == "WARN" ]]; then
    echo "⚠️ WARNING: $message"
    WARNING_COUNT=$((WARNING_COUNT + 1))
  else
    echo "❌ FAIL: $message"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

echo "1. Checking required files..."

# Check manifest.json
if [[ -f "manifest.json" ]]; then
  report_test "PASS" "manifest.json exists"
  
  # Validate manifest.json content
  if grep -q "\"manifest_version\": 3" manifest.json; then
    report_test "PASS" "manifest.json uses manifest version 3"
  else
    report_test "WARN" "manifest.json may not use manifest version 3"
  fi
else
  report_test "FAIL" "manifest.json is missing"
fi

# Check HTML files
for html_file in "popup.html" "add-prompt.html" "edit-prompt.html"; do
  if [[ -f "$html_file" ]]; then
    report_test "PASS" "$html_file exists"
    
    # Check for malformed HTML
    if grep -q "</html>" "$html_file" && grep -q "</body>" "$html_file"; then
      # Get line numbers for body and html closing tags
      body_line=$(grep -n "</body>" "$html_file" | cut -d: -f1)
      html_line=$(grep -n "</html>" "$html_file" | cut -d: -f1)
      
      # Check if body tag comes before html tag
      if (( body_line < html_line )); then
        report_test "PASS" "$html_file has proper HTML structure"
      else
        report_test "FAIL" "$html_file has malformed HTML structure"
      fi
    else
      report_test "FAIL" "$html_file is missing closing HTML tags"
    fi
  else
    report_test "FAIL" "$html_file is missing"
  fi
done

echo ""
echo "2. Checking CSS files..."

# Check CSS directories and files
if [[ -d "css" ]]; then
  report_test "PASS" "css directory exists"

  if [[ -f "css/global.css" ]]; then
    report_test "PASS" "global.css exists"
  else
    report_test "FAIL" "global.css is missing"
  fi

  # Check for minified CSS
  if [[ -d "css-min" ]]; then
    report_test "PASS" "css-min directory exists"
    
    # Check for CSS typos in minified files
    # Look for known CSS typos like 'ransition' (should be 'transition')
    TYPO_COUNT=$(grep -r -E '(^|[^t])ransition|^ransform|[^t]ransform:|ttransition|ttransform|ext-transform' --include="*.css" css-min/ | 
                grep -v "text-transform" | wc -l)
    if [[ $TYPO_COUNT -eq 0 ]]; then
      report_test "PASS" "No CSS property name typos found in minified files"
    else
      report_test "FAIL" "Found $TYPO_COUNT potential CSS property name typos in minified files"
    fi
  else
    report_test "WARN" "css-min directory is missing; run minify-css.sh to generate it"
  fi
else
  report_test "FAIL" "css directory is missing"
fi

echo ""
echo "3. Checking JavaScript files..."

# Check for core JavaScript files
for js_file in "popup.js" "add-prompt.js" "edit-prompt.js" "js/ui.js" "js/promptData.js" "js/utils.js"; do
  if [[ -f "$js_file" ]]; then
    report_test "PASS" "$js_file exists"
    
    # Run a simple syntax check
    node --check "$js_file" > /dev/null 2>&1
    if [[ $? -eq 0 ]]; then
      report_test "PASS" "$js_file has valid JavaScript syntax"
    else
      report_test "FAIL" "$js_file has JavaScript syntax errors"
    fi
  else
    report_test "FAIL" "$js_file is missing"
  fi
done

echo ""
echo "4. Checking icons..."

# Check icon files
for icon in "icon16.png" "icon48.png" "icon128.png"; do
  if [[ -f "icons/$icon" ]]; then
    report_test "PASS" "icons/$icon exists"
    
    # Get image dimensions if possible
    if command -v identify > /dev/null; then
      DIMENSIONS=$(identify -format "%wx%h" "icons/$icon" 2>/dev/null)
      EXPECTED_DIM=$(echo $icon | sed 's/[^0-9]//g')
      
      if [[ "$DIMENSIONS" == "${EXPECTED_DIM}x${EXPECTED_DIM}" ]]; then
        report_test "PASS" "icons/$icon has correct dimensions: $DIMENSIONS"
      else
        report_test "WARN" "icons/$icon has dimensions $DIMENSIONS (expected ${EXPECTED_DIM}x${EXPECTED_DIM})"
      fi
    else
      # Fallback if ImageMagick is not installed
      FILE_SIZE=$(wc -c < "icons/$icon")
      report_test "WARN" "ImageMagick not found; can't verify icon dimensions. File size: $FILE_SIZE bytes"
    fi
  else
    report_test "FAIL" "icons/$icon is missing"
  fi
done

echo ""
echo "5. Running NPM tests (if available)..."

# Run NPM tests if package.json exists
if [[ -f "package.json" ]]; then
  if grep -q "\"test\":" package.json; then
    npm test --silent > /dev/null 2>&1
    if [[ $? -eq 0 ]]; then
      report_test "PASS" "NPM tests passed"
    else
      report_test "WARN" "Some NPM tests failed"
    fi
  else
    report_test "WARN" "No test script defined in package.json"
  fi
else
  report_test "WARN" "package.json not found; skipping NPM tests"
fi

echo ""
echo "===== Test Summary ====="
echo "✅ Passed: $PASS_COUNT tests"
echo "⚠️ Warnings: $WARNING_COUNT tests"
echo "❌ Failed: $FAIL_COUNT tests"
echo ""

if [[ $FAIL_COUNT -eq 0 ]]; then
  if [[ $WARNING_COUNT -eq 0 ]]; then
    echo "🎉 All tests passed successfully!"
  else
    echo "🎉 All critical tests passed, but there are $WARNING_COUNT warnings to address."
  fi
  
  echo ""
  echo "Next step: Load the extension in Chrome to verify functionality:"
  echo "1. Open Chrome and go to chrome://extensions/"
  echo "2. Enable 'Developer mode' using the toggle in the top-right"
  echo "3. Click 'Load unpacked' and select your extension directory"
  echo "4. Test the extension functionality manually"
else
  echo "❌ $FAIL_COUNT tests failed. Please fix the issues before testing in Chrome."
fi

exit $FAIL_COUNT
