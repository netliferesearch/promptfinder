# DesignPrompts CSS Structure

This document describes the CSS architecture for the DesignPrompts Chrome extension.

## Organization

The CSS is organized into a modular structure:

```
/css
  /base
    variables.css
    reset.css
    utilities.css
  /components
    buttons.css
    cards.css
    forms.css
    sticky-search-header.css
    tabs.css
  /layout
    containers.css
    header.css
  /pages
    auth.css
    edit-mode.css
    popup.css
    prompt-details.css
  global.css
  README.md
```

## Key Files

### Base

- `variables.css`: Contains CSS variables for colors, typography, spacing, etc.
- `reset.css`: Basic reset styles for consistent rendering
- `utilities.css`: Helper classes for common styling needs

### Components

- `buttons.css`: Button styles and variations
- `cards.css`: Card components and prompts
- `forms.css`: Form elements and controls
- `sticky-search-header.css`: Sticky header for search UI
- `tabs.css`: Tab navigation and content

### Layout

- `containers.css`: Main container layouts
- `header.css`: Header styles

### Pages

- `auth.css`: Styles for authentication views
- `edit-mode.css`: Styles for prompt editing mode
- `popup.css`: Styles specific to the main popup
- `prompt-details.css`: Styles for the prompt details view

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

- Consistent spacing scale: xxs, xs, sm, md, lg, xl

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
