## Relevant Files

- `functions/src/searchPrompts.ts` – Cloud Function to handle search queries, ranking, and scoring.
- `functions/src/utils/searchUtils.ts` – Utility functions for scoring, stemming, synonyms, and typo tolerance.
- `functions/src/searchPrompts.test.ts` – Unit and integration tests for the search Cloud Function.
- `js/promptData.js` – Update to call the new Cloud Function for search queries.
- `js/ui.js` – Update to display match annotations in the search results UI.
- `pages/popup.html` – Update to support new UI elements for match annotations (if needed).
- `firestore.rules` – Ensure security rules allow correct access for search queries.
- `tests/promptData.test.js` – Update/add tests for client-side search integration and result handling.
- `tests/ui.test.js` – Update/add tests for UI display of match annotations and accessibility.

### Notes

- Unit tests for Cloud Functions should be placed in `functions/src/*.test.ts`.
- Frontend tests should be placed in `/tests/` alongside the code they test.
- Use open-source libraries only (e.g., Fuse.js, natural, stemmer).
- Use `npx jest` or `npm test` to run tests.

---

## Tasks

- [x] 1.0 Cloud Function: Search & Ranking

  - [x] 1.1 Set up `searchPrompts.ts` Cloud Function boilerplate (input validation, Firestore access).
  - [x] 1.2 Implement prompt fetching logic (public and private prompts, respecting user permissions).
  - [x] 1.3 Integrate open-source libraries for stemming, synonyms, and typo tolerance (e.g., natural, stemmer, Fuse.js).
  - [x] 1.4 Implement field weighting and cumulative scoring logic (title > description > text > categories > tags).
  - [x] 1.5 Implement logic to boost results matching in multiple fields.
  - [x] 1.6 Ensure exact matches are ranked above partial/fuzzy matches.
  - [x] 1.7 Annotate each result with matched fields (e.g., "Matched in: title, tags").
  - [x] 1.8 Optimize for performance (return results within 500ms for up to 1000 prompts).
  - [x] 1.9 Enforce Firestore security rules for public/private prompt access.
  - [x] 1.10 Write unit and integration tests for the Cloud Function (`searchPrompts.test.ts`).

- [x] 2.0 Client Integration

  - [x] 2.1 Update `js/promptData.js` to call the new Cloud Function for search queries.
  - [x] 2.2 Parse and handle annotated results from the backend (including matched fields).
  - [x] 2.3 Update error handling and loading states for search (e.g., show spinner, handle errors gracefully).
  - [x] 2.4 Add logging for search response times (for metrics).
  - [x] 2.5 Add/expand tests in `tests/promptData.test.js` for new search logic and error handling.

- [x] 3.0 UI/UX Improvements

  - [x] 3.1 Update `js/ui.js` and `pages/popup.html` to display match annotations for each result (e.g., label or icon for matched fields).
  - [x] 3.2 Ensure accessibility and clean design for match indicators (screen reader support, color contrast, etc.).
  - [x] 3.3 Add visual feedback for search performance (e.g., loading spinner, timing display).
  - [x] 3.4 Add/expand tests in `tests/ui.test.js` for UI display of match annotations and accessibility.

- [x] 4.0 Testing & Metrics

  - [x] 4.1 Log and measure search response times (client and server).
  - [x] 4.2 Validate that time-to-find-prompt is improved (compare before/after, if possible).
  - [x] 4.3 Provide a mechanism for developers to review search performance metrics (e.g., console logs, optional UI for devs).

- [x] 5.0 Documentation & Deployment

  - [x] 5.1 Document the new search system in the project README and/or a dedicated doc.
  - [x] 5.2 Update deployment scripts and instructions for the new Cloud Function.
  - [x] 5.3 Announce the feature and solicit user feedback (optional).

- [x] 6.0 Testability Refactor
  - [x] 6.1 Extracted main search logic to searchPromptsHandler for direct testing.
  - [x] 6.2 Updated tests to call searchPromptsHandler directly instead of the onCall wrapper.
