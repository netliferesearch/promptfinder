/**
 * PromptFinder Extension - Detached Edit Prompt Window (ESM Version)
 * Handles form population and submission in the detached window.
 */
import { PROMPT_CATEGORIES } from '../js/categories.js';
import { auth } from '../js/firebase-init.js';
import { findPromptById, updatePrompt } from '../js/promptData.js';
import { handleError, showConfirmationMessage } from '../js/utils.js';

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached edit prompt window initialized (ESM)');

  const urlParams = new URLSearchParams(window.location.search);
  const promptId = urlParams.get('id');
  const promptIdField = document.getElementById('prompt-id');
  const errorMessageElement = document.getElementById('error-message');

  if (!auth) {
    console.warn(
      'Firebase Auth service not immediately available from firebase-init.js in edit-prompt.js.'
    );
  }

  if (!promptId) {
    handleError('No prompt ID provided in URL.', {
      specificErrorElement: errorMessageElement,
      userVisible: true,
    });
    const form = document.getElementById('edit-prompt-form');
    if (form) form.style.display = 'none';
    return;
  }

  if (promptIdField) {
    promptIdField.value = promptId;
  }

  initializeForm();
  populateCategoryDropdown();
  loadPromptData(promptId, errorMessageElement);
});

function initializeForm() {
  const editPromptForm = document.getElementById('edit-prompt-form');
  if (editPromptForm) {
    editPromptForm.addEventListener('submit', handleEditPromptSubmit);
  }

  const cancelEditPromptButton = document.getElementById('cancel-edit-prompt');
  if (cancelEditPromptButton) {
    cancelEditPromptButton.addEventListener('click', () => {
      window.close();
    });
  }
}

function populateCategoryDropdown() {
  const categorySelect = document.getElementById('prompt-category');
  if (categorySelect) {
    categorySelect.innerHTML = '';

    // Add a default empty option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select a category --';
    categorySelect.appendChild(defaultOption);

    // Add all predefined categories
    PROMPT_CATEGORIES.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  }
}

async function loadPromptData(promptId, errorElement) {
  try {
    const prompt = await findPromptById(promptId);

    if (!prompt) {
      handleError(`Prompt with ID ${promptId} not found.`, {
        specificErrorElement: errorElement,
        userVisible: true,
      });
      const form = document.getElementById('edit-prompt-form');
      if (form) form.style.display = 'none';
      return;
    }

    const titleInput = document.getElementById('prompt-title');
    const descriptionInput = document.getElementById('prompt-description');
    const textInput = document.getElementById('prompt-text');
    const categorySelect = document.getElementById('prompt-category');
    const tagsInput = document.getElementById('prompt-tags');
    const toolsInput = document.getElementById('prompt-tools');
    const privateCheckbox = document.getElementById('prompt-private');

    if (titleInput) titleInput.value = prompt.title || '';
    if (descriptionInput) descriptionInput.value = prompt.description || '';
    if (textInput) textInput.value = prompt.text || '';
    if (categorySelect) categorySelect.value = prompt.category || '';
    if (tagsInput) tagsInput.value = prompt.tags ? prompt.tags.join(', ') : '';
    if (toolsInput) toolsInput.value = prompt.targetAiTools ? prompt.targetAiTools.join(', ') : '';
    if (privateCheckbox) privateCheckbox.checked = prompt.isPrivate || false;

    console.info('[edit-prompt.js ESM] Prompt data loaded successfully into form.');
  } catch (error) {
    console.error('[edit-prompt.js ESM] Failed to load prompt data:', error);
    handleError('Failed to load prompt data. Please try again.', {
      specificErrorElement: errorElement,
      userVisible: true,
      originalError: error,
    });
  }
}

async function handleEditPromptSubmit(event) {
  event.preventDefault();
  const errorMessageElement = document.getElementById('error-message');
  const confirmationMessageElement = document.getElementById('confirmation-message');

  if (errorMessageElement) errorMessageElement.classList.add('hidden');
  if (confirmationMessageElement) confirmationMessageElement.classList.add('hidden');

  const currentUser = auth ? auth.currentUser : null;
  if (!currentUser) {
    handleError('You must be logged in to update prompts.', {
      specificErrorElement: errorMessageElement,
      userVisible: true,
    });
    return;
  }

  const promptIdField = document.getElementById('prompt-id');
  const titleInput = document.getElementById('prompt-title');
  const descriptionInput = document.getElementById('prompt-description');
  const textInput = document.getElementById('prompt-text');
  const categorySelect = document.getElementById('prompt-category');
  const tagsInput = document.getElementById('prompt-tags');
  const toolsInput = document.getElementById('prompt-tools');
  const privateCheckbox = document.getElementById('prompt-private');

  const promptId = promptIdField ? promptIdField.value : null;
  const title = titleInput ? titleInput.value.trim() : '';
  const description = descriptionInput ? descriptionInput.value.trim() : '';
  const text = textInput ? textInput.value.trim() : '';
  const category = categorySelect ? categorySelect.value : '';
  const targetAiToolsArray = toolsInput
    ? toolsInput.value
        .split(',')
        .map(tool => tool.trim())
        .filter(tool => tool !== '')
    : [];

  if (!promptId) {
    handleError('Prompt ID is missing. Cannot update.', {
      specificErrorElement: errorMessageElement,
      userVisible: true,
    });
    return;
  }
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

  const updates = {
    title,
    description,
    text,
    category,
    tags: tagsInput
      ? tagsInput.value
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag)
      : [],
    targetAiTools: targetAiToolsArray,
    isPrivate: privateCheckbox ? privateCheckbox.checked : false,
  };

  console.log(
    '[edit-prompt.js ESM] Attempting to update prompt with ID:',
    promptId,
    'Data:',
    updates
  );

  try {
    const updatedPrompt = await updatePrompt(promptId, updates);

    if (updatedPrompt && updatedPrompt.id) {
      showConfirmationMessage('Prompt updated successfully!', {
        messageElement: confirmationMessageElement,
        timeout: 1500,
      });

      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'PROMPT_ADDED_OR_MODIFIED' }, _response => {
          if (chrome.runtime.lastError) {
            console.warn(
              'Could not send PROMPT_ADDED_OR_MODIFIED message from edit:',
              chrome.runtime.lastError.message
            );
          }
        });
      }
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      if (!errorMessageElement || errorMessageElement.classList.contains('hidden')) {
        handleError('Failed to update prompt. Please check details or try again.', {
          specificErrorElement: errorMessageElement,
          userVisible: true,
        });
      }
    }
  } catch (error) {
    handleError(`Critical error updating prompt: ${error.message}`, {
      userVisible: true,
      originalError: error,
      specificErrorElement: errorMessageElement,
    });
  }
}
