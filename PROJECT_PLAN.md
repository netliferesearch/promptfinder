## PromptFinder Project Plan

**Last Updated**: May 19, 2025

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

1.  ✅ **Technology Stack & Initial Setup**
2.  ✅ **Development Environment**
3.  ✅ **Integrate Firebase v9+ Modular SDK & Full JS Refactor to ES Modules**
4.  ✅ **Data Models Defined (Initial Version)**

---

### Phase 2: Core Features & UX Enhancements (COMPLETED)

_Status: ✅_

1.  ✅ **User Authentication Integration (Firebase v9 Modular)**
2.  ✅ **Prompt Management (CRUD - Firebase v9 Modular)**
3.  ✅ **Enhanced Prompt Display & Interaction in Details View**
4.  ✅ **Rating System (Per-User & Community Average - Client-Side Aggregation)**
5.  ✅ **Favorites System (Per-User & Global Count - Client-Side Aggregation)**
6.  ✅ **UX for Logged-Out Users & Action Prompts**

---

### Phase 3: Backend Robustness & Advanced Features (PLANNED)

_Status: ⬜_

1.  ⬜ **Cloud Functions for Aggregation & Maintenance**
2.  ⬜ **Firestore Security Rules (Comprehensive Implementation)**
3.  ⬜ **Advanced Querying/Filtering (Potentially with Cloud Functions)**
4.  ⬜ **Implement Remaining Fields from Firestore in Forms/Display (If any missed)**

---

### Phase 4: Testing, UI/UX Refinement, & Optimization (NOW IN PROGRESS)

_Status: 🚧_

1.  🚧 **Unit Tests Update & Expansion**:
    - ✅ Configure Jest to correctly handle ES Modules (ESM) and the Firebase v9 SDK.
    - ✅ Update existing tests in `tests/` to align with ESM and v9 API mocks (including `increment()` handling, improved mock stability for `setPathData`).
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
2.  ⬜ **Integration Testing**: Test the interaction between UI, client-side logic, and Firebase services (especially after Cloud Functions and stricter security rules are in place).
3.  ⬜ **UI/UX Refinements**:
    - ⬜ Further refine the display of prompt ownership.
    - ⬜ Review and improve overall popup layout, detached window forms, and user flows based on testing and feedback.
    - ⬜ Consider UI for managing `targetAiTools` if it needs to be more than a text input.
4.  ⬜ **Performance Testing & Optimization**: Basic checks for data loading, query performance, and UI responsiveness, especially after bundling and with larger datasets.

---

### Ongoing Testing Status & Roadmap (Unit Tests)

This section provides a snapshot of current unit test coverage and areas for future expansion. This is a sub-section of Phase 4.1.

**Covered (`✅`):**

-   **`promptData.js` (Data Logic):**
    -   ✅ User Authentication (signup, login, logout, auth state)
    -   ✅ Prompt CRUD (add, (implicitly by load/find: get, update, delete))
    -   ✅ Rating System (`ratePrompt` - add new, update existing, invalid, logged out)
    -   ✅ Favorites System (`toggleFavorite` - favorite, unfavorite, toggle multiple, logged out, no ID)
    -   ✅ Usage Count (`copyPromptToClipboard`)
    -   ✅ Filtering Logic (`filterPrompts` - though tests might be in `ui.test.js` context if not directly tested)
-   **`ui.js` (UI Logic - Partial):**
    -   ✅ Initialization, DOM caching, basic event listener setup (`initializeUI`)
    -   ✅ Data loading and initial display (`loadAndDisplayData`, `displayPrompts`)
    -   ✅ Prompt list item click handling (`handlePromptListClick` and its delegations to `handleToggleFavorite`, `viewPromptDetails`, `handleCopyPrompt`)
    -   ✅ Basic prompt details display (`displayPromptDetails` - checked via side-effects)
-   **`utils.js` (Utility Functions):**
    -   ✅ `chromeStorageGet`, `chromeStorageSet`
    -   ✅ Error/Confirmation message handling (`handleError`, `showConfirmationMessage`)
    -   ✅ `highlightStars`, `escapeHTML`

**To Be Tested (`⬜`) / Areas for Expansion (`🚧`):**

-   **`ui.js` (UI Logic - Remaining):**
    -   ⬜ **Tab Switching & Filtering:**
        -   `showTab('all')`, `showTab('favs')`, `showTab('private')` - verify correct calls to `filterPrompts` and `displayPrompts`.
        -   Verify active class toggling on tab buttons.
        -   Verify UI state changes (e.g., details view hidden, list shown).
    -   ⬜ **Search Functionality:**
        -   `searchInputEl` event listener triggering `showTab`.
        -   Verify `filterPrompts` is called with correct `searchTerm`.
    -   ⬜ **Rating Filter Panel:**
        -   `filterButtonEl` click toggling `ratingFilterPanelEl` visibility and button active state.
        -   `minRatingSelectEl` change event triggering `showTab`.
        -   Verify `filterPrompts` is called with correct `minRating`.
    -   ⬜ **Prompt Details View Interactions (More granular):**
        -   Back button (`backToListButtonEl`) functionality (calls `showPromptList`).
        -   Copy button on details page (`copyPromptDetailButtonEl`) calling `handleCopyPrompt`.
        -   Edit button (`editPromptButtonEl`) calling `openDetachedEditWindow` (check conditions like ownership, disabled state).
        -   Delete button flow (`deletePromptTriggerButtonEl`, `deleteConfirmationEl`, `cancelDeleteButtonEl`, `confirmDeleteButtonEl`) calling `handleDeletePrompt`.
        -   Favorite toggle on details page (`#toggle-fav-detail`) calling `handleToggleFavorite` and updating its own icon.
        -   "View More/Less" for prompt text (`promptTextViewMoreEl`).
        -   Interactive star rating clicks (`userStarRatingEl` children) calling `handleRatePrompt` and UI feedback.
    -   ⬜ **Rendering Edge Cases in `displayPrompts` & `displayPromptDetails`:**
        -   Prompts with missing optional fields (e.g., no tags, no description).
        -   Long text truncation and expansion in `displayPromptDetails`.
        -   Correct display of community ratings vs. user ratings based on `isPrivate` and login state.
    -   ⬜ **Error Handling in UI Event Handlers:**
        -   If `PromptData` functions (e.g., `toggleFavorite`, `ratePrompt`) reject/throw, ensure `Utils.handleError` is called by the UI handler.
    -   🚧 **`openDetachedAddPromptWindow` / `openDetachedEditWindow`:** Verify `chrome.windows.create` is called with correct parameters (these involve Chrome APIs which are mocked).
-   **`app.js` (Main Popup Logic):**
    -   ⬜ Event listeners for login/signup form submissions.
    -   ⬜ Handling of `DOMContentLoaded`.
    -   ⬜ `handleAuthRequiredAction` behavior.
    -   ⬜ Navigation between views (auth vs. main content).
-   **Page-Specific JS (`pages/add-prompt.js`, `pages/edit-prompt.js`):**
    -   ⬜ Form submission logic.
    -   ⬜ Data loading for edit page.
    -   ⬜ Interaction with `chrome.runtime.sendMessage` or other Chrome APIs if used for inter-script communication.

---

### Phase 5: Deployment & Monitoring (PLANNED)

_Status: ⬜_

1.  ⬜ **Prepare for "Release"**.
2.  ⬜ **Monitor**: Firebase usage, Cloud Function logs, and any reported errors.
3.  ⬜ **Gather User Feedback**.

---

**Open Questions/Notes**:

- How to handle truly anonymous users if they are allowed to view public prompts before sign-in? (Current assumption: sign-in is required for most read/write actions other than viewing public prompts).
- Detailed strategy for migrating prompts from a previous system (if applicable) is deferred.
