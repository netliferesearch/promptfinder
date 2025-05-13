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
├── js/                      # JavaScript modules
│   ├── utils.js             # Utility functions and helpers
│   ├── promptData.js        # Prompt data management functions
│   └── ui.js                # UI controller functions
├── css/                     # Modular CSS structure
│   ├── base/                # Foundation styles
│   │   ├── variables.css    # CSS variables (colors, spacing, etc.)
│   │   ├── reset.css        # CSS reset for consistent rendering
│   │   └── utilities.css    # Utility classes
│   ├── components/          # Reusable UI components
│   │   ├── buttons.css      # Button styles
│   │   ├── cards.css        # Card components
│   │   ├── forms.css        # Form elements
│   │   └── tabs.css         # Tab components
│   ├── layout/              # Layout structures
│   │   ├── containers.css   # Containers and grid layouts
│   │   └── header.css       # Header styles
│   ├── pages/               # Page-specific styles
│   │   ├── popup.css        # Main popup styles
│   │   ├── add-prompt.css   # Add prompt page styles
│   │   └── edit-prompt.css  # Edit prompt page styles
│   └── global.css           # Main CSS file that imports base styles
├── icons/                   # Extension icons and images
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── lightbulb.png
├── app.js                   # Main entry point
├── popup.html               # Main HTML structure
├── add-prompt.html          # Add prompt page
├── edit-prompt.html         # Edit prompt page
├── manifest.json            # Extension configuration
└── README.md                # Documentation
```

### Key Components

#### JavaScript Modules

- **utils.js**: Contains shared utility functions like error handling, Chrome storage helpers, and UI notification functions.
- **promptData.js**: Manages all operations related to prompt data (CRUD operations).
- **ui.js**: Handles UI rendering, event listeners, and display logic.

#### CSS Structure

- **global.css**: Main CSS file that imports all base styles.
- **base/**: Foundation styles including variables, reset, and utilities.
- **components/**: Reusable UI components like buttons, forms, tabs, and cards.
- **layout/**: Page layout structures like containers and headers.
- **pages/**: Page-specific styles for popup, add-prompt, and edit-prompt.

### Design System

The extension uses a consistent design system based on CSS variables:

- **Colors**: Primary purple (#7C4DFF) with various gray shades for UI elements
- **Typography**: System font stack with consistent sizing
- **Spacing**: Standardized spacing scale (xs, sm, md, lg, xl)
- **Components**: Modular components with consistent styling
- **Shadows**: Three levels of elevation (sm, md, lg)
- **app.js**: Main entry point that initializes the extension.

### Module Organization

The extension uses a namespace pattern for better organization and Chrome extension compatibility:

```javascript
// Access utility functions
window.PromptFinder.Utils.handleError('Example error');

// Access prompt data operations
window.PromptFinder.PromptData.loadPrompts().then(prompts => {
  console.log('Loaded prompts:', prompts);
});

// Access UI functions
window.PromptFinder.UI.showPromptList();
```

This pattern allows for proper code organization while avoiding issues with ES modules in Chrome extensions.

- **app.js**: Main entry point that initializes the extension.

## Features

- **Accessibility Support**: Fully accessible with keyboard navigation and screen reader support.
- **Error Handling**: Robust error handling system with different severity levels.
- **Filtering**: Filter prompts by rating, favorites, and search terms.
- **Responsive Design**: Mobile-friendly interface that works across different screen sizes.
- **Rating System**: Interactive star rating system with proper accessibility.
- **Notification System**: User-friendly notifications for errors and confirmations.

## Future Roadmap

- **Cloud Sync**: Implement user accounts and cloud storage for syncing prompts across devices.
- **Social Sharing**: Add options to share prompts with others via links or social media.
- **Analytics**: Integrate basic analytics to track popular prompt categories and search terms (with user privacy in mind).
- **Dark Mode**: Add support for dark mode.
- **Export/Import**: Add functionality to export and import prompts for backup.
- **Testing Framework**: Implement unit and integration tests.

## Development Setup

To set up the development environment:

1. Install dependencies:

   ```bash
   npm run clean-install
   ```

   This command will perform a clean installation of all dependencies, avoiding issues with deprecated packages.

   > **Note**: You may see some deprecation warnings during installation. These are related to transitive dependencies and don't affect functionality. See [DEPENDENCY_NOTES.md](DEPENDENCY_NOTES.md) for details.

2. Available scripts:

   ```bash
   npm run lint       # Check for code issues
   npm run lint:fix   # Fix code issues automatically where possible
   npm run format     # Format code according to prettier rules
   npm run test       # Run tests
   npm run build      # Lint, format, and prepare for distribution
   ```

3. Development workflow:
   - Make changes to the source code
   - Run linting and formatting
   - Test in Chrome by loading the unpacked extension
   - Write tests for new functionality

### Project Structure Conventions

- Keep UI logic in `ui.js`
- Keep data operations in `promptData.js`
- Add utilities and helpers to `utils.js`
- All new features should include proper error handling using the `handleError` utility
- Follow accessibility best practices for all UI components

## Development Setup 1

To set up the development environment:

1. Install dependencies:

   ```bash
   npm run clean-install
   ```

   This command will perform a clean installation of all dependencies, avoiding issues with deprecated packages.

   > **Note**: You may see some deprecation warnings during installation. These are related to transitive dependencies and don't affect functionality. See [DEPENDENCY_NOTES.md](DEPENDENCY_NOTES.md) for details.

2. Available scripts:

   ```bash
   npm run lint       # Check for code issues
   npm run lint:fix   # Fix code issues automatically where possible
   npm run format     # Format code according to prettier rules
   npm run test       # Run tests
   npm run build      # Lint, format, and prepare for distribution
   ```

3. Development workflow:
   - Make changes to the source code
   - Run linting and formatting
   - Test in Chrome by loading the unpacked extension
   - Write tests for new functionality

### Project Structure Conventions 2

- Keep UI logic in `ui.js`
- Keep data operations in `promptData.js`
- Add utilities and helpers to `utils.js`
- All new features should include proper error handling using the `handleError` utility
- Follow accessibility best practices for all UI components
