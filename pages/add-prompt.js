/**
 * PromptFinder Extension - Detached Add Prompt Window
 * Handles the form submission in the detached window.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached add prompt window initialized');

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
      window.close();
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

  const titleInput = document.getElementById('prompt-title');
  const textInput = document.getElementById('prompt-text');
  const categoryInput = document.getElementById('prompt-category');
  const tagsInput = document.getElementById('prompt-tags');
  const privateCheckbox = document.getElementById('prompt-private');

  if (!titleInput || !textInput) {
    Utils.handleError('Form elements missing');
    return;
  }

  const title = titleInput.value;
  const text = textInput.value;

  if (!title || !text) {
    Utils.handleError('Please enter both a title and prompt text.');
    return;
  }

  const category = categoryInput ? categoryInput.value : '';
  const tags = tagsInput
    ? tagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '')
    : [];
  const isPrivate = privateCheckbox ? privateCheckbox.checked : false;

  try {
    const newPrompt = await PromptData.addPrompt({
      title,
      text,
      category,
      tags,
      isPrivate,
    });

    // Notify main window that a prompt was updated
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ promptUpdated: Date.now() });
    }

    const form = document.getElementById('add-prompt-form');
    if (form) form.reset();

    Utils.showConfirmationMessage('Prompt added successfully!', {
      withButton: true,
      timeout: 5000,
    });

    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    Utils.handleError(`Failed to add prompt: ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
  }
}
