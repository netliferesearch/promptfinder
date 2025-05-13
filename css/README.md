# PromptFinder CSS Structure

This document describes the CSS architecture for the PromptFinder Chrome extension.

## Organization

The CSS is organized into a modular structure:

```
/css
  /base          # Foundation styles, variables, reset, utilities
  /components    # Reusable UI components
  /layout        # Page layout structures
  /pages         # Page-specific styles
  global.css     # Main CSS file that imports all base styles
```

## Key Files

### Base

- `variables.css`: Contains CSS variables for colors, typography, spacing, etc.
- `reset.css`: Basic reset styles for consistent rendering
- `utilities.css`: Helper classes for common styling needs

### Components

- `forms.css`: Form elements and controls
- `buttons.css`: Button styles and variations
- `tabs.css`: Tab navigation and content
- `cards.css`: Card components and prompts

### Layout

- `containers.css`: Main container layouts
- `header.css`: Header styles

### Pages

- `popup.css`: Styles specific to the main popup
- `add-prompt.css`: Styles for the add prompt page
- `edit-prompt.css`: Styles for the edit prompt page

## Design System

The CSS architecture follows a design system approach with:

### Colors

- Primary: `#7C4DFF` (purple)
- Gray scale from 100-500
- Semantic colors for success/error states

### Typography

- Font family: System font stack
- Font sizes: xs, sm, md, lg, xl

### Spacing

- Consistent spacing scale: xs, sm, md, lg, xl

### Shadows

- Three levels: sm, md, lg

## Usage

In HTML files, include:

1. The global CSS file: `<link rel="stylesheet" href="css/global.css" />`
2. Any page-specific CSS: `<link rel="stylesheet" href="css/pages/page-name.css" />`

## Migration Notes

1. We've implemented a CSS migration helper (`js/css-migration-helper.js`) that temporarily includes old CSS files as fallbacks
2. Once all pages are fully converted to the new structure, old CSS files can be removed
3. During migration, use the browser devtools to check for any styling issues

## Best Practices

1. Use CSS variables for consistency
2. Apply utility classes for common styling needs
3. Keep page-specific CSS minimal by leveraging the component library
4. Follow the BEM naming convention for complex components
