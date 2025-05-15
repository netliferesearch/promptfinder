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
    
    const prompt = await PromptData.findPromptById(promptId);
    
    if (!prompt) {
      if (Utils && Utils.handleError) Utils.handleError(`Prompt with ID ${promptId} not found.`, {specificErrorElement: errorMessageElement, userVisible: true});
      const form = document.getElementById('edit-prompt-form');
      if(form) form.style.display = 'none';
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
    
    console.info('[edit-prompt.js] Prompt data loaded successfully into form.');

  } catch (error) {
    console.error('[edit-prompt.js] Failed to load prompt data:', error);
    if (Utils && Utils.handleError) Utils.handleError('Failed to load prompt data. Please try again.', {specificErrorElement: errorMessageElement, userVisible: true, originalError: error});
  }
}

function showError(message) { 
  console.error(message);
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }
}

function showConfirmation(message) { 
  const confirmationElement = document.getElementById('confirmation-message');
  if (confirmationElement) {
    confirmationElement.textContent = message;
    confirmationElement.classList.remove('hidden');
    setTimeout(() => { confirmationElement.classList.add('hidden'); }, 3000);
  }
}

async function handleEditPromptSubmit(event) {
  event.preventDefault();
  const PromptData = window.PromptFinder.PromptData;
  const Utils = window.PromptFinder.Utils;
  const errorMessageElement = document.getElementById('error-message');
  const confirmationMessageElement = document.getElementById('confirmation-message');
  
  if(errorMessageElement) errorMessageElement.classList.add('hidden');
  if(confirmationMessageElement) confirmationMessageElement.classList.add('hidden');

  const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
  if (!currentUser) {
    return Utils.handleError("You must be logged in to update prompts.", {specificErrorElement: errorMessageElement, userVisible: true});
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
    // targetAiTools could be added here if there was a form field for it
  };
  
  console.log('[edit-prompt.js] Attempting to update prompt with ID:', promptId, 'Data:', updates);
  
  const updatedPrompt = await PromptData.updatePrompt(promptId, updates);
  
  if (updatedPrompt) {
    showConfirmation('Prompt updated successfully!');
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'PROMPT_ADDED_OR_MODIFIED' }, response => {
          if (chrome.runtime.lastError) {
            console.warn("Could not send PROMPT_ADDED_OR_MODIFIED message from edit:", chrome.runtime.lastError.message);
          }
      });
    }
    setTimeout(() => { window.close(); }, 2000); // Close window after 2 seconds
  } else {
    // Error should have been handled by PromptData.updatePrompt, but provide a fallback message.
    // showError function will use the #error-message element on this page.
    showError('Failed to update prompt. Please check details or try again.'); 
  }
}
