/**
 * PromptFinder Extension - UI Controllers
 * Contains functions for managing the UI and interactions.
 */

import * as Utils from './utils.js';
import * as PromptData from './promptData.js';
import { auth } from './firebase-init.js'; // Import the initialized auth service
import { PROMPT_CATEGORIES } from './categories.js';

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
      Utils.showConfirmationMessage(`Rated ${rating} stars!`);
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
      Utils.showConfirmationMessage('Prompt copied to clipboard!');

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
      Utils.handleError('Failed to copy prompt. Please try again.', {
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
      Utils.showConfirmationMessage('Prompt copied to clipboard!');
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
    editPromptButtonEl?.addEventListener('click', () => {
      const promptId =
        promptDetailsSectionEl.dataset.currentPromptId ||
        (userStarRatingEl ? userStarRatingEl.dataset.id : null);
      if (promptId && editPromptButtonEl && !editPromptButtonEl.disabled)
        openDetachedEditWindow(promptId);
    });
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
    function populateSelect(selectEl, values) {
      if (!selectEl) return;
      const current = selectEl.value;
      selectEl.innerHTML =
        '<option value="">Any</option>' +
        Array.from(values)
          .sort()
          .map(v => `<option value="${Utils.escapeHTML(v)}">${Utils.escapeHTML(v)}</option>`)
          .join('');
      // Restore selection if possible
      if (current && selectEl.querySelector(`[value="${Utils.escapeHTML(current)}"]`)) {
        selectEl.value = current;
      }
    }
    populateSelect(categoryFilterEl, categories);
    populateSelect(tagFilterEl, tags);
    populateSelect(aiToolFilterEl, aiTools);

    showTab(activeTab);
  } catch (error) {
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
    category: categoryFilterEl ? categoryFilterEl.value : '',
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

export const displayPrompts = prompts => {
  if (!promptsListEl) return;
  promptsListEl.innerHTML = '';
  if (prompts.length === 0) {
    promptsListEl.innerHTML =
      '<div class="empty-state"><p>No prompts found. Try adjusting filters or add new prompts.</p></div>';
    return;
  }
  prompts.forEach(prompt => {
    // Card is a button for accessibility and clickability
    const cardBtn = document.createElement('button');
    cardBtn.classList.add('prompt-item', 'prompt-card-btn');
    cardBtn.setAttribute('type', 'button');
    cardBtn.setAttribute('tabindex', '0');
    cardBtn.setAttribute('aria-label', `View details for prompt: ${prompt.title}`);
    cardBtn.dataset.id = prompt.id;
    const isFavoriteDisplay = prompt.currentUserIsFavorite || false;
    cardBtn.innerHTML = `
      <div class="prompt-item__header">
        <span class="prompt-item__title">${Utils.escapeHTML(prompt.title)}</span>
        <div class="prompt-item__actions">
          <button class="copy-prompt" data-id="${Utils.escapeHTML(prompt.id)}" aria-label="Copy prompt">
            <i class="fa-regular fa-copy"></i>
          </button>
          <button class="toggle-favorite" data-id="${Utils.escapeHTML(prompt.id)}" aria-label="Toggle favorite" aria-pressed="${isFavoriteDisplay}">
            <i class="${isFavoriteDisplay ? 'fas' : 'far'} fa-heart"></i>
          </button>
        </div>
      </div>
      <div class="prompt-item__category">${Utils.escapeHTML(prompt.category || '')}</div>
      <div class="tags">
        ${(prompt.tags || []).map(t => `<span class="tag">${Utils.escapeHTML(t)}</span>`).join('')}
      </div>
    `;
    promptsListEl.appendChild(cardBtn);
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

  // Update community rating label if present
  const communityLabel = document.getElementById('community-rating-label');
  if (communityLabel) communityLabel.textContent = 'Average vibes:';

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
    const isFavoriteDisplay = prompt.currentUserIsFavorite || false;
    if (icon) icon.className = isFavoriteDisplay ? 'fas fa-heart' : 'far fa-heart';
  }

  const isOwner = currentUser && prompt.userId === currentUser.uid;
  if (promptOwnerActionsEl) {
    promptOwnerActionsEl.style.display = isOwner ? 'flex' : 'none';
    if (editPromptButtonEl) {
      editPromptButtonEl.disabled = !isOwner;
    }
    if (deletePromptTriggerButtonEl) {
      deletePromptTriggerButtonEl.disabled = !isOwner;
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
      userRatingMessageEl.textContent = currentRating > 0 ? 'Your Rating:' : 'Rate this prompt!';
    }
  } else {
    if (userRatingMessageEl) userRatingMessageEl.textContent = 'Login to rate.';
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
