<!--
_This is a suggested `README.md` file. You can edit it to better suit your project._
-->

# PromptFinder - AI Prompt Management Chrome Extension

PromptFinder is a Chrome extension designed to help users efficiently manage, store, and discover AI prompts. It allows you to search, browse, add, and organize prompts for various AI tools (like ChatGPT, Midjourney, etc.) without direct integration.

## Installation

To install PromptFinder in your Chrome browser:

1.  **Download or Clone:** Download or clone the extension's source code to your local machine.
2.  **Navigate to Project Directory:** Open your terminal or command prompt and navigate into the directory where you downloaded or cloned the PromptFinder source code (e.g., `cd path/to/promptfinder-main`).
3.  **Install Dependencies:** Run the following command to install necessary dependencies (including Firebase SDKs):
    ```bash
    npm install
    ```
    _(This will create a `node_modules` folder in your project directory.)_
4.  **Load in Chrome:** Open Chrome and go to `chrome://extensions/`.
5.  Enable "Developer mode" in the top right corner.
6.  Click "Load unpacked" and select the directory where you downloaded/cloned the PromptFinder source code (the same directory where you ran `npm install`).
7.  The extension should now appear in your extensions list and its icon will be visible in your browser toolbar.

## Usage

- **Adding Prompts:** Click the PromptFinder icon in the toolbar. In the popup, navigate to the "Add New Prompt" section or use the dedicated button.
- **Viewing Prompts:** Browse all prompts, view favorites, or see your private prompts using the tabs.
- **Searching:** Use the search bar to find prompts by title, text, category, or tags.
- **Filtering:** Apply filters (e.g., by minimum rating - future feature) to narrow down your search.
- **Sorting:** Sort prompts by various criteria (e.g., recently added, most used - future feature).
- **Editing Prompts:** Edit existing prompt details.
- **Deleting Prompts:** Remove prompts you no longer need.
- **Copying Prompts:** Quickly copy prompt text to your clipboard.
- **Favorites:** Mark prompts as favorites for easy access.
- **Ratings:** Rate prompts (future feature for community-sourced ratings).

## Features

- **Local Storage:** Prompts are initially stored locally using `chrome.storage.local`.
- **Add, Edit, Delete Prompts:** Full CRUD operations for your prompts.
- **Search Functionality:** Robust search across prompt titles, text, categories, and tags.
- **Favorite System:** Mark and easily access your most-used prompts.
- **Private Prompts:** Option to keep prompts private to your browser profile.
- **Categorization & Tagging:** Organize prompts with categories and multiple tags.
- **Clipboard Integration:** Copy prompt text with a single click.
- **Responsive UI:** Designed to be user-friendly within the extension popup.

### Planned Features (Roadmap)

- **Cloud Sync & Backup:** Migrate storage to a cloud database (e.g., Firebase Firestore) to enable:
  - Synchronization across multiple Chrome browsers/profiles.
  - User accounts and authentication.
  - Secure backup of prompts.
- **Shared Prompts Community:**
  - Option to share prompts publicly with other users.
  - Browse and use prompts shared by the community.
  - Community ratings and comments on shared prompts.
- **Advanced Filtering & Sorting:** More granular control over how prompts are displayed.
- **Import/Export:** Allow users to import and export their prompt libraries (e.g., JSON, CSV).
- **Usage Statistics:** Track how often prompts are used.
- **AI Tool Specific Fields:** Add fields to specify target AI tools (e.g., ChatGPT, Midjourney, Claude) and model versions.
- **Dark Mode:** Theme option for user preference.
- **UI Enhancements:** Continuous improvements to user interface and experience.
- **Social Sharing:** Option to share individual prompts via social media or direct links (if cloud sync is implemented).

## File Structure

```
promptfinder-main/
├── css/                    # CSS files
│   ├── base/
│   │   ├── reset.css
│   │   ├── utilities.css
│   │   └── variables.css
│   ├── components/
│   │   ├── buttons.css
│   │   ├── cards.css
│   │   ├── forms.css
│   │   └── tabs.css
│   ├── layout/
│   │   ├── containers.css
│   │   └── header.css
│   ├── pages/
│   │   ├── add-prompt.css
│   │   ├── edit-prompt.css
│   │   └── popup.css
│   └── global.css          # Global styles, imports other CSS
├── docs/                   # Documentation files
│   └── DEPENDENCY_NOTES.md # Notes on npm dependency warnings
├── icons/                  # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── js/                     # JavaScript files
│   ├── css-class-helper.js # Utility for CSS class manipulation
│   ├── firebase-init.js    # Firebase SDK initialization
│   ├── promptData.js       # Data handling logic (add, edit, delete, load)
│   ├── ui.js               # UI interaction and DOM manipulation
│   └── utils.js            # General utility functions
├── lib/                    # Local libraries (e.g., Firebase SDK copies)
│   └── firebase/
│       ├── firebase-app.js
│       └── firebase-auth.js
├── node_modules/           # (Generated by npm install, typically in .gitignore)
├── pages/                  # HTML files for different views
│   ├── add-prompt.html
│   ├── add-prompt.js       # JS specific to add-prompt.html
│   ├── edit-prompt.html
│   ├── edit-prompt.js      # JS specific to edit-prompt.html
│   └── popup.html          # Main extension popup
├── tests/                  # Jest test files
│   ├── setupTests.js       # Jest setup configuration
│   ├── promptData.test.js
│   ├── ui.test.js
│   └── utils.test.js
├── .eslintignore           # Files/folders for ESLint to ignore
├── .eslintrc.js            # ESLint configuration (if used, or eslint.config.mjs)
├── .gitignore              # Files/folders for Git to ignore
├── app.js                  # Main entry point for popup JavaScript logic
├── babel.config.json       # Babel configuration for Jest transpilation
├── eslint.config.mjs       # ESLint configuration (ESM format)
├── manifest.json           # Chrome extension manifest file
├── package-lock.json       # Exact versions of dependencies
├── package.json            # Project metadata and dependencies
└── README.md               # This file
```

## Development Setup

To set up the development environment:

1.  **Prerequisites**: Node.js and npm installed.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
    Or use `npm run clean-install` for a fresh install removing `node_modules` and `package-lock.json` first.
    > **Note**: You may see some deprecation warnings during installation. These are generally related to transitive dependencies of well-established tools and typically don't affect functionality. See `docs/DEPENDENCY_NOTES.md` for details.
3.  **Load the extension in Chrome** (as an unpacked extension) by following the steps in the [Installation](#installation) section (steps 4-7, ensuring you've already run `npm install` from this setup section).
4.  **Making Changes**: Edit the source code. After saving changes, you typically need to reload the extension in `chrome://extensions/` (click the refresh icon for the extension) to see the updates.

### Linting

ESLint is set up to maintain code quality. To run the linter:

```bash
npm run lint         # Check for issues
npm run lint:fix     # Attempt to automatically fix issues
```

### Testing

Jest is used for unit testing JavaScript logic.

```bash
npm test             # Run all tests
npm test -- --watch  # Run tests in watch mode
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs, feature requests, or suggestions.

## License

This project is open-sourced and available under the [MIT License](LICENSE.txt) (assuming you add one - currently no LICENSE.txt file is present).
