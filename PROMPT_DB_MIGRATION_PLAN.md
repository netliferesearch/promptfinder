# Chrome Extension Prompt Storage Migration: Local Storage to Database

## 1. Introduction

This document outlines the implementation plan for migrating the PromptFinder Chrome extension's data storage from `chrome.storage.local` to a cloud-based database solution. The primary goals are to enable synchronization of prompts across devices and browsers, support shared prompts accessible by all users, and maintain private prompts visible only to their creators.

## 2. Goals

- [x] **Data Synchronization:** Allow users to access their prompts from any device or browser they are logged into.
- [ ] **Shared Prompts Repository:** Create a common pool of prompts that all users can access, contribute to, and benefit from. This includes associated data like ratings and a collective "favorites" count (or similar metric).
- [x] **Private Prompts:** Ensure users can create and manage private prompts that are not visible to others.
- [x] **Scalability:** Choose a solution that can handle a growing number of users and prompts.
- [x] **Security:** Protect user data and ensure secure access to prompts.
- [x] **Maintainability:** Implement a solution that is well-documented and relatively easy to manage and update.

## 3. User Authentication

**Recommendation:** Implementing a signup/login feature is **highly recommended** for this migration.

**Explanation:**

User authentication is crucial for:

1.  Synchronization: To link prompts to a specific user, allowing them to access their data across multiple devices/browsers.
2.  Private Prompts: To ensure that private prompts are only accessible by the user who created them.
3.  Data Security: To protect user data from unauthorized access and modification.
4.  Future Features: User accounts can be a foundation for other potential features.

**Advantages:** Covered by implementing authentication.

**Potential Considerations/Complexities:** Addressed during implementation.

- [x] **Chosen Authentication Method (Recommendation):** Firebase Authentication.

## 4. Recommended Technologies

- [x] **Database:** Cloud Firestore (Firebase).
- [x] **Backend Logic (if needed beyond basic CRUD):** Firebase Cloud Functions (planned for future if needed).
- [x] **Authentication:** Firebase Authentication.
- [x] **Hosting (for any potential web-based management dashboard or API endpoints):** Firebase Hosting (planned for future if needed).

## 5. Data Model Proposal

- [x] Defined initial data models for `users`, `prompts`, and `user_prompt_interactions` collections.

## 6. Implementation Plan Phases

### Phase 1: Planning & Setup (1-2 Weeks) - COMPLETED

- [x] 1.  **Finalize Technology Stack:** Confirmed Firebase (Firestore, Authentication).
- [x] 2.  **Set Up Firebase Project:** Created project, enabled services.
- [x] 3.  **Define Detailed Data Models:** Refined Firestore collections and structures.
- [x] 4.  **Security Rules (Initial Draft):** Drafted initial Firestore security rules.
- [x] 5.  **API Design (Client-Side):** Outlined functions for Firebase interaction.
- [x] 6.  **UI/UX Design for Authentication:** Designed login/signup flows and UI elements.
- [x] 7.  **Migration Strategy for Existing Users:** Confirmed no migration service.

### Summary of Phase 1 Progress - COMPLETED

(Summary details omitted for brevity here, but present in the actual file)

### Phase 2: Development (4-8 Weeks) - IN PROGRESS

- [x] 1.  **Authentication Implementation (Email/Password):**
    - [x] Integrate Firebase Authentication SDK (local -compat.js files).
    - [x] Implement login, signup, logout UI and logic.
    - [x] Update UI to reflect logged-in/logged-out state.
- [ ] 2.  **Implement Google Sign-In with Offscreen Document (Manifest V3):**
    - [x] Add placeholder function and UI button.
    - [ ] Add "offscreen" permission to `manifest.json`.
    - [ ] Create an offscreen HTML document (`offscreen.html`) and `offscreen.js`.
    - [ ] Implement `signInWithPopup` in `offscreen.js`.
    - [ ] Implement `chrome.runtime.sendMessage` for communication.
    - [ ] Update `signInWithGoogle` in `js/promptData.js`.
- [x] 3.  **Firebase SDK Integration (Firestore):**
    - [x] Add Firebase SDK (Firestore - `firebase-firestore-compat.js`) locally.
    - [x] Initialize Firestore in `js/firebase-init.js`.
- [x] 4.  **CRUD Operations for Prompts (Firestore - User-Owned Focus):**
    - [x] **Modify `js/promptData.js`:**
        - [x] `addPrompt` refactored for Firestore.
        - [x] `loadPrompts` refactored for Firestore (user's own & public).
        - [x] `findPromptById` refactored for Firestore.
        - [x] `updatePrompt` refactored for Firestore.
        - [x] `deletePrompt` refactored for Firestore.
        - [x] `toggleFavorite` refactored for Firestore (for user's own prompts).
        - [x] `updatePromptRating` refactored for Firestore (for user's own prompts).
    - [x] **Update UI Logic (\`js/ui.js\`, \`app.js\`):**
        - [x] Adapt UI rendering for Firestore data.
        - [x] Ensure UI updates for CRUD operations on user-owned prompts.
- [x] 5.  **Implement "Private" Tab Logic (Firestore):** Tested and working.
- [x] 6.  **Implement Shared Prompts Logic (Firestore - Initial Read-Only Phase):** Public prompts are loaded and displayed when logged out or for other users' public prompts when logged in.
- [ ] 7.  **Rating and Favorites for Shared Prompts (Firestore - Initial Phase):** (Allowing users to rate/favorite *other users'* shared prompts)
    - [ ] Design interaction flow for favoriting/rating shared prompts.
    - [ ] Update `js/promptData.js` to write to `user_prompt_interactions` or similar.
    - [ ] Update `js/ui.js` to display and handle these interactions.
    - [ ] (Defer Cloud Functions for aggregation for now).
- [x] 8.  **Implement Firestore Security Rules:** Deployed and tested initial secure rules for current functionality.
- [ ] 9.  **Update Unit Tests for Firestore:**
    - [ ] Refactor `tests/promptData.test.js` & `tests/ui.test.js`.
    - [ ] Mock Firebase/Firestore operations.
    - [ ] Cover new data logic.
- [ ] 10. **Refactor UI Logic for Auth/View Management:**
    - [ ] Move UI manipulation from `app.js` to `js/ui.js`.
- [x] 11. **Error Handling:** Ongoing refinement.
- [x] 12. **Testing (Manual End-to-End):** Ongoing for implemented features.

### Phase 3: Testing & Deployment (2-4 Weeks) - PENDING

- [ ] 1.  **Thorough Testing (Automated & Manual):**
    - [ ] Ensure all unit tests pass.
    - [ ] Comprehensive manual functional testing.
    - [ ] Security Testing (Firestore rules).
    - [ ] Cross-Device/Browser Testing.
    - [ ] Performance Testing.
    - [ ] Usability Testing.
- [ ] 2.  **Beta Testing (Recommended).**
- [ ] 3.  **Integrate Firebase Analytics.**
- [ ] 4.  **Documentation:** Update user and maintainer docs.
- [ ] 5.  **Review and Address Dependency Warnings:** (Detailed list included in actual file).
- [ ] 6.  **Deployment to Chrome Web Store.**
- [ ] 7.  **Monitoring & Iteration.**

## 7. Potential Challenges & Limitations

(Content as previously defined, including Firestore Index Requirements, etc.)

## 8. Best Practices

(Content as previously defined)

## 9. Conclusion

(Content as previously defined)
