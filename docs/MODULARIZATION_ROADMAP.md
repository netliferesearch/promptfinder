# PromptFinder Modularization Roadmap

## Current Status (as of latest refactor)

- **JavaScript Modularization**: Largely complete. Core logic is separated into `js/ui.js` (UI interactions), `js/promptData.js` (data operations), and `js/utils.js` (shared utilities). `app.js` serves as the lean entry point for the main popup. Page-specific logic for `add-prompt.html` and `edit-prompt.html` is in their respective `pages/*.js` files. The original monolithic `popup.js` has been eliminated.
- **CSS Modularization**: Structure is well-defined. CSS is organized into `base`, `components`, `layout`, and `pages`. PurgeCSS has been integrated for removing unused styles. Minification and other advanced optimizations can be built upon this.
- **Linting & Formatting**: ESLint (v9, using `eslint.config.mjs`) and Prettier (v3) are set up and applied, ensuring code consistency.
- **Build Process**: Basic build scripts exist for linting, formatting, and CSS purging. Can be expanded for bundling/minification.

## JavaScript Modularization

### Phase 1: Setup & Preparation (Complete)

- ✅ Create directory structure for modules
- ✅ Set up linting and formatting tools (ESLint v9, Prettier v3 with `eslint.config.mjs`)
- ✅ Create test environment scaffolding
- ✅ Address dependency issues (upgraded ESLint, Prettier, etc.)

### Phase 2: Initial Modularization (Complete)

1. ✅ Create namespace pattern for modules (`window.PromptFinder`)
2. ✅ Extract utility functions to `js/utils.js`
3. ✅ Extract data operations to `js/promptData.js`
4. ✅ Extract UI operations to `js/ui.js`
5. ✅ Update module references to use the namespace pattern
6. ✅ `app.js` (entry for `popup.html`) now uses these modules for initialization and core logic delegation.

### Phase 3: Integration, Refinement & Testing (Largely Complete / Ongoing)

1. ✅ Functionality previously in `popup.js` migrated to appropriate modules or handled by `app.js`.
   - ✅ Section visibility management in `js/ui.js`
   - ✅ Prompt display functions in `js/ui.js`
   - ✅ Form handling (main popup) in `js/ui.js`; detached forms in `pages/*.js`
2. ✅ Legacy `popup.js` (monolithic version) removed.
3. ⬜ Write/expand unit tests for each module.
4. ⬜ Fix any issues discovered during testing and further refactoring.
5. ✅ Documentation for module usage updated (README.md).

## CSS Modularization

### Phase 1: Structure & Foundation (Complete)

1. ✅ Create modular CSS directory structure (`base`, `components`, `layout`, `pages`)
2. ✅ Create CSS variables and design system
3. ✅ Implement CSS reset and utility classes

### Phase 2: Component & Layout Development (Complete)

1. ✅ Create component CSS files (forms, buttons, tabs, cards)
2. ✅ Create layout CSS files (containers, header)
3. ✅ Create page-specific CSS files (popup, add-prompt, edit-prompt)
4. ✅ Create `css/global.css` to import base styles
5. ✅ HTML files updated to use new CSS structure

### Phase 3: Migration & Implementation (Revised)

1. ✅ CSS class application largely handled by static HTML and `js/css-class-helper.js`.
2. ❌ Obsolete helper scripts (`cleanup-css.sh`, `finalize-css.sh`) removed (were empty).
3. ✅ Inline styles largely converted to use CSS variables and classes.
4. ⬜ Test across all pages for visual consistency (ongoing).

### Phase 4: Finalization & Optimization (In Progress)

1. ⬜ Remove CSS migration helpers (`js/css-migration-helper.js`) once fully stable and old CSS references are gone.
2. ✅ Optimize CSS for performance:
   - ✅ **Remove unused styles**: PurgeCSS integrated (`npm run css:purge`). Requires ongoing safelist review.
   - ⬜ **Minify CSS**: Currently no active minification script in `package.json` build process; `scripts/minify-css.sh` was empty. (To be added if desired).
   - ⬜ Consolidate duplicate rules (manual review or advanced tooling).
3. ⬜ Add dark mode support.
4. ⬜ Enhance responsive design for different screen sizes.
5. ⬜ Document CSS architecture and usage guidelines.

## Challenges (Mostly Addressed or Mitigated)

- **ES Module Compatibility**: Using namespace pattern. `eslint.config.mjs` adopted for ESLint v9 tooling.
- **Existing Functionality**: Maintained during refactoring.

## Future Development (High-Level Features - see README.md Future Roadmap)

1. Implement dark mode support.
2. Add export/import functionality.
3. Improve filtering options.
4. Enhance accessibility features further.

## Implementation Guidelines

### Module Pattern for Chrome Extensions

Using the namespace pattern (`window.PromptFinder`) with IIFE for `js/utils.js`, `js/promptData.js`, `js/ui.js`.

### Module Usage in HTML (`pages/popup.html` example)

Modules are loaded in dependency order, with `app.js` as the final entry point for popup initialization:

```html
<!-- Load shared modules first -->
<script src="../js/utils.js"></script>
<script src="../js/promptData.js"></script>
<script src="../js/ui.js"></script>
<!-- Page-specific JS (if any, not for popup.html as app.js is entry) -->
<!-- Main app entry point for this HTML page -->
<script src="../app.js"></script>
```

## Timeline

- **Phase 1 (Setup & JS/CSS Structure)**: Complete
- **Phase 2 (Initial JS/CSS Modularization & Content)**: Complete
- **Phase 3 (Integration, Cleanup, Tooling Upgrades)**: Complete
- **Phase 4 (Advanced Features & Ongoing Optimization)**: In Progress
