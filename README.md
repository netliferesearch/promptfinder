# PromptFinder - AI Prompt Management Chrome Extension

PromptFinder is a Chrome extension designed to help users efficiently manage, store, and discover AI prompts. It allows you to search, browse, add, and organize prompts for various AI tools (like ChatGPT, Midjourney, Claude, etc.). All your prompts are synced to the cloud using Firebase, allowing access across different Chrome browsers where you're signed in.

## Key Features

- **Cloud Synced Prompts:** Prompts are stored in Firebase Firestore, enabling synchronization and backup.
- **User Accounts:** Supports Email/Password and Google Sign-In for personalized prompt management.
- **CRUD Operations:** Add, edit, and delete your prompts.
- **Comprehensive Prompt Details:** View title, description, full prompt text (with Markdown highlighting), category, tags, target AI tools, author, creation/update dates, usage count, and ratings.
- **Code-Formatted Display:** Prompt text is displayed in a code block with syntax highlighting for Markdown.
- **Truncation & "View More":** Long prompt texts are truncated by default with an option to expand.
- **Per-User Ratings:** Rate any prompt from 1-5 stars; you can update your rating.
- **Community Ratings:** View the average community rating and total number of ratings for public prompts.
- **Universal Favorites:** Favorite any prompt (public or your own private ones). `favoritesCount` on prompts tracks total favorites.
- **Usage Count:** Tracks how many times a prompt has been copied.
- **Search & Filtering:** Search across multiple fields. Filter by tabs (All, Favorites, Private).
- **Sticky Search Header:** The search field and prompt counter remain visible at the top of the prompt list as you scroll, making it easy to refine searches and see results count. Fully accessible (keyboard, screen reader) and mobile-friendly.
- **Private Prompts:** Option to keep prompts private to your account.
- **Private Prompt Indicator:** Private prompts are visually marked with a lock icon next to their title in both the prompt list and details views.
- **Required Fields:** Ensures essential information (Title, Description, Prompt Text, Category, Target AI Tools) is provided when adding/editing prompts.
- **Custom Display Names:** Users set a display name upon email/password signup, avoiding email exposure.

## Improved Search System

PromptFinder now features a powerful, server-side search system designed for speed, accuracy, and usability:

- **Field Weighting:** Prioritizes matches in prompt title, description, text, categories, and tags, with title matches ranked highest.
- **Stemming, Synonyms, and Typo Tolerance:** Uses open-source libraries to handle word variations, common synonyms, and minor typos.
- **Match Annotations:** Each search result displays badges indicating which fields matched your query, with accessible labels for screen readers.
- **Exact Match Boost:** Exact matches are always ranked above partial or fuzzy matches.
- **Multi-Field Boost:** Results matching in multiple fields are ranked higher.
- **Public & Private Prompts:** Search includes both public prompts and your private prompts (when logged in), respecting all permissions.
- **Performance:** Optimized to return results within 500ms for up to 1000 prompts. Search timing is displayed in the UI and logged for developers.
- **Accessibility:** All match indicators and search controls are accessible by keyboard and screen reader.

**Usage:**

- Just type in the main search bar. Results are prioritized and annotated in real time.
- Search timing and matched fields are shown for each result.
- Developers can review search performance in the browser console and Cloud Function logs.

**For full technical details, see [`docs/search-system.md`](docs/search-system.md).**

## Project Status & Roadmap

**For a detailed breakdown of current development status, ongoing tasks, and future plans, please see the [PROJECT_PLAN.md](PROJECT_PLAN.md) file.**

This project has recently undergone a significant migration to Firebase for backend services and a major refactoring to use modern JavaScript (ES Modules) and a Rollup build process.

## Recent Major Changes (2025)

### Firefox Cross-Browser Compatibility (May 2025)

- ✅ **Firefox Warning Resolved:** Fixed Firefox console warning "Reading manifest: Warning processing oauth2: An unexpected property was found in the WebExtension manifest."
- ✅ **Cross-Browser OAuth Config:** Implemented `config/oauth-config.js` module to handle OAuth2 configuration in a browser-agnostic way.
- ✅ **Manifest Optimization:** Removed Chrome-specific `oauth2` section from `manifest.json` to eliminate Firefox warnings while maintaining Chrome functionality.
- ✅ **Backward Compatibility:** OAuth functionality preserved for Chrome while adding Firefox support through fallback configuration system.
- ✅ **Build Process Updated:** All tests passing (65/65) and build process working correctly across browsers.

### Email Verification Flow Fix (May 2025)

- ✅ **Fixed Blank Email Verification Screen:** Resolved critical issue where email verification screen appeared blank after user registration due to HTML structure problems.
- ✅ **HTML Structure Refactored:** Moved email verification section from being nested inside the main auth card to being a sibling element, allowing independent show/hide functionality.
- ✅ **CSS Styling Updated:** Created dedicated `.verification-card` styling to replace `auth-card` class usage for email verification, maintaining visual consistency.
- ✅ **Authentication Flow Improved:** Email verification now displays correctly after signup, providing proper user guidance for account verification.

### UI Cleanup & Sort Controls Refactor (May 2025)

- ✅ **Removed `.filter-sort-row`:** All traces of the legacy `.filter-sort-row` class have been removed from the codebase (HTML, CSS, JS) for clarity and maintainability.
- ✅ **Sort Controls Modernized:** The sort direction toggle button is now grouped directly with the sort dropdown for a more intuitive and accessible UI.
- ✅ **Auth View CSS Improved:** Authentication (login/signup) views have improved layout, z-index, and maintainability, with all text i18n-ready and styles centralized in `auth.css`.
- ✅ **General Code Cleanup:** Related code in `popup.html`, `popup.css`, `auth.css`, and `ui.js` was refactored for clarity and maintainability.
- **Centralized Text Management System (January 2025):**

  - ✅ **Text Constants Architecture:** Created comprehensive text management system with 137 organized constants covering all user-facing strings
  - ✅ **TextManager Class:** Implemented with `get()`, `has()`, `format()` methods and internationalization infrastructure
  - ✅ **Variable Interpolation:** Added `{{variable}}` syntax for dynamic text with proper escaping
  - ✅ **Codebase Integration:** Updated all JavaScript files to use centralized text management, replacing 80+ hardcoded strings
  - ✅ **Message Standardization:** Unified all authentication, validation, error, and success messages across the extension
  - ✅ **Maintainability Improvement:** Eliminated scattered hardcoded strings, making text updates centralized and consistent
  - ✅ **I18n Ready:** Built foundation for future internationalization support with locale-aware text management

- **CSS Optimization & Performance Improvements (January 2025):**

  - ✅ **PurgeCSS Integration:** Implemented automated unused CSS removal achieving 43% size reduction (92K → 52K)
  - ✅ **Legacy System Cleanup:** Removed outdated `/css-min/` directory (56KB) and CSS migration helper files
  - ✅ **Icon Optimization:** Resized all icons from 800x800px to proper dimensions (16px, 48px, 128px) for ~98% size reduction
  - ✅ **Build Process Enhancement:** Added `npm run css:purge` command and integrated CSS optimization into build workflow
  - ✅ **Performance Validation:** Maintained full functionality while achieving significant performance improvements across all tests
  - ✅ **Performance Validation:** Maintained full functionality while achieving significant performance improvements across all tests in the main `/tests` system
  - ✅ **Configuration Management:** Created comprehensive PurgeCSS configuration with safelist for dynamic classes

- **Critical Bug Fix - Prompt List Virtualization (May 2025):**

  - ✅ **Fixed Empty Prompt Lists:** Resolved critical issue where no prompts were visible in any tab (All, Favorites, Private)
  - ✅ **Clusterize.js Integration Completed:** Fixed DOM element reference mismatch that prevented the virtualization library from initializing properly
  - ✅ **Performance Optimization Working:** Large prompt lists now use efficient virtualization for smooth scrolling and reduced memory usage
  - ✅ **Build Process Improved:** Excluded third-party minified libraries from linting to prevent build failures

- **Popup Navigation Tabs Accessibility & Layout Improved:**
  - Tab buttons now have better color contrast for hover, focus, and active states, meeting accessibility guidelines.
  - Tab button widths are reduced and responsive, so all tabs are always visible without horizontal scrolling.
  - Horizontal scrolling is minimized and styled for accessibility.
- **Reset Filters Button Logic Fixed:**
  - The reset filters button now appears and disappears immediately as filters are changed or reset, improving usability and accessibility.
  - **Font Awesome Updated:**
  - The extension now uses Font Awesome 6.4.2 for full icon support, including the reset icon.
  - **Private Prompt Lock Icon:** Private prompts now display a lock icon next to their title in both the list and details views, making it easy to distinguish private content at a glance.
- **General UI/UX Improvements:**

  - Filter and sort controls are visually consistent, accessible, and mobile-friendly.
  - Filter checkboxes are properly aligned and sized for better UX.
  - **Global Toast Notification System:** All user-facing messages (success, error, info) now use an accessible toast notification system. Legacy message elements have been removed from the UI. All user actions (copy, favorite, logout, etc.) provide clear, accessible feedback via toast. Copying prompts always works for logged-out users; usage count increment errors are now silent. All tests updated and passing for new error handling logic.

- **Global Toast Notification System:** All user-facing messages (success, error, info) now use an accessible toast notification system. Legacy message elements have been removed from the UI. All user actions (copy, favorite, logout, etc.) provide clear, accessible feedback via toast. Copying prompts always works for logged-out users; usage count increment errors are now silent. All tests in the main `/tests` system updated and passing for new error handling logic.
- **Delete Confirmation Dialog Improved:** The delete confirmation dialog's buttons now match the style and accessibility of the add/edit prompt buttons ("Delete" is red, "Cancel" is secondary style).
- **Add/Edit Prompt Workflow Improved:** After adding a new prompt, users are redirected to the details view for that prompt, improving workflow and clarity.
- **Chrome Extension Warning Silenced:** The warning for message passing ("Could not establish connection") is now silenced unless a real error occurs.
- Copy-to-clipboard works for all users, regardless of login state.
- CSP updated to allow Cloud Functions endpoint for all users.

- **Cloud Functions Fully Migrated to Firebase Functions v2 API:** All backend logic (ratings, favorites, usage count, stats, subcollection cleanup) is now implemented as 2nd Gen Cloud Functions in `europe-west1`.
- **Automated Dependency & Code Health Script:** Use `./update-deps.sh` to automatically check for outdated npm packages, upgrade all dependencies, and run lint, build, and test. This helps keep your project up to date and healthy.
- **All Dependencies Up to Date:** Core packages like `firebase`, `rollup`, and others are now kept current. The project uses ES Modules (`type: module` in `package.json`) for modern compatibility.
- **All Tests Passing:** 61/61 tests pass, including unit and integration tests for Cloud Functions and client logic.
- **All Tests Passing:** 61/61 tests pass in the main `/tests` system, including unit and integration tests for Cloud Functions and client logic. Redesign-specific test files have been removed; only the core test suite is maintained.
- **Strict Linting, Formatting, and Build:** Code quality is enforced with ESLint and Prettier. The build process is automated and tested after every update.
- **Cloud Functions Deployment:** All functions are deployed as 2nd Gen in `europe-west1` and tested for permissions and runtime issues.

## Accessibility & Usability

- All navigation tabs and filter/sort controls are now accessible by keyboard and screen reader.
- Color contrast and focus states have been improved for all interactive elements.
- The UI is responsive and mobile-friendly.
- All error and confirmation messages use a consistent, accessible toast notification system.
- Delete confirmation dialog buttons are styled and accessible, matching the rest of the UI.

---

**Recent Highlights (Completed as part of Phase 1 & 2 of PROJECT_PLAN.md):**

- Full Firebase Integration (Auth & Firestore using v9+ SDK).
- Rollup bundling for all JavaScript.
- Refactoring of all JS to ES Modules.
- Email/Password and Google Sign-In (using `chrome.identity.launchWebAuthFlow`).
- Comprehensive CRUD for prompts with cloud storage.
- New Rating System: Per-user ratings and display of community average (client-side aggregation for now).
- New Favorites System: Per-user favoriting of any prompt and `favoritesCount`.
- `usageCount` for copied prompts.
- Enhanced prompt details display and form field requirements.
- Improved UX for logged-out users attempting actions.

**Recent Accomplishments:**

- ✅ **Unit Tests Updated & Passing:** All tests in the main `/tests` system have been adapted for ES Modules and Firebase v9 SDK. A global Jest mock for `js/firebase-init.js` ensures all test files use the same mock for Firebase services, and all 61 tests now pass reliably. Redesign-specific test files have been removed as part of project maintenance.
- ✅ **Unit Tests Updated & Passing:** All tests in the main `/tests` system have been adapted for ES Modules and Firebase v9 SDK. A global Jest mock for `js/firebase-init.js` ensures all test files use the same mock for Firebase services, and all 61 tests now pass reliably. Redesign-specific test files have been removed as part of project maintenance.
- ✅ **Firestore Security Rules:** Implemented robust data protection.
- ✅ **Cloud Functions for Aggregation:** Implemented server-side calculation for `averageRating`, `totalRatingsCount`, and `favoritesCount`.

**Key Next Steps (from PROJECT_PLAN.md):**

- UI/UX Refinements: Improve popup layout, user flows, and prompt display.
- Performance Testing & Optimization: Ensure smooth operation with larger datasets.
- End-to-end testing with real Firebase services in a test environment.

## Installation & Setup

1. **Prerequisites**: Node.js and npm (or a compatible package manager) installed.
2. **Clone Repository:**

   ```bash
   git clone https://github.com/mjolne/promptfinder.git # Replace with your repo URL if different
   cd promptfinder
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

   This installs Firebase, Rollup, ESLint, Prettier, Jest, and other necessary packages.

4. **Build the Extension:**

   ```bash
   npm run build
   ```

   This command will lint, format, and bundle the JavaScript using Rollup, placing the output in the `dist/` directory. It also processes CSS.

5. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" (usually a toggle in the top right corner).
   - Click "Load unpacked".
   - Select the **root directory** of the `promptfinder` project (the one containing `manifest.json` and the `dist/` folder).
6. The PromptFinder extension icon should appear in your browser toolbar.

## Firefox Compatibility

PromptFinder supports both Chrome and Firefox browsers with a cross-browser OAuth configuration system:

### Browser-Specific OAuth Configuration

- **Chrome**: Uses OAuth2 configuration from `manifest.json` (required for `chrome.identity.launchWebAuthFlow()` API)
- **Firefox**: Shows a console warning about the `oauth2` manifest property but uses fallback configuration from `config/oauth-config.js`

### Firefox Console Warning

When running in Firefox, you may see this warning in the console:

```
Reading manifest: Warning processing oauth2: An unexpected property was found in the WebExtension manifest.
```

This is **expected behavior** and does not affect functionality. The warning occurs because:

1. Chrome requires `oauth2` in manifest.json for the identity API to work
2. Firefox doesn't recognize this Chrome-specific property but safely ignores it
3. Our code automatically falls back to the cross-browser configuration

### Cross-Browser Testing

- **Firefox Development**: Use `npm run dev:firefox` to test in Firefox Developer Edition
- **Chrome Development**: Build with `npm run build` and load as unpacked extension
- **Both browsers**: OAuth authentication works correctly with the appropriate configuration source

## Development Workflow

1. **Make Code Changes:** Edit source files in `js/`, `pages/`, `css/`, etc.
2. **Lint & Format (Recommended):**

   ```bash
   npm run lint:fix
   # or run formatting separately
   npm run format
   ```

3. **Build JavaScript (if not using watch mode):**

   ```bash
   npm run build:js:dev
   # or the full build
   npm run build
   ```

4. **Watch Mode (Recommended for Active Development):** For automatic rebuilding of JavaScript on changes:

   ```bash
   npm run watch:js
   ```

   You will still need to manually reload the extension in Chrome to see changes.

5. **Reload Extension in Chrome:** After making changes and rebuilding (if not using watch mode, or even with it for some changes), go to `chrome://extensions/` and click the reload icon for PromptFinder.

### Testing

Jest is used for unit testing. The main `/tests` suite is fully updated for ES Modules and Firebase v9 SDK. **A global Jest mock for `js/firebase-init.js` is used in `tests/setupTests.js` to ensure all test files use the same mock for `auth`, `db`, and `functions`.**

**Note:** All redesign-specific test files and ad hoc test HTML/scripts have been removed. Only the core `/tests` system is maintained and used for ongoing production and maintenance testing.

To run tests:

```bash
npm test
npm test -- --watch # For watch mode
```

All tests are now passing (61 tests across 7 test suites). The test coverage includes:

- Core data operations (CRUD, auth, favorites, ratings)
- Firebase integration (Firestore operations, security rules)
- Cloud Functions (recalculate ratings, update favorites count, usage tracking)
- UI interactions (event handling, rendering, state management)

The testing implementation includes:

- Global Jest mock for Firebase services (`js/firebase-init.js`)
- Simulated user authentication with `simulateLogin`/`simulateLogout` helpers
- Error condition testing
- Integration tests for Cloud Functions

For detailed test status and future test expansion plans, see the testing section in [PROJECT_PLAN.md](PROJECT_PLAN.md).

## Firebase Cloud Functions

The project uses Firebase Cloud Functions for server-side operations, including search, aggregation, and usage tracking:

- `/functions` directory contains its own `package.json` and dependencies (this is by Firebase design)
- Functions are written in TypeScript in the `/functions/src` directory
- ESLint and Prettier configurations in the functions directory are specifically for TypeScript

To work with Cloud Functions:

```bash
# Install functions dependencies
cd functions
npm install

# Build functions
npm run build

# Deploy functions (including the new searchPrompts Cloud Function)
npm run deploy

# Run functions locally with the Firebase emulator
npm run serve
```

The main implemented functions are:

- `searchPrompts`: Prioritized, weighted, typo-tolerant search for prompts (see `src/searchPrompts.ts`)
- `recalculateRating`: Updates average ratings when a rating changes
- `updateFavoritesCount`: Maintains accurate favorites counts
- `incrementUsageCount`: Tracks usage counts when prompts are copied
- `recalculateAllStats`: Admin function to recalculate all stats

> **Note:** The `searchPrompts` Cloud Function is deployed and updated automatically with the standard deployment command above.

For details on deployment and testing, see:

- [FIREBASE_CLOUD_FUNCTIONS_DEPLOYMENT.md](/docs/FIREBASE_CLOUD_FUNCTIONS_DEPLOYMENT.md)
- [TESTING_CLOUD_FUNCTIONS.md](/docs/TESTING_CLOUD_FUNCTIONS.md)

## Centralized Text Management

The project uses a centralized text management system to maintain consistency and enable future internationalization:

- **Text Constants:** All user-facing strings are defined in `js/text-constants.js` with 137 organized constants
- **TextManager Class:** Provides `get()`, `has()`, and `format()` methods for text retrieval and interpolation
- **Variable Interpolation:** Dynamic text uses `{{variable}}` syntax with proper escaping (e.g., `getText('WELCOME_MESSAGE', {name: 'John'})`)
- **I18n Ready:** Built with locale support infrastructure for future multi-language support
- **Consistent Messaging:** All authentication, validation, error, and success messages use the centralized system

**Usage Examples:**

```javascript
// Simple text retrieval
const message = getText('LOGIN_SUCCESS');

// Text with variable interpolation
const welcome = textManager.format('WELCOME_USER', { name: user.displayName });

// Check if text constant exists
if (textManager.has('CUSTOM_MESSAGE')) {
  // Use the constant
}
```

For detailed implementation information, see [CENTRALIZED_TEXT_MANAGEMENT_SUMMARY.md](/docs/CENTRALIZED_TEXT_MANAGEMENT_SUMMARY.md).

## File Structure Overview

```plaintext
promptfinder/
├── css/                    # Source CSS files (modular structure) - 92K total
│   ├── base/
│   ├── components/
│   ├── layout/
│   └── pages/
├── dist/                   # Build output (gitignored)
│   ├── js/
│   └── pages/
│   └── css-purged/         # Optimized CSS output - 52K (43% reduction via PurgeCSS)
├── docs/                   # Documentation
├── functions/               # Firebase Cloud Functions
│   ├── src/                 # TypeScript source code for Cloud Functions
│   ├── lib/                 # Compiled JavaScript (generated from TypeScript)
│   ├── node_modules/        # Functions-specific dependencies
│   ├── package.json         # Functions-specific package config
│   └── tsconfig.json        # TypeScript configuration for Functions
├── icons/                  # Extension icons
├── js/                     # Source JavaScript modules
│   ├── firebase-init.js
│   ├── promptData.js
│   ├── text-constants.js   # Centralized text management system
│   ├── ui.js
│   └── utils.js
├── node_modules/           # (Ignored by Git)
├── pages/                  # Source HTML and page-specific JS
│   ├── add-prompt.html
│   ├── add-prompt.js
│   ├── edit-prompt.html
│   ├── edit-prompt.js
│   └── popup.html
├── tests/                  # Jest test files
├── .gitignore
├── app.js                  # Main entry point for popup (source)
├── babel.config.json
├── eslint.config.mjs       # ESLint configuration
├── manifest.json
├── package-lock.json
├── package.json
├── PROJECT_PLAN.md         # Detailed project roadmap and task tracking
├── purgecss.config.mjs
├── README.md               # This file
└── rollup.config.js        # Rollup bundler configuration
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

This project is open-sourced. (Consider adding a `LICENSE.txt` file, e.g., MIT License).
