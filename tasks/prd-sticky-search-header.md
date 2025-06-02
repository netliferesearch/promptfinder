# Product Requirements Document (PRD): Sticky Search Header in Prompt List View

## 1. Background & Motivation

- As the prompt list grows, users often scroll far down and lose access to the search bar.
- Keeping the search field always accessible will improve discoverability and reduce time-to-find for prompts.

## 2. Objective

- Add a sticky header to the prompt list view that remains visible while scrolling.
- The sticky header should only contain the search field (no tabs, filters, or other controls).

## 3. Requirements

### 3.1 Functional

- When the user scrolls the prompt list, the search field remains visible at the top of the viewport.
- The sticky header should not overlap or obscure prompt content.
- Only the search field is shown in the sticky header (no tabs, filters, or sort controls).
- The sticky header should appear only when the user scrolls the prompt list (not on other views).
- The sticky header should be visually distinct (e.g., subtle shadow or border) to indicate it is fixed.

### 3.2 Non-Functional

- The sticky header must be accessible (keyboard and screen reader).
- The sticky header must work on all supported browsers (Chrome, Firefox).
- The sticky header must not cause layout shifts or performance issues, even with large prompt lists.
- The implementation should use modern CSS (e.g., `position: sticky`) where possible, with a JS fallback if needed.

### 3.3 Out of Scope

- No changes to the search logic or prompt ranking.
- No changes to the rest of the header (tabs, filters, etc.).

## 4. User Stories

- As a user, I want the search field to always be visible while scrolling the prompt list, so I can quickly refine my search without scrolling back to the top.

## 5. Acceptance Criteria

- [ ] When scrolling the prompt list, the search field remains visible at the top.
- [ ] Only the search field is present in the sticky header.
- [ ] The sticky header is accessible and visually distinct.
- [ ] The sticky header does not interfere with prompt content or other UI elements.
- [ ] Works in Chrome and Firefox.

## 6. Dependencies & Risks

- May require refactoring of the prompt list view layout.
- Must be tested for compatibility with virtualization (if used) and responsive layouts.

## 7. Design Notes

- Use CSS `position: sticky` for modern browsers.
- Add a shadow or border to the sticky header for clarity.
- Ensure the search field in the sticky header is the same as the main search field (not a duplicate).
