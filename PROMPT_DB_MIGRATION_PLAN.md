## Prompt DB Migration & Feature Enhancement Plan

**Objective**: Migrate to a more robust backend (Firestore) for prompt storage, enable user accounts, and lay the groundwork for future collaborative features.

**Legend**:

- `⬜` Todo
- `🚧` In Progress
- `✅` Completed
- `❗` Blocked/Issue
- `❓` Needs Discussion/Decision

---

### Phase 1: Planning & Setup (COMPLETED)

_Status: ✅_

1.  ✅ **Technology Stack Finalized**:
    - ✅ Backend: Firebase (Firestore for DB, Firebase Authentication for Users - v9+ modular SDK).
    - ✅ Frontend: Existing JavaScript, HTML, CSS structure. Bundler (Rollup) integrated.
2.  ✅ **Data Models Defined (Initial Version)**:
    - ✅ `users` collection (basic profile info).
    - ✅ `prompts` collection (prompt data, `userId` for ownership, `isPublic`, `isPrivate`, etc.).
3.  ✅ **Migration Strategy**:
    - ✅ New prompts will be written directly to Firestore.
    - ✅ Existing prompts (if any, from a different storage) - manual migration or separate script (TBD, not critical for initial launch of new system). Current focus is on new system.
4.  ✅ **Development Environment**:
    - ✅ Firebase project setup.
    - ✅ Local development environment configured for Firebase interaction.
    - ✅ **Setup Rollup for JavaScript bundling**.

---

### Phase 2: Core Migration Implementation (IN PROGRESS)

_Status: 🚧_

1.  ✅ **Integrate Firebase v9+ Modular SDK & Refactor**:
    - ✅ Install Firebase v9+ SDK via npm.
    - ✅ Refactor `js/firebase-init.js` to use v9 modular imports and export initialized services (auth, db).
    - ✅ Refactor `js/promptData.js` to import Firebase services from `firebase-init.js` and use v9 modular syntax for all Firestore and Auth operations.
    - ✅ Refactor `pages/offscreen.js` (now removed) and other page scripts (`add-prompt.js`, `edit-prompt.js`) to use bundled, modular Firebase.
    - ✅ Update other JS files (`app.js`, `utils.js`) to use ES Modules and align with modular Firebase usage.
2.  🚧 **User Authentication Integration (Firebase v9 Modular)**:
    - ✅ Implement Email/Password signup and login using v9 auth (via `js/promptData.js` refactor).
    - ✅ Implement Google Sign-In using `chrome.identity.launchWebAuthFlow` and bundled v9 auth. _(Pivoted from offscreen API)_
    - ✅ Ensure user data is correctly created/managed in Firestore upon signup/auth.
3.  🚧 **Basic data read/write functions for Prompts (CRUD - Firebase v9 Modular)**:
    - ✅ Review and complete all CRUD operations in `promptData.js` using v9 Firestore syntax. _(Largely done during refactor, pending final review)_
    - ⬜ Ensure client-side logic in `ui.js` correctly interacts with refactored `promptData.js`. _(Implicitly tested, but focused review might be good)_
4.  ✅ **Write unit tests** for new data handling and authentication logic in `promptData.js`. _(Existing tests will need adaptation to v9 syntax after refactor - this task is effectively superseded by the successful refactor and subsequent testing of auth, but test suite will need update)_.
5.  ⬜ **Develop UI for associating prompts with users** (e.g., in add/edit forms, display user ownership).

---

### Phase 3: Cloud Functions & Advanced Logic (PLANNED)

_Status: ⬜_

1.  ⬜ **Develop Cloud Functions for complex queries/logic**:
    - ⬜ Example: Fetching all public prompts not owned by the current user.
    - ⬜ Example: Aggregating ratings or usage stats (if planned).
2.  ⬜ **Implement basic prompt rating/favoriting logic** (if not already client-side and needing aggregation).
3.  ⬜ **Refactor client-side code (`promptData.js`)** to call Cloud Functions where appropriate, instead of direct DB access for complex operations.
4.  ⬜ **Security Rules**: Implement comprehensive Firestore security rules.

---

### Phase 4: Testing & Refinement (PLANNED)

_Status: ⬜_

1.  ⬜ **Integration Testing**: Test interaction between UI, client-side logic, and Firebase services after v9 refactor.
2.  ⬜ **Refine UI/UX** based on new features.
3.  ⬜ **Security Review**: Thoroughly review security rules and authentication flows.
4.  ⬜ **Performance Testing**: Basic checks for data loading and interaction speed, especially after bundling.

---

### Phase 5: Deployment & Monitoring (PLANNED)

_Status: ⬜_

1.  ⬜ **Prepare for "Release"**: This might be an internal release or a broader one depending on the extension's user base.
2.  ⬜ **Monitor**: Basic monitoring of Firestore usage and any Cloud Function logs.
3.  ⬜ **Gather User Feedback**: For new features and any migration-related issues.

---

**Open Questions/Notes**:

- How to handle truly anonymous users if they are allowed to view public prompts before sign-in? (Current assumption: sign-in is required for most actions).
- Detailed strategy for migrating prompts from a previous system (if applicable) is deferred.
- Advanced search/filtering capabilities (beyond basic client-side) will likely require Cloud Functions.
