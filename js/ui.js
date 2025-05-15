/**
 * PromptFinder Extension - UI Controllers
 * Contains functions for managing the UI and interactions.
 */

window.PromptFinder = window.PromptFinder || {};

window.PromptFinder.UI = (function () {
  const Utils = window.PromptFinder.Utils;
  const PromptData = window.PromptFinder.PromptData;

  let allPrompts = [];
  let activeTab = 'all';

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
    promptDetailTextEl,
    promptDetailCategoryEl,
    promptDetailTagsEl,
    averageRatingValueEl,
    ratingCountEl,
    starRatingContainerEl;
  let addPromptSectionEl; 
  let controlsEl, tabsContainerEl, addPromptBarEl;

  const cacheDOMElements = () => {
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
    addPromptSectionEl = document.getElementById('add-prompt-section'); 
    promptDetailTitleEl = document.getElementById('prompt-detail-title');
    promptDetailTextEl = document.getElementById('prompt-detail-text');
    promptDetailCategoryEl = document.getElementById('prompt-detail-category');
    promptDetailTagsEl = document.getElementById('prompt-detail-tags');
    averageRatingValueEl = document.getElementById('average-rating-value');
    ratingCountEl = document.getElementById('rating-count');
    starRatingContainerEl = document.getElementById('star-rating');

    if (promptDetailsSectionEl) {
      backToListButtonEl = promptDetailsSectionEl.querySelector('#back-to-list-button');
      copyPromptDetailButtonEl = promptDetailsSectionEl.querySelector('#copy-prompt-button');
      editPromptButtonEl = promptDetailsSectionEl.querySelector('#edit-prompt-button');
      deletePromptTriggerButtonEl = promptDetailsSectionEl.querySelector('#delete-prompt-detail-trigger-button'); 
      deleteConfirmationEl = promptDetailsSectionEl.querySelector('#delete-confirmation');
      cancelDeleteButtonEl = promptDetailsSectionEl.querySelector('#cancel-delete-button');
      confirmDeleteButtonEl = promptDetailsSectionEl.querySelector('#confirm-delete-button');
    } 
    controlsEl = document.querySelector('.controls');
    tabsContainerEl = document.querySelector('.tabs');
    addPromptBarEl = document.querySelector('.add-prompt-bar');
  };

  const loadAndDisplayData = async () => {
    try {
      allPrompts = await PromptData.loadPrompts(); 
      showTab(activeTab); 
    } catch (error) {
      Utils.handleError('Error loading and displaying prompt data', { userVisible: true, originalError: error });
      if (promptsListEl) promptsListEl.innerHTML = '<p class="empty-state">Could not load prompts.</p>';
    }
  };

  const initializeUI = async () => {
    try {
      cacheDOMElements();
      setupEventListeners();
      await loadAndDisplayData(); 
    } catch (error) {
      Utils.handleError('Error initializing UI', { userVisible: true, originalError: error });
    }
  };

  const setupEventListeners = () => {
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
        const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
        if (currentUser) {
            openDetachedAddPromptWindow();
        } else {
            console.log("UI: Add prompt clicked, but user not logged in (app.js should show message).");
        }
    });
    promptsListEl?.addEventListener('click', handlePromptListClick);

    if (promptDetailsSectionEl) {
      backToListButtonEl?.addEventListener('click', async () => {
        showPromptList(); 
      });
      copyPromptDetailButtonEl?.addEventListener('click', () => {
        const promptId = promptDetailsSectionEl.dataset.currentPromptId || (starRatingContainerEl ? starRatingContainerEl.dataset.id : null);
        if (promptId) handleCopyPrompt(promptId);
      });
      editPromptButtonEl?.addEventListener('click', () => {
        const promptId = promptDetailsSectionEl.dataset.currentPromptId || (starRatingContainerEl ? starRatingContainerEl.dataset.id : null);
        if (promptId) openDetachedEditWindow(promptId);
      });
      
      deletePromptTriggerButtonEl?.addEventListener('click', () => { 
        if(deleteConfirmationEl) deleteConfirmationEl.classList.remove('hidden');
      });

      cancelDeleteButtonEl?.addEventListener('click', () => {
        if(deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
      });
      confirmDeleteButtonEl?.addEventListener('click', () => {
        const currentDetailedPromptId = promptDetailsSectionEl.dataset.currentPromptId;
        if (currentDetailedPromptId) {
          handleDeletePrompt(currentDetailedPromptId);
        } else {
          Utils.handleError("Could not determine prompt ID for deletion from detail view.", {userVisible: true});
        }
      });
      const favBtnDetail = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
      favBtnDetail?.addEventListener('click', () => {
          const promptId = promptDetailsSectionEl.dataset.currentPromptId || favBtnDetail.dataset.id;
          if (promptId) {
            handleToggleFavorite(promptId);
          }
      });
    }
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

  const openDetachedAddPromptWindow = () => {
    try {
      chrome.windows.create({
          url: chrome.runtime.getURL('pages/add-prompt.html'),
          type: 'popup', width: 500, height: 600, focused: true
      }, _window => {
        if (chrome.runtime.lastError) Utils.handleError('Could not open add prompt window.', {userVisible: true});
      });
    } catch (error) {
      Utils.handleError('Failed to open add prompt window.', {userVisible: true, originalError: error});
    }
  };

  const openDetachedEditWindow = promptId => {
    try {
      if (!promptId) return Utils.handleError('No prompt ID for editing.', {userVisible: true});
      chrome.windows.create({
          url: chrome.runtime.getURL(`pages/edit-prompt.html?id=${promptId}`),
          type: 'popup', width: 500, height: 600, focused: true
      }, _window => {
         if (chrome.runtime.lastError) Utils.handleError('Could not open edit window.', {userVisible: true});
      });
    } catch (error) {
      Utils.handleError('Failed to open edit window.', {userVisible: true, originalError: error});
    }
  };

  const showTab = which => {
    console.log("[UI_TEST_DEBUG] showTab called with:", which); // ADDED
    activeTab = which;
    if(tabAllEl) tabAllEl.classList.toggle('active', which === 'all');
    if(tabFavsEl) tabFavsEl.classList.toggle('active', which === 'favs');
    if(tabPrivateEl) tabPrivateEl.classList.toggle('active', which === 'private');
    if (promptsListEl && !promptDetailsSectionEl?.classList.contains('hidden')) {
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
    console.log("[UI_TEST_DEBUG] showTab - promptsToFilter count:", promptsToFilter.length); // ADDED
    const filtered = PromptData.filterPrompts(promptsToFilter, filters);
    console.log("[UI_TEST_DEBUG] showTab - filtered prompts count:", filtered.length); // ADDED
    displayPrompts(filtered);
    console.log("[UI_TEST_DEBUG] showTab - after displayPrompts call"); // ADDED
  };

  const displayPrompts = prompts => {
    if (!promptsListEl) return;
    const sorted = [...prompts].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    );
    promptsListEl.innerHTML = '';
    if (sorted.length === 0) {
      promptsListEl.innerHTML = '<div class="empty-state"><p>No prompts found. Try adjusting filters or add new prompts.</p></div>';
      return;
    }
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
    sorted.forEach(prompt => {
      const div = document.createElement('div');
      div.classList.add('prompt-item');
      const isFavoriteDisplay = currentUser && prompt.userId === currentUser.uid && prompt.userIsFavorite;
      div.innerHTML = `
      <button class="toggle-favorite" data-id="${prompt.id}" aria-label="Toggle favorite">
        <i class="${isFavoriteDisplay ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <h3>${Utils.escapeHTML(prompt.title)}</h3>
      <div class="tags">
        ${(prompt.tags || []).map(t => `<span class="tag">${Utils.escapeHTML(t)}</span>`).join('')}
      </div>
      <div class="buttons">
        <button class="view-details" data-id="${prompt.id}">View Details</button>
        <button class="copy-prompt" data-id="${prompt.id}">Copy</button>
      </div>
    `;
      promptsListEl.appendChild(div);
    });
  };

  const displayPromptDetails = prompt => {
    if (!prompt || !promptDetailsSectionEl) return;
    showPromptDetailsView(); 
    promptDetailsSectionEl.dataset.currentPromptId = prompt.id; 

    if (promptDetailTitleEl) promptDetailTitleEl.textContent = prompt.title || 'N/A'; 
    if (promptDetailTextEl) promptDetailTextEl.textContent = prompt.text || 'N/A'; 
    if (promptDetailCategoryEl) promptDetailCategoryEl.textContent = prompt.category || 'N/A'; 
    if (promptDetailTagsEl) promptDetailTagsEl.textContent = (prompt.tags || []).join(', ') || 'None'; 
    
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
    const favBtn = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
    if (favBtn) {
      favBtn.dataset.id = prompt.id; 
      const icon = favBtn.querySelector('i');
      const isFavoriteDisplay = currentUser && prompt.userId === currentUser.uid && prompt.userIsFavorite;
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
    if (averageRatingValueEl) averageRatingValueEl.textContent = `(${ratingToDisplay.toFixed(1)})`;
    if (ratingCountEl) ratingCountEl.textContent = ratingText;
    
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
        star.innerHTML = i <= currentRating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        if (i <= currentRating) star.classList.add('filled');
        star.addEventListener('click', async _e => {
          _e.stopPropagation();
          await handleRatePrompt(prompt.id, i);
        });
        starRatingContainerEl.appendChild(star);
      }
    } 
    if (deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
  };

  const viewPromptDetails = async promptId => {
    try {
      const prompt = await PromptData.findPromptById(promptId);
      if (prompt) {
        displayPromptDetails(prompt);
      } else {
        throw new Error(`Prompt with ID ${promptId} not found`);
      }
    } catch (error) {
      Utils.handleError(`Error viewing prompt details: ${error.message}`, { userVisible: true, originalError: error });
    }
  };

  const handlePromptListClick = async event => {
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
  };
  
  const handleToggleFavorite = async (promptId) => {
    try {
      const updatedPrompt = await PromptData.toggleFavorite(promptId);
      if (updatedPrompt) {
        const index = allPrompts.findIndex(p => p.id === promptId);
        if (index !== -1) {
          allPrompts[index] = updatedPrompt;
        }
        if (promptDetailsSectionEl && !promptDetailsSectionEl.classList.contains('hidden') && promptDetailsSectionEl.dataset.currentPromptId === promptId) {
          displayPromptDetails(updatedPrompt); 
        } else {
          showTab(activeTab); 
        }
        Utils.showConfirmationMessage('Favorite status updated!');
      } 
    } catch (error) {
      Utils.handleError('Error toggling favorite status in UI', { userVisible: true, originalError: error });
    }
  };

  const handleRatePrompt = async (promptId, rating) => {
    try {
      const updatedPrompt = await PromptData.updatePromptRating(promptId, rating);
      if (updatedPrompt) {
        const index = allPrompts.findIndex(p => p.id === promptId);
        if (index !== -1) {
          allPrompts[index] = updatedPrompt;
        }
        if (promptDetailsSectionEl && !promptDetailsSectionEl.classList.contains('hidden') && promptDetailsSectionEl.dataset.currentPromptId === promptId) {
            displayPromptDetails(allPrompts[index]);
        }
        Utils.showConfirmationMessage(`Rated ${rating} stars!`);
      } 
    } catch (error) {
        Utils.handleError('Error processing rating in UI', { userVisible: true, originalError: error });
    }
  };

  const handleCopyPrompt = async promptId => {
    try {
      const success = await PromptData.copyPromptToClipboard(promptId);
      if (success) Utils.showConfirmationMessage('Prompt copied to clipboard!');
    } catch (error) {
      Utils.handleError('Failed to copy prompt', { userVisible: true, originalError: error });
    }
  };

  const handleDeletePrompt = async (promptId) => {
    try {
      const success = await PromptData.deletePrompt(promptId);
      if (success) {
        Utils.showConfirmationMessage('Prompt deleted successfully!');
        await loadAndDisplayData(); 
        showPromptList(); 
      } 
    } catch (error) {
      Utils.handleError('Error during prompt deletion process', { userVisible: true, originalError: error });
    }
  };

  if (Utils && !Utils.escapeHTML) {
    Utils.escapeHTML = function (str) {
      if (typeof str !== 'string' || !str) return '';
      return str.replace(/[&<>"'/]/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;'
      }[s]));
    };
  }

  return {
    initializeUI,
    loadAndDisplayData, 
    showTab,
    displayPrompts, 
    viewPromptDetails 
  };
})();
