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
  
  setTimeout(() => {
    loadPromptData(promptId);
  }, 500);
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
 * Load prompt data and populate form fields
 * @param {string} promptId - ID of the prompt to load
 */
async function loadPromptData(promptId) {
  try {
    if (!window.PromptFinder || !window.PromptFinder.PromptData) {
      console.warn('PromptFinder namespace not available yet, retrying in 500ms');
      setTimeout(() => loadPromptData(promptId), 500);
      return;
    }
    
    const PromptData = window.PromptFinder.PromptData;
    
    const titleInput = document.getElementById('prompt-title');
    const textInput = document.getElementById('prompt-text');
    const categoryInput = document.getElementById('prompt-category');
    const tagsInput = document.getElementById('prompt-tags');
    const privateCheckbox = document.getElementById('prompt-private');
    
    if (!titleInput || !textInput) {
      showError('Form elements missing');
      return;
    }
    
    titleInput.dataset.loaded = 'true';
    
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
    
    console.info('Prompt data loaded successfully');
  } catch (error) {
    console.error('Failed to load prompt data:', error);
    showError('Failed to load prompt data. Please try again.');
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
 * Update form fields with verified data from storage
 * @param {Object} prompt - The verified prompt data
 */
function updateFormWithVerifiedData(prompt) {
  try {
    const titleInput = document.getElementById('prompt-title');
    const textInput = document.getElementById('prompt-text');
    const categoryInput = document.getElementById('prompt-category');
    const tagsInput = document.getElementById('prompt-tags');
    const privateCheckbox = document.getElementById('prompt-private');
    
    if (!titleInput || !textInput) {
      console.error('Form elements missing when trying to update with verified data');
      return;
    }
    
    titleInput.value = prompt.title || '';
    textInput.value = prompt.text || '';
    if (categoryInput) categoryInput.value = prompt.category || '';
    if (tagsInput) tagsInput.value = prompt.tags ? prompt.tags.join(', ') : '';
    if (privateCheckbox) privateCheckbox.checked = prompt.isPrivate || false;
    
    console.info('Form updated with verified data from storage');
  } catch (error) {
    console.error('Error updating form with verified data:', error);
  }
}

/**
 * Add a close button to the confirmation message
 */
function addCloseButton() {
  try {
    if (document.getElementById('close-button')) {
      return;
    }
    
    const formButtons = document.querySelector('.form-buttons');
    if (!formButtons) {
      console.error('Form buttons container not found');
      return;
    }
    
    formButtons.innerHTML = '';
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.id = 'close-button';
    closeButton.textContent = 'Close Window';
    closeButton.className = 'close-button';
    closeButton.style.backgroundColor = '#7C4DFF';
    closeButton.style.color = 'white';
    closeButton.style.padding = '0.75rem 1.5rem';
    closeButton.style.borderRadius = '24px';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.width = '100%';
    
    closeButton.addEventListener('click', () => {
      window.close();
    });
    
    formButtons.appendChild(closeButton);
    
    console.info('Close button added successfully');
  } catch (error) {
    console.error('Error adding close button:', error);
  }
}

/**
 * Handle form submission for editing a prompt
 * @param {Event} event - The submit event
 */
async function handleEditPromptSubmit(event) {
  event.preventDefault();
  
  try {
    if (!window.PromptFinder || !window.PromptFinder.PromptData) {
      showError('Extension not fully initialized. Please try again in a moment.');
      return;
    }
    
    const PromptData = window.PromptFinder.PromptData;
    const Utils = window.PromptFinder.Utils;
    
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
    
    console.log('Updating prompt with ID:', promptId);
    console.log('Update data:', { title, text, category, tags, isPrivate });
    
    const allPrompts = await PromptData.loadPrompts();
    const existingPrompt = await PromptData.findPromptById(promptId, allPrompts);
    
    if (!existingPrompt) {
      showError(`Prompt with ID ${promptId} not found. Cannot update.`);
      return;
    }
    
    console.log('Existing prompt before update:', existingPrompt);
    
    try {
      const updatedPrompt = await PromptData.updatePrompt(promptId, {
        title,
        text,
        category,
        tags,
        isPrivate
      });
      
      console.log('Updated prompt:', updatedPrompt);
      
      const verifyPrompts = await PromptData.loadPrompts();
      const verifiedPrompt = verifyPrompts.find(p => p.id === promptId);
      
      console.log('Verified prompt after update:', verifiedPrompt);
      
      if (!verifiedPrompt) {
        throw new Error('Failed to verify prompt update');
      }
      
      if (verifiedPrompt.title !== title || verifiedPrompt.text !== text) {
        throw new Error('Prompt update verification failed: data mismatch');
      }
      
      updateFormWithVerifiedData(verifiedPrompt);
      
      showConfirmation('Prompt updated successfully!');
      
      addCloseButton();
    } catch (updateError) {
      console.error('Error updating prompt:', updateError);
      showError(`Failed to update prompt: ${updateError.message}`);
    }
  } catch (error) {
    console.error('Error in edit prompt form:', error);
    showError('Failed to update prompt. Please try again.');
  }
}
