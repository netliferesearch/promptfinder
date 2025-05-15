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
  let lastActiveSectionShowFunction;

  let tabAllEl, tabFavsEl, tabPrivateEl;
  let searchInputEl;
  let filterButtonEl, ratingFilterPanelEl, minRatingSelectEl;
  let addPromptButtonEl; // addPromptFormEl and cancelAddPromptButtonEl are for inline form, not main button
  let promptsListEl;
  let promptDetailsSectionEl,
    backToListButtonEl,
    copyPromptDetailButtonEl,
    editPromptButtonEl,
    // deletePromptIconEl, // Assuming this was part of detail view, handled by event delegation or specific button
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
  // addPromptSectionEl is for the inline form in popup.html, not the detached window flow primarily.
  // We might remove logic tied to it if the detached window is the sole add method from popup.
  let addPromptSectionEl; 
  let controlsEl, tabsContainerEl, bottomBarEl, addPromptBarEl;

  const cacheDOMElements = () => {
    tabAllEl = document.getElementById('tab-all');
    tabFavsEl = document.getElementById('tab-favs');
    tabPrivateEl = document.getElementById('tab-private');
    searchInputEl = document.getElementById('search-input');
    filterButtonEl = document.getElementById('filter-button');
    ratingFilterPanelEl = document.getElementById('rating-filter');
    minRatingSelectEl = document.getElementById('min-rating');
    addPromptButtonEl = document.getElementById('add-prompt-button'); // Main button in popup
    promptsListEl = document.getElementById('prompts-list');
    promptDetailsSectionEl = document.getElementById('prompt-details-section');
    addPromptSectionEl = document.getElementById('add-prompt-section'); // Inline add form section

    if (promptDetailsSectionEl) {
      backToListButtonEl = promptDetailsSectionEl.querySelector('#back-to-list-button');
      copyPromptDetailButtonEl = promptDetailsSectionEl.querySelector('#copy-prompt-button');
      editPromptButtonEl = promptDetailsSectionEl.querySelector('#edit-prompt-button');
      // deletePromptIconEl = promptDetailsSectionEl.querySelector('#delete-prompt-icon'); // Ensure this ID exists if used
      deleteConfirmationEl = promptDetailsSectionEl.querySelector('#delete-confirmation');
      cancelDeleteButtonEl = promptDetailsSectionEl.querySelector('#cancel-delete-button');
      confirmDeleteButtonEl = promptDetailsSectionEl.querySelector('#confirm-delete-button');
      promptDetailTitleEl = promptDetailsSectionEl.querySelector('#prompt-detail-title');
      promptDetailTextEl = promptDetailsSectionEl.querySelector('#prompt-detail-text');
      promptDetailCategoryEl = promptDetailsSectionEl.querySelector('#prompt-detail-category');
      promptDetailTagsEl = promptDetailsSectionEl.querySelector('#prompt-detail-tags');
      averageRatingValueEl = promptDetailsSectionEl.querySelector('#average-rating-value');
      ratingCountEl = promptDetailsSectionEl.querySelector('#rating-count');
      starRatingContainerEl = promptDetailsSectionEl.querySelector('#star-rating');
    }
    controlsEl = document.querySelector('.controls');
    tabsContainerEl = document.querySelector('.tabs');
    bottomBarEl = document.querySelector('.bottom-bar'); // Ensure this element exists if used
    addPromptBarEl = document.querySelector('.add-prompt-bar');
  };

  /**
   * Fetches prompts from PromptData (Firestore) and updates the UI.
   */
  const loadAndDisplayData = async () => {
    try {
      console.log("UI: Starting loadAndDisplayData");
      allPrompts = await PromptData.loadPrompts(); // Now fetches from Firestore
      console.log(`UI: Loaded ${allPrompts.length} prompts from data source.`);
      showTab(activeTab); // This will filter and call displayPrompts
    } catch (error) {
      Utils.handleError('Error loading and displaying prompt data', {
        userVisible: true,
        originalError: error,
      });
      if (promptsListEl) promptsListEl.innerHTML = '<p class="empty-state">Could not load prompts.</p>';
    }
  };

  const initializeUI = async () => {
    try {
      cacheDOMElements();
      setupEventListeners();
      // setupStorageChangeListener(); // This might be replaced by chrome.runtime.onMessage for Firestore updates
      await loadAndDisplayData(); // Initial data load and render
    } catch (error) {
      Utils.handleError('Error initializing UI', {
        userVisible: true,
        originalError: error,
      });
    }
  };
  
  // Commenting out setupStorageChangeListener as it's for chrome.storage.local.
  // Updates from Firestore will be triggered by specific actions (add, edit, delete) 
  // or by auth state changes, which then call loadAndDisplayData.
  /*
  const setupStorageChangeListener = () => {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.promptUpdated) {
        loadAndDisplayData(); // Refresh with Firestore data
      }
    });
  };
  */

  const setupEventListeners = () => {
    tabAllEl?.addEventListener('click', () => showTab('all'));
    tabFavsEl?.addEventListener('click', () => showTab('favs'));
    tabPrivateEl?.addEventListener('click', () => showTab('private'));
    searchInputEl?.addEventListener('input', () => showTab(activeTab)); // Re-filter on search
    if (filterButtonEl && ratingFilterPanelEl) {
      filterButtonEl.addEventListener('click', () => {
        ratingFilterPanelEl.classList.toggle('hidden');
        filterButtonEl.classList.toggle('active');
      });
    } 
    minRatingSelectEl?.addEventListener('change', () => showTab(activeTab)); // Re-filter on rating change
    
    // This button now opens a new window, handled by openDetachedAddPromptWindow
    addPromptButtonEl?.addEventListener('click', () => {
        const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
        if (currentUser) {
            openDetachedAddPromptWindow();
        } else {
            // Error message is handled in app.js for this button based on auth state
            console.log("UI: Add prompt clicked, but user not logged in (app.js should show message).");
        }
    });

    promptsListEl?.addEventListener('click', handlePromptListClick);

    if (promptDetailsSectionEl) {
      backToListButtonEl?.addEventListener('click', async () => {
        // No need to reload all prompts here if allPrompts is kept up-to-date by other actions
        // Or, if we want to ensure fresh data after potential background changes:
        // await loadAndDisplayData(); 
        showPromptList(); // This will use the existing allPrompts array and re-filter/display
        // showTab(activeTab); // showPromptList might call displayPrompts which considers activeTab or showTab calls showPromptList
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
      // Example for delete icon if it's directly in details view and not part of a list item
      const deletePromptButtonDetail = promptDetailsSectionEl.querySelector('#delete-prompt-button-detail'); // Assume this ID if needed
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
      // Favorite toggle in detail view
      const favBtnDetail = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
      favBtnDetail?.addEventListener('click', () => {
          if (favBtnDetail.dataset.id) {
            handleToggleFavorite(favBtnDetail.dataset.id);
          }
      });
    }
  };

  const showPromptList = () => {
    promptsListEl?.classList.remove('hidden');
    promptDetailsSectionEl?.classList.add('hidden');
    // addPromptSectionEl?.classList.add('hidden'); // If inline add form exists
    controlsEl?.classList.remove('hidden');
    tabsContainerEl?.classList.remove('hidden');
    // bottomBarEl?.classList.remove('hidden');
    addPromptBarEl?.classList.remove('hidden');
    // Re-apply current filters and display. showTab already does this.
    // This ensures when we return to list, it respects current filters.
    // If allPrompts is up-to-date, showTab will correctly re-render.
    // No need to call displayPrompts directly here if showTab is the main rendering trigger for the list.
    showTab(activeTab); 
  };

  const showPromptDetailsView = () => {
    promptsListEl?.classList.add('hidden');
    promptDetailsSectionEl?.classList.remove('hidden');
    // addPromptSectionEl?.classList.add('hidden');
    controlsEl?.classList.remove('hidden'); // Or hide if details view is full-screen
    tabsContainerEl?.classList.remove('hidden'); // Or hide
    // bottomBarEl?.classList.add('hidden');
    addPromptBarEl?.classList.add('hidden'); // Typically hide add button when viewing details
  };

  // showAddPromptView for inline form is removed as detached window is primary for add from popup

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
    // This function now relies on allPrompts being up-to-date from loadAndDisplayData
    console.log(`UI: Showing tab: ${which}, with ${allPrompts.length} total prompts available.`);
    activeTab = which;
    tabAllEl?.classList.toggle('active', which === 'all');
    tabFavsEl?.classList.toggle('active', which === 'favs');
    tabPrivateEl?.classList.toggle('active', which === 'private');
    
    if (promptsListEl && !promptDetailsSectionEl?.classList.contains('hidden')) {
        // If details view is active, switch back to list view before applying tab filters
        promptsListEl?.classList.remove('hidden');
        promptDetailsSectionEl?.classList.add('hidden');
        addPromptBarEl?.classList.remove('hidden');
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
    if (!promptsListEl) return;
    console.log(`UI: Displaying ${prompts.length} prompts.`);
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
      // Use userIsFavorite for the heart icon status
      const isFavorite = prompt.userIsFavorite || prompt.favorites === 1; // cater to old structure if present
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
    if (!prompt || !promptDetailsSectionEl) return;
    showPromptDetailsView();
    // lastActiveSectionShowFunction = () => displayPromptDetails(prompt); // May not be needed
    if (promptDetailTitleEl) promptDetailTitleEl.textContent = prompt.title;
    if (promptDetailTextEl) promptDetailTextEl.textContent = prompt.text;
    if (promptDetailCategoryEl) promptDetailCategoryEl.textContent = prompt.category;
    if (promptDetailTagsEl) promptDetailTagsEl.textContent = (prompt.tags || []).join(', ');
    
    const favBtn = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
    if (favBtn) {
      favBtn.dataset.id = prompt.id;
      const icon = favBtn.querySelector('i');
      if (icon) icon.className = (prompt.userIsFavorite || prompt.favorites === 1) ? 'fas fa-heart' : 'far fa-heart';
    }

    const ratingToDisplay = prompt.isPrivate ? (prompt.userRating || 0) : (prompt.averageRating || 0);
    const ratingCountToDisplay = prompt.isPrivate ? 1 : (prompt.totalRatingsCount || 0); // Simplification for private

    if (averageRatingValueEl) averageRatingValueEl.textContent = `(${ratingToDisplay.toFixed(1)})`;
    if (ratingCountEl) ratingCountEl.textContent = `(${ratingCountToDisplay} ${ratingCountToDisplay === 1 ? 'rating' : 'ratings'})`;
    
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
    }
    if (deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
  };

  const viewPromptDetails = async promptId => {
    try {
      // Use PromptData.findPromptById which can fetch from Firestore directly
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
      event.stopPropagation(); // Prevent card click if any
      await handleToggleFavorite(promptId);
    } else if (targetButton.classList.contains('view-details')) {
      await viewPromptDetails(promptId);
    } else if (targetButton.classList.contains('copy-prompt')) {
      await handleCopyPrompt(promptId);
    }
  };
  
  // handleAddPromptSubmit is removed as it's for the inline form, which we are de-emphasizing from app.js
  // The primary add flow is via the detached add-prompt.html page.

  const handleToggleFavorite = async promptId => {
    // This will need to be refactored for Firestore
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
    // This will need to be refactored for Firestore, especially for shared vs private ratings
    console.warn('handleRatePrompt needs Firestore update');
    try {
      // For now, assume it updates the local allPrompts array like toggleFavorite for UI demo
      const updatedPrompt = await PromptData.updatePromptRating(promptId, rating, isPrivatePrompt); // Pass isPrivatePrompt
      allPrompts = allPrompts.map(p => p.id === promptId ? updatedPrompt : p);
      if (starRatingContainerEl?.dataset.id === promptId) {
         displayPromptDetails(updatedPrompt); // Re-render details view if it's the current one
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
    // This will need to be refactored for Firestore
    console.warn('handleDeletePrompt needs Firestore update');
    try {
      const success = await PromptData.deletePrompt(promptId);
      if (success) {
        allPrompts = allPrompts.filter(p => p.id !== promptId);
        Utils.showConfirmationMessage('Prompt deleted successfully!');
        showPromptList(); // This will call showTab and re-render
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
    loadAndDisplayData, // Exposed for app.js to call
    // openDetachedAddPromptWindow, // This is now primarily handled by #add-prompt-button listener
    // openDetachedEditWindow, // Can be called directly if needed
    // Exposing other functions if app.js or other modules need direct access, though most UI interaction should be internal
    showTab,
    displayPrompts, 
    displayPromptDetails, 
    viewPromptDetails 
  };
})();
