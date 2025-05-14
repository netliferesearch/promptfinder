# Chrome Extension Prompt Storage Migration: Local Storage to Database

## 1. Introduction

This document outlines the implementation plan for migrating the PromptFinder Chrome extension's data storage from `chrome.storage.local` to a cloud-based database solution. The primary goals are to enable synchronization of prompts across devices and browsers, support shared prompts accessible by all users, and maintain private prompts visible only to their creators.

## 2. Goals

*   **Data Synchronization:** Allow users to access their prompts from any device or browser they are logged into.
*   **Shared Prompts Repository:** Create a common pool of prompts that all users can access, contribute to, and benefit from. This includes associated data like ratings and a collective "favorites" count (or similar metric).
*   **Private Prompts:** Ensure users can create and manage private prompts that are not visible to others.
*   **Scalability:** Choose a solution that can handle a growing number of users and prompts.
*   **Security:** Protect user data and ensure secure access to prompts.
*   **Maintainability:** Implement a solution that is well-documented and relatively easy to manage and update.

## 3. User Authentication

**Recommendation:** Implementing a signup/login feature is **highly recommended** for this migration.

**Explanation:**

User authentication is crucial for:

1.  **Synchronization:** To link prompts to a specific user, allowing them to access their data across multiple devices/browsers. Without user accounts, there's no reliable way to identify a user uniquely across different environments.
2.  **Private Prompts:** To ensure that private prompts are only accessible by the user who created them. This requires a secure way to verify user identity.
3.  **Data Security:** To protect user data from unauthorized access and modification.
4.  **Future Features:** User accounts can be a foundation for other potential features like personalized recommendations or sharing controls.

**Advantages:**

*   Securely associates data (prompts, settings) with a specific user.
*   Enables seamless data synchronization.
*   Provides a clear distinction between private and public data.
*   Scales well as new users join.

**Potential Considerations/Complexities:**

*   **Implementation Effort:** Adds development time for UI (login/signup forms), authentication logic, and backend integration.
*   **User Experience:** Users will need to create accounts, which can be a barrier for some. Offering "Sign in with Google/GitHub" or other OAuth providers can simplify this.
*   **Privacy Concerns:** Clear communication about data handling and privacy is essential.
*   **Password Management & Security:** Requires robust security practices for storing user credentials (if not using OAuth exclusively).

**Chosen Authentication Method (Recommendation):**

*   **Firebase Authentication:** Offers a comprehensive suite of authentication methods (email/password, Google, Facebook, GitHub, etc.) with robust security and ease of integration. It handles much of the complexity of user management.

## 4. Recommended Technologies

*   **Database:**
    *   **Cloud Firestore (Firebase):** A NoSQL, document-based database that is highly scalable, offers real-time synchronization, and integrates seamlessly with Firebase Authentication and Cloud Functions. Its flexible data model is well-suited for storing prompts with varying attributes.
*   **Backend Logic (if needed beyond basic CRUD):**
    *   **Firebase Cloud Functions:** For server-side logic that can't or shouldn't run in the client (e.g., complex data validation, aggregation, or interactions with other services).
*   **Authentication:**
    *   **Firebase Authentication:** As mentioned above.
*   **Hosting (for any potential web-based management dashboard or API endpoints):**
    *   **Firebase Hosting:** For static assets and potentially for hosting Cloud Functions accessible via HTTP.

## 5. Data Model Proposal

We'll need at least two main collections in Firestore:

1.  **`users` Collection:**
    *   Document ID: `userId` (from Firebase Authentication)
    *   Fields:
        *   `email`: User's email (if applicable)
        *   `displayName`: User's display name
        *   `createdAt`: Timestamp
        *   Any other user-specific preferences

2.  **`prompts` Collection:**
    *   Document ID: Auto-generated unique ID
    *   Fields:
        *   `text`: The prompt content (string)
        *   `title`: A title for the prompt (string)
        *   `isPrivate`: Boolean (true if private, false if public/shared)
        *   `userId`: The `userId` of the creator (string, foreign key to `users` collection). Essential for private prompts and ownership.
        *   `createdAt`: Timestamp
        *   `updatedAt`: Timestamp
        *   `tags`: Array of strings (for categorization/filtering)
        *   `category`: String (e.g., "Development", "Writing", "Marketing")
        *   **For Shared Prompts (if `isPrivate` is false):**
            *   `averageRating`: Number (calculated average, potentially updated via Cloud Function)
            *   `totalRatings`: Number (count of ratings)
            *   `cumulativeFavorites`: Number (count of how many users have favorited this shared prompt)
        *   **For Private Prompts (if `isPrivate` is true):**
            *   `isFavorite`: Boolean (specific to the `userId`)
            *   `rating`: Number (specific to the `userId`)

**Data Structure for Ratings/Favorites (Alternative/Detailed Approach):**

To handle individual user ratings and favorites for shared prompts more granularly, we could introduce subcollections or related collections:

*   **`prompt_ratings` Collection (if detailed tracking is needed):**
    *   Document ID: `userId_promptId`
    *   Fields:
        *   `userId`: User who rated
        *   `promptId`: Prompt that was rated
        *   `rating`: Number (1-5)
*   **`user_favorites` Collection (maps users to their favorited prompts):**
    *   Document ID: `userId_promptId` (or a subcollection under `users/{userId}/favorites/{promptId}`)
    *   Fields:
        *   `userId`: User who favorited
        *   `promptId`: Favorited prompt
        *   `addedAt`: Timestamp

This more detailed approach offers flexibility but adds complexity. For a start, the fields within the `prompts` collection might be sufficient.

## 6. Implementation Plan Phases

### Phase 1: Planning & Setup (1-2 Weeks)

1.  **Finalize Technology Stack:** Confirm Firebase (Firestore, Authentication, Cloud Functions if needed).
2.  **Set Up Firebase Project:**
    *   Create a new Firebase project.
    *   Enable Firestore database.
    *   Enable Firebase Authentication and configure desired sign-in methods (e.g., Email/Password, Google Sign-In).
3.  **Define Detailed Data Models:** Refine the Firestore collections and document structures based on all feature requirements.
4.  **Security Rules:**
    *   Draft initial Firestore security rules to protect data.
        *   Users can only read/write their own private prompts.
        *   Users can read all shared prompts.
        *   Authenticated users can write new shared prompts (consider moderation or review process if needed).
        *   Authenticated users can update ratings/favorites for shared prompts.
5.  **API Design (Client-Side):**
    *   Define the functions needed in the extension to interact with Firebase (e.g., `addPromptToDb`, `getPrivatePromptsFromDb`, `getSharedPromptsFromDb`, `updatePromptInDb`, `deletePromptFromDb`).
    *   These will replace or augment the existing `PromptData.js` functions.
6.  **UI/UX Design for Authentication:**
    *   Design login/signup forms/flows within the extension.
    *   Design user profile area (if any).
7.  **Migration Strategy for Existing Users:** **No migration service will be offered.** Existing users will need to manually add their prompts to the new system after creating an account. This simplifies development but should be clearly communicated to users.

### Summary of Phase 1 Progress

As of [Current Date - to be filled in manually or updated], Phase 1 (Planning & Setup) is substantially complete. Key accomplishments include:

*   **Technology Stack Finalized:** Confirmed use of Firebase (Cloud Firestore, Firebase Authentication, and potential for Cloud Functions).
*   **Firebase Project Setup:** User has created the Firebase project, enabled Firestore, and configured authentication methods. The `firebaseConfig` details are available.
*   **Detailed Data Models Defined:** Comprehensive data models for `users`, `prompts`, and `user_prompt_interactions` collections have been defined, including fields like `targetAiTools` in the `prompts` collection based on specific requirements.
*   **Initial Firestore Security Rules Drafted:** A foundational set of security rules has been drafted to govern access to the collections based on user authentication and data ownership.
*   **Client-Side API Design Outlined:** A list of necessary JavaScript functions for interacting with Firebase (authentication, CRUD operations for prompts, handling user interactions) has been created to guide the modification of `js/promptData.js`.
*   **UI/UX for Authentication Discussed:** A clear plan for UI elements and user flows for login, signup, logout, and accessing user preferences (dark/light mode, account deletion) has been agreed upon, centering around a gear icon for settings and an account icon for authentication status and actions.
*   **Migration Strategy Confirmed:** Confirmed that no automatic migration for existing users' local data will be implemented.

All planned items for Phase 1 have been addressed, and we are ready to proceed to Phase 2: Development.

### Phase 2: Development (4-8 Weeks)

1.  **Authentication Implementation (Email/Password):**
    *   Integrate Firebase Authentication SDK into the Chrome extension (using local -compat.js files).
    *   Implement login, signup, logout (email/password) UI and logic in `popup.html`, `app.js`, and `js/promptData.js`.
    *   Update UI to reflect logged-in/logged-out state for email/password auth.
2.  **Implement Google Sign-In with Offscreen Document (Manifest V3):**
    *   Add "offscreen" permission to `manifest.json`.
    *   Create an offscreen HTML document (`offscreen.html`) and its corresponding JavaScript (`offscreen.js`).
    *   `offscreen.js` will handle the `firebase.auth.signInWithPopup(googleProvider)` call.
    *   Use `chrome.runtime.sendMessage` to communicate between `app.js` (or `js/promptData.js`) and `offscreen.js` to initiate the flow and receive the result.
    *   Update `signInWithGoogle` in `js/promptData.js` to use this offscreen document mechanism.
    *   Ensure appropriate UI feedback during the Google Sign-in process.
3.  **Firebase SDK Integration (Firestore):**
    *   Add Firebase SDK (Firestore - `firebase-firestore-compat.js`) to the extension's local library.
    *   Initialize Firebase (Firestore) in `js/firebase-init.js` and make `db` globally available.
4.  **CRUD Operations for Prompts (Firestore):**
    *   **Modify `js/promptData.js`:**
        *   Replace `chrome.storage.local.get` and `chrome.storage.local.set` calls with Firestore `get`, `add`, `update`, `delete` operations for prompts.
        *   Associate prompts with `currentUser.uid`.
        *   Refactor `loadPrompts` to fetch prompts based on user (private vs. shared - initially focus on user's own prompts).
        *   Update `addPrompt`, `updatePrompt`, `deletePrompt` to use Firestore.
    *   **Update UI Logic (`js/ui.js`, `app.js`):**
        *   Adapt UI rendering functions to work with data fetched from Firestore.
        *   Ensure UI updates correctly reflect private vs. shared status (once shared implemented).
5.  **Implement "Private" Tab Logic (Firestore):**
    *   Ensure the "Private" tab only fetches and displays prompts where `isPrivate == true` and `userId` matches the currently logged-in user from Firestore.
6.  **Implement Shared Prompts Logic (Firestore - Initial Phase):**
    *   The main or "All Prompts" tab should display all shared prompts (`isPrivate == false`) from Firestore.
    *   Focus on read-only for shared prompts initially if contribution flow is complex.
7.  **Rating and Favorites for Shared Prompts (Firestore - Initial Phase):**
    *   Implement basic UI for rating/favoriting shared prompts.
    *   Defer complex aggregation or Cloud Function logic for `averageRating` etc., if necessary, focusing on storing individual user interactions (e.g., in `user_prompt_interactions` collection or directly on the prompt if simpler for a first pass).
8.  **Implement Firestore Security Rules:**
    *   Deploy and thoroughly test the security rules defined in the planning phase, adapting as necessary for prompt data.
9.  **Data Migration:** **Not applicable** as per the decision to not offer a migration service.
10. **Error Handling:**
    *   Continuously refine error handling for Firebase operations in `js/utils.js` and throughout the data/UI layers.
11. **Testing:**
    *   Unit tests for new/modified data service functions in `js/promptData.js`.
    *   Integration tests for Firebase interactions (Auth and Firestore).
    *   End-to-end tests for login, prompt creation (public/private), viewing, and synchronization.

### Phase 3: Testing & Deployment (2-4 Weeks)

1.  **Thorough Testing:**
    *   **Functional Testing:** Verify all features work as expected (CRUD, private/shared, ratings, favorites, auth, Google Sign-In).
    *   **Security Testing:** Test Firestore security rules rigorously.
    *   **Cross-Device/Browser Testing:** Test synchronization.
    *   **Performance Testing:** Assess load times.
    *   **Usability Testing:** Get feedback.
2.  **Beta Testing (Recommended):**
    *   Release to a small group of beta testers.
3.  **Integrate Firebase Analytics:**
    *   Include Firebase Analytics SDK locally (`firebase-analytics-compat.js`).
    *   Initialize in `js/firebase-init.js` and make it globally available (e.g., `window.firebaseAnalytics`).
    *   Log relevant user interaction events (e.g., login, signup, prompt_added, prompt_copied, feature_used).
4.  **Documentation:**
    *   Update user-facing documentation.
    *   Document new architecture for maintainers.
5.  **Review and Address Dependency Warnings:**
    *   Investigate warnings from `npm install`. Specific warnings observed around late 2024 include:
        *   **EBADENGINE (Unsupported engine) for multiple ESLint-related packages:** 
            *   `@eslint/config-array@0.20.0`
            *   `@eslint/config-helpers@0.2.2`
            *   `@eslint/core@0.13.0`
            *   `@eslint/eslintrc@3.3.1`
            *   `@eslint/js@9.26.0`
            *   `@eslint/object-schema@2.1.6`
            *   `@eslint/plugin-kit@0.2.8`
            *   `eslint@9.26.0`
            *   `eslint-scope@8.3.0`
            *   `eslint-visitor-keys@4.2.0`
            *   `espree@10.3.0`
            *   (All noted as requiring Node.js `^18.18.0 || ^20.9.0 || >=21.1.0`, while project was using `v20.1.0`)
        *   **Deprecated Packages:**
            *   `inflight@1.0.6`: Leaks memory. Suggests `lru-cache`.
            *   `abab@2.0.6`: Suggests using native `atob()` and `btoa()`.
            *   `glob@7.2.3`: Versions prior to v9 are no longer supported.
            *   `domexception@4.0.0`: Suggests using native `DOMException`.
    *   Update Node.js/npm version if necessary.
    *   Update or replace deprecated packages.
6.  **Deployment to Chrome Web Store:**
    *   Prepare extension package.
    *   Submit to Chrome Web Store.
7.  **Monitoring & Iteration:**
    *   Monitor Firebase console.
    *   Collect user feedback.

## 7. Potential Challenges & Limitations

*   **Offline Support:** Firestore provides offline data persistence.
*   **Firestore Costs:** Monitor usage.
*   **Security Rule Complexity:** Critical.
*   **Learning Curve:** Firebase/NoSQL.
*   **User Transition:** Manual re-entry of prompts.
*   **Real-time Sync Complexity:** Manage listeners carefully.
*   **Offscreen Document for OAuth:** Adds complexity for social sign-ins in MV3.

## 8. Best Practices

*   **Granular Security Rules.**
*   **Efficient Queries.**
*   **Data Validation.**
*   **Error Handling.**
*   **Environment Configuration.**
*   **Regular Backups.**
*   **Monitor Usage and Costs.**
*   **Iterative Development.**
*   **Clear User Communication.**

## 9. Conclusion

Migrating to Firebase Firestore and Authentication will greatly enhance PromptFinder. Careful planning, phased development, thorough testing, and clear communication are key to success.
