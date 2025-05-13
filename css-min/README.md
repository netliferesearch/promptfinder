# PromptFinder Minified CSS

This directory contains minified versions of the CSS files for production use.
The CSS structure is preserved but files have been optimized to reduce file size.

## Directory Structure
- `/base`: Foundation styles (variables, reset, utilities)
- `/components`: Reusable UI components (buttons, forms, etc.)
- `/layout`: Layout structures
- `/pages`: Page-specific styles
- `global.css`: Main CSS entry point

## Updating

When making changes to CSS, always modify the original files in the `/css` directory,
then run the minification script again to update these files.
