/**
 * PromptFinder Extension - UI Controllers
 * Contains functions for managing the UI and interactions.
 */

import * as Utils from './utils.js';
import * as PromptData from './promptData.js';
import { auth } from './firebase-init.js'; // Import the initialized auth service

// Import Prism.js
import 'prismjs'; // Core
import 'prismjs/components/prism-markdown.min.js'; // Markdown language support
import 'prismjs/themes/prism-tomorrow.css'; // Prism Tomorrow Night theme CSS

let allPrompts = [];
let activeTab = 'all';

const PROMPT_TRUNCATE_LENGTH = 200;

// Cached DOM Elements (module scope)
let tabAllEl, tabFavsEl, tabPrivateEl;
let searchInputEl;
let filterButtonEl, ratingFilterPanelEl, minRatingSelectEl;
let addPromptButtonEl;
let promptsListEl;
let promptDetailsSectionEl,
  backToListButtonEl,
  copyPromptDetailButtonEl,
  editPromptButtonEl,
  deletePromptTriggerButtonEl,
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
  averageRatingValueEl,
  ratingCountEl,
  starRatingContainerEl;
let controlsEl, tabsContainerEl, addPromptBarEl;

export const cacheDOMElements = () => {
  tabAllEl = document.getElementById('tab-all');
  tabFavsEl = document.getElementById('tab-favs');
  tabPrivateEl = document.getElementById('tab-private');
  searchInputEl = document.getElementById('search-input');
  filterButtonEl = document.getElementById('filter-button');
  ratingFilterPanelEl = document.getElementById('rating-filter');
  minRatingSelectEl = document.getElementById('min-rating');
  addPromptButtonEl = document.getElementById('add-prompt-button');
  promptsListEl = document.getElementById('prompts-list');
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

  averageRatingValueEl = document.getElementById('average-rating-value');
  ratingCountEl = document.getElementById('rating-count');
  starRatingContainerEl = document.getElementById('star-rating');

  if (promptDetailsSectionEl) {
    backToListButtonEl = promptDetailsSectionEl.querySelector('#back-to-list-button');
    copyPromptDetailButtonEl = promptDetailsSectionEl.querySelector('#copy-prompt-button');
    editPromptButtonEl = promptDetailsSectionEl.querySelector('#edit-prompt-button');
    deletePromptTriggerButtonEl = promptDetailsSectionEl.querySelector(
      '#delete-prompt-detail-trigger-button'
    );
    deleteConfirmationEl = promptDetailsSectionEl.querySelector('#delete-confirmation');
    cancelDeleteButtonEl = promptDetailsSectionEl.querySelector('#cancel-delete-button');
    confirmDeleteButtonEl = promptDetailsSectionEl.querySelector('#confirm-delete-button');
  }
  controlsEl = document.querySelector('.controls');
  tabsContainerEl = document.querySelector('.tabs');
  addPromptBarEl = document.querySelector('.add-prompt-bar');
};

const openDetachedAddPromptWindow = () => {
  try {
    if (chrome && chrome.windows && chrome.runtime) {
      chrome.windows.create(
        {
          url: chrome.runtime.getURL('pages/add-prompt.html'),
          type: 'popup',
          width: 500,
          height: 600,
          focused: true,
        },
        _window => {
          if (chrome.runtime.lastError) {
            Utils.handleError(
              'Could not open add prompt window: ' + chrome.runtime.lastError.message,
              { userVisible: true }
            );
          }
        }
      );
    } else {
      Utils.handleError('Chrome API not available to open window.', { userVisible: true });
    }
  } catch (error) {
    Utils.handleError('Failed to open add prompt window.', {
      userVisible: true,
      originalError: error,
    });
  }
};

const openDetachedEditWindow = promptId => {
  try {
    if (!promptId) return Utils.handleError('No prompt ID for editing.', { userVisible: true });
    if (chrome && chrome.windows && chrome.runtime) {
      chrome.windows.create(
        {
          url: chrome.runtime.getURL(`pages/edit-prompt.html?id=${promptId}`),
          type: 'popup',
          width: 500,
          height: 600,
          focused: true,
        },
        _window => {
          if (chrome.runtime.lastError) {
            Utils.handleError('Could not open edit window: ' + chrome.runtime.lastError.message, {
              userVisible: true,
            });
          }
        }
      );
    } else {
      Utils.handleError('Chrome API not available to open window.', { userVisible: true });
    }
  } catch (error) {
    Utils.handleError('Failed to open edit window.', { userVisible: true, originalError: error });
  }
};

async function handlePromptListClick(event) {
  const targetButton = event.target.closest('button');
  if (!targetButton || !targetButton.dataset.id) return;
  const promptId = targetButton.dataset.id;
  if (targetButton.classList.contains('toggle-favorite')) {
    event.stopPropagation();
    await handleToggleFavorite(promptId);
  } else if (targetButton.classList.contains('view-details')) {
    await viewPromptDetails(promptId);
  } else if (targetButton.classList.contains('copy-prompt')) {
    await handleCopyPrompt(promptId);
  }
}

async function handleToggleFavorite(promptId) {
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
      Utils.showConfirmationMessage('Favorite status updated!');
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
    // Call the new ratePrompt function instead of updatePromptRating
    const updatedPrompt = await PromptData.ratePrompt(promptId, rating);
    if (updatedPrompt) {
      const index = allPrompts.findIndex(p => p.id === promptId);
      if (index !== -1) {
        allPrompts[index] = updatedPrompt;
      }
      // If the currently viewed detail prompt is the one rated, refresh its display
      if (
        promptDetailsSectionEl &&
        !promptDetailsSectionEl.classList.contains('hidden') &&
        promptDetailsSectionEl.dataset.currentPromptId === promptId
      ) {
        displayPromptDetails(updatedPrompt); // Pass the fully updated prompt object
      }
      Utils.showConfirmationMessage(`Rated ${rating} stars!`);
    }
  } catch (error) {
    Utils.handleError('Error processing rating in UI', { userVisible: true, originalError: error });
  }
}

async function handleCopyPrompt(promptId) {
  try {
    const success = await PromptData.copyPromptToClipboard(promptId);
    if (success) Utils.showConfirmationMessage('Prompt copied to clipboard!');
  } catch (error) {
    Utils.handleError('Failed to copy prompt', { userVisible: true, originalError: error });
  }
}

async function handleDeletePrompt(promptId) {
  try {
    const success = await PromptData.deletePrompt(promptId);
    if (success) {
      Utils.showConfirmationMessage('Prompt deleted successfully!');
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

const setupEventListeners = () => {
  console.log('[UI_DEBUG] setupEventListeners - START (v9 modular)');
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
  minRatingSelectEl?.addEventListener('change', () => showTab(activeTab));

  addPromptButtonEl?.addEventListener('click', () => {
    const currentUser = auth ? auth.currentUser : null;
    if (currentUser) {
      openDetachedAddPromptWindow();
    } else {
      Utils.handleError('Please login to add a prompt.', {
        userVisible: true,
        specificErrorElement: document.getElementById('error-message'),
      });
      console.log('UI: Add prompt clicked, but user not logged in.');
    }
  });

  promptsListEl?.addEventListener('click', handlePromptListClick);

  if (promptDetailsSectionEl) {
    backToListButtonEl?.addEventListener('click', () => showPromptList());
    copyPromptDetailButtonEl?.addEventListener('click', () => {
      const promptId =
        promptDetailsSectionEl.dataset.currentPromptId ||
        (starRatingContainerEl ? starRatingContainerEl.dataset.id : null);
      if (promptId) handleCopyPrompt(promptId);
    });
    editPromptButtonEl?.addEventListener('click', () => {
      const promptId =
        promptDetailsSectionEl.dataset.currentPromptId ||
        (starRatingContainerEl ? starRatingContainerEl.dataset.id : null);
      if (promptId) openDetachedEditWindow(promptId);
    });
    deletePromptTriggerButtonEl?.addEventListener('click', () => {
      if (deleteConfirmationEl) deleteConfirmationEl.classList.remove('hidden');
    });
    cancelDeleteButtonEl?.addEventListener('click', () => {
      if (deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
    });
    confirmDeleteButtonEl?.addEventListener('click', () => {
      const currentDetailedPromptId = promptDetailsSectionEl.dataset.currentPromptId;
      if (currentDetailedPromptId) {
        handleDeletePrompt(currentDetailedPromptId);
      } else {
        Utils.handleError('Could not determine prompt ID for deletion from detail view.', {
          userVisible: true,
        });
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
        promptTextViewMoreEl.textContent = isExpanded ? 'View Less' : 'View More';
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
  console.log('[UI_DEBUG] setupEventListeners - END (v9 modular)');
};

export const loadAndDisplayData = async () => {
  try {
    console.log('[UI_DEBUG] loadAndDisplayData - START (v9 modular)');
    allPrompts = await PromptData.loadPrompts();
    console.log(
      `[UI_DEBUG] loadAndDisplayData - after PromptData.loadPrompts, count: ${allPrompts ? allPrompts.length : 'undefined'}`
    );
    showTab(activeTab);
    console.log('[UI_DEBUG] loadAndDisplayData - END (v9 modular)');
  } catch (error) {
    console.error('[UI_DEBUG] loadAndDisplayData - CAUGHT ERROR (v9):', error);
    Utils.handleError('Error loading and displaying prompt data', {
      userVisible: true,
      originalError: error,
    });
    if (promptsListEl)
      promptsListEl.innerHTML = '<p class="empty-state">Could not load prompts.</p>';
  }
};

export const initializeUI = async () => {
  try {
    console.log('[UI_DEBUG] initializeUI - START (v9 modular)');
    cacheDOMElements();
    console.log('[UI_DEBUG] initializeUI - after cacheDOMElements');
    setupEventListeners();
    console.log('[UI_DEBUG] initializeUI - after setupEventListeners');
    await loadAndDisplayData();
    console.log('[UI_DEBUG] initializeUI - after loadAndDisplayData');
  } catch (error) {
    console.error('[UI_DEBUG] initializeUI - CAUGHT ERROR (v9):', error);
    Utils.handleError('Error initializing UI', { userVisible: true, originalError: error });
  }
};

export const showTab = which => {
  console.log('[UI_TEST_DEBUG] showTab called with (v9):', which);
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
  };
  const promptsToFilter = Array.isArray(allPrompts) ? allPrompts : [];
  console.log('[UI_TEST_DEBUG] showTab - promptsToFilter count (v9):', promptsToFilter.length);
  const filtered = PromptData.filterPrompts(promptsToFilter, filters);
  console.log('[UI_TEST_DEBUG] showTab - filtered prompts count (v9):', filtered.length);
  displayPrompts(filtered);
  console.log('[UI_TEST_DEBUG] showTab - after displayPrompts call (v9)');
};

export const displayPrompts = prompts => {
  if (!promptsListEl) return;
  const sorted = [...prompts].sort((a, b) =>
    (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
  );
  promptsListEl.innerHTML = '';
  if (sorted.length === 0) {
    promptsListEl.innerHTML =
      '<div class="empty-state"><p>No prompts found. Try adjusting filters or add new prompts.</p></div>';
    return;
  }
  const currentUser = auth ? auth.currentUser : null;
  sorted.forEach(prompt => {
    const div = document.createElement('div');
    div.classList.add('prompt-item');
    const isFavoriteDisplay =
      currentUser && prompt.userId === currentUser.uid && prompt.userIsFavorite;
    div.innerHTML = `
      <button class="toggle-favorite" data-id="${Utils.escapeHTML(prompt.id)}" aria-label="Toggle favorite">
        <i class="${isFavoriteDisplay ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <h3>${Utils.escapeHTML(prompt.title)}</h3>
      <div class="tags">
        ${(prompt.tags || []).map(t => `<span class="tag">${Utils.escapeHTML(t)}</span>`).join('')}
      </div>
      <div class="buttons">
        <button class="view-details" data-id="${Utils.escapeHTML(prompt.id)}">View Details</button>
        <button class="copy-prompt" data-id="${Utils.escapeHTML(prompt.id)}">Copy</button>
      </div>
    `;
    promptsListEl.appendChild(div);
  });
};

const showPromptList = () => {
  if (promptsListEl) promptsListEl.classList.remove('hidden');
  if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('hidden');
  if (controlsEl) controlsEl.classList.remove('hidden');
  if (tabsContainerEl) tabsContainerEl.classList.remove('hidden');
  if (addPromptBarEl) addPromptBarEl.classList.remove('hidden');
  showTab(activeTab);
};

const showPromptDetailsView = () => {
  if (promptsListEl) promptsListEl.classList.add('hidden');
  if (promptDetailsSectionEl) promptDetailsSectionEl.classList.remove('hidden');
  if (controlsEl) controlsEl.classList.add('hidden');
  if (tabsContainerEl) tabsContainerEl.classList.add('hidden');
  if (addPromptBarEl) addPromptBarEl.classList.add('hidden');
};

export const displayPromptDetails = prompt => {
  if (!prompt || !promptDetailsSectionEl) return;
  showPromptDetailsView();
  promptDetailsSectionEl.dataset.currentPromptId = prompt.id;
  promptDetailsSectionEl.dataset.fullPromptText = prompt.text || '';

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

  setText(promptDetailTitleEl, prompt.title);
  setText(promptDetailDescriptionEl, prompt.description);
  setText(promptDetailCategoryEl, prompt.category);
  setText(promptDetailTagsEl, formatArray(prompt.tags));
  setText(promptDetailToolsEl, formatArray(prompt.targetAiTools));
  setText(promptDetailAuthorEl, prompt.authorDisplayName);
  setText(promptDetailCreatedEl, formatDate(prompt.createdAt));
  setText(promptDetailUpdatedEl, formatDate(prompt.updatedAt));
  setText(promptDetailUsageEl, prompt.usageCount?.toString() || '0');
  setText(promptDetailFavoritesEl, prompt.favoritesCount?.toString() || '0');

  if (promptDetailTextEl && promptTextWrapperEl && promptTextViewMoreEl) {
    const fullText = prompt.text || '';
    if (fullText.length > PROMPT_TRUNCATE_LENGTH) {
      promptDetailTextEl.textContent = fullText.substring(0, PROMPT_TRUNCATE_LENGTH) + '...';
      promptTextViewMoreEl.classList.remove('hidden');
      promptTextViewMoreEl.textContent = 'View More';
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
    const isFavoriteDisplay =
      currentUser && prompt.userId === currentUser.uid && prompt.userIsFavorite;
    if (icon) icon.className = isFavoriteDisplay ? 'fas fa-heart' : 'far fa-heart';
  }

  let ratingToDisplay = 0;
  let countToDisplay = 0;
  let ratingText = '(Not rated)';

  if (currentUser && prompt.userId === currentUser.uid) {
    ratingToDisplay = prompt.userRating || 0;
    ratingText = ratingToDisplay > 0 ? '(My Rating)' : '(Not yet rated by you)';
  } else if (!prompt.isPrivate) {
    ratingToDisplay = prompt.averageRating || 0;
    countToDisplay = prompt.totalRatingsCount || 0;
    ratingText = `(${countToDisplay} ${countToDisplay === 1 ? 'rating' : 'ratings'})`;
  } else {
    ratingText = '(N/A)';
  }
  setText(averageRatingValueEl, `(${ratingToDisplay.toFixed(1)})`);
  setText(ratingCountEl, ratingText);

  if (starRatingContainerEl) {
    starRatingContainerEl.dataset.id = prompt.id;
    starRatingContainerEl.innerHTML = '';
    const currentRating = Math.round(ratingToDisplay);
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('button');
      star.classList.add('star');
      star.dataset.value = i;
      star.setAttribute('role', 'radio');
      star.setAttribute('aria-checked', i <= currentRating ? 'true' : 'false');
      star.setAttribute('aria-label', `${i} star${i !== 1 ? 's' : ''}`);
      star.innerHTML =
        i <= currentRating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
      if (i <= currentRating) star.classList.add('filled');
      star.addEventListener('click', async _event => {
        _event.stopPropagation();
        await handleRatePrompt(prompt.id, i);
      });
      starRatingContainerEl.appendChild(star);
    }
  }
  if (deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
};

export const viewPromptDetails = async promptId => {
  try {
    const prompt = await PromptData.findPromptById(promptId);
    if (prompt) {
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

export const getStarRatingContainerElementForTest = () => starRatingContainerEl;
