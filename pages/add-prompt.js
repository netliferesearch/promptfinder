/**
 * PromptFinder Extension - Detached Add Prompt Window (ESM Version)
 * Handles the form submission in the detached window.
 */
import { auth } from '../js/firebase-init.js';
import { addPrompt } from '../js/promptData.js';
import { handleError, showConfirmationMessage } from '../js/utils.js'; // Removed unused escapeHTML

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached add prompt window initialized (ESM)');
  if (!auth) {
    console.warn(
      'Firebase Auth service not immediately available from firebase-init.js in add-prompt.js. This might be an issue if auth state is needed before user interaction.'
    );
    // Potentially show an error and disable form if auth isn't ready
    // For now, rely on the submit handler to check currentUser
  }
  initializeForm();
});

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

async function handleAddPromptSubmit(event) {
  event.preventDefault();

  const confirmationMessageElement = document.getElementById('confirmation-message');
  const errorMessageElement = document.getElementById('error-message');

  const currentUser = auth ? auth.currentUser : null;
  if (!currentUser) {
    handleError('You must be logged in to add a prompt. Please log in via the extension popup.', {
      userVisible: true,
      specificErrorElement: errorMessageElement,
      timeout: 7000,
    });
    return;
  }

  const titleInput = document.getElementById('prompt-title');
  const textInput = document.getElementById('prompt-text');
  const categoryInput = document.getElementById('prompt-category');
  const tagsInput = document.getElementById('prompt-tags');
  const privateCheckbox = document.getElementById('prompt-private');

  if (!titleInput || !textInput) {
    handleError('Form elements missing', {
      specificErrorElement: errorMessageElement,
      userVisible: true,
    });
    return;
  }

  const title = titleInput.value.trim();
  const text = textInput.value.trim();

  if (!title || !text) {
    handleError('Please enter both a title and prompt text.', {
      specificErrorElement: errorMessageElement,
      userVisible: true,
    });
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
    targetAiTools: [],
  };

  try {
    const newPrompt = await addPrompt(promptDataPayload);

    if (newPrompt && newPrompt.id) {
      // Check for truthy newPrompt and its ID
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'PROMPT_ADDED_OR_MODIFIED' }, _response => {
          // Changed to _response
          if (chrome.runtime.lastError) {
            console.warn(
              'Could not send PROMPT_ADDED_OR_MODIFIED message:',
              chrome.runtime.lastError.message
            );
          } else {
            console.log('PROMPT_ADDED_OR_MODIFIED message sent from add-prompt.js.');
          }
        });
      }

      const form = document.getElementById('add-prompt-form');
      if (form) form.reset();

      showConfirmationMessage('Prompt added successfully!', {
        messageElement: confirmationMessageElement,
        timeout: 3000,
      });

      setTimeout(() => {
        window.close();
      }, 3500);
    } else {
      // addPrompt returns null on failure, and handleError should have been called within addPrompt.
      // This is a fallback if something unexpected happens or error wasn't user-visible.
      if (!errorMessageElement || errorMessageElement.classList.contains('hidden')) {
        handleError('Failed to add prompt. An unexpected error occurred.', {
          specificErrorElement: errorMessageElement,
          userVisible: true,
        });
      }
    }
  } catch (error) {
    // This catch is for unexpected errors from addPrompt itself, though it aims to handle its own.
    handleError(`Critical error adding prompt: ${error.message}`, {
      userVisible: true,
      originalError: error,
      specificErrorElement: errorMessageElement,
    });
  }
}
