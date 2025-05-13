# PromptFinder Chrome Extension

## Description

PromptFinder is a lightweight, community-powered Chrome extension that helps you effectively manage and discover AI prompts. It allows you to search, browse, add, and organize prompts for various AI tools (like ChatGPT, Midjourney, etc.) without direct integration.

## Installation

To install PromptFinder in your Chrome browser:

1. Download or clone the extension's source code to your local machine.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory where you downloaded or cloned the PromptFinder source code.
5. The extension should now appear in your extensions list and its icon will be visible in your browser toolbar.

## Usage

- **Adding Prompts:** Click the PromptFinder icon in the toolbar. In the popup, navigate to the "Add New Prompt" section. Fill in the title, prompt text, category, and tags. You can choose whether to make the prompt public or keep it private. Click "Add Prompt" to save.
- **Viewing Prompts:** The "All Prompts" section lists the prompts in your database. Click on a prompt's title or the "View Details" button to see the full prompt text, category, tags, votes, and favorites. Use the "Back to List" button to return to the list.
- **Copying Prompts:** In the prompt details view, click the "Copy" button to quickly copy the prompt text to your clipboard.
- **Searching Prompts:** Use the search bar in the "All Prompts" section to filter prompts by keywords in their title, text, category, or tags.
- **Voting and Favorites:** In the prompt details view, you can click the star icon to mark a prompt as a favorite for easy access.

## Project Structure

The PromptFinder extension is organized with a modular architecture:

```text
promptfinder/
├── css/                     # Modular CSS source files
│   ├── base/                # Foundation styles (variables, reset, utilities)
│   ├── components/          # Reusable UI components (buttons, cards, forms, tabs)
│   ├── layout/              # Layout structures (containers, header)
│   └── pages/               # Page-specific styles (popup, add-prompt, edit-prompt)
│   └── global.css           # Imports base styles, entry point for CSS
├── css-purged/              # Output directory for PurgeCSS processed files (example)
├── docs/                    # Project documentation and markdown files
├── icons/                   # Extension icons and images
├── js/                      # JavaScript modules
│   ├── utils.js             # Utility functions and helpers
│   ├── promptData.js        # Prompt data management functions
│   └── ui.js                # UI controller functions
├── pages/                   # HTML views and their page-specific JavaScript
│   ├── popup.html           # Main popup UI
│   ├── add-prompt.html      # Add prompt page UI
│   ├── add-prompt.js        # Logic specific to add-prompt.html
│   ├── edit-prompt.html     # Edit prompt page UI
│   ├── edit-prompt.js       # Logic specific to edit-prompt.html
├── scripts/                 # Shell scripts for build, dev, and utility tasks
├── tests/                   # Unit tests
├── app.js                   # Main JavaScript entry point for the popup UI
├── eslint.config.mjs        # ESLint v9 configuration file
├── manifest.json            # Extension configuration
├── package.json             # Project dependencies and scripts
├── package-lock.json        # Lockfile for npm dependencies
├── purgecss.config.mjs      # PurgeCSS configuration file
└── README.md                # This file
```

### Key Components

#### JavaScript Modules

- **`app.js`**: The main JavaScript entry point for the extension's popup UI (`pages/popup.html`). It initializes the UI system.
- **`js/utils.js`**: Contains shared utility functions like error handling, Chrome storage helpers, and UI notification functions.
- **`js/promptData.js`**: Manages all operations related to prompt data (CRUD operations, storage interaction).
- **`js/ui.js`**: Handles general UI rendering, event listeners, and display logic for the main popup and shared UI elements.
- **`pages/*.js`**: (e.g., `pages/add-prompt.js`, `pages/edit-prompt.js`) Contain JavaScript logic specific to their corresponding HTML pages, primarily for detached window functionality.

#### CSS Structure

- **`css/global.css`**: Main CSS file that imports all base styles.
- **`css/base/`**: Foundation styles including variables, reset, and utilities.
- **`css/components/`**: Reusable UI components like buttons, forms, tabs, and cards.
- **`css/layout/`**: Page layout structures like containers and headers.
- **`css/pages/`**: Page-specific styles for `popup.html`, `add-prompt.html`, and `edit-prompt.html`.
- **CSS Optimization**: Unused CSS is removed using PurgeCSS (via `npm run css:purge`), with output typically directed to a build artifact directory (e.g., `css-purged/`). Further minification can be added to the build process.

### Design System

The extension uses a consistent design system based on CSS variables:

- **Colors**: Primary purple (#7C4DFF) with various gray shades for UI elements
- **Typography**: System font stack with consistent sizing
- **Spacing**: Standardized spacing scale (xs, sm, md, lg, xl)
- **Components**: Modular components with consistent styling
- **Shadows**: Three levels of elevation (sm, md, lg)

### Module Organization

The extension uses a namespace pattern (`window.PromptFinder`) for better organization and Chrome extension compatibility, allowing modules to interact.

```javascript
// Access utility functions
window.PromptFinder.Utils.handleError('Example error');

// Access prompt data operations
window.PromptFinder.PromptData.loadPrompts().then(prompts => {
  // console.log('Loaded prompts:', prompts); // Example
});

// Initialize the main UI (typically from app.js)
window.PromptFinder.UI.initializeUI();
```

## Features

- **Accessibility Support**: Designed with accessibility in mind, including keyboard navigation and screen reader support.
- **Error Handling**: Robust error handling system.
- **Filtering**: Filter prompts by rating, favorites, and search terms.
- **Responsive Design**: Mobile-friendly interface.
- **Rating System**: Interactive star rating system.
- **Notification System**: User-friendly notifications for errors and confirmations.

## Future Roadmap

- **Cloud Sync**: Implement user accounts and cloud storage for syncing prompts across devices.
- **Social Sharing**: Add options to share prompts with others via links or social media.
- **Analytics**: Integrate basic analytics (with user privacy in mind).
- **Dark Mode**: Add support for dark mode.
- **Export/Import**: Add functionality to export and import prompts.
- **Testing Framework**: Continue expanding unit and integration tests.
- **CSS Minification**: Implement CSS minification in the build process.

## Development Setup

To set up the development environment:

1.  **Prerequisites**: Node.js and npm installed.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
    Or use `npm run clean-install` for a fresh install removing `node_modules` and `package-lock.json` first.
    > **Note**: You may see some deprecation warnings during installation. These are generally related to transitive dependencies of well-established tools and typically don't affect functionality. See `docs/DEPENDENCY_NOTES.md` for details.

3.  **Available npm scripts**:
    *   `npm run lint`: Check for code issues using ESLint (v9).
    *   `npm run lint:fix`: Fix ESLint issues automatically where possible.
    *   `npm run format`: Format code with Prettier (v3).
    *   `npm run test`: Run unit tests with Jest.
    *   `npm run css:purge`: Remove unused CSS using PurgeCSS, output to `css-purged/`.
    *   `npm run css:switch`: (If implemented) Switches CSS environment for `popup.html` (e.g., between dev source CSS and production optimized CSS).
    *   `npm run build`: Lints, formats, and purges CSS. (Further steps like JS bundling/minification can be added).
    *   `npm run build:prod`: Currently same as `build`. (Can be expanded for more production-specific optimizations).

4.  **Development workflow**:
    *   Make changes to the source code in `css/`, `js/`, `pages/`, `app.js`, etc.
    *   Use `npm run format` and `npm run lint:fix` regularly.
    *   Test in Chrome by loading the unpacked extension (reload the extension after changes).
    *   Write tests for new functionality.

### Project Structure Conventions

- Main popup UI logic is managed by `js/ui.js`, initialized by `app.js`.
- Page-specific logic for detached windows (`add-prompt.html`, `edit-prompt.html`) is in their respective `pages/*.js` files.
- Data operations are centralized in `js/promptData.js`.
- Shared utilities are in `js/utils.js`.
- Follow accessibility best practices.
- Use the `window.PromptFinder.Utils.handleError` utility for error management.
