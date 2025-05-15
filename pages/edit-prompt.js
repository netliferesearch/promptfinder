/**
 * PromptFinder Extension - Detached Edit Prompt Window
 * Handles form population and submission in the detached window.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.info('PromptFinder detached edit prompt window initialized');
  
  const urlParams = new URLSearchParams(window.location.search);
  const promptId = urlParams.get('id');
  const promptIdField = document.getElementById('prompt-id');
  const errorMessageElement = document.getElementById('error-message');

  if (!promptId) {
    if (window.PromptFinder && window.PromptFinder.Utils) {
        window.PromptFinder.Utils.handleError('No prompt ID provided in URL.', {specificErrorElement: errorMessageElement, userVisible: true});
    } else {
        console.error('No prompt ID provided in URL.');
    }
    // Disable form or show error and close button
    const form = document.getElementById('edit-prompt-form');
    if(form) form.style.display = 'none';
    return;
  }
  
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
 * Load prompt data and populate form fields
 * @param {string} promptId - ID of the prompt to load
 */
async function loadPromptData(promptId) {
  const Utils = window.PromptFinder.Utils;
  const PromptData = window.PromptFinder.PromptData;
  const errorMessageElement = document.getElementById('error-message');

  try {
    if (!PromptData || !PromptData.findPromptById) {
      const initErrorMsg = 'PromptData module or findPromptById not available.';
      console.error(initErrorMsg);
      if (Utils && Utils.handleError) Utils.handleError(initErrorMsg, {specificErrorElement: errorMessageElement, userVisible: true});
      return;
    }
    
    console.log(`[edit-prompt.js] Loading data for prompt ID: ${promptId}`);
    // Directly use the Firestore-aware findPromptById
    const prompt = await PromptData.findPromptById(promptId);
    
    if (!prompt) {
      if (Utils && Utils.handleError) Utils.handleError(`Prompt with ID ${promptId} not found.`, {specificErrorElement: errorMessageElement, userVisible: true});
      // Optionally disable form or close window
      const form = document.getElementById('edit-prompt-form');
      if(form) form.style.display = 'none';
      return;
    }
    
    // Populate the form fields
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
    
    console.info('[edit-prompt.js] Prompt data loaded successfully into form.');

  } catch (error) {
    console.error('[edit-prompt.js] Failed to load prompt data:', error);
    if (Utils && Utils.handleError) Utils.handleError('Failed to load prompt data. Please try again.', {specificErrorElement: errorMessageElement, userVisible: true, originalError: error});
  }
}

// showError, showConfirmation, updateFormWithVerifiedData, addCloseButton 
// are primarily for the submit handler, so they can remain as is for now.
// We might refactor showError to be more generic if needed.
function showError(message) { // This is a local showError for edit-prompt.js
  console.error(message);
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }
}

function showConfirmation(message) { // Local showConfirmation
  const confirmationElement = document.getElementById('confirmation-message');
  if (confirmationElement) {
    confirmationElement.textContent = message;
    confirmationElement.classList.remove('hidden');
    // Optionally hide after a delay if not closing window immediately
    setTimeout(() => { confirmationElement.classList.add('hidden'); }, 3000);
  }
}

// updateFormWithVerifiedData might not be needed if we close window on success
// or if we re-fetch and re-populate after update.

/**
 * Handle form submission for editing a prompt
 * @param {Event} event - The submit event
 */
async function handleEditPromptSubmit(event) {
  event.preventDefault();
  const PromptData = window.PromptFinder.PromptData;
  const Utils = window.PromptFinder.Utils;
  const errorMessageElement = document.getElementById('error-message');
  const confirmationMessageElement = document.getElementById('confirmation-message');
  
  // Hide previous messages
  if(errorMessageElement) errorMessageElement.classList.add('hidden');
  if(confirmationMessageElement) confirmationMessageElement.classList.add('hidden');

  // Check for currentUser (essential for update operation to check ownership)
  const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
  if (!currentUser) {
    Utils.handleError("You must be logged in to update prompts.", {specificErrorElement: errorMessageElement, userVisible: true});
    return;
  }

  const promptIdField = document.getElementById('prompt-id');
  const titleInput = document.getElementById('prompt-title');
  const textInput = document.getElementById('prompt-text');
  const categoryInput = document.getElementById('prompt-category');
  const tagsInput = document.getElementById('prompt-tags');
  const privateCheckbox = document.getElementById('prompt-private');
  
  const promptId = promptIdField ? promptIdField.value : null;
  const title = titleInput ? titleInput.value.trim() : '';
  const text = textInput ? textInput.value.trim() : '';
  
  if (!promptId) {
    return Utils.handleError('Prompt ID is missing. Cannot update.', {specificErrorElement: errorMessageElement, userVisible: true});
  }
  if (!title || !text) {
    return Utils.handleError('Please enter both a title and prompt text.', {specificErrorElement: errorMessageElement, userVisible: true});
  }
  
  const updates = {
    title,
    text,
    category: categoryInput ? categoryInput.value.trim() : '',
    tags: tagsInput ? tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    isPrivate: privateCheckbox ? privateCheckbox.checked : false,
    // targetAiTools might also be editable here in the future
  };
  
  console.log('[edit-prompt.js] Updating prompt with ID:', promptId, 'Data:', updates);
  
  // We will refactor PromptData.updatePrompt next. For now, this call expects the old structure.
  // const success = await PromptData.updatePrompt(promptId, updates); 
  // For now, let's assume updatePrompt will be refactored and work similarly to addPrompt

  // Placeholder for refactored PromptData.updatePrompt call
  // This will be the subject of the next step.
  // For now, we'll just log and show a temporary message.
  
  Utils.showConfirmationMessage('Update logic pending refactor of PromptData.updatePrompt.', {messageElement: confirmationMessageElement});
  console.warn("PromptData.updatePrompt needs to be refactored for Firestore before this form fully works.");
  
  // Example of how it would look after PromptData.updatePrompt is refactored:
  /*
  const updatedPrompt = await PromptData.updatePrompt(promptId, updates);
  if (updatedPrompt) {
    showConfirmation('Prompt updated successfully!');
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'PROMPT_ADDED_OR_MODIFIED' });
    }
    setTimeout(() => { window.close(); }, 2000);
  } else {
    // Error handled by PromptData.updatePrompt
    showError('Failed to update prompt. Check console for details.'); // Or use Utils.displayAuthError style
  }
  */
}
