// Text constants for PromptFinder Chrome Extension
// Centralized text management for consistency and future internationalization

export const TEXT_CONSTANTS = {
  // Password reset
  RESET_PASSWORD_EMAIL_SENT: 'Password reset email sent! Please check your inbox.',
  RESET_PASSWORD_ERROR: 'Could not send password reset email: {{message}}',
  RESET_PASSWORD_PROMPT: 'Enter your email to reset your password:',
  RESET_PASSWORD_BUTTON: 'Send reset email',
  RESET_PASSWORD_SUCCESS:
    'If an account exists for this email, a password reset link has been sent.',
  // Sort Dropdown Options
  SORT_NEWEST: 'Newest',
  SORT_RECENTLY_EDITED: 'Recently Edited',
  SORT_COMMUNITY_RATING: 'Community Rating',
  SORT_YOUR_RATING: 'Your Rating',
  SORT_MOST_USED: 'Most Used',
  SORT_MOST_FAVORITED: 'Most Favorited',
  SORT_TITLE_AZ: 'Title (A-Z)',
  // App branding
  APP_NAME: 'PromptFinder',

  // Navigation & Actions
  BACK_TO_LIST: 'Back to list',
  VIEW_MORE: 'View More',
  VIEW_LESS: 'View Less',
  CANCEL: 'Cancel',
  SAVE: 'Save',
  DELETE: 'Delete',
  EDIT: 'Edit',
  COPY: 'Copy',

  // Buttons
  ADD_PROMPT: 'Add Prompt',
  DELETE_PROMPT: 'Delete Prompt',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  SIGN_IN_WITH_GOOGLE: 'Sign in with Google',
  FILTERS: 'Filters',
  SORT: 'Sort',
  RESET_FILTERS: 'Reset filters',

  // Form Labels
  TITLE: 'Title:',
  DESCRIPTION: 'Description:',
  EMAIL: 'Email:',
  PASSWORD: 'Password:',
  DISPLAY_NAME: 'Display Name:',
  PROMPT_TEXT: 'Prompt Text:',
  THE_ACTUAL_PROMPT: 'The actual prompt',
  WHAT_ITS_FOR: "What it's for",
  CATEGORY: 'Category:',
  TAGS: 'Tags (comma-separated):',
  TARGET_AI_TOOLS: 'Target AI Tools (comma-separated):',
  AI_TOOL: 'AI Tool:',
  MAKE_PRIVATE: 'Make Private',
  YOUR_PROMPTS_ONLY: 'Your prompts only',
  USED_BY_YOU: 'Used by you',

  // Form Labels (detailed)
  TITLE_LABEL: 'Title',
  DESCRIPTION_LABEL: 'Description',
  PROMPT_TEXT_LABEL: 'Prompt Text',
  CATEGORY_LABEL: 'Category',
  TAGS_LABEL: 'Tags (comma-separated)',
  TARGET_AI_TOOLS_LABEL: 'Target AI Tools (comma-separated)',
  MAKE_PRIVATE_LABEL: 'Make Private',
  RATE_PROMPT: 'Rate this prompt!',

  // Placeholders
  SEARCH_PROMPTS: 'Search prompts...',
  SELECT_CATEGORY: '-- Select a category --',
  ANY: 'Any',

  // Status & Messages
  RATE_THIS_PROMPT: 'Rate this prompt!',
  YOUR_RATING: 'Your Rating:',
  LOGIN_TO_RATE: 'Login to rate.',
  AVERAGE_VIBES: 'Average vibes:',
  COULD_NOT_LOAD_PROMPTS: 'Could not load prompts.',
  NO_PROMPTS_FOUND: 'No prompts found. Try adjusting filters or add new prompts.',
  NOT_AVAILABLE: 'N/A',
  NONE: 'None',
  PRIVATE: 'Private',

  // Success Messages
  PROMPT_ADDED_SUCCESS: 'Prompt added successfully!',
  PROMPT_UPDATED_SUCCESS: 'Prompt updated successfully!',
  PROMPT_DELETED_SUCCESS: 'Prompt deleted successfully!',
  COPY_SUCCESS: 'Prompt copied to clipboard!',
  FAVORITE_UPDATED: 'Favorite status updated!',
  RATING_SUCCESS: 'Rated {{rating}} stars!',

  // Form validation messages
  FORM_DISPLAY_NAME_REQUIRED: 'Please enter a display name.',
  FORM_DISPLAY_NAME_INVALID: 'Display name cannot be an email address.',
  REQUIRED_FIELDS_ERROR: 'Please fill in all required fields: {{fields}}.',
  COPY_FAILED: 'Failed to copy prompt. Please try again.',
  ERROR_LOADING_PROMPTS: 'Error loading and displaying prompt data',
  FAILED_TO_ADD_PROMPT: 'Failed to add prompt. Please check details or try again.',
  FAILED_TO_UPDATE_PROMPT: 'Failed to update prompt. Please check details or try again.',
  CRITICAL_ERROR_ADDING: 'Critical error adding prompt: {{message}}',
  CRITICAL_ERROR_UPDATING: 'Critical error updating prompt: {{message}}',
  ERROR_DELETING_PROCESS: 'Error during prompt deletion process',
  ERROR_INITIALIZING_UI: 'Error initializing UI',

  // Authentication messages
  AUTH_NOT_AVAILABLE: 'Firebase Auth not available from firebase-init.js.',
  FIRESTORE_NOT_AVAILABLE: 'Firestore not available from firebase-init.js.',
  FIRESTORE_NOT_AVAILABLE_GENERAL: 'Firestore not available.',
  FIRESTORE_NOT_AVAILABLE_LOADING: 'Firestore not available for loading prompts (v9).',
  LOGIN_TO_ADD_PROMPT: 'User must be logged in to add a prompt.',
  LOGIN_TO_UPDATE_PROMPT: 'User must be logged in to update a prompt.',
  LOGIN_TO_RATE_PROMPT: 'User must be logged in to rate a prompt.',
  LOGIN_TO_DELETE_PROMPT: 'User must be logged in to delete a prompt.',
  LOGIN_TO_ACTION: 'Please login or create an account to {{action}}.',
  SIGNUP_ERROR: 'Signup error: {{message}}',
  LOGIN_ERROR: 'Login error: {{message}}',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  LOGOUT_ERROR: 'Logout error (v9): {{message}}',
  SIGNUP_SUCCESS: 'Signup successful! You are now logged in.',
  SIGNUP_FAILED: 'Signup failed. Please try again.',
  GOOGLE_SIGNIN_FAILED: 'Google Sign-In failed.',
  GOOGLE_SIGNIN_CANCELLED: 'Google Sign-In cancelled by user.',
  GOOGLE_SIGNIN_CANCELLED_POPUP: 'Google Sign-In cancelled or popup closed by user.',
  GOOGLE_SIGNIN_ID_TOKEN_NOT_FOUND: 'Google Sign-In failed: ID token not found in callback URL.',
  GOOGLE_SIGNIN_UNKNOWN_ERROR: 'An unknown error occurred during Google Sign-In.',
  GOOGLE_USER_DETAILS_SAVE_ERROR: 'Could not save Google user details after signup.',
  DISPLAY_NAME_ERROR: 'Display name cannot be an email address.',
  PROFILE_UPDATE_ERROR: 'Could not set display name in auth profile.',
  USER_DOC_ERROR: 'Could not save user details after signup.',

  // API and system messages
  CHROME_IDENTITY_NOT_AVAILABLE:
    'chrome.identity.launchWebAuthFlow API not available. Google Sign-In cannot proceed.',
  OAUTH_CLIENT_ID_NOT_FOUND: 'OAuth2 client_id not found in manifest.json.',
  CHROME_STORAGE_NOT_AVAILABLE: 'Chrome storage API not available.',

  // Prompt operations
  INVALID_RATING: 'Invalid rating value. Must be a number between 1 and 5.',
  PROMPT_NOT_FOUND: 'Prompt with ID {{id}} not found',
  PROMPT_NOT_FOUND_FOR_COPY: 'Prompt with ID {{id}} not found for copying (v9)',
  PROMPT_NOT_FOUND_FOR_UPDATE: 'Prompt with ID {{id}} not found for update (v9).',
  NO_PERMISSION_UPDATE: 'You do not have permission to update this prompt (v9).',
  NO_PROMPT_ID_UPDATE: 'No prompt ID provided for update.',
  ERROR_ADDING_PROMPT: 'Error adding prompt to Firestore (v9): {{message}}',
  ERROR_UPDATING_PROMPT: 'Error updating prompt: {{message}}',
  ERROR_DELETING_PROMPT: 'Error deleting prompt: {{message}}',
  ERROR_RATING_PROMPT: 'Error rating prompt: {{message}}',
  ERROR_TOGGLING_FAVORITE: 'Error toggling favorite for prompt {{id}} (v9): {{message}}',
  ERROR_COPYING_PROMPT: 'Error copying to clipboard: {{message}}',
  ERROR_VIEWING_DETAILS: 'Error viewing prompt details: {{message}}',

  // Actions (detailed)
  ACTION_ADD_PROMPT: 'add a new prompt',
  COPY_PROMPT: 'Copy prompt',
  TOGGLE_FAVORITE: 'Toggle favorite',
  VIEW_DETAILS_FOR_PROMPT: 'View details for prompt: {{title}}',

  // Page Headers (detailed)
  EDITING_PROMPT: 'Editing prompt',
  ADD_NEW_PROMPT: 'Add New Prompt',

  // Meta Information Labels
  AUTHOR: 'Author:',
  USAGE: 'Usage:',
  FAVORITES: 'Favorites:',
  CREATED: 'Created:',
  UPDATED: 'Updated:',
  AI_TOOLS: 'AI Tools:',

  // Authentication UI (Sign in/Sign up forms)
  LOGIN_OR_SIGNUP: 'Login or Signup',
  SIGNIN_TITLE: 'Sign in to PromptFinder',
  SIGNIN_SUBTEXT: 'Welcome back! Please enter your details below.',
  SIGNIN_EMAIL_LABEL: 'Email',
  SIGNIN_EMAIL_PLACEHOLDER: 'you@email.com',
  SIGNIN_EMAIL_HINT: "We'll never share your email.",
  SIGNIN_PASSWORD_LABEL: 'Password',
  SIGNIN_PASSWORD_PLACEHOLDER: 'Enter your password',
  SIGNIN_FORGOT_PASSWORD: 'Forgot password?',
  SIGNIN_BUTTON: 'Sign in',
  SIGNIN_GOOGLE_BUTTON: 'Sign in with Google',
  SIGNIN_OR_CONTINUE_WITH: 'OR CONTINUE WITH',
  SIGNIN_SIGNUP_ROW: "Don't have an account?",
  SIGNIN_SIGNUP_LINK: 'Sign up',

  SIGNUP_TITLE: 'Create account',
  SIGNUP_SUBTEXT: 'Enter your information to create a new account',
  SIGNUP_DISPLAY_LABEL: 'Display Name',
  SIGNUP_DISPLAY_PLACEHOLDER: 'Enter your display name',
  SIGNUP_DISPLAY_HINT: 'This will be shown to other users',
  SIGNUP_EMAIL_LABEL: 'Email',
  SIGNUP_EMAIL_PLACEHOLDER: 'Enter your email',
  SIGNUP_EMAIL_HINT: "We'll never share your email with anyone else",
  SIGNUP_PASSWORD_LABEL: 'Password',
  SIGNUP_PASSWORD_PLACEHOLDER: 'Enter your password',
  SIGNUP_PASSWORD_HINT: 'Must be at least 8 characters long',
  SIGNUP_BUTTON: 'Create account',
  SIGNUP_GOOGLE_BUTTON: 'Continue with Google',
  SIGNUP_OR_CONTINUE_WITH: 'OR CONTINUE WITH',
  SIGNUP_LOGIN_ROW: 'Already have an account?',
  SIGNUP_LOGIN_LINK: 'Sign in',

  // Confirmations
  DELETE_CONFIRMATION: 'Are you sure you want to delete this prompt?',
  CONFIRM_DELETION: 'Confirm Deletion',

  // Aria Labels
  ACCOUNT: 'Account',
  SETTINGS: 'Settings',
  SEARCH_PROMPTS_LABEL: 'Search Prompts',
  DISMISS: 'Dismiss',

  // Tab Labels
  ALL: 'All',
  FAVORITES_TAB: 'Favorites',
  PRIVATE_TAB: 'Private',

  // Star Rating
  STAR_RATING: 'star',
  STARS_RATING: 'stars',

  // Required field indicator
  REQUIRED: '*',
};

// Simple text manager class for future internationalization
export class TextManager {
  constructor(locale = 'en') {
    this.locale = locale;
    this.texts = TEXT_CONSTANTS;
  }

  // Get text by key with optional fallback
  get(key, fallback = '') {
    return this.texts[key] || fallback || key;
  }

  // Check if a text key exists
  has(key) {
    return key in this.texts;
  }

  // Get all text constants (useful for debugging)
  getAll() {
    return { ...this.texts };
  }

  // Future: Load locale-specific texts
  async loadLocale(locale) {
    this.locale = locale;
    // In the future, this could load from locale files:
    // const localeTexts = await import(`../locales/${locale}.js`);
    // this.texts = { ...TEXT_CONSTANTS, ...localeTexts.default };
    return this;
  }

  // Interpolate variables into text (for dynamic messages)
  format(key, variables = {}) {
    let text = this.get(key);

    // Simple variable interpolation: {{variable}}
    Object.keys(variables).forEach(varName => {
      const placeholder = `{{${varName}}}`;
      text = text.replace(new RegExp(placeholder, 'g'), variables[varName]);
    });

    return text;
  }
}

// Global text manager instance
export const textManager = new TextManager();

// Convenience function for getting text
export const getText = (key, fallback = '') => textManager.get(key, fallback);

// For backwards compatibility and easy migration
export const t = getText;
