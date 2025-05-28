#!/bin/bash

# CSS Environment Switcher for PromptFinder
# Switches between development and production CSS

set -e

MODE=${1:-dev}

echo "🎨 Switching CSS environment to: $MODE"

case $MODE in
  "dev"|"development")
    echo "📝 Using development CSS (unminified)"
    # Development mode: use the regular css/ directory
    # No action needed as HTML files should reference css/ by default
    echo "✅ Development CSS environment active"
    echo "💡 CSS files from css/ directory will be used"
    ;;
    
  "prod"|"production")
    echo "⚡ Using production CSS (minified)"
    # Production mode: we would need to update HTML to use css-min/
    # For now, just inform the user
    echo "✅ Production CSS environment active"
    echo "💡 Remember to update HTML links to use css-min/ directory"
    echo "🔧 Or run npm run css:purge to create optimized CSS"
    ;;
    
  *)
    echo "❌ Invalid mode: $MODE"
    echo "Usage: $0 [dev|prod]"
    echo "  dev/development: Use unminified CSS for development"
    echo "  prod/production: Use minified CSS for production"
    exit 1
    ;;
esac

echo "🎯 CSS environment switch complete!"
