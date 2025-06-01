# PromptFinder Improved Search System

## Overview

PromptFinder's search system is designed to help users find the right prompt as quickly and accurately as possible. It leverages a server-side Cloud Function (Firebase Functions v2) to deliver fast, prioritized, and annotated search results, supporting both public and private prompts.

## Goals

- **Minimize time-to-find-prompt** for all users
- **Prioritize relevance** using field weighting and match quality
- **Support accessibility** and clear user feedback
- **Enable robust developer metrics and troubleshooting**

## Key Features

- **Field Weighting:**
  - Title > Description > Text > Categories > Tags
  - Matches in higher-weighted fields are ranked higher
- **Stemming, Synonyms, Typo Tolerance:**
  - Uses open-source libraries (Fuse.js, natural) for word variations, common synonyms, and typo handling
- **Match Annotations:**
  - Each result includes a `matchedIn` array (e.g., `["title", "tags"]`)
  - UI displays badges for each matched field, with accessible labels
- **Exact Match Boost:**
  - Exact matches in any field are always ranked above partial/fuzzy matches
- **Multi-Field Boost:**
  - Results matching in multiple fields are boosted
- **Public & Private Prompts:**
  - Public prompts are always included
  - Private prompts are included for logged-in users (only their own)
- **Performance:**
  - Returns results within 500ms for up to 1000 prompts
  - Only required fields are fetched from Firestore
- **Accessibility:**
  - All match indicators and search controls are accessible by keyboard and screen reader
- **Logging:**
  - Search timing is logged in both the client (browser console) and server (Cloud Function logs)

## How It Works

### Cloud Function (`searchPrompts`)

- Receives a search query and user context
- Fetches public prompts and, if authenticated, the user's private prompts
- Uses Fuse.js for weighted, typo-tolerant search
- Annotates each result with `matchedIn` fields and scoring
- Returns results, total, durationMs, and a message
- Logs query, user, and duration to the server console

### Client Integration

- Calls the Cloud Function via `PromptData.searchPromptsServer`
- Displays annotated results with badges for matched fields
- Shows search timing and handles errors gracefully
- Logs search timing to the browser console

### Result Structure

```json
{
  "results": [
    {
      "id": "...",
      "title": "...",
      "description": "...",
      "text": "...",
      "category": "...",
      "tags": ["..."],
      "matchedIn": ["title", "tags"],
      "isExactMatch": true,
      "score": 0.05,
      ...
    }
  ],
  "total": 1,
  "durationMs": 123,
  "message": "Search completed with exact match boost."
}
```

## Usage

### For End Users

- Type in the main search bar
- Results are prioritized and annotated in real time
- Badges show which fields matched your query
- Search timing is displayed below the search bar

### For Developers

- Search timing is logged in the browser console and Cloud Function logs
- All search logic is covered by unit and integration tests
- To review performance, check browser and server logs
- To extend search (e.g., add new fields or synonyms), update the Cloud Function and UI badge logic

## Extensibility & Best Practices

- Use open-source libraries for search logic (no third-party subscriptions required)
- Keep field weighting and scoring logic in sync between backend and UI
- Ensure all new fields are annotated in `matchedIn` for transparency
- Maintain accessibility for all new UI elements

## Troubleshooting

- If search is slow, check Cloud Function logs for durationMs
- If private prompts are missing, verify authentication and Firestore rules
- If match annotations are missing, check the result structure and UI badge rendering

## References

- See the [README.md](../README.md#improved-search-system) for a summary
- See the [Product Requirements Document](../tasks/prd-improved-search-prioritization.md) for full requirements and rationale
