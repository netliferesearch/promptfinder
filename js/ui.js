/**
 * PromptFinder Extension - UI Controllers
 * Contains functions for managing the UI and interactions.
 * Using namespace pattern for Chrome extension compatibility.
 */

// Extend the namespace
window.PromptFinder = window.PromptFinder || {};

// UI module
window.PromptFinder.UI = (function () {
  // Private references to other modules
  const Utils = window.PromptFinder.Utils;
  const PromptData = window.PromptFinder.PromptData;

  // UI state
  let allPrompts = [];
  let activeTab = 'all';
  let lastActiveSectionShowFunction;

  // Cached DOM Elements
  let tabAllEl, tabFavsEl, tabPrivateEl;
  let searchInputEl;
  let filterButtonEl, ratingFilterPanelEl, minRatingSelectEl;
  let addPromptButtonEl, addPromptFormEl, cancelAddPromptButtonEl;
  let promptsListEl;
  let promptDetailsSectionEl, backToListButtonEl, copyPromptDetailButtonEl, editPromptButtonEl,
      deletePromptIconEl, deleteConfirmationEl, cancelDeleteButtonEl, confirmDeleteButtonEl,
      promptDetailTitleEl, promptDetailTextEl, promptDetailCategoryEl, promptDetailTagsEl,
      averageRatingValueEl, ratingCountEl, starRatingContainerEl;
  let addPromptSectionEl;
  let controlsEl, tabsContainerEl, bottomBarEl, addPromptBarEl;
  
  // Form input elements (for add/edit forms - assuming they share IDs for simplicity in this refactor)
  let formPromptTitleEl, formPromptTextEl, formPromptCategoryEl, formPromptTagsEl, formPromptPrivateEl;


  /**
   * Cache all frequently used DOM elements.
   */
  const cacheDOMElements = () => {
    // Tabs
    tabAllEl = document.getElementById('tab-all');
    tabFavsEl = document.getElementById('tab-favs');
    tabPrivateEl = document.getElementById('tab-private');

    // Search & Filter
    searchInputEl = document.getElementById('search-input');
    filterButtonEl = document.getElementById('filter-button');
    ratingFilterPanelEl = document.getElementById('rating-filter');
    minRatingSelectEl = document.getElementById('min-rating');

    // Add Prompt
    addPromptButtonEl = document.getElementById('add-prompt-button');
    // Note: add-prompt-form related elements are likely in add-prompt.html,
    // so they might need to be cached when that specific view/window is active if not always present.
    // For the main popup UI:
    addPromptFormEl = document.getElementById('add-prompt-form'); // If it exists in popup.html
    cancelAddPromptButtonEl = document.getElementById('cancel-add-prompt'); // If it exists in popup.html
    
    // Form inputs (assuming these IDs are used in add-prompt.html/edit-prompt.html and potentially within popup if form is embedded)
    formPromptTitleEl = document.getElementById('prompt-title');
    formPromptTextEl = document.getElementById('prompt-text');
    formPromptCategoryEl = document.getElementById('prompt-category');
    formPromptTagsEl = document.getElementById('prompt-tags');
    formPromptPrivateEl = document.getElementById('prompt-private');


    // Prompt List
    promptsListEl = document.getElementById('prompts-list');

    // Prompt Details Section
    promptDetailsSectionEl = document.getElementById('prompt-details-section');
    if (promptDetailsSectionEl) {
      backToListButtonEl = promptDetailsSectionEl.querySelector('#back-to-list-button');
      copyPromptDetailButtonEl = promptDetailsSectionEl.querySelector('#copy-prompt-button');
      editPromptButtonEl = promptDetailsSectionEl.querySelector('#edit-prompt-button');
      deletePromptIconEl = promptDetailsSectionEl.querySelector('#delete-prompt-icon');
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

    // Sections
    addPromptSectionEl = document.getElementById('add-prompt-section'); // If it exists in popup.html

    // Layout Controls
    controlsEl = document.querySelector('.controls');
    tabsContainerEl = document.querySelector('.tabs');
    bottomBarEl = document.querySelector('.bottom-bar');
    addPromptBarEl = document.querySelector('.add-prompt-bar');
  };

  /**
   * Initialize the UI
   */
  const initializeUI = async () => {
    try {
      // Cache DOM elements first
      cacheDOMElements();
      
      // Load prompts
      allPrompts = await PromptData.loadPrompts();

      // Set up event listeners
      setupEventListeners();

      // Set up storage change listener for prompt updates
      setupStorageChangeListener();

      // Show initial tab
      showTab(activeTab);
    } catch (error) {
      Utils.handleError('Error initializing UI', {
        userVisible: true,
        originalError: error,
      });
    }
  };
  
  /**
   * Set up storage change listener to detect prompt updates from detached windows
   */
  const setupStorageChangeListener = () => {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.promptUpdated) {
        console.log('Detected prompt update from detached window, refreshing prompt data');
        
        PromptData.loadPrompts().then(prompts => {
          allPrompts = prompts;
          
          // Update UI based on current view
          // Use cached promptDetailsSectionEl
          if (!promptDetailsSectionEl || promptDetailsSectionEl.classList.contains('hidden')) {
            // In list view - force immediate refresh
            const filters = {
              tab: activeTab,
              searchTerm: searchInputEl ? searchInputEl.value : '',
              minRating: minRatingSelectEl ? parseInt(minRatingSelectEl.value) : 0,
            };
            
            const filtered = PromptData.filterPrompts(allPrompts, filters);
            displayPrompts(filtered);
            
            // Update tab state in UI to ensure visual consistency
            if (tabAllEl) tabAllEl.classList.toggle('active', activeTab === 'all');
            if (tabFavsEl) tabFavsEl.classList.toggle('active', activeTab === 'favs');
            if (tabPrivateEl) tabPrivateEl.classList.toggle('active', activeTab === 'private');
          } else {
            // In detail view - get the current prompt ID from the star rating container
            // Use cached starRatingContainerEl
            if (starRatingContainerEl && starRatingContainerEl.dataset.id) {
              const promptId = starRatingContainerEl.dataset.id;
              console.log('Found prompt ID in detail view:', promptId);
              
              const updatedPrompt = allPrompts.find(p => p.id === promptId);
              if (updatedPrompt) {
                console.log('Found updated prompt, refreshing detail view:', updatedPrompt.title);
                displayPromptDetails(updatedPrompt);
                Utils.showConfirmationMessage('Prompt details updated with recent changes');
              } else {
                console.warn('Could not find updated prompt with ID:', promptId);
              }
            } else {
              console.warn('Could not find prompt ID in detail view');
            }
          }
        }).catch(error => {
          Utils.handleError('Failed to refresh prompts after update', {
            userVisible: true,
            originalError: error,
          });
        });
      }
    });
  };

  /**
   * Set up all event listeners
   */
  const setupEventListeners = () => {
    // --- Tab Navigation ---
    tabAllEl?.addEventListener('click', () => showTab('all'));
    tabFavsEl?.addEventListener('click', () => showTab('favs'));
    tabPrivateEl?.addEventListener('click', () => showTab('private'));

    // --- Search Input ---
    searchInputEl?.addEventListener('input', () => showTab(activeTab));

    // --- Filter Button and Panel ---
    if (filterButtonEl && ratingFilterPanelEl) {
      filterButtonEl.addEventListener('click', () => {
        ratingFilterPanelEl.classList.toggle('hidden');
        filterButtonEl.classList.toggle('active');
      });
    } else {
      console.error('Missing filter button or panel elements');
    }

    minRatingSelectEl?.addEventListener('change', () => {
      showTab(activeTab);
    });
    

    // --- Add Prompt Button ---
    addPromptButtonEl?.addEventListener('click', openDetachedAddPromptWindow);

    // --- Add Prompt Form (if present in popup.html) ---
    if (addPromptFormEl) {
      addPromptFormEl.addEventListener('submit', handleAddPromptSubmit);
      cancelAddPromptButtonEl?.addEventListener('click', () => {
        addPromptFormEl.reset();
        if (typeof lastActiveSectionShowFunction === 'function') {
          lastActiveSectionShowFunction();
        } else {
          showPromptList();
        }
      });
    }

    // --- Prompt List Delegation ---
    promptsListEl?.addEventListener('click', handlePromptListClick);

    // --- Prompt Details Section ---
    if (promptDetailsSectionEl) {
      backToListButtonEl?.addEventListener('click', () => {
        PromptData.loadPrompts().then(prompts => {
          allPrompts = prompts;
          showPromptList();
          showTab(activeTab);
        }).catch(error => {
          console.error('Error refreshing prompts when going back to list:', error);
          showPromptList();
          showTab(activeTab);
        });
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

      // Favorite button (using event delegation on promptDetailsSectionEl)
      promptDetailsSectionEl.addEventListener('click', event => {
        const favBtn = event.target.closest('#toggle-fav-detail');
        if (favBtn && favBtn.dataset.id) {
          handleToggleFavorite(favBtn.dataset.id);
        }
      });

      deletePromptIconEl?.addEventListener('click', () => {
        deleteConfirmationEl?.classList.remove('hidden');
      });

      cancelDeleteButtonEl?.addEventListener('click', () => {
        deleteConfirmationEl?.classList.add('hidden');
      });

      confirmDeleteButtonEl?.addEventListener('click', () => {
        if (starRatingContainerEl && starRatingContainerEl.dataset.id) {
          handleDeletePrompt(starRatingContainerEl.dataset.id);
        }
      });
    }
  };

  // --- Section Visibility Management ---

  const showPromptList = () => {
    promptsListEl?.classList.remove('hidden');
    promptDetailsSectionEl?.classList.add('hidden');
    addPromptSectionEl?.classList.add('hidden'); // If add-prompt section is part of main popup

    controlsEl?.classList.remove('hidden');
    tabsContainerEl?.classList.remove('hidden');
    bottomBarEl?.classList.remove('hidden');
    addPromptBarEl?.classList.remove('hidden');

    lastActiveSectionShowFunction = showPromptList;
  };

  const showPromptDetailsView = () => { // Renamed to avoid conflict with displayPromptDetails function
    promptsListEl?.classList.add('hidden');
    promptDetailsSectionEl?.classList.remove('hidden');
    addPromptSectionEl?.classList.add('hidden');

    controlsEl?.classList.remove('hidden');
    tabsContainerEl?.classList.remove('hidden');
    bottomBarEl?.classList.remove('hidden');
    addPromptBarEl?.classList.remove('hidden');
  };
  
  const showAddPromptView = () => { // Renamed for clarity
    promptsListEl?.classList.add('hidden');
    promptDetailsSectionEl?.classList.add('hidden');
    addPromptSectionEl?.classList.remove('hidden');

    controlsEl?.classList.add('hidden');
    tabsContainerEl?.classList.add('hidden');
    bottomBarEl?.classList.add('hidden');
    addPromptBarEl?.classList.add('hidden');
  };
  
  const openDetachedAddPromptWindow = () => {
    try {
      const width = 500;
      const height = 600;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;
      
      chrome.windows.create({
        url: chrome.runtime.getURL('add-prompt.html'),
        type: 'popup',
        width: width,
        height: height,
        left: Math.round(left),
        top: Math.round(top),
        focused: true
      }, (window) => {
        if (chrome.runtime.lastError) {
          console.error('Error opening detached window:', chrome.runtime.lastError);
          // Fallback to inline form if it exists and is part of popup.html
          if (addPromptSectionEl) {
            showAddPromptView();
          } else {
            Utils.handleError('Could not open add prompt window or find inline form.');
          }
        } else {
          console.log('Detached add prompt window opened successfully');
        }
      });
    } catch (error) {
      console.error('Failed to open detached window:', error);
       if (addPromptSectionEl) {
         showAddPromptView();
       } else {
         Utils.handleError('Could not open add prompt window or find inline form.');
       }
    }
  };
  
  const openDetachedEditWindow = (promptId) => {
    try {
      if (!promptId) {
        Utils.handleError('No prompt ID provided for editing');
        return;
      }
      
      const width = 500;
      const height = 600;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;
      
      chrome.windows.create({
        url: chrome.runtime.getURL(`edit-prompt.html?id=${promptId}`),
        type: 'popup',
        width: width,
        height: height,
        left: Math.round(left),
        top: Math.round(top),
        focused: true
      }, (window) => {
        if (chrome.runtime.lastError) {
          console.error('Error opening detached edit window:', chrome.runtime.lastError);
          Utils.handleError('Failed to open edit window. Please try again.');
        } else {
          console.log('Detached edit prompt window opened successfully');
        }
      });
    } catch (error) {
      console.error('Failed to open detached edit window:', error);
      Utils.handleError('Failed to open edit window. Please try again.');
    }
  };

  const showTab = which => {
    showPromptList();
    activeTab = which;

    tabAllEl?.classList.toggle('active', which === 'all');
    tabFavsEl?.classList.toggle('active', which === 'favs');
    tabPrivateEl?.classList.toggle('active', which === 'private');

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

    const sorted = [...prompts].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );

    promptsListEl.innerHTML = '';

    if (sorted.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.classList.add('empty-state');
      emptyDiv.innerHTML = `<p>No prompts found. Try adjusting your filters or add new prompts.</p>`;
      promptsListEl.appendChild(emptyDiv);
      return;
    }

    sorted.forEach(prompt => {
      const div = document.createElement('div');
      div.classList.add('prompt-item');
      // Using textContent for safety where possible, or ensure data is sanitized if it can contain HTML
      div.innerHTML = `
      <button class="toggle-favorite" data-id="${prompt.id}" aria-label="Toggle favorite">
        <i class="${prompt.favorites === 1 ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <h3>${Utils.escapeHTML(prompt.title)}</h3>
      <div class="tags">
        ${prompt.tags.map(t => `<span class="tag">${Utils.escapeHTML(t)}</span>`).join('')}
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

    showPromptDetailsView(); // Use the renamed section visibility function
    lastActiveSectionShowFunction = () => displayPromptDetails(prompt);

    if (promptDetailTitleEl) promptDetailTitleEl.textContent = prompt.title;
    if (promptDetailTextEl) promptDetailTextEl.textContent = prompt.text; // Assuming prompt.text is plain text
    if (promptDetailCategoryEl) promptDetailCategoryEl.textContent = prompt.category;
    if (promptDetailTagsEl) promptDetailTagsEl.textContent = prompt.tags.join(', ');

    const favBtn = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
    if (favBtn) {
      favBtn.dataset.id = prompt.id;
      const icon = favBtn.querySelector('i');
      if (icon) {
        icon.className = prompt.favorites === 1 ? 'fas fa-heart' : 'far fa-heart';
      }
    }

    if (averageRatingValueEl) {
      const avgRating = prompt.rating || 0;
      averageRatingValueEl.textContent = `(${avgRating.toFixed(1)})`;
    }
    if (ratingCountEl) {
      const count = prompt.ratingCount || 0;
      ratingCountEl.textContent = `(${count} ${count === 1 ? 'rating' : 'ratings'})`;
    }

    if (starRatingContainerEl) {
      starRatingContainerEl.dataset.id = prompt.id;
      starRatingContainerEl.innerHTML = ''; 
      const currentRating = Math.round(prompt.rating || 0);
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('button');
        star.classList.add('star');
        star.dataset.value = i;
        star.setAttribute('role', 'radio');
        star.setAttribute('aria-checked', i <= currentRating ? 'true' : 'false');
        star.setAttribute('aria-label', `${i} star${i !== 1 ? 's' : ''}`);
        star.setAttribute('tabindex', '0');
        star.innerHTML = i <= currentRating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        if (i <= currentRating) star.classList.add('filled');
        star.addEventListener('keydown', e => { /* ... keyboard support ... */ });
        star.addEventListener('click', async e => {
          e.stopPropagation();
          await handleRatePrompt(prompt.id, i);
        });
        starRatingContainerEl.appendChild(star);
      }
    }

    deleteConfirmationEl?.classList.add('hidden');
  };

  const viewPromptDetails = async promptId => {
    try {
      const prompt = await PromptData.findPromptById(promptId, allPrompts);
      if (prompt) {
        displayPromptDetails(prompt);
      } else {
        throw new Error(`Prompt with ID ${promptId} not found`);
      }
    } catch (error) {
      Utils.handleError(`Error viewing prompt details`, {
        userVisible: true,
        originalError: error,
      });
    }
  };

  const handlePromptListClick = async event => {
    const favoriteBtn = event.target.closest('.toggle-favorite');
    if (favoriteBtn && favoriteBtn.dataset.id) {
      event.preventDefault();
      event.stopPropagation();
      await handleToggleFavorite(favoriteBtn.dataset.id);
      return;
    }
    const viewDetailsBtn = event.target.closest('.view-details');
    if (viewDetailsBtn && viewDetailsBtn.dataset.id) {
      event.preventDefault();
      await viewPromptDetails(viewDetailsBtn.dataset.id);
      return;
    }
    const copyBtn = event.target.closest('.copy-prompt');
    if (copyBtn && copyBtn.dataset.id) {
      event.preventDefault();
      await handleCopyPrompt(copyBtn.dataset.id);
      return;
    }
  };

  const handleAddPromptSubmit = async event => {
    event.preventDefault();
    
    // Assuming formPromptTitleEl, etc. are cached correctly for the active form
    // These might need to be fetched from event.target.elements if form is not always the same
    const title = formPromptTitleEl ? formPromptTitleEl.value : document.getElementById('prompt-title')?.value;
    const text = formPromptTextEl ? formPromptTextEl.value : document.getElementById('prompt-text')?.value;
    const category = formPromptCategoryEl ? formPromptCategoryEl.value : document.getElementById('prompt-category')?.value || '';
    const tagsValue = formPromptTagsEl ? formPromptTagsEl.value : document.getElementById('prompt-tags')?.value || '';
    const isPrivate = formPromptPrivateEl ? formPromptPrivateEl.checked : document.getElementById('prompt-private')?.checked || false;

    if (!title || !text) {
      Utils.handleError('Please enter both a title and prompt text.');
      return;
    }

    const tags = tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      await PromptData.addPrompt({ title, text, category, tags, isPrivate });
      allPrompts = await PromptData.loadPrompts();
      
      // Reset the form that was submitted
      if (event.target && typeof event.target.reset === 'function') {
        event.target.reset();
      } else if (addPromptFormEl) { // Fallback for popup embedded form
         addPromptFormEl.reset();
      }


      Utils.showConfirmationMessage('Prompt added successfully!', { withButton: true, timeout: 5000 });
      showPromptList();
      showTab(activeTab);
    } catch (error) {
      Utils.handleError(`Failed to add prompt: ${error.message}`, {
        userVisible: true,
        originalError: error,
      });
    }
  };

  const handleToggleFavorite = async promptId => {
    try {
      const updatedPrompt = await PromptData.toggleFavorite(promptId);
      const index = allPrompts.findIndex(p => p.id === promptId);
      if (index !== -1) allPrompts[index] = updatedPrompt;

      if (!promptDetailsSectionEl || promptDetailsSectionEl.classList.contains('hidden')) {
        showTab(activeTab);
      } else {
        displayPromptDetails(updatedPrompt);
      }
      const actionText = updatedPrompt.favorites === 1 ? 'added to' : 'removed from';
      Utils.showConfirmationMessage(`Prompt ${actionText} favorites!`);
    } catch (error) {
      Utils.handleError('Failed to update favorite status', { userVisible: true, originalError: error });
    }
  };

  const handleRatePrompt = async (promptId, rating) => {
    try {
      // starRatingContainerEl should be the one in promptDetailsSectionEl
      if (!starRatingContainerEl) return;
      Utils.highlightStars(rating, starRatingContainerEl); // Optimistic update

      const updatedPrompt = await PromptData.updatePromptRating(promptId, rating);
      const index = allPrompts.findIndex(p => p.id === promptId);
      if (index !== -1) allPrompts[index] = updatedPrompt;

      if (ratingCountEl) {
        const count = updatedPrompt.ratingCount || 0;
        ratingCountEl.textContent = `(${count} ${count === 1 ? 'rating' : 'ratings'})`;
      }
      if (averageRatingValueEl) {
        const avgRating = updatedPrompt.rating || 0;
        averageRatingValueEl.textContent = `(${avgRating.toFixed(1)})`;
      }
      const newAverageRating = Math.round(updatedPrompt.rating || 0);
      Utils.highlightStars(newAverageRating, starRatingContainerEl); // Update to actual average

      Utils.showConfirmationMessage(`Rated ${rating} stars!`);
    } catch (error) {
      Utils.handleError('Failed to update rating', { userVisible: true, originalError: error });
      // Revert optimistic update on error by re-displaying
      const currentPrompt = await PromptData.findPromptById(promptId, allPrompts);
        if (currentPrompt && starRatingContainerEl) {
          const currentRating = Math.round(currentPrompt.rating || 0);
          Utils.highlightStars(currentRating, starRatingContainerEl);
        }
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
    try {
      const success = await PromptData.deletePrompt(promptId);
      if (success) {
        allPrompts = allPrompts.filter(p => p.id !== promptId);
        Utils.showConfirmationMessage('Prompt deleted successfully!');
        showPromptList();
        showTab(activeTab);
      }
    } catch (error) {
      Utils.handleError('Failed to delete prompt', { userVisible: true, originalError: error });
    }
  };
  
  // Ensure Utils.escapeHTML is available if used in displayPrompts
  // This is a placeholder, actual implementation might be in utils.js
  if (Utils && !Utils.escapeHTML) {
    Utils.escapeHTML = function(str) {
      if (typeof str !== 'string') return '';
      return str.replace(/[&<>"'\/]/g, function (s) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '">': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
          '/': '&#x2F;'
        }[s];
      });
    };
  }


  // Return public API
  return {
    initializeUI,
    // Expose section visibility functions if they need to be called from outside
    // showPromptList, 
    // showPromptDetailsView, 
    // showAddPromptView,
    openDetachedAddPromptWindow,
    openDetachedEditWindow,
    // Expose other specific handlers or display functions if needed by other modules or HTML pages
    // displayPromptDetails, 
    // viewPromptDetails,
    // handleAddPromptSubmit, // This might be needed if add-prompt.html calls it directly
  };
})();

// Example of how add-prompt.html or edit-prompt.html might initialize if they have their own JS:
// document.addEventListener('DOMContentLoaded', () => {
//   // If it's a simple form submission handled by ui.js from the popup context:
//   // const form = document.getElementById('add-prompt-form');
//   // if (form) {
//   //   form.addEventListener('submit', (event) => {
//   //      window.opener.PromptFinder.UI.handleAddPromptSubmit(event, () => window.close()); 
//   //      // ^ This assumes handleAddPromptSubmit is exposed and can take a callback
//   //   });
//   // }
//   // Or, more likely, add-prompt.js / edit-prompt.js would handle their own form logic
//   // and call PromptData methods directly, then notify the main popup to refresh.
// });
