#!/bin/bash

# PromptFinder Development Script
# This script sets up a complete development environment with:
# - CSS environment switching
# - JavaScript bundling with watch mode
# - Firefox extension auto-reload

set -e  # Exit on any error

echo "🚀 Starting PromptFinder development environment..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🧹 Cleaning up background processes..."
    if [ ! -z "$ROLLUP_PID" ]; then
        kill $ROLLUP_PID 2>/dev/null || true
    fi
    if [ ! -z "$WEBEXT_PID" ]; then
        kill $WEBEXT_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# 1. Switch CSS to development mode
echo "🎨 Setting up CSS environment..."
if npm run css:switch -- dev; then
    echo "✅ CSS environment set to development"
else
    echo "⚠️  CSS switch had issues, continuing anyway..."
fi

# 2. Build JavaScript once
echo "📦 Building JavaScript..."
npm run build:js:dev

# 3. Start JavaScript watcher in background
echo "👀 Starting JavaScript watcher..."
npm run watch:js &
ROLLUP_PID=$!

# 4. Start Firefox with extension and developer tools
echo "🦊 Starting Firefox with extension and developer tools..."
npm run firefox:run &
WEBEXT_PID=$!

echo "✅ Development environment ready!"
echo "🛠️  Firefox Developer Tools will open automatically"
echo "🖥️  Browser Console will be available for debugging"
echo "📝 JavaScript changes will auto-rebuild"
echo "🔄 Extension will auto-reload in Firefox"
echo "🛑 Press Ctrl+C to stop all processes"

# Wait for user to stop
wait
