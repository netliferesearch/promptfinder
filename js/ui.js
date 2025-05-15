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
    deleteConfirmationEl,
    cancelDeleteButtonEl,
    confirmDeleteButtonEl,
    promptDetailTitleEl, // Will be cached using document.getElementById
    promptDetailTextEl,  // Will be cached using document.getElementById
    promptDetailCategoryEl, // Will be cached using document.getElementById
    promptDetailTagsEl,     // Will be cached using document.getElementById
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

    // Cache detail view elements directly using document.getElementById
    promptDetailTitleEl = document.getElementById('prompt-detail-title');
    promptDetailTextEl = document.getElementById('prompt-detail-text');
    promptDetailCategoryEl = document.getElementById('prompt-detail-category');
    promptDetailTagsEl = document.getElementById('prompt-detail-tags');
    averageRatingValueEl = document.getElementById('average-rating-value');
    ratingCountEl = document.getElementById('rating-count');
    starRatingContainerEl = document.getElementById('star-rating');

    if (promptDetailsSectionEl) {
      console.log("[UI Cache] promptDetailsSectionEl found:", promptDetailsSectionEl);
      // These buttons are definitely within promptDetailsSectionEl, so querySelector is fine here.
      backToListButtonEl = promptDetailsSectionEl.querySelector('#back-to-list-button');
      copyPromptDetailButtonEl = promptDetailsSectionEl.querySelector('#copy-prompt-button');
      editPromptButtonEl = promptDetailsSectionEl.querySelector('#edit-prompt-button');
      deleteConfirmationEl = promptDetailsSectionEl.querySelector('#delete-confirmation');
      cancelDeleteButtonEl = promptDetailsSectionEl.querySelector('#cancel-delete-button');
      confirmDeleteButtonEl = promptDetailsSectionEl.querySelector('#confirm-delete-button');
      // Log the result of direct ID caching
      console.log("[UI Cache Direct] promptDetailTitleEl:", promptDetailTitleEl);
      console.log("[UI Cache Direct] promptDetailTextEl:", promptDetailTextEl);
      console.log("[UI Cache Direct] promptDetailCategoryEl:", promptDetailCategoryEl);
      console.log("[UI Cache Direct] promptDetailTagsEl:", promptDetailTagsEl);
    } else {
      console.warn("[UI Cache] promptDetailsSectionEl NOT found!");
    }
    controlsEl = document.querySelector('.controls');
    tabsContainerEl = document.querySelector('.tabs');
    addPromptBarEl = document.querySelector('.add-prompt-bar');
  };

  const loadAndDisplayData = async () => {
    try {
      console.log("[UI] Starting loadAndDisplayData");
      allPrompts = await PromptData.loadPrompts(); 
      console.log(`[UI] Loaded ${allPrompts.length} prompts from data source.`);
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
        if (starRatingContainerEl && starRatingContainerEl.dataset.id) {
          handleCopyPrompt(starRatingContainerEl.dataset.id);
        }
      });
      editPromptButtonEl?.addEventListener('click', () => {
        if (starRatingContainerEl && starRatingContainerEl.dataset.id) {
          openDetachedEditWindow(starRatingContainerEl.dataset.id);
        }
      });
      const deletePromptButtonDetail = promptDetailsSectionEl.querySelector('#delete-prompt-button-detail');
      deletePromptButtonDetail?.addEventListener('click', () => {
          if(deleteConfirmationEl) deleteConfirmationEl.classList.remove('hidden');
      });
      cancelDeleteButtonEl?.addEventListener('click', () => {
        if(deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
      });
      confirmDeleteButtonEl?.addEventListener('click', () => {
        if (starRatingContainerEl && starRatingContainerEl.dataset.id) {
          handleDeletePrompt(starRatingContainerEl.dataset.id);
        }
      });
      const favBtnDetail = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
      favBtnDetail?.addEventListener('click', () => {
          if (favBtnDetail.dataset.id) {
            handleToggleFavorite(favBtnDetail.dataset.id);
          }
      });
    }
  };

  const showPromptList = () => {
    console.log("[UI] showPromptList called");
    if (promptsListEl) promptsListEl.classList.remove('hidden');
    if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('hidden');
    if (controlsEl) controlsEl.classList.remove('hidden');
    if (tabsContainerEl) tabsContainerEl.classList.remove('hidden');
    if (addPromptBarEl) addPromptBarEl.classList.remove('hidden');
    showTab(activeTab); 
  };

  const showPromptDetailsView = () => {
    console.log("[UI] showPromptDetailsView called");
    if (promptsListEl) promptsListEl.classList.add('hidden');
    if (promptDetailsSectionEl) promptDetailsSectionEl.classList.remove('hidden');
    if (controlsEl) controlsEl.classList.add('hidden');
    if (tabsContainerEl) tabsContainerEl.classList.add('hidden');
    if (addPromptBarEl) addPromptBarEl.classList.add('hidden');
    console.log("[UI] promptDetailsSectionEl classList after remove hidden:", promptDetailsSectionEl ? promptDetailsSectionEl.classList : 'not found');
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
    console.log(`[UI] Showing tab: ${which}, with ${allPrompts.length} total prompts available.`);
    activeTab = which;
    if(tabAllEl) tabAllEl.classList.toggle('active', which === 'all');
    if(tabFavsEl) tabFavsEl.classList.toggle('active', which === 'favs');
    if(tabPrivateEl) tabPrivateEl.classList.toggle('active', which === 'private');
    
    if (promptsListEl && !promptDetailsSectionEl?.classList.contains('hidden')) {
        if (promptsListEl) promptsListEl.classList.remove('hidden');
        if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('hidden');
        if (addPromptBarEl) addPromptBarEl.classList.remove('hidden');
    }
    
    const filters = {
      tab: which,
      searchTerm: searchInputEl ? searchInputEl.value : '',
      minRating: minRatingSelectEl ? parseInt(minRatingSelectEl.value) : 0,
    };
    const filtered = PromptData.filterPrompts(allPrompts, filters);
    displayPrompts(filtered);
  };

  const displayPrompts = prompts => {
    if (!promptsListEl) {
        console.warn("[UI] promptsListEl not found in displayPrompts");
        return;
    }
    console.log(`[UI] Displaying ${prompts.length} prompts.`);
    const sorted = [...prompts].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    );
    promptsListEl.innerHTML = '';
    if (sorted.length === 0) {
      promptsListEl.innerHTML = '<div class="empty-state"><p>No prompts found. Try adjusting filters or add new prompts.</p></div>';
      return;
    }
    sorted.forEach(prompt => {
      const div = document.createElement('div');
      div.classList.add('prompt-item');
      const isFavorite = prompt.userIsFavorite || prompt.favorites === 1; 
      div.innerHTML = `
      <button class="toggle-favorite" data-id="${prompt.id}" aria-label="Toggle favorite">
        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
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
    console.log("[UI] displayPromptDetails called with prompt:", prompt);
    if (!prompt || !promptDetailsSectionEl) {
        console.warn("[UI] No prompt or promptDetailsSectionEl in displayPromptDetails. Prompt:", prompt, "Section:", promptDetailsSectionEl);
        return;
    }
    // Log the elements again after direct ID caching attempt
    console.log("[UI Direct Cache Check in displayPromptDetails] titleEl:", promptDetailTitleEl, "textEl:", promptDetailTextEl);

    showPromptDetailsView(); 

    if (promptDetailTitleEl) promptDetailTitleEl.textContent = prompt.title || 'N/A'; else console.warn("promptDetailTitleEl is null");
    if (promptDetailTextEl) promptDetailTextEl.textContent = prompt.text || 'N/A'; else console.warn("promptDetailTextEl is null");
    if (promptDetailCategoryEl) promptDetailCategoryEl.textContent = prompt.category || 'N/A'; else console.warn("promptDetailCategoryEl is null");
    if (promptDetailTagsEl) promptDetailTagsEl.textContent = (prompt.tags || []).join(', ') || 'None'; else console.warn("promptDetailTagsEl is null");
    
    const favBtn = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
    if (favBtn) {
      favBtn.dataset.id = prompt.id;
      const icon = favBtn.querySelector('i');
      if (icon) icon.className = (prompt.userIsFavorite || prompt.favorites === 1) ? 'fas fa-heart' : 'far fa-heart';
    }

    const ratingToDisplay = prompt.isPrivate ? (prompt.userRating || 0) : (prompt.averageRating || 0);
    const ratingCountToDisplay = prompt.isPrivate ? 1 : (prompt.totalRatingsCount || 0); 

    if (averageRatingValueEl) averageRatingValueEl.textContent = `(${ratingToDisplay.toFixed(1)})`; else console.warn("averageRatingValueEl is null");
    if (ratingCountEl) ratingCountEl.textContent = `(${ratingCountToDisplay} ${ratingCountToDisplay === 1 ? 'rating' : 'ratings'})`; else console.warn("ratingCountEl is null");
    
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
          await handleRatePrompt(prompt.id, i, prompt.isPrivate);
        });
        starRatingContainerEl.appendChild(star);
      }
    } else { console.warn("starRatingContainerEl is null");}
    if (deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
    console.log("[UI] displayPromptDetails finished populating fields.");
  };

  const viewPromptDetails = async promptId => {
    console.log(`[UI] viewPromptDetails called for ID: ${promptId}`);
    try {
      const prompt = await PromptData.findPromptById(promptId);
      console.log("[UI] Prompt fetched by findPromptById:", prompt);
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
  
  const handleToggleFavorite = async promptId => {
    console.warn('handleToggleFavorite needs Firestore update');
    try {
      const updatedPrompt = await PromptData.toggleFavorite(promptId);
      allPrompts = allPrompts.map(p => p.id === promptId ? updatedPrompt : p);
      if (promptDetailsSectionEl && !promptDetailsSectionEl.classList.contains('hidden') && starRatingContainerEl?.dataset.id === promptId) {
        displayPromptDetails(updatedPrompt);
      } else {
        showTab(activeTab);
      }
      Utils.showConfirmationMessage(`Favorite status updated!`);
    } catch (error) {
      Utils.handleError('Failed to update favorite status', { userVisible: true, originalError: error });
    }
  };

  const handleRatePrompt = async (promptId, rating, isPrivatePrompt) => {
    console.warn('handleRatePrompt needs Firestore update');
    try {
      const updatedPrompt = await PromptData.updatePromptRating(promptId, rating, isPrivatePrompt); 
      allPrompts = allPrompts.map(p => p.id === promptId ? updatedPrompt : p);
      if (starRatingContainerEl?.dataset.id === promptId) {
         displayPromptDetails(updatedPrompt); 
      }
      Utils.showConfirmationMessage(`Rated ${rating} stars!`);
    } catch (error) {
      Utils.handleError('Failed to update rating', { userVisible: true, originalError: error });
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

  const handleDeletePrompt = async promptId => {
    console.warn('handleDeletePrompt needs Firestore update');
    try {
      const success = await PromptData.deletePrompt(promptId);
      if (success) {
        allPrompts = allPrompts.filter(p => p.id !== promptId);
        Utils.showConfirmationMessage('Prompt deleted successfully!');
        showPromptList(); 
      } else {
        Utils.handleError('Failed to delete prompt.', { userVisible: true });
      }
    } catch (error) {
      Utils.handleError('Error during prompt deletion', { userVisible: true, originalError: error });
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
    displayPromptDetails, 
    viewPromptDetails 
  };
})();
