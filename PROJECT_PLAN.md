## PromptFinder Project Plan

**Last Updated**: May 17, 2025

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

1.  ✅ **Technology Stack & Initial Setup**:
    - ✅ Backend: Firebase (Firestore for DB, Firebase Authentication for Users - v9+ modular SDK).
    - ✅ Frontend: JavaScript, HTML, CSS. Bundler (Rollup) integrated.
    - ✅ ESLint, Prettier, Jest configured.
2.  ✅ **Development Environment**:
    - ✅ Firebase project setup.
    - ✅ Local development environment configured for Firebase interaction.
    - ✅ Setup Rollup for JavaScript bundling & `package.json` build scripts.
3.  ✅ **Integrate Firebase v9+ Modular SDK & Full JS Refactor to ES Modules**:
    - ✅ Install Firebase v9+ SDK via npm.
    - ✅ Refactor `js/firebase-init.js` to use v9 modular imports and export initialized services (auth, db).
    - ✅ Refactor all core JS files (`js/promptData.js`, `js/utils.js`, `js/ui.js`, `app.js`) to use ES Modules.
    - ✅ Refactor page-specific scripts (`pages/add-prompt.js`, `pages/edit-prompt.js`) to use ES Modules.
    - ✅ Update HTML files to load bundled scripts from `dist/`.
    - ✅ Remove old `lib/firebase` local SDK copies.
4.  ✅ **Data Models Defined (Initial Version)**:
    - ✅ `users` collection (basic profile info).
    - ✅ `prompts` collection (prompt data, `userId` for ownership, etc.).
    - ✅ `prompts/{promptId}/ratings/{userId}` subcollection for individual user ratings.
    - ✅ `prompts/{promptId}/favoritedBy/{userId}` subcollection for user favorites.

---

### Phase 2: Core Features & UX Enhancements (LARGELY COMPLETE)

_Status: 🚧_

1.  ✅ **User Authentication Integration (Firebase v9 Modular)**:
    - ✅ Implement Email/Password signup with Display Name.
      - ✅ HTML form updated for Display Name.
      - ✅ `app.js` handles Display Name input.
      - ✅ `promptData.js` saves Display Name to Firebase Auth profile & Firestore user document.
    - ✅ Implement Email/Password login.
    - ✅ Implement Google Sign-In using `chrome.identity.launchWebAuthFlow`.
      - ✅ `manifest.json` updated with `identity` permission & `oauth2` client ID/scopes.
      - ✅ Google Cloud Console: Chrome App OAuth Client ID configured with correct extension ID & redirect URI.
      - ✅ Firebase Console: Chrome App Client ID safelisted for Google Sign-In provider.
    - ✅ User document in Firestore (`users` collection) created/updated upon new user signup/Google Sign-In.
    - ✅ Logout functionality.
    - ✅ Auth state changes correctly update UI.
2.  ✅ **Prompt Management (CRUD - Firebase v9 Modular)**:
    - ✅ Add new prompts (with `title`, `description`, `text`, `category`, `tags`, `targetAiTools`, `isPrivate`).
    - ✅ Edit existing prompts (owner only).
    - ✅ Delete prompts (owner only).
    - ✅ Load and display all accessible prompts (own private/public + others' public).
    - ✅ View individual prompt details.
    - ✅ `usageCount` field implemented and incremented on prompt copy.
      - ✅ `copyPromptToClipboard` in `promptData.js` increments `usageCount` without changing `updatedAt`.
      - ✅ Firestore security rules allow `usageCount` increment by any user.
      - ✅ UI (details view) refreshes to show updated `usageCount` after copy.
3.  ✅ **Enhanced Prompt Display & Interaction in Details View**:
    - ✅ Display all relevant Firestore fields: Description, Target AI Tools, Author, Created/Updated dates, Usage Count, Favorites Count, Average Rating, Total Ratings.
    - ✅ Prompt text truncated with "View More/Less" functionality.
    - ✅ Prompt text displayed in a code-formatted block (`<pre><code>`).
    - ✅ Syntax highlighting for Markdown in prompt text using Prism.js (locally bundled).
    - ✅ Edit/Delete buttons moved to bottom of details, shown as full buttons, visible only to prompt owner.
4.  ✅ **Rating System (Per-User & Community Average - Client-Side Aggregation)**:
    - ✅ Users can rate any prompt 1-5 stars (once per prompt, can update).
    - ✅ Individual ratings stored in `prompts/{promptId}/ratings/{userId}`.
    - ✅ `averageRating` and `totalRatingsCount` on main prompt document updated via client-side logic in `promptData.js` (temporary, for UI feedback).
    - ✅ `ratePrompt` function implemented in `promptData.js`.
    - ✅ UI in prompt details view displays "Your Rating" (interactive) and "Community Rating" (read-only, for public prompts), with appropriate labels/messages.
    - ✅ `updatedAt` on main prompt document is NOT changed by rating actions.
5.  ✅ **Favorites System (Per-User & Global Count - Client-Side Aggregation)**:
    - ✅ Users can favorite/unfavorite any prompt.
    - ✅ User's favorite status stored in `prompts/{promptId}/favoritedBy/{userId}`.
    - ✅ `favoritesCount` on main prompt document updated via client-side logic in `promptData.js` (temporary).
    - ✅ `toggleFavorite` function refactored in `promptData.js`.
    - ✅ UI (list and detail views) updates heart icon based on `currentUserIsFavorite`.
    - ✅ "Favorites" tab lists prompts favorited by the current user.
    - ✅ `updatedAt` on main prompt document is NOT changed by favoriting actions.
6.  ✅ **UX for Logged-Out Users & Action Prompts:**
    - ✅ Attempting to "Add New Prompt" or "Favorite" when logged out displays an informative message with a clickable link to the login/signup view.
    - ✅ Messages auto-dismiss after a set time or when the link is clicked.

---

### Phase 3: Backend Robustness & Advanced Features (PLANNED)

_Status: ⬜_

1.  ⬜ **Cloud Functions for Aggregation & Maintenance**:
    - ⬜ Implement Cloud Function to securely and reliably aggregate `averageRating` and `totalRatingsCount` on prompt documents when a new rating is added/updated/deleted in the `ratings` subcollection.
    - ⬜ Implement Cloud Function to securely and reliably update `favoritesCount` on prompt documents when a prompt is favorited/unfavorited in the `favoritedBy` subcollection.
    - ⬜ Implement Cloud Function to delete all subcollections (e.g., `ratings`, `favoritedBy`) when a prompt document is deleted.
    - ⬜ Refactor client-side `ratePrompt` and `toggleFavorite` in `promptData.js` to remove client-side aggregation logic once Cloud Functions are active.
2.  ⬜ **Firestore Security Rules (Comprehensive Implementation)**:
    - ⬜ Refine `read` rules for prompts (e.g., logged-in users can list public prompts and their own, unauthenticated users can only list public prompts that meet certain criteria if desired).
    - ⬜ Ensure all write operations (`create`, `update`, `delete`) for prompts and subcollections are appropriately restricted.
    - ⬜ Review and tighten rules for the `users` collection.
    - ⬜ Thoroughly test all rules using Firebase Emulator Suite or direct testing.
3.  ⬜ **Advanced Querying/Filtering (Potentially with Cloud Functions)**:
    - ⬜ Explore more complex filtering options if client-side filtering becomes insufficient (e.g., filtering by multiple tags AND category).
    - ⬜ Consider server-side search capabilities if dataset grows large.
4.  ⬜ **Implement Remaining Fields from Firestore in Forms/Display (If any missed)**:
    - (Double-check if any fields like `targetAiTools` need more sophisticated UI than comma-separated string if complex interactions are desired).

---

### Phase 4: Testing, UI/UX Refinement, & Optimization (PLANNED)

_Status: ⬜_

1.  🚧 **Unit Tests Update & Expansion**:
    - ⬜ Configure Jest to correctly handle ES Modules (ESM) and the Firebase v9 SDK.
    - ⬜ Update existing tests in `tests/` to align with ESM and v9 API mocks.
    - ⬜ Write new unit tests for recently added functionalities (ratings, favorites, usage count, new UI interactions).
2.  ⬜ **Integration Testing**: Test the interaction between UI, client-side logic, and Firebase services (especially after Cloud Functions and stricter security rules are in place).
3.  ⬜ **UI/UX Refinements**:
    - ⬜ Further refine the display of prompt ownership.
    - ⬜ Review and improve overall popup layout, detached window forms, and user flows based on testing and feedback.
    - ⬜ Consider UI for managing `targetAiTools` if it needs to be more than a text input.
4.  ⬜ **Performance Testing & Optimization**: Basic checks for data loading, query performance, and UI responsiveness, especially after bundling and with larger datasets.

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
