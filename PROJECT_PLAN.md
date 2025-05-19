## PromptFinder Project Plan

**Last Updated**: May 20, 2025 (Size optimization complete - reduced from 571MB to 467KB)

**Objective**: Migrate to a more robust backend (Firestore) for prompt storage, enable user accounts, implement advanced features like ratings and favorites, and lay the groundwork for future collaborative capabilities.

**Legend**:

- `⬜` Todo
- `🚧` In Progress
- `✅` Completed
- `❗` Blocked/Issue
- `❓` Needs Discussion/Decision

---

### Phase 1: Core Infrastructure & Refactoring (COMPLETED)

_Status: ✅_

1. ✅ **Technology Stack & Initial Setup**
2. ✅ **Development Environment**
3. ✅ **Integrate Firebase v9+ Modular SDK & Full JS Refactor to ES Modules**
4. ✅ **Data Models Defined (Initial Version)**

---

### Phase 2: Core Features & UX Enhancements (COMPLETED)

_Status: ✅_

1. ✅ **User Authentication Integration (Firebase v9 Modular)**
2. ✅ **Prompt Management (CRUD - Firebase v9 Modular)**
3. ✅ **Enhanced Prompt Display & Interaction in Details View**
4. ✅ **Rating System (Per-User & Community Average - Client-Side Aggregation)**
5. ✅ **Favorites System (Per-User & Global Count - Client-Side Aggregation)**
6. ✅ **UX for Logged-Out Users & Action Prompts**

---

### Phase 3: Backend Robustness & Advanced Features (IN PROGRESS)

_Status: 🚧_

1. 🚧 **Cloud Functions for Aggregation & Maintenance**
   - ✅ Implement `recalculateRating` function to update averages when ratings change
   - ✅ Implement `updateFavoritesCount` function to maintain accurate favorites counts
   - ✅ Implement `incrementUsageCount` function to track usage counts when prompts are copied
   - ✅ Implement `recalculateAllStats` admin function to recalculate all statistics
   - ✅ Configure Firebase Functions with correct region (europe-west1)
   - ✅ Update client code to use cloud functions instead of client-side calculations
   - ✅ Create documentation for cloud functions (deployment and testing guides)
   - ✅ Set up proper error handling and logging
     - ✅ Implement structured JSON logging with severity levels (INFO, WARNING, ERROR)
     - ✅ Create error classification system for better error tracking
     - ✅ Add execution time tracking for performance monitoring
     - ✅ Implement error handling wrapper for callable functions
   - 🚧 Add monitoring for function performance
     - ✅ Prepare Cloud Functions for monitoring (execution time, error rates)
     - ✅ Set up monitoring dashboard
     - ✅ Configure alerts for critical errors or performance issues
   - ⬜ Consider implementing pagination or query optimization functions
2. ✅ **Firestore Security Rules (Comprehensive Implementation)**
   - ✅ Implement authentication and access control rules
   - ✅ Add data validation for all collections
   - ✅ Create helper functions for rule reusability
   - ✅ Set up special rules for admin operations
   - ✅ Create test suite for security rules validation
   - ✅ Document security rules implementation
3. ⬜ **Advanced Querying/Filtering (Potentially with Cloud Functions)**
4. ✅ **Implement Remaining Fields from Firestore in Forms/Display (If any missed)**

---

### Phase 4: Testing, UI/UX Refinement, & Optimization (NOW IN PROGRESS)

_Status: 🚧_

1. 🚧 **Unit Tests Update & Expansion**:
   - ✅ Configure Jest to correctly handle ES Modules (ESM) and the Firebase v9 SDK.
   - ✅ Update existing tests in `tests/` to align with ESM and v9 API mocks (including `increment()` handling, improved mock stability for `setPathData`).
   - ✅ Project cleanup: Removed backup files (.bak, .new, .broken) and unnecessary debug logs.
   - 🚧 Write new unit tests for recently added functionalities:
     - ✅ Data Layer (`promptData.js`):
       - ✅ ratings (`ratePrompt`)
       - ✅ favorites (`toggleFavorite`)
       - ✅ usage count (covered by `copyPromptToClipboard` tests)
     - 🚧 UI Layer (`ui.js`):
       - ✅ List item click delegations (`handlePromptListClick` for favorite, view details, copy)
       - ⬜ Tab switching & filtering logic (`showTab`)
       - ⬜ Search input functionality
       - ⬜ Filter panel interactions (toggle, min rating select)
       - ⬜ Prompt Details View: specific interactions (back, copy, edit, delete buttons, view more/less text, favorite toggle on details, star rating clicks)
       - ⬜ Add/Edit form specific UI logic (if any beyond standard form submissions handled by `app.js` or `pages/*.js`)
2. 🚧 **Integration Testing**:
   - 🚧 Test the interaction between UI, client-side logic, and Firebase services
   - **Firebase Cloud Functions:**

- ✅ `recalculateRating`: Unit tests for client-side integration implemented
- ✅ `updateFavoritesCount`: Unit tests for client-side integration implemented
- ✅ `incrementUsageCount`: Unit tests for client-side integration implemented
- ✅ `recalculateAllStats`: Admin function testing implemented
- ✅ Automated testing of Cloud Functions with Firebase emulators
- ⬜ End-to-end testing with real Firebase services in a test environment

3. ⬜ **UI/UX Refinements**:
   - ⬜ Further refine the display of prompt ownership.
   - ⬜ Review and improve overall popup layout, detached window forms, and user flows based on testing and feedback.
   - ⬜ Consider UI for managing `targetAiTools` if it needs to be more than a text input.
4. ✅ **Performance Testing & Optimization**:
   - ✅ Extension Size Optimization: Reduced extension size from 571MB to 467KB (99.9% reduction)
   - ✅ Created optimized packaging script for Chrome Web Store submission
   - ✅ Removed source maps from production builds
   - ✅ Consolidated and minified CSS files
   - ✅ Optimized JavaScript bundling with improved tree shaking
   - ✅ Created documentation for optimization techniques in `docs/EXTENSION_SIZE_OPTIMIZATION.md`
   - ✅ Created detailed size analysis tool in `scripts/analyze-size.sh`
   - ⬜ Further performance optimization for data loading and UI responsiveness

---

### Ongoing Testing Status & Roadmap (Unit Tests)

This section provides a snapshot of current unit test coverage and areas for future expansion. This is a sub-section of Phase 4.1.

**Covered (`✅`):**

- **`promptData.js` (Data Logic):**
  - ✅ User Authentication (signup, login, logout, auth state)
  - ✅ Prompt CRUD (add, (implicitly by load/find: get, update, delete))
  - ✅ Rating System (`ratePrompt` - add new, update existing, invalid, logged out)
  - ✅ Favorites System (`toggleFavorite` - favorite, unfavorite, toggle multiple, logged out, no ID)
  - ✅ Usage Count (`copyPromptToClipboard`)
  - ✅ Filtering Logic (`filterPrompts` - though tests might be in `ui.test.js` context if not directly tested)
- **`ui.js` (UI Logic - Partial):**
  - ✅ Initialization, DOM caching, basic event listener setup (`initializeUI`)
  - ✅ Data loading and initial display (`loadAndDisplayData`, `displayPrompts`)
  - ✅ Prompt list item click handling (`handlePromptListClick` and its delegations to `handleToggleFavorite`, `viewPromptDetails`, `handleCopyPrompt`)
  - ✅ Basic prompt details display (`displayPromptDetails` - checked via side-effects)
- **`utils.js` (Utility Functions):**
  - ✅ `chromeStorageGet`, `chromeStorageSet`
  - ✅ Error/Confirmation message handling (`handleError`, `showConfirmationMessage`)
  - ✅ `highlightStars`, `escapeHTML`
- **Firebase Cloud Functions:**
  - ✅ `recalculateRating`: Unit tests implemented
  - ✅ `updateFavoritesCount`: Unit tests implemented
  - ✅ `incrementUsageCount`: Unit tests implemented
  - ✅ `recalculateAllStats`: Unit tests implemented

**To Be Tested (`⬜`) / Areas for Expansion (`🚧`):**

- **`ui.js` (UI Logic - Remaining):**
  - ⬜ **Tab Switching & Filtering:**
    - `showTab('all')`, `showTab('favs')`, `showTab('private')` - verify correct calls to `filterPrompts` and `displayPrompts`.
    - Verify active class toggling on tab buttons.
    - Verify UI state changes (e.g., details view hidden, list shown).
  - ⬜ **Search Functionality:**
    - `searchInputEl` event listener triggering `showTab`.
    - Verify `filterPrompts` is called with correct `searchTerm`.
  - ⬜ **Rating Filter Panel:**
    - `filterButtonEl` click toggling `ratingFilterPanelEl` visibility and button active state.
    - `minRatingSelectEl` change event triggering `showTab`.
    - Verify `filterPrompts` is called with correct `minRating`.
  - ⬜ **Prompt Details View Interactions (More granular):**
    - Back button (`backToListButtonEl`) functionality (calls `showPromptList`).
    - Copy button on details page (`copyPromptDetailButtonEl`) calling `handleCopyPrompt`.
    - Edit button (`editPromptButtonEl`) calling `openDetachedEditWindow` (check conditions like ownership, disabled state).
    - Delete button flow (`deletePromptTriggerButtonEl`, `deleteConfirmationEl`, `cancelDeleteButtonEl`, `confirmDeleteButtonEl`) calling `handleDeletePrompt`.
    - Favorite toggle on details page (`#toggle-fav-detail`) calling `handleToggleFavorite` and updating its own icon.
    - "View More/Less" for prompt text (`promptTextViewMoreEl`).
    - Interactive star rating clicks (`userStarRatingEl` children) calling `handleRatePrompt` and UI feedback.
  - ⬜ **Rendering Edge Cases in `displayPrompts` & `displayPromptDetails`:**
    - Prompts with missing optional fields (e.g., no tags, no description).
    - Long text truncation and expansion in `displayPromptDetails`.
    - Correct display of community ratings vs. user ratings based on `isPrivate` and login state.
  - ⬜ **Error Handling in UI Event Handlers:**
    - If `PromptData` functions (e.g., `toggleFavorite`, `ratePrompt`) reject/throw, ensure `Utils.handleError` is called by the UI handler.
  - 🚧 **`openDetachedAddPromptWindow` / `openDetachedEditWindow`:** Verify `chrome.windows.create` is called with correct parameters (these involve Chrome APIs which are mocked).
- **`app.js` (Main Popup Logic):**
  - ⬜ Event listeners for login/signup form submissions.
  - ⬜ Handling of `DOMContentLoaded`.
  - ⬜ `handleAuthRequiredAction` behavior.
  - ⬜ Navigation between views (auth vs. main content).
- **Page-Specific JS (`pages/add-prompt.js`, `pages/edit-prompt.js`):**

  - ⬜ Interaction with `chrome.runtime.sendMessage` or other Chrome APIs if used for inter-script communication.

- **Firebase Cloud Functions Integration Testing:**
  - ✅ **Client-side integration with `recalculateRating`:**
    - Verify client properly delegates rating calculation to the Cloud Function
    - Test error handling when the function fails
  - ✅ **Client-side integration with `updateFavoritesCount`:**
    - Verify UI updates correctly after favorite toggling
    - Test error handling when the function fails
  - ✅ **Client-side integration with `incrementUsageCount`:**
    - Verify usage count increments when copying a prompt
    - Test error handling when the function fails
  - ✅ **Admin Functions:**
    - Test `recalculateAllStats` with different data scenarios
    - Verify permissions enforcement for admin-only functions
  - ✅ **Emulator Testing:**
    - Create comprehensive test suite against Firebase emulators
    - Document the testing workflow for contributors

---

### Phase 5: Deployment & Monitoring (PLANNED)

_Status: ⬜_

1. ⬜ **Prepare for "Release"**:
   - ⬜ Finalize documentation
   - ⬜ Conduct final cross-browser testing
   - ⬜ Create release notes
2. ⬜ **Monitor**:
   - ⬜ Set up Firebase usage monitoring dashboard
   - ⬜ Configure Cloud Function performance and error logging
   - ⬜ Set up alerts for critical errors
3. ⬜ **Gather User Feedback**:
   - ⬜ Create feedback form within the extension
   - ⬜ Set up a channel for bug reports
4. ⬜ **Continuous Improvement**:
   - ⬜ Optimize Cloud Functions for performance and cost
   - ⬜ Implement additional Cloud Functions as needs arise
   - ⬜ Regularly update dependencies for security and features

---

**Open Questions/Notes**:

- How to handle truly anonymous users if they are allowed to view public prompts before sign-in? (Current assumption: sign-in is required for most read/write actions other than viewing public prompts).
- Detailed strategy for migrating prompts from a previous system (if applicable) is deferred.
- Cloud Functions setup considerations:
  - Function region (europe-west1) was chosen to better align with Firestore region (europe-north2)
  - Client-side code now properly delegates data aggregation to server-side functions
  - Development workflow uses Firebase emulators for local testing
  - For optimal cost management, consider implementing function usage monitoring and throttling if needed
