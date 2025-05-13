/**
 * PromptFinder Extension - Detached Edit Prompt Window
 * Handles form population and submission in the detached window.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached edit prompt window initialized');
  
  const urlParams = new URLSearchParams(window.location.search);
  const promptId = urlParams.get('id');
  
  if (!promptId) {
    window.PromptFinder.Utils.handleError('No prompt ID provided', {
      userVisible: true
    });
    return;
  }
  
  const promptIdField = document.getElementById('prompt-id');
  if (promptIdField) {
    promptIdField.value = promptId;
  }
  
  initializeForm();
  loadPromptData(promptId);
});

/**
 * Initialize the form and set up event listeners
 */
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

/**
 * Load prompt data and populate the form
 * @param {string} promptId - ID of the prompt to edit
 */
async function loadPromptData(promptId) {
  try {
    const Utils = window.PromptFinder.Utils;
    const PromptData = window.PromptFinder.PromptData;
    
    const allPrompts = await PromptData.loadPrompts();
    
    const prompt = await PromptData.findPromptById(promptId, allPrompts);
    
    if (!prompt) {
      Utils.handleError(`Prompt with ID ${promptId} not found`, {
        userVisible: true
      });
      return;
    }
    
    const titleInput = document.getElementById('prompt-title');
    const textInput = document.getElementById('prompt-text');
    const categoryInput = document.getElementById('prompt-category');
    const tagsInput = document.getElementById('prompt-tags');
    const privateCheckbox = document.getElementById('prompt-private');
    
    if (titleInput) titleInput.value = prompt.title || '';
    if (textInput) textInput.value = prompt.text || '';
    if (categoryInput) categoryInput.value = prompt.category || '';
    if (tagsInput) tagsInput.value = prompt.tags ? prompt.tags.join(', ') : '';
    if (privateCheckbox) privateCheckbox.checked = prompt.isPrivate || false;
    
  } catch (error) {
    window.PromptFinder.Utils.handleError('Failed to load prompt data', {
      userVisible: true,
      originalError: error
    });
  }
}

/**
 * Handle form submission for editing a prompt
 * @param {Event} event - The submit event
 */
async function handleEditPromptSubmit(event) {
  event.preventDefault();
  
  const Utils = window.PromptFinder.Utils;
  const PromptData = window.PromptFinder.PromptData;
  
  const promptIdField = document.getElementById('prompt-id');
  const titleInput = document.getElementById('prompt-title');
  const textInput = document.getElementById('prompt-text');
  const categoryInput = document.getElementById('prompt-category');
  const tagsInput = document.getElementById('prompt-tags');
  const privateCheckbox = document.getElementById('prompt-private');
  
  if (!promptIdField || !titleInput || !textInput) {
    Utils.handleError('Form elements missing', {
      userVisible: true
    });
    return;
  }
  
  const promptId = promptIdField.value;
  const title = titleInput.value;
  const text = textInput.value;
  
  if (!promptId) {
    Utils.handleError('Prompt ID is missing', {
      userVisible: true
    });
    return;
  }
  
  if (!title || !text) {
    Utils.handleError('Please enter both a title and prompt text.', {
      userVisible: true
    });
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
    await PromptData.updatePrompt(promptId, {
      title,
      text,
      category,
      tags,
      isPrivate
    });
    
    Utils.showConfirmationMessage('Prompt updated successfully!', {
      withButton: true,
      timeout: 5000
    });
    
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    Utils.handleError(`Failed to update prompt: ${error.message}`, {
      userVisible: true,
      originalError: error
    });
  }
}
