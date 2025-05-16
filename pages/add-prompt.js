/**
 * PromptFinder Extension - Detached Add Prompt Window (ESM Version)
 * Handles the form submission in the detached window.
 */
import { auth } from '../js/firebase-init.js';
import { addPrompt } from '../js/promptData.js';
import { handleError, showConfirmationMessage } from '../js/utils.js';

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached add prompt window initialized (ESM)');
  if (!auth) {
    console.warn(
      'Firebase Auth service not immediately available from firebase-init.js in add-prompt.js. This might be an issue if auth state is needed before user interaction.'
    );
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
      window.close();
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
  const descriptionInput = document.getElementById('prompt-description');
  const textInput = document.getElementById('prompt-text');
  const categoryInput = document.getElementById('prompt-category');
  const tagsInput = document.getElementById('prompt-tags');
  const toolsInput = document.getElementById('prompt-tools');
  const privateCheckbox = document.getElementById('prompt-private');

  const title = titleInput ? titleInput.value.trim() : '';
  const description = descriptionInput ? descriptionInput.value.trim() : '';
  const text = textInput ? textInput.value.trim() : '';
  const category = categoryInput ? categoryInput.value.trim() : '';
  const targetAiToolsArray = toolsInput
    ? toolsInput.value
        .split(',')
        .map(tool => tool.trim())
        .filter(tool => tool !== '')
    : [];

  if (!title || !description || !text || !category || targetAiToolsArray.length === 0) {
    handleError(
      'Please fill in all required fields: Title, Description, Prompt Text, Category, and Target AI Tools.',
      {
        specificErrorElement: errorMessageElement,
        userVisible: true,
      }
    );
    return;
  }

  const tags = tagsInput
    ? tagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '')
    : [];
  const isPrivate = privateCheckbox ? privateCheckbox.checked : false;

  const promptDataPayload = {
    title,
    description,
    text,
    category,
    tags,
    targetAiTools: targetAiToolsArray,
    isPrivate,
  };

  try {
    const newPrompt = await addPrompt(promptDataPayload);

    if (newPrompt && newPrompt.id) {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'PROMPT_ADDED_OR_MODIFIED' }, _response => {
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
      if (!errorMessageElement || errorMessageElement.classList.contains('hidden')) {
        handleError('Failed to add prompt. Please check details or try again.', {
          specificErrorElement: errorMessageElement,
          userVisible: true,
        });
      }
    }
  } catch (error) {
    handleError(`Critical error adding prompt: ${error.message}`, {
      userVisible: true,
      originalError: error,
      specificErrorElement: errorMessageElement,
    });
  }
}
