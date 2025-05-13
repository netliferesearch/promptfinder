# PromptFinder Modularization Roadmap

## JavaScript Modularization

### Phase 3: Integration & Testing (In Progress)

1. ✅ Continue migrating functionality from `popup.js` to modules
   - ✅ Move section visibility management to `UI` module
   - ✅ Move prompt display functions to `UI` module
   - ✅ Move form handling to `UI` module
   - 🔄 Consolidate remaining duplicate functions
2. 🔄 Clean up legacy code in `popup.js`
   - 🔄 Remove commented-out code sections
   - 🔄 Refactor popup.js into smaller, more manageable parts
3. ⬜ Write tests for each module
4. ⬜ Fix any issues discovered during testing
5. ✅ Add documentation for module usage (updated README.md)

## CSS Modularization (In Progress)

### Phase 1: Structure & Foundation (Complete)

1. ✅ Create modular CSS directory structure
   - ✅ /base for foundational styles
   - ✅ /components for reusable UI components
   - ✅ /layout for structural elements
   - ✅ /pages for page-specific styles
2. ✅ Create CSS variables and design system
   - ✅ Colors, typography, spacing, etc.
3. ✅ Implement CSS reset and utility classes

### Phase 2: Component & Layout Development (In Progress)

1. ✅ Create component CSS files
   - ✅ forms.css: Form elements and controls
   - ✅ buttons.css: Button styles and variations
   - ✅ tabs.css: Tab navigation components
   - ✅ cards.css: Card and prompt components
2. ✅ Create layout CSS files
   - ✅ containers.css: Layout containers
   - ✅ header.css: Header components
3. ✅ Create page-specific CSS files
   - ✅ popup.css: Main popup styles
   - ✅ add-prompt.css: Add prompt page styles
   - ✅ edit-prompt.css: Edit prompt page styles
4. ✅ Create global.css to import all base styles
5. 🔄 Update HTML files to use new CSS structure

### Phase 3: Migration & Implementation (Current)

1. 🔄 Create helper scripts for CSS class migration
   - ✅ css-migration-helper.js: Temporary fallback for old CSS
   - ✅ css-class-helper.js: Apply new CSS classes to elements
2. 🔄 Create scripts for CSS cleanup
   - ✅ cleanup-css.sh: Remove old CSS files and references
   - ✅ finalize-css.sh: Update HTML with new classes directly
3. 🔄 HTML/CSS integration
   - 🔄 Convert existing inline styles to use CSS variables
   - 🔄 Apply component classes to HTML elements
   - ⬜ Test across all pages for visual consistency

### Phase 4: Finalization & Optimization

1. ⬜ Remove CSS migration helpers once stable
2. ⬜ Optimize CSS for performance
   - ⬜ Remove unused styles
   - ⬜ Consolidate duplicate rules
3. ⬜ Add dark mode support
4. ⬜ Enhance responsive design for different screen sizes
5. ⬜ Document CSS architecture and usage guidelines

## Current State

The extension currently uses a monolithic structure with all JavaScript in `popup.js`. We've created skeleton modules in the `js/` directory, but haven't integrated them yet.

## Challenges

- **ES Module Compatibility**: Chrome extensions have certain limitations with ES modules.
- **Existing Functionality**: We need to maintain the current functionality during the transition.

## Modularization Plan

### Phase 1: Setup & Preparation (Complete)

- ✅ Create directory structure for modules
- ✅ Set up linting and formatting tools
- ✅ Create test environment scaffolding
- ✅ Address dependency issues

### Phase 2: Initial Modularization (Complete)

1. ✅ Create namespace pattern for modules
2. ✅ Extract utility functions to `utils.js`
3. ✅ Extract data operations to `promptData.js`
4. ✅ Extract UI operations to `ui.js`
5. ✅ Update module references to use the namespace pattern
6. ✅ Update `popup.js` to use these modules
   - ✅ Initialize UI module
   - ✅ Replace handleError with Utils.handleError
   - ✅ Replace showConfirmationMessage with Utils.showConfirmationMessage
   - ✅ Replace highlightStars with Utils.highlightStars
   - ✅ Replace chrome.storage operations with Utils.chromeStorageGet/Set
   - ✅ Update UI function calls to use UI module
   - ✅ Replace duplicate functions with calls to module functions
   - ✅ Move Chrome API operations to Utils module

### Phase 3: Integration & Testing (In Progress - not so much)

1. 🔄 Continue migrating functionality from `popup.js` to modules
   - Move section visibility management to `UI` module
   - Move prompt display functions to `UI` module
   - Move form handling to `UI` module
2. ⬜ Write tests for each module
3. ⬜ Fix any issues discovered during testing
4. ✅ Add documentation for module usage (updated README.md)

### Phase 4: Advanced Features

1. Implement dark mode support
2. Add export/import functionality
3. Improve filtering options
4. Enhance accessibility features

## Implementation Guidelines

### Module Pattern for Chrome Extensions

For Chrome extensions, we're using the namespace pattern with IIFE (Immediately Invoked Function Expression):

```javascript
// utils.js
window.PromptFinder = window.PromptFinder || {};

window.PromptFinder.Utils = (function() {
  // Private functions and variables
  
  // Return public API
  return {
    publicFunction1,
    publicFunction2
  };
})();
```

### Module Usage in HTML

In the HTML file, modules must be loaded in the correct dependency order:

```html
<!-- First load utility functions -->
<script src="js/utils.js"></script>
<!-- Then load modules that depend on utils -->
<script src="js/promptData.js"></script>
<!-- Then load UI that depends on both -->
<script src="js/ui.js"></script>
<!-- Finally load the main app code -->
<script src="popup.js"></script>
<script src="app.js"></script>
```

window.PromptFinder = window.PromptFinder || {};
window.PromptFinder.Utils = (function() {
  // Private functions and variables
  
  // Public API
  return {
    handleError: function() { /*...*/ },
    // other functions...
  };
})();

```new

### Integration Strategy

Each module will be loaded in the proper order, and `popup.js` will be refactored to use these modules incrementally.

## Timeline

- **Phase 1**: Complete
- **Phase 2**: 2 weeks
- **Phase 3**: 1 week
- **Phase 4**: Ongoing
