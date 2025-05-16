## Prompt DB Migration & Feature Enhancement Plan

**Objective**: Migrate to a more robust backend (Firestore) for prompt storage, enable user accounts, and lay the groundwork for future collaborative features.

**Legend**:
-   `⬜` Todo
-   `🚧` In Progress
-   `✅` Completed
-   `❗` Blocked/Issue
-   `❓` Needs Discussion/Decision

---

### Phase 1: Planning & Setup (COMPLETED)
*Status: ✅*
1.  ✅ **Technology Stack Finalized**:
    *   ✅ Backend: Firebase (Firestore for DB, Firebase Authentication for Users).
    *   ✅ Frontend: Existing JavaScript, HTML, CSS structure.
2.  ✅ **Data Models Defined (Initial Version)**:
    *   ✅ `users` collection (basic profile info).
    *   ✅ `prompts` collection (prompt data, `userId` for ownership, `isPublic`, `isPrivate`, etc.).
3.  ✅ **Migration Strategy**:
    *   ✅ New prompts will be written directly to Firestore.
    *   ✅ Existing prompts (if any, from a different storage) - manual migration or separate script (TBD, not critical for initial launch of new system). Current focus is on new system.
4.  ✅ **Development Environment**:
    *   ✅ Firebase project setup.
    -   ✅ Local development environment configured for Firebase interaction (e.g., Firebase emulators or dev project).

---

### Phase 2: Core Migration Implementation (IN PROGRESS)
*Status: 🚧*
1.  ⬜ **Basic data read/write functions for Prompts (CRUD)** - initial version targeting Firestore directly from client-side (`ui.js`, `promptData.js`). *(Partially done, needs review & completion)*
2.  ⬜ **User Authentication integration** for associating prompts with users. *(Partially done, needs review & completion)*
3.  ✅ **Write unit tests** for new data handling and authentication logic in `promptData.js`.
4.  ⬜ **Develop UI for associating prompts with users** (e.g., in add/edit forms, display user ownership).

---

### Phase 3: Cloud Functions & Advanced Logic (PLANNED)
*Status: ⬜*
1.  ⬜ **Develop Cloud Functions for complex queries/logic**:
    *   ⬜ Example: Fetching all public prompts not owned by the current user.
    *   ⬜ Example: Aggregating ratings or usage stats (if planned).
2.  ⬜ **Implement basic prompt rating/favoriting logic** (if not already client-side and needing aggregation).
3.  ⬜ **Refactor client-side code (`promptData.js`)** to call Cloud Functions where appropriate, instead of direct DB access for complex operations.
4.  ⬜ **Security Rules**: Implement comprehensive Firestore security rules.

---

### Phase 4: Testing & Refinement (PLANNED)
*Status: ⬜*
1.  ⬜ **Integration Testing**: Test interaction between UI, client-side logic, and Firebase services.
2.  ⬜ **Refine UI/UX** based on new features.
3.  ⬜ **Security Review**: Thoroughly review security rules and authentication flows.
4.  ⬜ **Performance Testing**: Basic checks for data loading and interaction speed.

---

### Phase 5: Deployment & Monitoring (PLANNED)
*Status: ⬜*
1.  ⬜ **Prepare for "Release"**: This might be an internal release or a broader one depending on the extension's user base.
2.  ⬜ **Monitor**: Basic monitoring of Firestore usage and any Cloud Function logs.
3.  ⬜ **Gather User Feedback**: For new features and any migration-related issues.

---

**Open Questions/Notes**:
-   How to handle truly anonymous users if they are allowed to view public prompts before sign-in? (Current assumption: sign-in is required for most actions).
-   Detailed strategy for migrating prompts from a previous system (if applicable) is deferred.
-   Advanced search/filtering capabilities (beyond basic client-side) will likely require Cloud Functions.
