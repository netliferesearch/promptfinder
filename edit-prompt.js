/**
 * PromptFinder Extension - Detached Edit Prompt Window
 * Handles form population and submission in the detached window.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached edit prompt window initialized');
  
  const urlParams = new URLSearchParams(window.location.search);
  const promptId = urlParams.get('id');
  
  if (!promptId) {
    console.error('No prompt ID provided');
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = 'No prompt ID provided';
      errorElement.classList.remove('hidden');
    }
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
    const PromptData = window.PromptFinder.PromptData;
    
    const allPrompts = await PromptData.loadPrompts();
    const prompt = await PromptData.findPromptById(promptId, allPrompts);
    
    if (!prompt) {
      console.error(`Prompt with ID ${promptId} not found`);
      const errorElement = document.getElementById('error-message');
      if (errorElement) {
        errorElement.textContent = `Prompt with ID ${promptId} not found`;
        errorElement.classList.remove('hidden');
      }
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
    console.error('Failed to load prompt data:', error);
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = 'Failed to load prompt data';
      errorElement.classList.remove('hidden');
    }
  }
}

/**
 * Handle form submission for editing a prompt
 * @param {Event} event - The submit event
 */
async function handleEditPromptSubmit(event) {
  event.preventDefault();
  
  const promptIdField = document.getElementById('prompt-id');
  const titleInput = document.getElementById('prompt-title');
  const textInput = document.getElementById('prompt-text');
  const categoryInput = document.getElementById('prompt-category');
  const tagsInput = document.getElementById('prompt-tags');
  const privateCheckbox = document.getElementById('prompt-private');
  
  if (!promptIdField || !titleInput || !textInput) {
    console.error('Form elements missing');
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = 'Form elements missing';
      errorElement.classList.remove('hidden');
    }
    return;
  }
  
  const promptId = promptIdField.value;
  const title = titleInput.value;
  const text = textInput.value;
  
  if (!promptId) {
    console.error('Prompt ID is missing');
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = 'Prompt ID is missing';
      errorElement.classList.remove('hidden');
    }
    return;
  }
  
  if (!title || !text) {
    console.error('Please enter both a title and prompt text');
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = 'Please enter both a title and prompt text';
      errorElement.classList.remove('hidden');
    }
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
    const PromptData = window.PromptFinder.PromptData;
    
    await PromptData.updatePrompt(promptId, {
      title,
      text,
      category,
      tags,
      isPrivate
    });
    
    const confirmationElement = document.getElementById('confirmation-message');
    if (confirmationElement) {
      confirmationElement.textContent = 'Prompt updated successfully!';
      confirmationElement.classList.remove('hidden');
    }
    
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    console.error('Failed to update prompt:', error);
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = 'Failed to update prompt';
      errorElement.classList.remove('hidden');
    }
  }
}
