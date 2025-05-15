/**
 * PromptFinder Extension - Detached Add Prompt Window
 * Handles the form submission in the detached window.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached add prompt window initialized');
  // Ensure Firebase is initialized and auth state is known if possible
  // This page runs in its own context, so firebaseAuth needs to be available.
  if (!window.firebaseAuth) {
      console.warn("Firebase Auth not immediately available in add-prompt.js. This might be an issue if auth state is needed before user interaction.");
      // If firebase-init.js from popup has already run and set window.firebaseAuth, it will be used.
      // Otherwise, this page relies on the popup having established an auth session.
  }
  initializeForm();
});

/**
 * Initialize the form and set up event listeners
 */
function initializeForm() {
  const addPromptForm = document.getElementById('add-prompt-form');
  if (addPromptForm) {
    addPromptForm.addEventListener('submit', handleAddPromptSubmit);
  }

  const cancelAddPromptButton = document.getElementById('cancel-add-prompt');
  if (cancelAddPromptButton) {
    cancelAddPromptButton.addEventListener('click', () => {
      window.close(); // Closes the detached window
    });
  }
}

/**
 * Handle form submission for adding a new prompt
 * @param {Event} event - The submit event
 */
async function handleAddPromptSubmit(event) {
  event.preventDefault();

  const Utils = window.PromptFinder.Utils;
  const PromptData = window.PromptFinder.PromptData;
  const confirmationMessageElement = document.getElementById('confirmation-message');
  const errorMessageElement = document.getElementById('error-message');

  // Check if user is logged in (PromptData.addPrompt will also check, but good for early UI feedback)
  if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
    Utils.handleError('You must be logged in to add a prompt. Please log in via the extension popup.', {
        userVisible: true,
        specificErrorElement: errorMessageElement, // Use the error element on this page
        timeout: 7000
    });
    return;
  }

  const titleInput = document.getElementById('prompt-title');
  const textInput = document.getElementById('prompt-text');
  const categoryInput = document.getElementById('prompt-category');
  const tagsInput = document.getElementById('prompt-tags');
  const privateCheckbox = document.getElementById('prompt-private');

  if (!titleInput || !textInput) {
    Utils.handleError('Form elements missing', { specificErrorElement: errorMessageElement, userVisible: true });
    return;
  }

  const title = titleInput.value.trim();
  const text = textInput.value.trim();

  if (!title || !text) {
    Utils.handleError('Please enter both a title and prompt text.', { specificErrorElement: errorMessageElement, userVisible: true });
    return;
  }

  const category = categoryInput ? categoryInput.value.trim() : '';
  const tags = tagsInput
    ? tagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '')
    : [];
  const isPrivate = privateCheckbox ? privateCheckbox.checked : false;

  const promptDataPayload = {
    title,
    text,
    category,
    tags,
    isPrivate,
    targetAiTools: [] // Placeholder, can be expanded later if UI is added to this form
    // userRating and userIsFavorite are handled by addPrompt based on isPrivate
  };

  try {
    // PromptData.addPrompt now handles Firestore logic and user check
    const newPrompt = await PromptData.addPrompt(promptDataPayload);

    if (newPrompt) {
      // Notify main popup window (if open) that prompts have been updated so it can refresh its list.
      // This is more robust than relying on storage events for cross-context communication.
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'PROMPT_ADDED_OR_MODIFIED' }, response => {
          if (chrome.runtime.lastError) {
            console.warn("Could not send PROMPT_ADDED_OR_MODIFIED message:", chrome.runtime.lastError.message);
          } else {
            console.log("PROMPT_ADDED_OR_MODIFIED message sent.");
          }
        });
      }

      const form = document.getElementById('add-prompt-form');
      if (form) form.reset();

      Utils.showConfirmationMessage('Prompt added successfully!', {
        messageElement: confirmationMessageElement,
        timeout: 3000, // Shorter timeout as window will close
      });

      // Close the detached window after a short delay
      setTimeout(() => {
        window.close();
      }, 3500);

    } else {
      // Error should have been handled and displayed by PromptData.addPrompt or the initial user check.
      // If we reach here and newPrompt is null, it means an error occurred.
      // Utils.handleError might have already shown a message if userVisible was true.
      // We can ensure a generic one is shown on this page if not.
      if (!errorMessageElement || errorMessageElement.classList.contains('hidden')) {
         Utils.handleError('Failed to add prompt. Please check details or try again.', { specificErrorElement: errorMessageElement, userVisible: true });
      }
    }
  } catch (error) {
    // This catch is unlikely to be hit if PromptData.addPrompt handles its own errors and returns null.
    Utils.handleError(`Critical error adding prompt: ${error.message}`, {
      userVisible: true,
      originalError: error,
      specificErrorElement: errorMessageElement
    });
  }
}
