# DesignPrompts Changelog

## [1.1.2] - 2025-08-12

### UI/UX

- Added a sticky controls bar in the prompt details view with a right-aligned Copy Prompt button for better accessibility while scrolling
- Restyled Back to list as a subdued gray pill so it doesn’t compete with the primary copy action
- Matched View more/View less styling with bordered pill treatment; added hover/focus affordances
- Reverted inline code copy control back to an icon; added padding/margin around the sticky bar for visual breathing room

### Functionality

- Usage count now increments for logged-out (anonymous) users when copying a prompt; details view updates accordingly

### Reliability & Tests

- `findPromptById` now gracefully falls back to Firestore in test environments to avoid callable interference
- Updated tests to expect `userId` in callable payloads and to reflect anonymous usage counting
- Reduced noisy test logs by suppressing function retrieval errors in tests; ensured all suites pass

### Build & Tooling

- Fixed build lint error by safely detecting test environment without referencing undefined globals
- Verified: full test suite green and development build succeeds

## [1.1.1] - 2025-08-11

### Fix

- Bump manifest/package version to 1.1.1 for Chrome Web Store (greater than 1.1)

## [1.1.0] - 2025-08-11

### UI/UX

- Moved sticky search to the top of the main view (remains sticky while scrolling)
- Added spacing below tab buttons to prevent clipping
- Header logo is now a home button that contextually navigates:
  - From signup form → back to signup methods
  - From login email form → back to sign-in methods
  - Otherwise → back to main list view

### Auth flow

- New signup method chooser (mirrors sign-in): “Sign up with Google” and “Sign up with email”
- “Sign up with email” reveals a compact form that fits the popup frame
- Back flows consistently restore the relevant chooser and keep the signup link visible

### Polish

- Compact styling for signup form to avoid scroll on small frames
- Minor accessibility improvements to header logo button

## [1.3.0] - 2025-07-21

### Authentication & Cloud Functions Architecture

- **Added**

  - Server-side Cloud Functions for rating and favorites operations (`ratePrompt`, `toggleFavorite`)
  - Enhanced Google Sign-In, email/password login, and signup with proper auth state management
  - Chrome Web Store Manifest V3 compliant authentication system
  - Server-side authentication validation for all user operations

- **Fixed**

  - Resolved Firestore permission-denied errors for rating and favorites operations
  - Fixed email/password login not updating UI after successful authentication
  - Fixed Google Sign-In and logout auth state synchronization
  - Eliminated ESLint warnings for unused imports

- **Security**

  - Migrated client-side Firestore writes to secure server-side Cloud Functions
  - Added proper user ID validation for all authenticated operations
  - Enhanced security compliance for Chrome Web Store approval

- **Improved**
  - Consistent authentication experience across all login methods
  - Better error handling and user feedback for authentication failures
  - Maintained existing UI/UX while improving underlying security

## [1.1.0] - 2025-05-13

### Added

- CSS minification system with `minify-css.sh` script
- CSS quality improvement tool with `improve-css-quality.sh` script
- Environment switching system with `switch-css-env.sh` script
- CSS analysis tool with `find-unused-css.sh` script
- NPM scripts for CSS operations: `css:minify`, `css:improve`, `css:analyze`, and `css:switch`
- Production build command: `npm run build:prod`
- Documentation: `CSS_OPTIMIZATION.md` and `CSS_OPTIMIZATION_SUMMARY.md`

### Changed

- Generated minified CSS in `css-min` directory for production use
- Updated build process to include CSS optimization
- Enhanced CSS with vendor prefixes for better cross-browser compatibility

### Improved

- Reduced CSS file sizes by approximately 8-9% through minification
- Enhanced CSS maintainability with standardized formatting
- Improved developer workflow with environment switching capabilities

### Fixed

- Addressed potential browser compatibility issues with vendor prefixes
- Fixed inconsistent formatting in CSS files

## [1.2.0] - 2025-05-24

### Centralized Text Management

- **Added**

  - Implemented a centralized text management system with 137 constants.
  - Created `TextManager` class for text retrieval, variable interpolation, and existence checking.
  - Updated 93 instances across the codebase to use centralized text constants.

- **Improved**
  - Enhanced maintainability and internationalization readiness.

### CSS Optimization

- **Added**

  - Developed scripts for CSS minification, quality improvement, and unused CSS detection.
  - Created environment switching system for development and production CSS.
  - Added NPM scripts for CSS operations: `css:minify`, `css:improve`, `css:analyze`, and `css:switch`.

- **Improved**
  - Reduced CSS file sizes by ~8-9%.
  - Enhanced cross-browser compatibility with vendor prefixes.
  - Standardized formatting for better maintainability.

### Error Handling & Monitoring

- **Added**

  - Structured error handling with standardized error types and logging functions.
  - Performance tracking with execution time measurements.
  - Monitoring dashboard setup guide for Firebase Cloud Functions.

- **Improved**
  - Enhanced error classification and reporting.
  - Improved visibility into function performance.

### Icon Resizing

- **Added**

  - Resized icons to optimal dimensions (16x16, 48x48, 128x128).
  - Provided resizing instructions using ImageMagick and graphic editors.

- **Improved**
  - Reduced memory usage and improved display quality.

### Tab Navigation Fix

- **Fixed**
  - Restored pill-shaped tab navigation with proper active state highlighting.
  - Consolidated tab styling into `tabs.css` and removed redundant styles.

### Dependency Management

- **Added**

  - Clean installation script to address npm warnings and deprecated packages.

- **Improved**
  - Updated package versions for compatibility with Node.js v20.1.0.

### Testing Infrastructure

- **Added**

  - Comprehensive test cases for error handling and monitoring.
  - Validation scripts for HTML structure, CSS typos, and JavaScript syntax.

- **Improved**
  - Expanded test coverage for Firebase Cloud Functions and edge cases.

### Firestore Security Rules

- **Added**

  - Implemented a structured, modular approach to Firestore security rules.
  - Created helper functions for reusability and maintainability.
  - Added authentication requirements and tiered access control (owner, authenticated user, admin).
  - Developed comprehensive validation for document fields, including type validation and length limits.
  - Protected critical fields like `userId` and stats fields from unauthorized changes.
  - Added admin-specific rules for management operations.

- **Improved**

  - Enhanced data integrity through validation and ownership boundaries.
  - Improved security against data manipulation and injection attacks.
  - Ensured compliance with regulatory requirements for user data protection.

- **Testing**

  - Developed comprehensive test cases covering all rules.
  - Created test scenarios for common use cases and edge cases.

- **Documentation**
  - Documented rule structure, design decisions, and testing approach.
