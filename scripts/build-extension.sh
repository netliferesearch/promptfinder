#!/bin/bash
# This script builds an optimized Chrome extension package

set -e

BUILD_DIR="dist"
PACKAGE_DIR="package"
EXTENSION_NAME="promptfinder"

# Step 1: Clean previous builds
echo "Cleaning previous builds..."
rm -rf "$BUILD_DIR" "$PACKAGE_DIR" "$EXTENSION_NAME.zip"
mkdir -p "$BUILD_DIR" "$PACKAGE_DIR"

# Step 2: Run production build without sourcemaps
echo "Building production assets..."
npm run build:prod

# Step 3: Create extension package with only necessary files
echo "Creating extension package..."
mkdir -p "$PACKAGE_DIR/css" "$PACKAGE_DIR/js" "$PACKAGE_DIR/pages" "$PACKAGE_DIR/icons"

# Copy only necessary files
echo "Copying manifest and HTML files..."
cp manifest.json "$PACKAGE_DIR/"
cp pages/*.html "$PACKAGE_DIR/pages/"
cp icons/*.png "$PACKAGE_DIR/icons/"

# Copy and minify JS files
echo "Copying minified JS files..."
cp "$BUILD_DIR/js/"*.js "$PACKAGE_DIR/js/"
cp "$BUILD_DIR/pages/"*.js "$PACKAGE_DIR/pages/"

# Copy all purged CSS files - check if directories exist first
echo "Optimizing CSS files..."
mkdir -p "$PACKAGE_DIR/css"

# Create a single combined CSS file from all purged CSS
echo "Creating combined CSS file..."
cat "$BUILD_DIR/css-purged/"*.css > "$PACKAGE_DIR/css/styles.css" 2>/dev/null || echo "No global CSS files found"

# Check if the pages directory exists and has files
if [ -d "$BUILD_DIR/css-purged/pages" ] && [ "$(ls -A "$BUILD_DIR/css-purged/pages")" ]; then
  echo "Copying page-specific CSS..."
  cp "$BUILD_DIR/css-purged/pages/"*.css "$PACKAGE_DIR/css/" 2>/dev/null || true
fi

# Further optimize by removing comments from CSS files
echo "Removing comments from CSS files..."
find "$PACKAGE_DIR/css" -name "*.css" -exec sed -i '' -e '/\/\*.*\*\//d' -e 's/\/\*.*\*\///g' {} \; 2>/dev/null || true

# Remove any empty lines from CSS files
find "$PACKAGE_DIR/css" -name "*.css" -exec sed -i '' -e '/^[[:space:]]*$/d' {} \; 2>/dev/null || true

# Optimize images 
echo "Optimizing PNG images..."
if command -v pngquant &> /dev/null; then
    find "$PACKAGE_DIR/icons" -name "*.png" -exec pngquant --force --quality=65-80 --skip-if-larger --strip --speed=1 --output {} {} \; 2>/dev/null || echo "Image optimization skipped"
else
    echo "pngquant not found, skipping image optimization"
fi

# Step 4: Calculate size before zipping
echo "Extension size before compression:"
du -sh "$PACKAGE_DIR"

# Step 5: Zip the extension with maximum compression
echo "Creating extension zip file..."
cd "$PACKAGE_DIR"
zip -9r "../$EXTENSION_NAME.zip" .
cd ..

echo "Extension built successfully: $EXTENSION_NAME.zip"
ls -lh "$EXTENSION_NAME.zip"
echo "Extension size:"
du -h "$EXTENSION_NAME.zip"

# Print compression ratio
ORIGINAL_SIZE=$(du -k "$PACKAGE_DIR" | cut -f1)
COMPRESSED_SIZE=$(du -k "$EXTENSION_NAME.zip" | cut -f1)
RATIO=$(echo "scale=2; $COMPRESSED_SIZE * 100 / $ORIGINAL_SIZE" | bc 2>/dev/null || echo "N/A")
echo "Compression ratio: $RATIO% of original size"
