/**
 * PromptFinder Extension - Detached Edit Prompt Window
 * Handles form population and submission in the detached window.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached edit prompt window initialized');
  
  const urlParams = new URLSearchParams(window.location.search);
  const promptId = urlParams.get('id');
  
  if (!promptId) {
    showError('No prompt ID provided');
    return;
  }
  
  const promptIdField = document.getElementById('prompt-id');
  if (promptIdField) {
    promptIdField.value = promptId;
  }
  
  // Initialize form and event listeners
  initializeForm();
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
 * Show error message in the UI
 * @param {string} message - Error message to display
 */
function showError(message) {
  console.error(message);
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }
}

/**
 * Show confirmation message in the UI
 * @param {string} message - Confirmation message to display
 */
function showConfirmation(message) {
  const confirmationElement = document.getElementById('confirmation-message');
  if (confirmationElement) {
    confirmationElement.textContent = message;
    confirmationElement.classList.remove('hidden');
  }
}

/**
 * Handle form submission for editing a prompt
 * @param {Event} event - The submit event
 */
async function handleEditPromptSubmit(event) {
  event.preventDefault();
  
  try {
    const Utils = window.PromptFinder.Utils;
    const PromptData = window.PromptFinder.PromptData;
    
    const promptIdField = document.getElementById('prompt-id');
    const titleInput = document.getElementById('prompt-title');
    const textInput = document.getElementById('prompt-text');
    const categoryInput = document.getElementById('prompt-category');
    const tagsInput = document.getElementById('prompt-tags');
    const privateCheckbox = document.getElementById('prompt-private');
    
    if (!promptIdField || !titleInput || !textInput) {
      showError('Form elements missing');
      return;
    }
    
    const promptId = promptIdField.value;
    const title = titleInput.value;
    const text = textInput.value;
    
    if (!promptId) {
      showError('Prompt ID is missing');
      return;
    }
    
    if (!title || !text) {
      showError('Please enter both a title and prompt text');
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
    
    if (!titleInput.dataset.loaded) {
      try {
        const allPrompts = await PromptData.loadPrompts();
        const prompt = await PromptData.findPromptById(promptId, allPrompts);
        
        if (!prompt) {
          showError(`Prompt with ID ${promptId} not found`);
          return;
        }
        
        titleInput.value = prompt.title || '';
        textInput.value = prompt.text || '';
        if (categoryInput) categoryInput.value = prompt.category || '';
        if (tagsInput) tagsInput.value = prompt.tags ? prompt.tags.join(', ') : '';
        if (privateCheckbox) privateCheckbox.checked = prompt.isPrivate || false;
        
        titleInput.dataset.loaded = 'true';
        
        return;
      } catch (loadError) {
        console.error('Failed to load prompt data:', loadError);
        showError('Failed to load prompt data. Please try again.');
        return;
      }
    }
    
    await PromptData.updatePrompt(promptId, {
      title,
      text,
      category,
      tags,
      isPrivate
    });
    
    showConfirmation('Prompt updated successfully!');
    
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    console.error('Error in edit prompt form:', error);
    showError('Failed to update prompt. Please try again.');
  }
}
