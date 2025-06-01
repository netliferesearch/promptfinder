# PRD: Improved Search Prioritization for PromptFinder

## 1. Introduction/Overview

The goal of this feature is to significantly improve the search experience in the PromptFinder extension. The new search system will prioritize results based on matches in prompt title, description, prompt text, categories, and tags, following best practices for search ranking. The system will boost results that match in multiple fields, rank exact matches above partial/fuzzy matches, and provide robust support for stemming, synonyms, and typo tolerance. The search will be performed server-side using Firestore and/or Cloud Functions for scalability and performance. The UI will indicate which fields matched for each result.

## 2. Goals

- Deliver more relevant search results by prioritizing matches in key fields (title, description, text, categories, tags).
- Boost results that match in multiple fields.
- Rank exact matches above partial/fuzzy matches.
- Support stemming, synonyms, and typo tolerance.
- Perform search server-side for scalability.
- Indicate to the user which fields matched for each result.
- Apply improvements to both public and private prompts, via the main search bar.
- Measure success by reducing the time it takes users to find the desired prompt.

## 3. User Stories

- **As a user**, when I search for a prompt, I want results that match my query in the title, description, text, categories, or tags to appear at the top.
- **As a user**, I want prompts that match my query in multiple fields to be ranked higher.
- **As a user**, I want exact matches to be prioritized over partial or fuzzy matches.
- **As a user**, I want the search to tolerate typos and recognize synonyms or word variations.
- **As a user**, I want to see why a prompt was matched (e.g., "matched in title and tags").
- **As a user**, I want the search to work equally well for my private prompts and public prompts.

## 4. Functional Requirements

1. **Unified Search Input:**  
   The main search bar remains a single input field for all prompt searches.

2. **Server-Side Search Implementation:**

   - Search queries are sent to a Cloud Function or Firestore query endpoint.
   - The backend performs ranking and scoring based on field matches.

3. **Ranking & Scoring Logic:**

   - Title matches have the highest weight, followed by description, prompt text, categories, and tags.
   - Prompts matching in multiple fields receive a cumulative score boost.
   - Exact matches are ranked above partial/fuzzy matches.
   - Matching logic supports stemming (e.g., "run" matches "running"), synonyms, and typo tolerance.

4. **Search Algorithm:**

   - Use an open-source, performant search library (e.g., Fuse.js for fuzzy search, or implement custom scoring logic in Cloud Functions).
   - No third-party subscription services are required.
   - Consider using a synonym dictionary and stemming library (e.g., natural, stemmer, or similar for Node.js).

5. **Result Annotation:**

   - Each search result indicates which fields matched the query (e.g., "Matched in: title, tags").

6. **Scope:**

   - Applies only to the main search bar.
   - Applies to both public and private prompts.

7. **Performance:**

   - Search should return results within 500ms for up to 1000 prompts.
   - The system should be scalable for future growth.

8. **Testing & Metrics:**
   - Track and log the time taken from search submission to result display.
   - Provide a mechanism for developers to review search performance metrics.

## 5. Non-Goals (Out of Scope)

- No support for user-adjustable search weighting.
- No advanced/field-specific search syntax in the UI.
- No changes to search in filter panels or other entry points.
- No integration with paid/external search APIs.

## 6. Design Considerations

- UI should clearly annotate which fields matched for each result (e.g., a small label or icon).
- Search bar and results UI should remain clean and uncluttered.
- Consider accessibility for screen readers when displaying match annotations.

## 7. Technical Considerations

- Cloud Function should be written in TypeScript (to match existing backend).
- Use open-source libraries for fuzzy search, stemming, and synonyms (e.g., Fuse.js, natural, or similar).
- Ensure Firestore security rules are respected for private/public prompt access.
- Consider caching or indexing strategies if performance is an issue.

## 8. Success Metrics

- **Primary:** Median time for users to find and select a prompt is reduced (measured via logs).
- **Secondary:** User feedback on search relevance is positive (optional survey or feedback mechanism).

## 9. Open Questions

- Should the search function return a limited number of top results (e.g., top 20), or all matches?
- Should the match annotation be shown as text, icons, or both?
- Are there any privacy concerns with sending private prompt data to the search backend (if not already handled)?
