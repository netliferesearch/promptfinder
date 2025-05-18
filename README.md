# PromptFinder - AI Prompt Management Chrome Extension

PromptFinder is a Chrome extension designed to help users efficiently manage, store, and discover AI prompts. It allows you to search, browse, add, and organize prompts for various AI tools (like ChatGPT, Midjourney, Claude, etc.). All your prompts are synced to the cloud using Firebase, allowing access across different Chrome browsers where you're signed in.

## Key Features

- **Cloud Synced Prompts:** Prompts are stored in Firebase Firestore, enabling synchronization and backup.
- **User Accounts:** Supports Email/Password and Google Sign-In for personalized prompt management.
- **CRUD Operations:** Add, edit, and delete your prompts.
- **Comprehensive Prompt Details:** View title, description, full prompt text (with Markdown highlighting), category, tags, target AI tools, author, creation/update dates, usage count, and ratings.
- **Code-Formatted Display:** Prompt text is displayed in a code block with syntax highlighting for Markdown.
- **Truncation & "View More":** Long prompt texts are truncated by default with an option to expand.
- **Per-User Ratings:** Rate any prompt from 1-5 stars; you can update your rating.
- **Community Ratings:** View the average community rating and total number of ratings for public prompts.
- **Universal Favorites:** Favorite any prompt (public or your own private ones). `favoritesCount` on prompts tracks total favorites.
- **Usage Count:** Tracks how many times a prompt has been copied.
- **Search & Filtering:** Search across multiple fields. Filter by tabs (All, Favorites, Private).
- **Private Prompts:** Option to keep prompts private to your account.
- **Required Fields:** Ensures essential information (Title, Description, Prompt Text, Category, Target AI Tools) is provided when adding/editing prompts.
- **Custom Display Names:** Users set a display name upon email/password signup, avoiding email exposure.

## Project Status & Roadmap

**For a detailed breakdown of current development status, ongoing tasks, and future plans, please see the [PROJECT_PLAN.md](PROJECT_PLAN.md) file.**

This project has recently undergone a significant migration to Firebase for backend services and a major refactoring to use modern JavaScript (ES Modules) and a Rollup build process.

**Recent Highlights (Completed as part of Phase 1 & 2 of PROJECT_PLAN.md):**

- Full Firebase Integration (Auth & Firestore using v9+ SDK).
- Rollup bundling for all JavaScript.
- Refactoring of all JS to ES Modules.
- Email/Password and Google Sign-In (using `chrome.identity.launchWebAuthFlow`).
- Comprehensive CRUD for prompts with cloud storage.
- New Rating System: Per-user ratings and display of community average (client-side aggregation for now).
- New Favorites System: Per-user favoriting of any prompt and `favoritesCount`.
- `usageCount` for copied prompts.
- Enhanced prompt details display and form field requirements.
- Improved UX for logged-out users attempting actions.

**Key Next Steps (from PROJECT_PLAN.md):**

- **Update & Fix Unit Tests:** Adapt Jest tests for ES Modules and Firebase v9 SDK.
- **Implement Firestore Security Rules:** Ensure robust data protection.
- **Cloud Functions for Aggregation:** Server-side calculation for `averageRating`, `totalRatingsCount`, and `favoritesCount`.

## Installation & Setup

1.  **Prerequisites**: Node.js and npm (or a compatible package manager) installed.
2.  **Clone Repository:**
    ```bash
    git clone https://github.com/mjolne/promptfinder.git # Replace with your repo URL if different
    cd promptfinder
    ```
3.  **Switch to the development branch** (if not already on it, e.g., `ratings-and-favorites` or `main` if merged):
    ```bash
    git checkout ratings-and-favorites # Or your active development branch
    ```
4.  **Install Dependencies:**
    ```bash
    npm install
    ```
    This installs Firebase, Rollup, ESLint, Prettier, Jest, and other necessary packages.
5.  **Build the Extension:**
    ```bash
    npm run build
    ```
    This command will lint, format, and bundle the JavaScript using Rollup, placing the output in the `dist/` directory. It also processes CSS.
6.  **Load in Chrome:**
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable "Developer mode" (usually a toggle in the top right corner).
    - Click "Load unpacked".
    - Select the **root directory** of the `promptfinder` project (the one containing `manifest.json` and the `dist/` folder).
7.  The PromptFinder extension icon should appear in your browser toolbar.

## Development Workflow

1.  **Make Code Changes:** Edit source files in `js/`, `pages/`, `css/`, etc.
2.  **Lint & Format (Recommended):**
    ```bash
    npm run lint:fix
    # or run formatting separately
    npm run format
    ```
3.  **Build JavaScript (if not using watch mode):**
    ```bash
    npm run build:js:dev
    # or the full build
    npm run build
    ```
4.  **Watch Mode (Recommended for Active Development):** For automatic rebuilding of JavaScript on changes:
    ```bash
    npm run watch:js
    ```
    You will still need to manually reload the extension in Chrome to see changes.
5.  **Reload Extension in Chrome:** After making changes and rebuilding (if not using watch mode, or even with it for some changes), go to `chrome://extensions/` and click the reload icon for PromptFinder.

### Testing

Jest is used for unit testing. **Note: Tests currently require significant updates to work with the ES Module structure and Firebase v9 SDK.**

To run tests (once updated):

```bash
npm test
npm test -- --watch # For watch mode
```

## File Structure Overview

```
promptfinder/
├── css/                    # Source CSS files (modular structure)
│   ├── base/
│   ├── components/
│   ├── layout/
│   └── pages/
├── dist/                   # Build output (gitignored)
│   ├── js/
│   └── pages/
│   └── css-purged/         # Purged CSS output
├── docs/                   # Documentation
├── icons/                  # Extension icons
├── js/                     # Source JavaScript modules
│   ├── firebase-init.js
│   ├── promptData.js
│   ├── ui.js
│   └── utils.js
├── node_modules/           # (Ignored by Git)
├── pages/                  # Source HTML and page-specific JS
│   ├── add-prompt.html
│   ├── add-prompt.js
│   ├── edit-prompt.html
│   ├── edit-prompt.js
│   └── popup.html
├── tests/                  # Jest test files (needs update)
├── .gitignore
├── app.js                  # Main entry point for popup (source)
├── babel.config.json
├── eslint.config.mjs       # ESLint configuration
├── manifest.json
├── package-lock.json
├── package.json
├── PROJECT_PLAN.md         # Detailed project roadmap and task tracking
├── purgecss.config.mjs
├── README.md               # This file
└── rollup.config.js        # Rollup bundler configuration
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

This project is open-sourced. (Consider adding a `LICENSE.txt` file, e.g., MIT License).
