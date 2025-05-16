# CSS Migration Guide for Developers

This document provides a guide for developers working on the PromptFinder extension to transition from the old CSS structure to the new modular system.

## What Has Changed?

We've moved from a flat CSS structure with 3 main files (`popup.css`, `add-prompt.css`, and `edit-prompt.css`) to a modular system with:

- CSS variables for consistent design
- Component-based approach
- Separation of concerns across multiple files
- CSS utility classes

## Migration Tools

We've created several tools to help with the migration:

### 1. CSS Migration Helper (`js/css-migration-helper.js`)

This script provides backward compatibility during the transition period. It:

- Loads old CSS files as fallbacks
- Monitors for CSS issues
- Can be safely removed once migration is complete

### 2. CSS Class Helper (`js/css-class-helper.js`)

This script helps with applying new CSS classes to elements without changing HTML:

- Maps old classes to new ones
- Provides helper functions for common tasks
- Applies new classes dynamically

### 3. Migration Scripts

- `apply-css-classes.sh`: Updates HTML to use new CSS classes directly
- `finalize-css.sh`: Finalizes HTML class changes and removes temporary helpers
- `cleanup-css.sh`: Removes old CSS files and creates backups

## How to Use the New CSS

### CSS Variables

Use CSS variables for consistent styling:

```css
/* Old approach */
.button {
  background-color: #7c4dff;
  padding: 10px 20px;
  border-radius: 24px;
}

/* New approach */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-lg);
}
```

### Component Classes

Use predefined component classes:

```html
<!-- Old approach -->
<button onclick="doSomething()" style="background-color: #7C4DFF; color: white;">Click Me</button>

<!-- New approach -->
<button onclick="doSomething()" class="button button-primary">Click Me</button>
```

### Utility Classes

Use utility classes for common styling needs:

```html
<!-- Old approach with inline CSS -->
<div style="display: flex; justify-content: center; margin-top: 20px;">Content</div>

<!-- New approach with utility classes -->
<div class="flex justify-center" style="margin-top: var(--spacing-lg);">Content</div>
```

## Migrating Your Code

1. **Review CSS variables** in `css/base/variables.css`
2. **Use component classes** from `css/components/`
3. **Apply layout containers** from `css/layout/`
4. **Keep page-specific styles** in the appropriate file in `css/pages/`

## Future Best Practices

1. Always use CSS variables for design values
2. Prefer component classes over custom styling
3. Use utility classes for simple layout adjustments
4. Keep page-specific styles separate
5. Follow BEM naming convention for complex components

## Testing Your Changes

After migrating, test your changes in various scenarios:

- Different screen sizes
- Different browsers
- All interactive states (hover, focus, active)
- Edge cases (very long content, etc.)
