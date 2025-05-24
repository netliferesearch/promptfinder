// (Removed duplicate: Always hide the delete confirmation dialog when entering add mode)
// Cancel edit handler for in-place editing
function handleCancelEditPrompt(prompt) {
  // Clear draft and revert to original data
  getDraftStorage()
    .remove(editDraftKey(prompt.id))
    .then(() => {
      // Remove global edit mode class from body
      document.body.classList.remove('editing-prompt');

      // Remove edit mode heading if it exists
      const editHeading = document.getElementById('edit-mode-heading');
      if (editHeading && editHeading.parentNode) {
        editHeading.parentNode.removeChild(editHeading);
      }

      // Show elements that were hidden during edit mode
      // Will be handled by displayPromptDetails

      displayPromptDetails(prompt);
    });
}
// --- In-place editing state and helpers ---
let promptDetailEditableFieldsWrapperEl;
let promptDetailStaticFieldsWrapperEl;
let promptEditActionsBarEl;
let promptOwnerActionsBarEl;
// Draft storage keys
const editDraftKey = promptId => `editDraft_${promptId}`;

// Add a constant for the add prompt draft key
const ADD_DRAFT_KEY = 'addDraft';

// Function to show inline add prompt form
function showAddPromptInline() {
  // Always hide the delete confirmation dialog when entering add mode
  var localDeleteConfirmationEl = document.getElementById('delete-confirmation');
  if (localDeleteConfirmationEl) {
    localDeleteConfirmationEl.classList.add('hidden');
  }
  if (!promptDetailsSectionEl) return;

  // Cache DOM elements if needed
  if (!promptDetailEditableFieldsWrapperEl)
    promptDetailEditableFieldsWrapperEl = document.getElementById(
      'prompt-detail-editable-fields-wrapper'
    );
  if (!promptDetailStaticFieldsWrapperEl)
    promptDetailStaticFieldsWrapperEl = document.getElementById(
      'prompt-detail-static-fields-wrapper'
    );
  if (!promptEditActionsBarEl)
    promptEditActionsBarEl = document.getElementById('prompt-edit-actions-bar');
  if (!promptOwnerActionsBarEl)
    promptOwnerActionsBarEl = document.getElementById('prompt-owner-actions-bar');

  // Get draft storage to retrieve any previously entered data
  const draftStorage = getDraftStorage();

  // Retrieve any existing draft
  draftStorage.get(ADD_DRAFT_KEY).then(draft => {
    // Set up edit view similar to showEditMode but for a new prompt
    promptDetailEditableFieldsWrapperEl.innerHTML = renderAddPromptForm(draft);
    promptDetailEditableFieldsWrapperEl.classList.remove('hidden');
    promptDetailStaticFieldsWrapperEl.classList.add('hidden');

    // Show edit actions bar but toggle between edit and add buttons
    if (promptEditActionsBarEl) {
      promptEditActionsBarEl.classList.remove('hidden');
      const editButtons = document.getElementById('edit-prompt-buttons');
      const addButtons = document.getElementById('add-prompt-buttons');
      if (editButtons) editButtons.classList.add('hidden');
      if (addButtons) addButtons.classList.remove('hidden');
    }

    if (promptOwnerActionsBarEl) promptOwnerActionsBarEl.classList.add('hidden');

    // Add classes to body for styling - both editing-prompt for shared styles and adding-prompt for add-specific styles
    document.body.classList.add('editing-prompt', 'adding-prompt');

    // Add editing class to prompt details section
    if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('editing');

    // Hide category dropdown bar
    const categoryDropdownBar = document.querySelector('.category-dropdown-bar');
    if (categoryDropdownBar) categoryDropdownBar.classList.add('hidden');

    // Hide additional elements in add mode
    // 1. Prompt title and actions (copy, favorite)
    const promptHeader = document.querySelector('.prompt-item__header');
    if (promptHeader) promptHeader.classList.add('hidden');

    // Add a heading to indicate add mode
    const editHeading = document.createElement('div');
    editHeading.id = 'edit-mode-heading';
    editHeading.classList.add('edit-mode-heading');
    editHeading.innerHTML = `<h2>${getText('ADD_NEW_PROMPT')}</h2>`;
    if (promptDetailEditableFieldsWrapperEl) {
      promptDetailEditableFieldsWrapperEl.insertAdjacentElement('beforebegin', editHeading);
    }

    // 2. Prompt category and tags
    const promptCategory = document.getElementById('prompt-detail-category');
    if (promptCategory) promptCategory.classList.add('hidden');

    const promptTags = document.getElementById('prompt-detail-tags');
    if (promptTags) promptTags.classList.add('hidden');

    // 3. Back to list button
    const backToListButton = document.getElementById('back-to-list-button');
    if (backToListButton) backToListButton.classList.add('hidden');

    // Hide ratings
    if (userStarRatingEl && userStarRatingEl.parentElement) {
      userStarRatingEl.parentElement.classList.add('hidden');
    }
    if (communityRatingSectionEl) {
      communityRatingSectionEl.classList.add('hidden');
    }

    // Set up form listeners
    const form = document.getElementById('prompt-add-form');
    if (form) {
      // Wire up Cancel button
      const cancelAddBtn = document.getElementById('cancel-add-prompt-button');
      if (cancelAddBtn) {
        cancelAddBtn.onclick = () => handleCancelAddPrompt();
      }

      // Wire up Save button
      const saveAddBtn = document.getElementById('save-add-prompt-button');
      if (saveAddBtn) {
        saveAddBtn.onclick = () => handleSaveAddPrompt();
      }

      // Set up input listeners for draft persistence
      form.addEventListener('input', () => {
        const data = {
          title: document.getElementById('add-title')?.value || '',
          description: document.getElementById('add-description')?.value || '',
          text: document.getElementById('add-text')?.value || '',
          category: document.getElementById('add-category')?.value || '',
          tags: document.getElementById('add-tags')?.value || '',
          isPrivate: document.getElementById('add-private')?.checked || false,
          aiTools:
            document
              .getElementById('add-tools')
              ?.value.split(',')
              .map(t => t.trim())
              .filter(Boolean) || [],
        };
        draftStorage.set(ADD_DRAFT_KEY, data);
      });
    }
  });
}

function renderAddPromptForm(draft = null) {
  // Use PROMPT_CATEGORIES from window or fallback
  const categories = window.PROMPT_CATEGORIES || [
    'Brainstorming & Idea Generation',
    'Planning & Strategy',
    'Writing & Content Creation',
    'Design & Visual Thinking',
    'Code & Technical Productivity',
    'Research & Analysis',
    'Execution & Delivery',
    'Optimization & Testing',
    'Decision-Making & Clarity',
    'Personal Productivity & Focus',
    'Workshop & Meeting Support',
    'Client Communication & Sales',
    'Team Collaboration & Alignment',
    'Professional Development',
    'Creative Projects & Hobbies',
    'Life Admin & Personal Insight',
  ];

  // Use draft values if available
  const title = draft?.title || '';
  const description = draft?.description || '';
  const text = draft?.text || '';
  const category = draft?.category || '';
  const tags = draft?.tags || '';
  const targetAiTools = draft?.aiTools?.join(', ') || '';
  const isPrivate = draft?.isPrivate || false;

  return `
    <form id="prompt-add-form" autocomplete="off" novalidate>
      <div class="form-group">
        <label for="add-title">${getText('TITLE_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="add-title" name="title" required maxlength="100" rows="2" aria-required="true">${Utils.escapeHTML(title)}</textarea>
      </div>
      <div class="form-group">
        <label for="add-description">${getText('DESCRIPTION_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="add-description" name="description" required maxlength="500" aria-required="true">${Utils.escapeHTML(description)}</textarea>
      </div>
      <div class="form-group">
        <label for="add-text">${getText('PROMPT_TEXT_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="add-text" name="text" required aria-required="true">${Utils.escapeHTML(text)}</textarea>
      </div>
      <div class="form-group">
        <label for="add-category">${getText('CATEGORY_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <select id="add-category" name="category" required aria-required="true">
          <option value="">${getText('SELECT_CATEGORY')}</option>
          ${categories.map(cat => `<option value="${Utils.escapeHTML(cat)}" ${category === cat ? 'selected' : ''}>${Utils.escapeHTML(cat)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="add-tags">${getText('TAGS_LABEL')}:</label>
        <input type="text" id="add-tags" name="tags" value="${Utils.escapeHTML(tags)}" />
      </div>
      <div class="form-group">
        <label for="add-tools">${getText('TARGET_AI_TOOLS_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <input type="text" id="add-tools" name="targetAiTools" required aria-required="true" value="${Utils.escapeHTML(targetAiTools)}" />
      </div>
      <div class="form-group">
        <input type="checkbox" id="add-private" name="isPrivate" ${isPrivate ? 'checked' : ''} />
        <label for="add-private">${getText('MAKE_PRIVATE_LABEL')}</label>
      </div>
    </form>
  `;
}

function getAddFormData() {
  const form = document.getElementById('prompt-add-form');
  if (!form) return {};

  return {
    title: document.getElementById('add-title')?.value.trim() || '',
    description: document.getElementById('add-description')?.value.trim() || '',
    text: document.getElementById('add-text')?.value.trim() || '',
    category: document.getElementById('add-category')?.value || '',
    tags: document
      .getElementById('add-tags')
      ?.value.split(',')
      .map(t => t.trim())
      .filter(Boolean),
    targetAiTools: document
      .getElementById('add-tools')
      ?.value.split(',')
      .map(t => t.trim())
      .filter(Boolean),
    isPrivate: document.getElementById('add-private')?.checked || false,
  };
}

function handleCancelAddPrompt() {
  // Remove global edit mode classes from body
  document.body.classList.remove('editing-prompt', 'adding-prompt');

  // Remove edit mode heading if it exists
  const editHeading = document.getElementById('edit-mode-heading');
  if (editHeading && editHeading.parentNode) {
    editHeading.parentNode.removeChild(editHeading);
  }

  // Get the form data before closing and save it to draft storage
  const form = document.getElementById('prompt-add-form');
  if (form) {
    const data = {
      title: document.getElementById('add-title')?.value || '',
      description: document.getElementById('add-description')?.value || '',
      text: document.getElementById('add-text')?.value || '',
      category: document.getElementById('add-category')?.value || '',
      tags: document.getElementById('add-tags')?.value || '',
      isPrivate: document.getElementById('add-private')?.checked || false,
      aiTools:
        document
          .getElementById('add-tools')
          ?.value.split(',')
          .map(t => t.trim())
          .filter(Boolean) || [],
    };
    // Save the draft data so it's available if user returns
    getDraftStorage().set(ADD_DRAFT_KEY, data);
  }

  // Return to prompt list view
  showPromptList();
}

async function handleSaveAddPrompt() {
  const form = document.getElementById('prompt-add-form');
  if (!form) return;
  const data = getAddFormData();

  // Validate required fields and show inline, accessible error message
  const requiredFields = [
    { id: 'add-title', name: 'Title' },
    { id: 'add-description', name: 'Description' },
    { id: 'add-text', name: 'Prompt Text' },
    { id: 'add-category', name: 'Category' },
    { id: 'add-tools', name: 'Target AI Tools' },
  ];
  let firstInvalid = null;
  let missingFields = [];
  requiredFields.forEach(field => {
    const el = document.getElementById(field.id);
    let value = el?.value?.trim() || '';
    if (field.id === 'add-category' && value === '') value = '';
    if (
      field.id === 'add-tools' &&
      value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean).length === 0
    )
      value = '';
    if (!value) {
      missingFields.push(field.name);
      if (!firstInvalid) firstInvalid = el;
      if (el) {
        el.setAttribute('aria-invalid', 'true');
        el.classList.add('input-error');
      }
    } else if (el) {
      el.removeAttribute('aria-invalid');
      el.classList.remove('input-error');
    }
  });
  // Show error using the global message system
  if (missingFields.length > 0) {
    Utils.handleError(
      textManager.format('REQUIRED_FIELDS_ERROR', { fields: missingFields.join(', ') }),
      {
        userVisible: true,
        type: 'error',
        timeout: 5000,
        specificErrorElement: null,
      }
    );
    if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
    return;
  }

  try {
    const newPrompt = await PromptData.addPrompt(data);
    if (newPrompt && newPrompt.id) {
      // Clear the draft storage since we successfully saved the prompt
      const draftStorage = getDraftStorage();
      await draftStorage.remove(ADD_DRAFT_KEY);

      Utils.showConfirmationMessage(getText('PROMPT_ADDED_SUCCESS'));

      // Notify any listeners (like the popup) that a prompt was modified (silence connection warning)
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'PROMPT_ADDED_OR_MODIFIED' }, _response => {
          if (
            chrome.runtime.lastError &&
            !chrome.runtime.lastError.message.includes('Could not establish connection')
          ) {
            console.warn(
              'Could not send PROMPT_ADDED_OR_MODIFIED message:',
              chrome.runtime.lastError.message
            );
          }
        });
      }

      // Show the details view for the newly added prompt
      await loadAndDisplayData();
      if (newPrompt && newPrompt.id) {
        // If you want to always reload from DB, use: await viewPromptDetails(newPrompt.id);
        displayPromptDetails(newPrompt);
      }
    } else {
      Utils.handleError('Failed to add prompt. Please check details or try again.', {
        userVisible: true,
      });
    }
  } catch (error) {
    Utils.handleError('Critical error adding prompt: ' + error.message, {
      userVisible: true,
      originalError: error,
    });
  }
}

function getDraftStorage() {
  // Prefer chrome.storage.local, fallback to localStorage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return {
      get: key =>
        new Promise(resolve => {
          chrome.storage.local.get([key], result => resolve(result[key] || null));
        }),
      set: (key, value) =>
        new Promise(resolve => {
          chrome.storage.local.set({ [key]: value }, resolve);
        }),
      remove: key =>
        new Promise(resolve => {
          chrome.storage.local.remove([key], resolve);
        }),
    };
  } else {
    return {
      get: key =>
        Promise.resolve(localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : null),
      set: (key, value) => Promise.resolve(localStorage.setItem(key, JSON.stringify(value))),
      remove: key => Promise.resolve(localStorage.removeItem(key)),
    };
  }
}

function renderPromptEditForm(prompt, draft) {
  // Returns HTML for the edit form fields, using draft if present, else prompt
  const val = (field, fallback = '') =>
    draft && draft[field] !== undefined ? draft[field] : prompt[field] || fallback;
  const tags = Array.isArray(val('tags', [])) ? val('tags', []).join(', ') : val('tags', '');
  const tools = Array.isArray(val('targetAiTools', []))
    ? val('targetAiTools', []).join(', ')
    : val('targetAiTools', '');
  // Use PROMPT_CATEGORIES from window or fallback
  const categories = window.PROMPT_CATEGORIES || [
    'Brainstorming & Idea Generation',
    'Planning & Strategy',
    'Writing & Content Creation',
    'Design & Visual Thinking',
    'Code & Technical Productivity',
    'Research & Analysis',
    'Execution & Delivery',
    'Optimization & Testing',
    'Decision-Making & Clarity',
    'Personal Productivity & Focus',
    'Workshop & Meeting Support',
    'Client Communication & Sales',
    'Team Collaboration & Alignment',
    'Professional Development',
    'Creative Projects & Hobbies',
    'Life Admin & Personal Insight',
  ];
  return `
    <form id="prompt-edit-form" autocomplete="off" novalidate>
      <div class="form-group">
        <label for="edit-title">${getText('TITLE_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="edit-title" name="title" required maxlength="100" rows="2" aria-required="true">${Utils.escapeHTML(val('title'))}</textarea>
      </div>
      <div class="form-group">
        <label for="edit-description">${getText('DESCRIPTION_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="edit-description" name="description" required maxlength="500" aria-required="true">${Utils.escapeHTML(val('description'))}</textarea>
      </div>
      <div class="form-group">
        <label for="edit-text">${getText('PROMPT_TEXT_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="edit-text" name="text" required aria-required="true">${Utils.escapeHTML(val('text'))}</textarea>
      </div>
      <div class="form-group">
        <label for="edit-category">${getText('CATEGORY_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <select id="edit-category" name="category" required aria-required="true">
          <option value="">${getText('SELECT_CATEGORY')}</option>
          ${categories.map(cat => `<option value="${Utils.escapeHTML(cat)}"${val('category') === cat ? ' selected' : ''}>${Utils.escapeHTML(cat)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="edit-tags">${getText('TAGS_LABEL')}:</label>
        <input type="text" id="edit-tags" name="tags" value="${Utils.escapeHTML(tags)}" />
      </div>
      <div class="form-group">
        <label for="edit-tools">${getText('TARGET_AI_TOOLS_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <input type="text" id="edit-tools" name="targetAiTools" required aria-required="true" value="${Utils.escapeHTML(tools)}" />
      </div>
      <div class="form-group">
        <input type="checkbox" id="edit-private" name="isPrivate"${val('isPrivate') ? ' checked' : ''} />
        <label for="edit-private">${getText('MAKE_PRIVATE_LABEL')}</label>
      </div>
    </form>
  `;
}

function showEditMode(prompt) {
  if (!promptDetailsSectionEl) return;
  if (!promptDetailEditableFieldsWrapperEl)
    promptDetailEditableFieldsWrapperEl = document.getElementById(
      'prompt-detail-editable-fields-wrapper'
    );
  if (!promptDetailStaticFieldsWrapperEl)
    promptDetailStaticFieldsWrapperEl = document.getElementById(
      'prompt-detail-static-fields-wrapper'
    );
  if (!promptEditActionsBarEl)
    promptEditActionsBarEl = document.getElementById('prompt-edit-actions-bar');
  if (!promptOwnerActionsBarEl)
    promptOwnerActionsBarEl = document.getElementById('prompt-owner-actions-bar');
  const draftStorage = getDraftStorage();
  const promptId = prompt.id;
  draftStorage.get(editDraftKey(promptId)).then(draft => {
    promptDetailEditableFieldsWrapperEl.innerHTML = renderPromptEditForm(prompt, draft);
    promptDetailEditableFieldsWrapperEl.classList.remove('hidden');
    promptDetailStaticFieldsWrapperEl.classList.add('hidden');

    // Show edit buttons and hide add buttons
    if (promptEditActionsBarEl) {
      console.log('Showing edit actions bar:', promptEditActionsBarEl);
      promptEditActionsBarEl.classList.remove('hidden');
      promptEditActionsBarEl.style.display = 'flex'; // Force display flex

      const editButtons = document.getElementById('edit-prompt-buttons');
      const addButtons = document.getElementById('add-prompt-buttons');

      if (editButtons) {
        console.log('Found edit buttons, showing:', editButtons);
        editButtons.classList.remove('hidden');
        editButtons.style.display = 'flex'; // Force display flex
      }

      if (addButtons) {
        console.log('Found add buttons, hiding:', addButtons);
        addButtons.classList.add('hidden');
      }
    }

    if (promptOwnerActionsBarEl) promptOwnerActionsBarEl.classList.add('hidden');

    // Add editing-prompt class but ensure adding-prompt class is removed
    // This ensures we're in edit mode but not add mode
    document.body.classList.add('editing-prompt');
    document.body.classList.remove('adding-prompt');

    // Add editing class to prompt details section for specific styling
    if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('editing');

    // Hide category dropdown bar in edit mode
    const categoryDropdownBar = document.querySelector('.category-dropdown-bar');
    if (categoryDropdownBar) categoryDropdownBar.classList.add('hidden');

    // Hide additional elements in edit mode
    // 1. Prompt title and actions (copy, favorite)
    const promptHeader = document.querySelector('.prompt-item__header');
    if (promptHeader) promptHeader.classList.add('hidden');

    // Add a heading to indicate edit mode
    const editHeading = document.createElement('div');
    editHeading.id = 'edit-mode-heading';
    editHeading.classList.add('edit-mode-heading');
    editHeading.innerHTML = `<h2>${getText('EDITING_PROMPT')}</h2>`;
    if (promptDetailEditableFieldsWrapperEl) {
      promptDetailEditableFieldsWrapperEl.insertAdjacentElement('beforebegin', editHeading);
    }

    // 2. Prompt category and tags
    const promptCategory = document.getElementById('prompt-detail-category');
    if (promptCategory) promptCategory.classList.add('hidden');

    const promptTags = document.getElementById('prompt-detail-tags');
    if (promptTags) promptTags.classList.add('hidden');

    // 3. Back to list button
    const backToListButton = document.getElementById('back-to-list-button');
    if (backToListButton) backToListButton.classList.add('hidden');

    // Hide ratings when editing
    if (userStarRatingEl && userStarRatingEl.parentElement) {
      userStarRatingEl.parentElement.classList.add('hidden');
    }
    if (communityRatingSectionEl) {
      communityRatingSectionEl.classList.add('hidden');
    }

    // Set up input listeners for draft persistence
    const form = document.getElementById('prompt-edit-form');
    if (form) {
      form.addEventListener('input', () => {
        const data = getEditFormData();
        draftStorage.set(editDraftKey(promptId), data);
      });
      // Wire up Cancel button after rendering the form
      const cancelEditBtn = document.getElementById('cancel-edit-prompt-button');
      if (cancelEditBtn) {
        cancelEditBtn.onclick = () => handleCancelEditPrompt(prompt);
      }
    }
  });
}

function getEditFormData() {
  const form = document.getElementById('prompt-edit-form');
  if (!form) return {};
  return {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    text: form.text.value.trim(),
    category: form.category.value,
    tags: form.tags.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean),
    targetAiTools: form.targetAiTools.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean),
    isPrivate: form.isPrivate.checked,
  };
}

async function handleSaveEditPrompt(prompt) {
  const form = document.getElementById('prompt-edit-form');
  if (!form) return;
  const data = getEditFormData();
  // Validate required fields and show inline, accessible error message
  const requiredFields = [
    { id: 'edit-title', name: 'Title' },
    { id: 'edit-description', name: 'Description' },
    { id: 'edit-text', name: 'Prompt Text' },
    { id: 'edit-category', name: 'Category' },
    { id: 'edit-tools', name: 'Target AI Tools' },
  ];
  let firstInvalid = null;
  let missingFields = [];
  requiredFields.forEach(field => {
    const el = document.getElementById(field.id);
    let value = el?.value?.trim() || '';
    if (field.id === 'edit-category' && value === '') value = '';
    if (
      field.id === 'edit-tools' &&
      value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean).length === 0
    ) {
      value = '';
    }
    if (!value) {
      missingFields.push(field.name);
      if (!firstInvalid) firstInvalid = el;
      if (el) {
        el.setAttribute('aria-invalid', 'true');
        el.classList.add('input-error');
      }
    } else if (el) {
      el.removeAttribute('aria-invalid');
      el.classList.remove('input-error');
    }
  });
  // Show error using the global message system
  if (missingFields.length > 0) {
    Utils.handleError(
      textManager.format('REQUIRED_FIELDS_ERROR', { fields: missingFields.join(', ') }),
      {
        userVisible: true,
        type: 'error',
        timeout: 5000,
        specificErrorElement: null,
      }
    );
    if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
    return;
  }
  try {
    const updatedPrompt = await PromptData.updatePrompt(prompt.id, data);
    if (updatedPrompt && updatedPrompt.id) {
      // Clear draft
      await getDraftStorage().remove(editDraftKey(prompt.id));
      Utils.showConfirmationMessage(getText('PROMPT_UPDATED_SUCCESS'));
      displayPromptDetails(updatedPrompt);
    } else {
      Utils.handleError('Failed to update prompt. Please check details or try again.', {
        userVisible: true,
      });
    }
  } catch (error) {
    Utils.handleError('Critical error updating prompt: ' + error.message, {
      userVisible: true,
      originalError: error,
    });
  }
}

// --- Category dropdown sync helpers ---
function syncCategoryDropdowns(source) {
  if (!mainCategoryDropdownEl || !categoryFilterEl) return;
  if (source === 'main') {
    categoryFilterEl.value = mainCategoryDropdownEl.value;
  } else {
    mainCategoryDropdownEl.value = categoryFilterEl.value;
  }
}
// Main category dropdown DOM element
let mainCategoryDropdownEl;
/**
 * PromptFinder Extension - UI Controllers
 * Contains functions for managing the UI and interactions.
 */

import * as Utils from './utils.js';
import * as PromptData from './promptData.js';
import { auth } from './firebase-init.js'; // Import the initialized auth service
import { PROMPT_CATEGORIES } from './categories.js';
import { getText, textManager } from './text-constants.js';

// Import Prism.js
import 'prismjs'; // Core
import 'prismjs/components/prism-markdown.min.js'; // Markdown language support

let allPrompts = [];
let activeTab = 'all';

const PROMPT_TRUNCATE_LENGTH = 200;

// Cached DOM Elements (module scope)
let tabAllEl, tabFavsEl, tabPrivateEl;
let searchInputEl;
let filterButtonEl,
  ratingFilterPanelEl,
  minRatingSelectEl,
  minUserRatingSelectEl,
  yourPromptsOnlyEl,
  usedByYouEl,
  categoryFilterEl,
  tagFilterEl,
  aiToolFilterEl,
  dateFromEl,
  dateToEl,
  updatedFromEl,
  updatedToEl;
let promptsListEl;
let promptDetailsSectionEl,
  backToListButtonEl,
  copyPromptDetailButtonEl,
  editPromptButtonEl,
  deletePromptTriggerButtonEl,
  promptOwnerActionsEl,
  deleteConfirmationEl,
  cancelDeleteButtonEl,
  confirmDeleteButtonEl,
  promptDetailTitleEl,
  promptDetailDescriptionEl,
  promptDetailTextEl,
  promptTextWrapperEl,
  promptTextViewMoreEl,
  promptDetailCategoryEl,
  promptDetailTagsEl,
  promptDetailToolsEl,
  promptDetailAuthorEl,
  promptDetailCreatedEl,
  promptDetailUpdatedEl,
  promptDetailUsageEl,
  promptDetailFavoritesEl,
  userStarRatingEl,
  userRatingMessageEl,
  communityRatingSectionEl,
  communityStarDisplayEl,
  communityAverageRatingValueEl,
  communityRatingCountEl;

let controlsEl, tabsContainerEl, addPromptBarEl;
let addPromptFabEl;
let resetFiltersButtonEl;

// Sort panel DOM elements and state
let sortPanelEl, sortBySelectEl, sortDirToggleEl, sortDirIconEl;
let currentSortBy = 'createdAt';
let currentSortDir = 'desc';

export const cacheDOMElements = () => {
  mainCategoryDropdownEl = document.getElementById('main-category-dropdown');
  resetFiltersButtonEl = document.getElementById('reset-filters-button');
  sortPanelEl = document.getElementById('sort-panel');
  sortBySelectEl = document.getElementById('sort-by');
  sortDirToggleEl = document.getElementById('sort-dir-toggle');
  sortDirIconEl = document.getElementById('sort-dir-icon');
  tabAllEl = document.getElementById('tab-all');
  tabFavsEl = document.getElementById('tab-favs');
  tabPrivateEl = document.getElementById('tab-private');
  searchInputEl = document.getElementById('search-input');
  filterButtonEl = document.getElementById('filter-button');
  ratingFilterPanelEl = document.getElementById('rating-filter');
  minRatingSelectEl = document.getElementById('min-rating');
  minUserRatingSelectEl = document.getElementById('min-user-rating');
  yourPromptsOnlyEl = document.getElementById('your-prompts-only');
  usedByYouEl = document.getElementById('used-by-you');
  categoryFilterEl = document.getElementById('category-filter');
  tagFilterEl = document.getElementById('tag-filter');
  aiToolFilterEl = document.getElementById('ai-tool-filter');
  dateFromEl = document.getElementById('date-from');
  dateToEl = document.getElementById('date-to');
  updatedFromEl = document.getElementById('updated-from');
  updatedToEl = document.getElementById('updated-to');
  promptsListEl = document.getElementById('prompts-list-scroll');
  promptDetailsSectionEl = document.getElementById('prompt-details-section');

  promptDetailTitleEl = document.getElementById('prompt-detail-title');
  promptDetailDescriptionEl = document.getElementById('prompt-detail-description');
  promptDetailTextEl = document.getElementById('prompt-detail-text');
  promptTextWrapperEl = document.getElementById('prompt-text-wrapper')?.querySelector('pre');
  promptTextViewMoreEl = document.getElementById('prompt-text-view-more');

  promptDetailCategoryEl = document.getElementById('prompt-detail-category');
  promptDetailTagsEl = document.getElementById('prompt-detail-tags');
  promptDetailToolsEl = document.getElementById('prompt-detail-tools');
  promptDetailAuthorEl = document.getElementById('prompt-detail-author');
  promptDetailCreatedEl = document.getElementById('prompt-detail-created');
  promptDetailUpdatedEl = document.getElementById('prompt-detail-updated');
  promptDetailUsageEl = document.getElementById('prompt-detail-usage');
  promptDetailFavoritesEl = document.getElementById('prompt-detail-favorites');

  userStarRatingEl = document.getElementById('user-star-rating');
  userRatingMessageEl = document.getElementById('user-rating-message');
  communityRatingSectionEl = document.getElementById('community-rating-section');
  communityStarDisplayEl = document.getElementById('community-star-display');
  communityAverageRatingValueEl = document.getElementById('community-average-rating-value');
  communityRatingCountEl = document.getElementById('community-rating-count');

  promptOwnerActionsEl = document.querySelector('.prompt-owner-actions');
  if (promptOwnerActionsEl) {
    editPromptButtonEl = promptOwnerActionsEl.querySelector('#edit-prompt-button');
    deletePromptTriggerButtonEl = promptOwnerActionsEl.querySelector(
      '#delete-prompt-detail-trigger-button'
    );
  }

  if (!editPromptButtonEl) editPromptButtonEl = document.getElementById('edit-prompt-button');
  if (!deletePromptTriggerButtonEl)
    deletePromptTriggerButtonEl = document.getElementById('delete-prompt-detail-trigger-button');

  if (promptDetailsSectionEl) {
    backToListButtonEl = promptDetailsSectionEl.querySelector('#back-to-list-button');
    copyPromptDetailButtonEl = promptDetailsSectionEl.querySelector('#copy-prompt-button');
    deleteConfirmationEl = promptDetailsSectionEl.querySelector('#delete-confirmation');
    cancelDeleteButtonEl = promptDetailsSectionEl.querySelector('#cancel-delete-button');
    confirmDeleteButtonEl = promptDetailsSectionEl.querySelector('#confirm-delete-button');
  }
  controlsEl = document.querySelector('.controls');
  tabsContainerEl = document.querySelector('.tabs');
  addPromptBarEl = document.querySelector('.add-prompt-bar');
  addPromptFabEl = document.getElementById('add-prompt-fab');
};

export const openDetachedAddPromptWindow = () => {
  // Instead of opening a detached window, we now show the add form inline
  // First switch to the details view with proper setup
  showPromptDetailsView();
  // Then show add prompt interface
  showAddPromptInline();
};

async function handlePromptListClick(event) {
  console.log('[UI SUT LOG] handlePromptListClick triggered');
  // Prevent card click from opening details if copy or favorite button is clicked
  const copyBtn = event.target.closest('.copy-prompt');
  const favBtn = event.target.closest('.toggle-favorite');
  if (copyBtn) {
    event.stopPropagation();
    const promptId = copyBtn.dataset.id;
    if (promptId) await handleCopyPrompt(promptId);
    return;
  }
  if (favBtn) {
    event.stopPropagation();
    const promptId = favBtn.dataset.id;
    if (promptId) await handleToggleFavorite(promptId);
    return;
  }
  // Card click: open details
  const cardBtn = event.target.closest('.prompt-card-btn');
  if (cardBtn && cardBtn.dataset.id) {
    await viewPromptDetails(cardBtn.dataset.id);
  }
}

async function handleToggleFavorite(promptId) {
  const currentUser = auth ? auth.currentUser : null;
  if (!currentUser) {
    if (window.handleAuthRequiredAction) {
      window.handleAuthRequiredAction('favorite a prompt');
    } else {
      Utils.handleError('Please login or create an account to favorite a prompt.', {
        specificErrorElement: document.getElementById('error-message'),
        type: 'info',
        timeout: 5000,
      });
    }
    return;
  }
  try {
    const updatedPrompt = await PromptData.toggleFavorite(promptId);
    if (updatedPrompt) {
      const index = allPrompts.findIndex(p => p.id === promptId);
      if (index !== -1) {
        allPrompts[index] = updatedPrompt;
      }
      if (
        promptDetailsSectionEl &&
        !promptDetailsSectionEl.classList.contains('hidden') &&
        promptDetailsSectionEl.dataset.currentPromptId === promptId
      ) {
        displayPromptDetails(updatedPrompt);
      } else {
        showTab(activeTab);
      }
      Utils.showConfirmationMessage(getText('FAVORITE_UPDATED'));
    }
  } catch (error) {
    Utils.handleError('Error toggling favorite status in UI', {
      userVisible: true,
      originalError: error,
    });
  }
}

async function handleRatePrompt(promptId, rating) {
  try {
    const updatedPromptWithNewRating = await PromptData.ratePrompt(promptId, rating);
    if (updatedPromptWithNewRating) {
      const index = allPrompts.findIndex(p => p.id === promptId);
      if (index !== -1) {
        allPrompts[index] = updatedPromptWithNewRating;
      }
      if (
        promptDetailsSectionEl &&
        !promptDetailsSectionEl.classList.contains('hidden') &&
        promptDetailsSectionEl.dataset.currentPromptId === promptId
      ) {
        displayPromptDetails(updatedPromptWithNewRating);
      }
      Utils.showConfirmationMessage(textManager.format('RATING_SUCCESS', { rating }));
    } else {
      Utils.handleError('Failed to submit rating. Please try again.', { userVisible: true });
    }
  } catch (error) {
    Utils.handleError('Error processing rating in UI', { userVisible: true, originalError: error });
  }
}

async function handleCopyPrompt(promptId) {
  try {
    const result = await PromptData.copyPromptToClipboard(promptId);
    if (result.success) {
      Utils.showConfirmationMessage(getText('COPY_SUCCESS'));

      if (result.prompt) {
        // Update the prompt in the list of all prompts
        const index = allPrompts.findIndex(p => p.id === promptId);
        if (index !== -1) {
          allPrompts[index] = result.prompt;
        }

        // If we're viewing the details, update the details view
        if (
          promptDetailsSectionEl &&
          !promptDetailsSectionEl.classList.contains('hidden') &&
          promptDetailsSectionEl.dataset.currentPromptId === promptId
        ) {
          displayPromptDetails(result.prompt);
        }
      }
    } else {
      // Only show an error if clipboard write failed or prompt not found
      Utils.handleError(getText('COPY_FAILED'), {
        userVisible: true,
        type: 'error',
      });
    }
  } catch (error) {
    // Don't show errors related to authentication for copy actions
    if (
      error &&
      error.message &&
      (error.message.includes('must be logged in') ||
        error.message.includes('not authorized') ||
        error.message.includes('PERMISSION_DENIED') ||
        error.message.includes('unauth') ||
        error.message.includes('401'))
    ) {
      // For auth-related errors, silently proceed with copy without showing error
      console.info(
        'Auth-related warning during copy (expected for logged-out users):',
        error.message
      );
      // Still show success message since the copy itself succeeded
      Utils.showConfirmationMessage(getText('COPY_SUCCESS'));
    } else {
      // Show errors for non-auth related issues
      Utils.handleError('Failed to process copy action in UI', {
        userVisible: true,
        originalError: error,
      });
    }
  }
}

async function handleDeletePrompt(promptId) {
  try {
    const success = await PromptData.deletePrompt(promptId);
    if (success) {
      Utils.showConfirmationMessage(getText('PROMPT_DELETED_SUCCESS'));
      await loadAndDisplayData();
      showPromptList();
    }
  } catch (error) {
    Utils.handleError('Error during prompt deletion process', {
      userVisible: true,
      originalError: error,
    });
  }
}

function updateResetFiltersButtonVisibility() {
  if (!resetFiltersButtonEl) return;
  const filtersActive =
    (minRatingSelectEl && minRatingSelectEl.value !== '0') ||
    (minUserRatingSelectEl && minUserRatingSelectEl.value !== '0') ||
    (yourPromptsOnlyEl && yourPromptsOnlyEl.checked) ||
    (usedByYouEl && usedByYouEl.checked) ||
    (categoryFilterEl && categoryFilterEl.value) ||
    (tagFilterEl && tagFilterEl.value) ||
    (aiToolFilterEl && aiToolFilterEl.value) ||
    (dateFromEl && dateFromEl.value) ||
    (dateToEl && dateToEl.value) ||
    (updatedFromEl && updatedFromEl.value) ||
    (updatedToEl && updatedToEl.value);
  if (filtersActive) {
    resetFiltersButtonEl.classList.remove('hidden');
  } else {
    resetFiltersButtonEl.classList.add('hidden');
  }
}

const setupEventListeners = () => {
  // Main always-visible category dropdown
  if (mainCategoryDropdownEl) {
    mainCategoryDropdownEl.addEventListener('change', () => {
      syncCategoryDropdowns('main');
      showTab(activeTab);
      updateResetFiltersButtonVisibility();
    });
  }
  // Keep filter panel category select in sync
  if (categoryFilterEl) {
    categoryFilterEl.addEventListener('change', () => {
      syncCategoryDropdowns('filter');
      showTab(activeTab);
      updateResetFiltersButtonVisibility();
    });
  }
  // Floating Action Button (FAB) for Add New Prompt
  if (addPromptFabEl) {
    addPromptFabEl.addEventListener('click', openDetachedAddPromptWindow);
  }
  // Reset Filters button logic
  if (resetFiltersButtonEl) {
    resetFiltersButtonEl.addEventListener('click', () => {
      // Reset all filter controls to default
      if (minRatingSelectEl) minRatingSelectEl.value = '0';
      if (minUserRatingSelectEl) minUserRatingSelectEl.value = '0';
      if (yourPromptsOnlyEl) yourPromptsOnlyEl.checked = false;
      if (usedByYouEl) usedByYouEl.checked = false;
      if (categoryFilterEl) categoryFilterEl.value = '';
      if (tagFilterEl) tagFilterEl.value = '';
      if (aiToolFilterEl) aiToolFilterEl.value = '';
      if (dateFromEl) dateFromEl.value = '';
      if (dateToEl) dateToEl.value = '';
      if (updatedFromEl) updatedFromEl.value = '';
      if (updatedToEl) updatedToEl.value = '';
      showTab(activeTab);
      updateResetFiltersButtonVisibility();
    });
  }
  // Sort panel show/hide
  const sortButtonEl = document.getElementById('sort-button');
  if (sortButtonEl && sortPanelEl) {
    sortButtonEl.addEventListener('click', () => {
      sortPanelEl.classList.toggle('hidden');
      sortButtonEl.classList.toggle('active');
    });
  }

  // Sort select and direction toggle
  if (sortBySelectEl) {
    sortBySelectEl.addEventListener('change', () => {
      currentSortBy = sortBySelectEl.value;
      showTab(activeTab);
    });
  }
  if (sortDirToggleEl && sortDirIconEl) {
    sortDirToggleEl.addEventListener('click', () => {
      currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      // Update icon
      sortDirIconEl.className =
        currentSortDir === 'asc' ? 'fas fa-arrow-up-wide-short' : 'fas fa-arrow-down-wide-short';
      showTab(activeTab);
    });
  }
  tabAllEl?.addEventListener('click', () => showTab('all'));
  tabFavsEl?.addEventListener('click', () => showTab('favs'));
  tabPrivateEl?.addEventListener('click', () => showTab('private'));
  searchInputEl?.addEventListener('input', () => showTab(activeTab));

  if (filterButtonEl && ratingFilterPanelEl) {
    filterButtonEl.addEventListener('click', () => {
      ratingFilterPanelEl.classList.toggle('hidden');
      filterButtonEl.classList.toggle('active');
    });
  }
  minRatingSelectEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  minUserRatingSelectEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  yourPromptsOnlyEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  usedByYouEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  categoryFilterEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  tagFilterEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  aiToolFilterEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  dateFromEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  dateToEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  updatedFromEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  updatedToEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });

  promptsListEl?.addEventListener('click', handlePromptListClick);

  if (promptDetailsSectionEl) {
    backToListButtonEl?.addEventListener('click', () => showPromptList());
    copyPromptDetailButtonEl?.addEventListener('click', () => {
      const promptId =
        promptDetailsSectionEl.dataset.currentPromptId ||
        (userStarRatingEl ? userStarRatingEl.dataset.id : null);
      if (promptId) handleCopyPrompt(promptId);
    });
    editPromptButtonEl?.addEventListener('click', async () => {
      const promptId =
        promptDetailsSectionEl.dataset.currentPromptId ||
        (userStarRatingEl ? userStarRatingEl.dataset.id : null);
      if (promptId && editPromptButtonEl && !editPromptButtonEl.disabled) {
        // In-place edit mode
        const prompt = await PromptData.findPromptById(promptId);
        if (prompt) showEditMode(prompt);
      }
    });
    // Save/cancel handlers for in-place edit
    const saveEditBtn = document.getElementById('save-edit-prompt-button');
    const cancelEditBtn = document.getElementById('cancel-edit-prompt-button');
    if (saveEditBtn) {
      saveEditBtn.onclick = async () => {
        const promptId = promptDetailsSectionEl.dataset.currentPromptId;
        const prompt = await PromptData.findPromptById(promptId);
        if (prompt) handleSaveEditPrompt(prompt);
      };
    }
    if (cancelEditBtn) {
      cancelEditBtn.onclick = async () => {
        const promptId = promptDetailsSectionEl.dataset.currentPromptId;
        const prompt = await PromptData.findPromptById(promptId);
        if (prompt) {
          // Ensure the function is in scope and defined
          if (typeof handleCancelEditPrompt === 'function') {
            handleCancelEditPrompt(prompt);
          } else if (window.handleCancelEditPrompt) {
            window.handleCancelEditPrompt(prompt);
          } else {
            // fallback: just redisplay details
            displayPromptDetails(prompt);
          }
        }
      };
    }
    deletePromptTriggerButtonEl?.addEventListener('click', () => {
      if (deletePromptTriggerButtonEl && !deletePromptTriggerButtonEl.disabled) {
        if (deleteConfirmationEl) deleteConfirmationEl.classList.remove('hidden');
      }
    });
    cancelDeleteButtonEl?.addEventListener('click', () => {
      if (deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
    });
    confirmDeleteButtonEl?.addEventListener('click', () => {
      const currentDetailedPromptId = promptDetailsSectionEl.dataset.currentPromptId;
      if (currentDetailedPromptId) {
        handleDeletePrompt(currentDetailedPromptId);
      }
    });
    const favBtnDetail = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
    favBtnDetail?.addEventListener('click', () => {
      const promptId = promptDetailsSectionEl.dataset.currentPromptId || favBtnDetail.dataset.id;
      if (promptId) handleToggleFavorite(promptId);
    });

    promptTextViewMoreEl?.addEventListener('click', () => {
      if (promptTextWrapperEl && promptDetailTextEl && promptDetailsSectionEl) {
        const isExpanded = promptTextWrapperEl.classList.toggle('expanded');
        promptTextViewMoreEl.textContent = isExpanded ? getText('VIEW_LESS') : getText('VIEW_MORE');
        const fullText = promptDetailsSectionEl.dataset.fullPromptText || '';
        if (isExpanded) {
          promptDetailTextEl.textContent = fullText;
        } else {
          promptDetailTextEl.textContent =
            fullText.substring(0, PROMPT_TRUNCATE_LENGTH) +
            (fullText.length > PROMPT_TRUNCATE_LENGTH ? '...' : '');
        }
        if (window.Prism && promptDetailTextEl) {
          Prism.highlightElement(promptDetailTextEl);
        }
      }
    });
  }
};

export const loadAndDisplayData = async () => {
  try {
    allPrompts = await PromptData.loadPrompts();

    // Populate filter dropdowns (category, tag, ai tool)
    // Use the predefined categories from categories.js instead of extracting from prompts
    const categories = new Set(PROMPT_CATEGORIES);
    const tags = new Set();
    const aiTools = new Set();
    allPrompts.forEach(p => {
      if (Array.isArray(p.tags)) p.tags.forEach(t => tags.add(t));
      if (Array.isArray(p.targetAiTools)) p.targetAiTools.forEach(t => aiTools.add(t));
    });
    // Helper to populate a select
    function populateSelect(selectEl, values, anyLabel = 'Any') {
      if (!selectEl) return;
      const current = selectEl.value;
      selectEl.innerHTML =
        `<option value="">${anyLabel}</option>` +
        Array.from(values)
          .sort()
          .map(v => `<option value="${Utils.escapeHTML(v)}">${Utils.escapeHTML(v)}</option>`)
          .join('');
      // Restore selection if possible
      if (current && selectEl.querySelector(`[value="${Utils.escapeHTML(current)}"]`)) {
        selectEl.value = current;
      }
    }
    populateSelect(categoryFilterEl, categories, 'Any');
    populateSelect(tagFilterEl, tags, 'Any');
    populateSelect(aiToolFilterEl, aiTools, 'Any');
    populateSelect(mainCategoryDropdownEl, categories, 'All Categories');

    showTab(activeTab);
  } catch (error) {
    Utils.handleError('Error loading and displaying prompt data', {
      userVisible: true,
      originalError: error,
    });
    if (promptsListEl)
      promptsListEl.innerHTML = `<p class="empty-state">${getText('COULD_NOT_LOAD_PROMPTS')}</p>`;
  }
};

export const initializeUI = async () => {
  try {
    cacheDOMElements();
    setupEventListeners();
    await loadAndDisplayData();

    // Show/hide FAB based on login state AND main content visibility
    if (addPromptFabEl) {
      const updateFabVisibility = () => {
        const user = auth && auth.currentUser;
        const mainContent = document.getElementById('main-content');
        const authView = document.getElementById('auth-view');
        // Always hide FAB if auth view is visible
        if (authView && !authView.classList.contains('hidden')) {
          addPromptFabEl.hidden = true;
          return;
        }
        // Only show FAB if user is logged in AND main content is visible AND auth view is hidden
        const mainVisible = mainContent && !mainContent.classList.contains('hidden');
        addPromptFabEl.hidden = !(user && mainVisible);
      };
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        auth.onAuthStateChanged(updateFabVisibility);
        updateFabVisibility();
      } else {
        addPromptFabEl.hidden = true;
      }
      // Also observe view changes
      const observer = new MutationObserver(updateFabVisibility);
      const mainContent = document.getElementById('main-content');
      const authView = document.getElementById('auth-view');
      if (mainContent)
        observer.observe(mainContent, { attributes: true, attributeFilter: ['class'] });
      if (authView) observer.observe(authView, { attributes: true, attributeFilter: ['class'] });
    }
  } catch (error) {
    Utils.handleError('Error initializing UI', { userVisible: true, originalError: error });
  }
};

export const showTab = which => {
  activeTab = which;
  if (tabAllEl) tabAllEl.classList.toggle('active', which === 'all');
  if (tabFavsEl) tabFavsEl.classList.toggle('active', which === 'favs');
  if (tabPrivateEl) tabPrivateEl.classList.toggle('active', which === 'private');

  if (
    promptsListEl &&
    promptDetailsSectionEl &&
    !promptDetailsSectionEl.classList.contains('hidden')
  ) {
    if (promptsListEl) promptsListEl.classList.remove('hidden');
    if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('hidden');
    if (addPromptBarEl) addPromptBarEl.classList.remove('hidden');
    if (controlsEl) controlsEl.classList.remove('hidden');
    if (tabsContainerEl) tabsContainerEl.classList.remove('hidden');
  }

  const filters = {
    tab: which,
    searchTerm: searchInputEl ? searchInputEl.value : '',
    minRating: minRatingSelectEl ? parseInt(minRatingSelectEl.value) : 0,
    minUserRating: minUserRatingSelectEl ? parseInt(minUserRatingSelectEl.value) : 0,
    yourPromptsOnly: yourPromptsOnlyEl ? yourPromptsOnlyEl.checked : false,
    usedByYou: usedByYouEl ? usedByYouEl.checked : false,
    // Use mainCategoryDropdownEl for category filter, fallback to categoryFilterEl for safety
    category: mainCategoryDropdownEl
      ? mainCategoryDropdownEl.value
      : categoryFilterEl
        ? categoryFilterEl.value
        : '',
    tag: tagFilterEl ? tagFilterEl.value : '',
    aiTool: aiToolFilterEl ? aiToolFilterEl.value : '',
    dateFrom: dateFromEl ? dateFromEl.value : '',
    dateTo: dateToEl ? dateToEl.value : '',
    updatedFrom: updatedFromEl ? updatedFromEl.value : '',
    updatedTo: updatedToEl ? updatedToEl.value : '',
    sortBy: currentSortBy,
    sortDir: currentSortDir,
  };
  const promptsToFilter = Array.isArray(allPrompts) ? allPrompts : [];
  const filtered = PromptData.filterPrompts(promptsToFilter, filters);
  displayPrompts(filtered);
  updateResetFiltersButtonVisibility();
};

// Clusterize.js instance for virtualized prompt list
let clusterizeInstance = null;

export const displayPrompts = prompts => {
  // Use Clusterize.js for virtualization
  const scrollElem = document.getElementById('prompts-list-scroll');
  const contentElem = document.getElementById('prompts-list-content');
  if (!scrollElem || !contentElem) return;

  // Handle empty state
  if (prompts.length === 0) {
    if (clusterizeInstance) {
      clusterizeInstance.update([]);
    }
    contentElem.innerHTML = `<div class="empty-state"><p>${getText('NO_PROMPTS_FOUND')}</p></div>`;
    // Reset scroll position
    scrollElem.scrollTop = 0;
    return;
  }

  // Generate HTML rows for Clusterize
  const rows = prompts.map(prompt => {
    const isFavoriteDisplay = prompt.currentUserIsFavorite || false;
    const privateIcon = prompt.isPrivate
      ? `<i class="fa-solid fa-lock prompt-private-icon" title="Private" aria-label="Private" style="margin-right:0.5em; color:#e74c3c;"></i>`
      : '';
    return `
      <button class="prompt-item prompt-card-btn" type="button" tabindex="0" aria-label="${textManager.format('VIEW_DETAILS_FOR_PROMPT', { title: Utils.escapeHTML(prompt.title) })}" data-id="${prompt.id}">
        <div class="prompt-item__header">
          ${privateIcon}<span class="prompt-item__title">${Utils.escapeHTML(prompt.title)}</span>
          <div class="prompt-item__actions">
            <button class="copy-prompt" data-id="${Utils.escapeHTML(prompt.id)}" aria-label="${getText('COPY_PROMPT')}">
              <i class="fa-regular fa-copy"></i>
            </button>
            <button class="toggle-favorite" data-id="${Utils.escapeHTML(prompt.id)}" aria-label="${getText('TOGGLE_FAVORITE')}" aria-pressed="${isFavoriteDisplay}">
              <i class="${isFavoriteDisplay ? 'fas' : 'far'} fa-heart"></i>
            </button>
          </div>
        </div>
        <div class="prompt-item__category">${Utils.escapeHTML(prompt.category || '')}</div>
        <div class="tags">
          ${(prompt.tags || []).map(t => `<span class="tag">${Utils.escapeHTML(t)}</span>`).join('')}
        </div>
      </button>
    `;
  });

  // Initialize or update Clusterize
  if (!clusterizeInstance) {
    clusterizeInstance = new window.Clusterize({
      rows,
      scrollElem,
      contentElem,
      tag: 'div',
      callbacks: {
        clusterChanged: () => {
          // No-op, but could be used for lazy-loading images, etc.
        },
      },
    });
  } else {
    clusterizeInstance.update(rows);
  }
  // Always reset scroll position to top on new render
  scrollElem.scrollTop = 0;
};

const showPromptList = () => {
  if (promptsListEl) promptsListEl.classList.remove('hidden');
  if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('hidden');
  if (controlsEl) controlsEl.classList.remove('hidden');
  if (tabsContainerEl) tabsContainerEl.classList.remove('hidden');
  if (addPromptBarEl) addPromptBarEl.classList.remove('hidden');

  // Show category dropdown bar in list view
  const categoryDropdownBar = document.querySelector('.category-dropdown-bar');
  if (categoryDropdownBar) categoryDropdownBar.classList.remove('hidden');

  showTab(activeTab);
};

const showPromptDetailsView = () => {
  if (promptsListEl) promptsListEl.classList.add('hidden');
  if (promptDetailsSectionEl) promptDetailsSectionEl.classList.remove('hidden');
  if (controlsEl) controlsEl.classList.add('hidden');
  if (tabsContainerEl) tabsContainerEl.classList.add('hidden');
  if (addPromptBarEl) addPromptBarEl.classList.add('hidden');

  // Hide category dropdown bar in details view
  const categoryDropdownBar = document.querySelector('.category-dropdown-bar');
  if (categoryDropdownBar) categoryDropdownBar.classList.add('hidden');
};

const createStars = (ratingValue, promptId, isInteractive = true) => {
  const starWrapper = document.createElement('div');
  starWrapper.classList.add('star-rating-display');
  if (isInteractive) {
    starWrapper.classList.add('interactive');
  }
  starWrapper.dataset.promptId = promptId;

  for (let i = 1; i <= 5; i++) {
    const starButton = document.createElement('button');
    starButton.classList.add('star');
    starButton.dataset.value = i;
    starButton.setAttribute('aria-label', `${i} star${i !== 1 ? 's' : ''}`);
    starButton.innerHTML =
      i <= ratingValue ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    if (i <= ratingValue) {
      starButton.classList.add('filled');
    }
    if (isInteractive) {
      starButton.addEventListener('click', async event => {
        event.stopPropagation();
        await handleRatePrompt(promptId, i);
      });
    } else {
      starButton.disabled = true;
      starButton.style.cursor = 'default';
    }
    starWrapper.appendChild(starButton);
  }
  return starWrapper;
};

export const displayPromptDetails = prompt => {
  if (!prompt || !promptDetailsSectionEl) return;
  showPromptDetailsView();
  promptDetailsSectionEl.dataset.currentPromptId = prompt.id;
  promptDetailsSectionEl.dataset.fullPromptText = prompt.text || '';

  // Always reset view to static (non-edit) mode
  if (!promptDetailStaticFieldsWrapperEl)
    promptDetailStaticFieldsWrapperEl = document.getElementById(
      'prompt-detail-static-fields-wrapper'
    );
  if (!promptDetailEditableFieldsWrapperEl)
    promptDetailEditableFieldsWrapperEl = document.getElementById(
      'prompt-detail-editable-fields-wrapper'
    );
  if (!promptEditActionsBarEl)
    promptEditActionsBarEl = document.getElementById('prompt-edit-actions-bar');
  if (!promptOwnerActionsBarEl)
    promptOwnerActionsBarEl = document.getElementById('prompt-owner-actions-bar');

  // Show static fields, hide edit fields and edit actions
  if (promptDetailStaticFieldsWrapperEl)
    promptDetailStaticFieldsWrapperEl.classList.remove('hidden');
  if (promptDetailEditableFieldsWrapperEl)
    promptDetailEditableFieldsWrapperEl.classList.add('hidden');
  if (promptEditActionsBarEl) {
    promptEditActionsBarEl.classList.add('hidden');
    promptEditActionsBarEl.style.display = 'none'; // Explicitly hide with inline style
  }

  // Remove global edit mode classes when viewing prompt details
  document.body.classList.remove('editing-prompt', 'adding-prompt');

  // Remove editing class from prompt details section
  if (promptDetailsSectionEl) promptDetailsSectionEl.classList.remove('editing');

  // Reset any inline styles for edit buttons
  const editButtons = document.getElementById('edit-prompt-buttons');
  const addButtons = document.getElementById('add-prompt-buttons');
  if (editButtons) {
    editButtons.classList.add('hidden');
    editButtons.style.display = 'none';
  }
  if (addButtons) {
    addButtons.classList.add('hidden');
    addButtons.style.display = 'none';
  }

  // Remove edit mode heading if it exists
  const editHeading = document.getElementById('edit-mode-heading');
  if (editHeading && editHeading.parentNode) {
    editHeading.parentNode.removeChild(editHeading);
  }

  // Make elements visible again that might have been hidden during edit mode
  // 1. Prompt header (title, copy, favorite)
  const promptHeader = document.querySelector('.prompt-item__header');
  if (promptHeader) promptHeader.classList.remove('hidden');

  // 2. Prompt category and tags
  const promptCategory = document.getElementById('prompt-detail-category');
  if (promptCategory) promptCategory.classList.remove('hidden');

  const promptTags = document.getElementById('prompt-detail-tags');
  if (promptTags) promptTags.classList.remove('hidden');

  // 3. Back to list button
  const backToListButton = document.getElementById('back-to-list-button');
  if (backToListButton) backToListButton.classList.remove('hidden');

  // Show ratings and FAB again when not editing
  if (userStarRatingEl && userStarRatingEl.parentElement) {
    userStarRatingEl.parentElement.classList.remove('hidden');
  }
  if (communityRatingSectionEl) {
    communityRatingSectionEl.classList.remove('hidden');
  }
  if (addPromptFabEl) {
    addPromptFabEl.classList.remove('hidden');
  }

  const setText = (el, text) => {
    if (el) el.textContent = text || 'N/A';
  };
  const formatArray = arr => (arr && arr.length > 0 ? arr.join(', ') : 'None');
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Add private icon to the left of the title if private
  if (promptDetailTitleEl) {
    if (prompt.isPrivate) {
      promptDetailTitleEl.innerHTML = `<i class='fa-solid fa-lock prompt-private-icon' title='Private' aria-label='Private' style='margin-right:0.5em; color:#e74c3c;'></i>${Utils.escapeHTML(prompt.title)}`;
    } else {
      promptDetailTitleEl.textContent = prompt.title;
    }
  }
  setText(promptDetailDescriptionEl, prompt.description);
  setText(promptDetailCategoryEl, prompt.category);
  setText(promptDetailTagsEl, formatArray(prompt.tags));
  setText(promptDetailToolsEl, formatArray(prompt.targetAiTools));
  setText(promptDetailAuthorEl, prompt.authorDisplayName);
  setText(promptDetailCreatedEl, formatDate(prompt.createdAt));
  setText(promptDetailUpdatedEl, formatDate(prompt.updatedAt));
  setText(promptDetailUsageEl, prompt.usageCount?.toString() || '0');
  setText(promptDetailFavoritesEl, prompt.favoritesCount?.toString() || '0');

  // Update community rating label if present
  const communityLabel = document.getElementById('community-rating-label');
  if (communityLabel) communityLabel.textContent = getText('AVERAGE_VIBES');

  if (promptDetailTextEl && promptTextWrapperEl && promptTextViewMoreEl) {
    const fullText = prompt.text || '';
    if (fullText.length > PROMPT_TRUNCATE_LENGTH) {
      promptDetailTextEl.textContent = fullText.substring(0, PROMPT_TRUNCATE_LENGTH) + '...';
      promptTextViewMoreEl.classList.remove('hidden');
      promptTextViewMoreEl.textContent = getText('VIEW_MORE');
      promptTextWrapperEl.classList.remove('expanded');
    } else {
      promptDetailTextEl.textContent = fullText;
      promptTextViewMoreEl.classList.add('hidden');
      promptTextWrapperEl.classList.remove('expanded');
    }
    if (window.Prism && promptDetailTextEl) {
      Prism.highlightElement(promptDetailTextEl);
    }
  } else {
    if (promptDetailTextEl) setText(promptDetailTextEl, prompt.text);
  }

  const currentUser = auth ? auth.currentUser : null;
  const favBtn = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
  if (favBtn) {
    favBtn.dataset.id = prompt.id;
    const icon = favBtn.querySelector('i');
    const isFavoriteDisplay = prompt.currentUserIsFavorite || false;
    if (icon) icon.className = isFavoriteDisplay ? 'fas fa-heart' : 'far fa-heart';
  }

  const isOwner = currentUser && prompt.userId === currentUser.uid;
  if (promptOwnerActionsEl) {
    if (isOwner) {
      promptOwnerActionsEl.classList.remove('hidden');
      promptOwnerActionsEl.style.display = 'flex';
      if (editPromptButtonEl) editPromptButtonEl.disabled = false;
      if (deletePromptTriggerButtonEl) deletePromptTriggerButtonEl.disabled = false;
    } else {
      promptOwnerActionsEl.classList.add('hidden');
      promptOwnerActionsEl.style.display = 'none';
      if (editPromptButtonEl) editPromptButtonEl.disabled = true;
      if (deletePromptTriggerButtonEl) deletePromptTriggerButtonEl.disabled = true;
    }
  } else {
    if (editPromptButtonEl) editPromptButtonEl.style.display = 'none';
    if (deletePromptTriggerButtonEl) deletePromptTriggerButtonEl.style.display = 'none';
  }

  if (userStarRatingEl) userStarRatingEl.innerHTML = '';
  if (userRatingMessageEl) userRatingMessageEl.textContent = '';
  if (communityStarDisplayEl) communityStarDisplayEl.innerHTML = '';
  if (communityRatingSectionEl) communityRatingSectionEl.classList.add('hidden');

  if (currentUser) {
    const currentRating = prompt.currentUserRating || 0;
    userStarRatingEl.appendChild(createStars(currentRating, prompt.id, true));
    if (userRatingMessageEl) {
      userRatingMessageEl.textContent =
        currentRating > 0 ? getText('YOUR_RATING') : getText('RATE_PROMPT');
    }
  } else {
    if (userRatingMessageEl) userRatingMessageEl.textContent = getText('LOGIN_TO_RATE');
    if (userStarRatingEl) userStarRatingEl.appendChild(createStars(0, prompt.id, false));
  }

  if (!prompt.isPrivate) {
    if (
      communityRatingSectionEl &&
      communityAverageRatingValueEl &&
      communityRatingCountEl &&
      communityStarDisplayEl
    ) {
      communityRatingSectionEl.classList.remove('hidden');
      const averageRating = prompt.averageRating || 0;
      const totalRatingsCount = prompt.totalRatingsCount || 0;

      communityStarDisplayEl.appendChild(createStars(Math.round(averageRating), prompt.id, false));
      setText(communityAverageRatingValueEl, `(${averageRating.toFixed(1)})`);
      setText(
        communityRatingCountEl,
        `(${totalRatingsCount} ${totalRatingsCount === 1 ? 'rating' : 'ratings'})`
      );
    }
  } else {
    if (communityRatingSectionEl) communityRatingSectionEl.classList.add('hidden');
  }

  if (deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
};

export const viewPromptDetails = async promptId => {
  console.log(`[UI SUT LOG] viewPromptDetails called with promptId: ${promptId}`); // Log entry
  try {
    const prompt = await PromptData.findPromptById(promptId);
    console.log(
      `[UI SUT LOG] viewPromptDetails: findPromptById returned: ${JSON.stringify(prompt)}`
    ); // Log fetched prompt
    if (prompt) {
      console.log('[UI SUT LOG] viewPromptDetails: Prompt found, calling displayPromptDetails.'); // Log before call
      displayPromptDetails(prompt);
    } else {
      throw new Error(`Prompt with ID ${promptId} not found`);
    }
  } catch (error) {
    Utils.handleError(`Error viewing prompt details: ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
  }
};

export const getStarRatingContainerElementForTest = () => userStarRatingEl;
