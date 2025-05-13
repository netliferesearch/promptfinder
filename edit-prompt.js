/**
 * PromptFinder Extension - Detached Edit Prompt Window
 * Handles form population and submission in the detached window.
 */

function safeHandleError(message, options = {}) {
  console.error(`Error: ${message}`);
  
  if (options.userVisible) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
      
      if (options.timeout) {
        setTimeout(() => {
          errorElement.classList.add('hidden');
        }, options.timeout);
      }
    }
  }
}

function ensurePromptFinderNamespace() {
  if (!window.PromptFinder) {
    window.PromptFinder = {};
  }
  
  if (!window.PromptFinder.Utils) {
    window.PromptFinder.Utils = {
      handleError: safeHandleError,
      showConfirmationMessage: (message, options = {}) => {
        console.log(`Confirmation: ${message}`);
        const confirmationElement = document.getElementById('confirmation-message');
        if (confirmationElement) {
          confirmationElement.textContent = message;
          confirmationElement.classList.remove('hidden');
          
          if (options.timeout) {
            setTimeout(() => {
              confirmationElement.classList.add('hidden');
            }, options.timeout);
          }
        }
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached edit prompt window initialized');
  
  ensurePromptFinderNamespace();
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const promptId = urlParams.get('id');
    
    if (!promptId) {
      safeHandleError('No prompt ID provided', {
        userVisible: true
      });
      return;
    }
    
    const promptIdField = document.getElementById('prompt-id');
    if (promptIdField) {
      promptIdField.value = promptId;
    }
    
    setTimeout(() => {
      initializeForm();
      loadPromptData(promptId);
    }, 100);
  } catch (error) {
    safeHandleError(`Initialization error: ${error.message}`, {
      userVisible: true
    });
  }
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
    ensurePromptFinderNamespace();
    
    const Utils = window.PromptFinder.Utils;
    
    if (!window.PromptFinder.PromptData) {
      safeHandleError('PromptData module not available. Please try again later.', {
        userVisible: true,
        timeout: 5000
      });
      
      setTimeout(() => {
        window.close();
      }, 3000);
      return;
    }
    
    const PromptData = window.PromptFinder.PromptData;
    
    let allPrompts;
    try {
      allPrompts = await PromptData.loadPrompts();
    } catch (loadError) {
      safeHandleError(`Failed to load prompts: ${loadError.message}`, {
        userVisible: true
      });
      return;
    }
    
    let prompt;
    try {
      prompt = await PromptData.findPromptById(promptId, allPrompts);
    } catch (findError) {
      safeHandleError(`Failed to find prompt: ${findError.message}`, {
        userVisible: true
      });
      return;
    }
    
    if (!prompt) {
      safeHandleError(`Prompt with ID ${promptId} not found`, {
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
    safeHandleError(`Failed to load prompt data: ${error.message}`, {
      userVisible: true
    });
  }
}

/**
 * Handle form submission for editing a prompt
 * @param {Event} event - The submit event
 */
async function handleEditPromptSubmit(event) {
  event.preventDefault();
  
  try {
    ensurePromptFinderNamespace();
    
    const Utils = window.PromptFinder.Utils;
    
    if (!window.PromptFinder.PromptData) {
      safeHandleError('PromptData module not available. Please try again later.', {
        userVisible: true,
        timeout: 5000
      });
      
      setTimeout(() => {
        window.close();
      }, 3000);
      return;
    }
    
    const PromptData = window.PromptFinder.PromptData;
    
    const promptIdField = document.getElementById('prompt-id');
    const titleInput = document.getElementById('prompt-title');
    const textInput = document.getElementById('prompt-text');
    const categoryInput = document.getElementById('prompt-category');
    const tagsInput = document.getElementById('prompt-tags');
    const privateCheckbox = document.getElementById('prompt-private');
    
    if (!promptIdField || !titleInput || !textInput) {
      safeHandleError('Form elements missing', {
        userVisible: true
      });
      return;
    }
    
    const promptId = promptIdField.value;
    const title = titleInput.value;
    const text = textInput.value;
    
    if (!promptId) {
      safeHandleError('Prompt ID is missing', {
        userVisible: true
      });
      return;
    }
    
    if (!title || !text) {
      safeHandleError('Please enter both a title and prompt text.', {
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
    } catch (updateError) {
      safeHandleError(`Failed to update prompt: ${updateError.message}`, {
        userVisible: true
      });
    }
  } catch (error) {
    safeHandleError(`An unexpected error occurred: ${error.message}`, {
      userVisible: true
    });
    
    console.error('Edit prompt submission error:', error);
  }
}
