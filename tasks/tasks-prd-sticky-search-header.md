## Tasks: Sticky Search Header in Prompt List View

- [x] 1.0 Planning & Design

  - [x] 1.1 Review current prompt list view structure and search field placement.
  - [x] 1.2 Determine the best approach for sticky header (CSS `position: sticky` vs. JS fallback).
  - [x] 1.3 Draft a simple wireframe or visual spec for the sticky header.

- [x] 2.0 Implementation

  - [x] 2.1 Refactor prompt list view markup to wrap the search field in a container suitable for sticky positioning.
  - [x] 2.2 Ensure only the search field is included in the sticky header (exclude tabs, filters, etc.).
  - [x] 2.3 Add CSS for `position: sticky` to the search header container.
  - [x] 2.4 Add visual distinction (e.g., shadow, border) to the sticky header.
  - [x] 2.5 Ensure the sticky header does not overlap prompt list content or FAB.
  - [ ] 2.6 (Optional) Add JS fallback for sticky header if needed (note: not needed for modern browsers).

- [x] 3.0 Accessibility & Responsiveness

  - [x] 3.1 Ensure sticky header and search field are accessible (label, role, aria-live for counter).
  - [x] 3.2 Test and improve mobile/responsive layout for sticky header and prompt list.

- [x] 4.0 Testing

  - [x] 4.1 Manually test in Chrome extension popup (desktop, mobile, dark/light mode).
  - [x] 4.2 Test with long prompt lists and edge cases (empty, 1 item, 100+ items).
  - [x] 4.3 Test with/without search term, with/without filters, and with/without private prompts.
  - [x] 4.4 Add/expand automated UI tests for sticky header behavior.

- [x] 5.0 Documentation

  - [x] 5.1 Update README and/or docs/search-system.md to describe sticky search header feature, accessibility, and responsive behavior.
  - [ ] 5.2 Add screenshots or GIFs of sticky header in action (optional).

- [x] 6.0 Review & Deployment

  - [x] 6.1 Commit and push to git.
