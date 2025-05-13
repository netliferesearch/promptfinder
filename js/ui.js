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

  /**
   * Initialize the UI
   */
  const initializeUI = async () => {
    try {
      // Load prompts
      allPrompts = await PromptData.loadPrompts();

      // Set up event listeners
      setupEventListeners();

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
   * Set up all event listeners
   */
  const setupEventListeners = () => {
    // --- Tab Navigation ---
    document.getElementById('tab-all')?.addEventListener('click', () => showTab('all'));
    document.getElementById('tab-favs')?.addEventListener('click', () => showTab('favs'));
    document.getElementById('tab-private')?.addEventListener('click', () => showTab('private'));

    // --- Search Input ---
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => showTab(activeTab));
    }

    // --- Filter Button and Panel ---
    const filterButton = document.getElementById('filter-button');
    const ratingFilterPanel = document.getElementById('rating-filter');
    const minRatingSelect = document.getElementById('min-rating');

    console.log('Filter elements found:', { 
      filterButton: filterButton ? filterButton.id : null, 
      ratingFilterPanel: ratingFilterPanel ? ratingFilterPanel.id : null, 
      minRatingSelect: minRatingSelect ? minRatingSelect.id : null 
    });

    if (filterButton && ratingFilterPanel) {
      const newFilterButton = filterButton.cloneNode(true);
      filterButton.parentNode.replaceChild(newFilterButton, filterButton);
      
      // Add click listener to the new button
      newFilterButton.addEventListener('click', (e) => {
        console.log('Filter button clicked', e);
        ratingFilterPanel.classList.toggle('hidden');
        newFilterButton.classList.toggle('active');
        console.log('Filter panel hidden:', ratingFilterPanel.classList.contains('hidden'));
      });
    } else {
      console.error('Missing filter elements');
    }

    if (minRatingSelect) {
      const newMinRatingSelect = minRatingSelect.cloneNode(true);
      minRatingSelect.parentNode.replaceChild(newMinRatingSelect, minRatingSelect);
      
      newMinRatingSelect.addEventListener('change', (e) => {
        console.log('Min rating changed to:', newMinRatingSelect.value);
        showTab(activeTab);
      });
    } else {
      console.error('Missing minRatingSelect element');
    }

    // --- Add Prompt Button ---
    const addPromptButton = document.getElementById('add-prompt-button');
    if (addPromptButton) {
      addPromptButton.addEventListener('click', openDetachedAddPromptWindow);
    }

    // --- Add Prompt Form ---
    const addPromptForm = document.getElementById('add-prompt-form');
    if (addPromptForm) {
      addPromptForm.addEventListener('submit', handleAddPromptSubmit);

      // Cancel button
      const cancelAddPromptButton = document.getElementById('cancel-add-prompt');
      if (cancelAddPromptButton) {
        cancelAddPromptButton.addEventListener('click', () => {
          addPromptForm.reset();
          if (typeof lastActiveSectionShowFunction === 'function') {
            lastActiveSectionShowFunction();
          } else {
            showPromptList();
          }
        });
      }
    }

    // --- Prompt List Delegation ---
    const promptsList = document.getElementById('prompts-list');
    if (promptsList) {
      promptsList.addEventListener('click', handlePromptListClick);
    }

    // --- Prompt Details Section ---
    const promptDetailSection = document.getElementById('prompt-details-section');
    if (promptDetailSection) {
      // Back button
      const backBtn = promptDetailSection.querySelector('#back-to-list-button');
      if (backBtn) {
        backBtn.addEventListener('click', showPromptList);
      }

      // Copy button
      const copyBtn = promptDetailSection.querySelector('#copy-prompt-button');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const starRatingContainer = promptDetailSection.querySelector('#star-rating');
          if (starRatingContainer && starRatingContainer.dataset.id) {
            handleCopyPrompt(starRatingContainer.dataset.id);
          }
        });
      }
      
      const editBtn = promptDetailSection.querySelector('#edit-prompt-button');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          const starRatingContainer = promptDetailSection.querySelector('#star-rating');
          if (starRatingContainer && starRatingContainer.dataset.id) {
            openDetachedEditWindow(starRatingContainer.dataset.id);
          }
        });
      }

      // Favorite button
      promptDetailSection.addEventListener('click', event => {
        const fav = event.target.closest('#toggle-fav-detail');
        if (fav && fav.dataset.id) {
          handleToggleFavorite(fav.dataset.id);
        }
      });

      // Delete confirmation
      const deleteIcon = promptDetailSection.querySelector('#delete-prompt-icon');
      const deleteConfirm = promptDetailSection.querySelector('#delete-confirmation');
      const cancelDeleteBtn = promptDetailSection.querySelector('#cancel-delete-button');
      const confirmDeleteBtn = promptDetailSection.querySelector('#confirm-delete-button');

      if (deleteIcon) {
        deleteIcon.addEventListener('click', () => {
          if (deleteConfirm) deleteConfirm.classList.remove('hidden');
        });
      }

      if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
          if (deleteConfirm) deleteConfirm.classList.add('hidden');
        });
      }

      if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
          const starRatingContainer = promptDetailSection.querySelector('#star-rating');
          if (starRatingContainer && starRatingContainer.dataset.id) {
            handleDeletePrompt(starRatingContainer.dataset.id);
          }
        });
      }
    }
  };

  // --- Section Visibility Management ---

  /**
   * Show the prompt list section
   */
  const showPromptList = () => {
    const promptsListSection = document.getElementById('prompts-list');
    const promptDetailSection = document.getElementById('prompt-details-section');
    const addPromptSection = document.getElementById('add-prompt-section');
    const controlsEl = document.querySelector('.controls');
    const tabsEl = document.querySelector('.tabs');
    const bottomBar = document.querySelector('.bottom-bar');
    const addPromptBar = document.querySelector('.add-prompt-bar');

    if (promptsListSection) promptsListSection.classList.remove('hidden');
    if (promptDetailSection) promptDetailSection.classList.add('hidden');
    if (addPromptSection) addPromptSection.classList.add('hidden');

    // Show elements relevant to the prompt list view
    if (controlsEl) controlsEl.classList.remove('hidden');
    if (tabsEl) tabsEl.classList.remove('hidden');
    if (bottomBar) bottomBar.classList.remove('hidden');
    if (addPromptBar) addPromptBar.classList.remove('hidden');

    lastActiveSectionShowFunction = showPromptList;
  };

  /**
   * Show the prompt details section
   */
  const showPromptDetails = () => {
    const promptsListSection = document.getElementById('prompts-list');
    const promptDetailSection = document.getElementById('prompt-details-section');
    const addPromptSection = document.getElementById('add-prompt-section');
    const controlsEl = document.querySelector('.controls');
    const tabsEl = document.querySelector('.tabs');
    const bottomBar = document.querySelector('.bottom-bar');
    const addPromptBar = document.querySelector('.add-prompt-bar');

    if (promptsListSection) promptsListSection.classList.add('hidden');
    if (promptDetailSection) promptDetailSection.classList.remove('hidden');
    if (addPromptSection) addPromptSection.classList.add('hidden');

    // Show elements relevant to the prompt details view
    if (controlsEl) controlsEl.classList.remove('hidden');
    if (tabsEl) tabsEl.classList.remove('hidden');
    if (bottomBar) bottomBar.classList.remove('hidden');
    if (addPromptBar) addPromptBar.classList.remove('hidden');
  };

  /**
   * Show the add prompt section
   */
  const showAddPrompt = () => {
    const promptsListSection = document.getElementById('prompts-list');
    const promptDetailSection = document.getElementById('prompt-details-section');
    const addPromptSection = document.getElementById('add-prompt-section');
    const controlsEl = document.querySelector('.controls');
    const tabsEl = document.querySelector('.tabs');
    const bottomBar = document.querySelector('.bottom-bar');
    const addPromptBar = document.querySelector('.add-prompt-bar');

    if (promptsListSection) promptsListSection.classList.add('hidden');
    if (promptDetailSection) promptDetailSection.classList.add('hidden');
    if (addPromptSection) addPromptSection.classList.remove('hidden');

    // Hide elements not relevant to the add prompt form view
    if (controlsEl) controlsEl.classList.add('hidden');
    if (tabsEl) tabsEl.classList.add('hidden');
    if (bottomBar) bottomBar.classList.add('hidden');
    if (addPromptBar) addPromptBar.classList.add('hidden');
  };
  
  /**
   * Open a detached window for adding a new prompt
   * This allows users to keep the form open while browsing other pages
   */
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
          showAddPrompt();
        } else {
          console.log('Detached add prompt window opened successfully');
        }
      });
    } catch (error) {
      console.error('Failed to open detached window:', error);
      showAddPrompt();
    }
  };
  
  /**
   * Open a detached window for editing an existing prompt
   * This allows users to keep the form open while browsing other pages
   * @param {string} promptId - ID of the prompt to edit
   */
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

  /**
   * Show prompts for a specific tab
   * @param {string} which - Tab to show: 'all', 'favs', or 'private'
   */
  const showTab = which => {
    // Show the prompt list first
    showPromptList();
    activeTab = which;

    // Update tab state in UI
    const tabAll = document.getElementById('tab-all');
    const tabFavs = document.getElementById('tab-favs');
    const tabPrivate = document.getElementById('tab-private');

    if (tabAll) tabAll.classList.toggle('active', which === 'all');
    if (tabFavs) tabFavs.classList.toggle('active', which === 'favs');
    if (tabPrivate) tabPrivate.classList.toggle('active', which === 'private');

    // Get filter values
    const searchInput = document.getElementById('search-input');
    const minRatingSelect = document.getElementById('min-rating');

    const filters = {
      tab: which,
      searchTerm: searchInput ? searchInput.value : '',
      minRating: minRatingSelect ? parseInt(minRatingSelect.value) : 0,
    };

    // Filter and display prompts
    const filtered = PromptData.filterPrompts(allPrompts, filters);
    displayPrompts(filtered);
  };

  /**
   * Display a list of prompts
   * @param {Array} prompts - The prompts to display
   */
  const displayPrompts = prompts => {
    const promptsList = document.getElementById('prompts-list');
    if (!promptsList) return;

    // Sort alphabetically by title
    const sorted = [...prompts].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );

    promptsList.innerHTML = '';

    // Handle empty state
    if (sorted.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.classList.add('empty-state');
      emptyDiv.innerHTML = `<p>No prompts found. Try adjusting your filters or add new prompts.</p>`;
      promptsList.appendChild(emptyDiv);
      return;
    }

    // Create prompt cards
    sorted.forEach(prompt => {
      const div = document.createElement('div');
      div.classList.add('prompt-item');
      div.innerHTML = `
      <button class="toggle-favorite" data-id="${prompt.id}" aria-label="Toggle favorite">
        <i class="${prompt.favorites === 1 ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <h3>${prompt.title}</h3>
      <div class="tags">
        ${prompt.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="buttons">
        <button class="view-details" data-id="${prompt.id}">View Details</button>
        <button class="copy-prompt" data-id="${prompt.id}">Copy</button>
      </div>
    `;
      promptsList.appendChild(div);
    });
  };

  /**
   * Display details for a specific prompt
   * @param {Object} prompt - The prompt to display details for
   */
  const displayPromptDetails = prompt => {
    if (!prompt) return;

    // Show detail section
    showPromptDetails();
    lastActiveSectionShowFunction = () => displayPromptDetails(prompt);

    const promptDetailSection = document.getElementById('prompt-details-section');
    if (!promptDetailSection) return;

    // Update basic info
    const titleEl = promptDetailSection.querySelector('#prompt-detail-title');
    const textEl = promptDetailSection.querySelector('#prompt-detail-text');
    const categoryEl = promptDetailSection.querySelector('#prompt-detail-category');
    const tagsEl = promptDetailSection.querySelector('#prompt-detail-tags');

    if (titleEl) titleEl.textContent = prompt.title;
    if (textEl) textEl.textContent = prompt.text;
    if (categoryEl) categoryEl.textContent = prompt.category;
    if (tagsEl) tagsEl.textContent = prompt.tags.join(', ');

    // Update favorite button
    const favBtn = promptDetailSection.querySelector('#toggle-fav-detail');
    if (favBtn) {
      favBtn.dataset.id = prompt.id;
      const icon = favBtn.querySelector('i');
      if (icon) {
        icon.className = prompt.favorites === 1 ? 'fas fa-heart' : 'far fa-heart';
      }
    }

    // Update rating display
    const avgValueEl = promptDetailSection.querySelector('#average-rating-value');
    if (avgValueEl) {
      const avgRating = prompt.rating || 0;
      avgValueEl.textContent = `(${avgRating.toFixed(1)})`;
    }

    const countEl = promptDetailSection.querySelector('#rating-count');
    if (countEl) {
      const count = prompt.ratingCount || 0;
      countEl.textContent = `(${count} ${count === 1 ? 'rating' : 'ratings'})`;
    }

    // Update star rating
    const starRatingContainer = promptDetailSection.querySelector('#star-rating');
    if (starRatingContainer) {
      starRatingContainer.dataset.id = prompt.id;
      starRatingContainer.innerHTML = ''; // Clear existing stars

      const currentRating = Math.round(prompt.rating || 0);

      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('button');

        star.classList.add('star');
        star.dataset.value = i;
        star.setAttribute('role', 'radio');
        star.setAttribute('aria-checked', i <= currentRating ? 'true' : 'false');
        star.setAttribute('aria-label', `${i} star${i !== 1 ? 's' : ''}`);
        star.setAttribute('tabindex', '0');

        star.innerHTML =
          i <= currentRating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';

        if (i <= currentRating) star.classList.add('filled');

        // Add keyboard support
        star.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            star.click();
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            const nextStar = star.nextElementSibling;
            if (nextStar) nextStar.focus();
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            const prevStar = star.previousElementSibling;
            if (prevStar) prevStar.focus();
          }
        });

        // Add click handler
        star.addEventListener('click', async e => {
          e.stopPropagation();
          await handleRatePrompt(prompt.id, i);
        });

        starRatingContainer.appendChild(star);
      }
    }

    // Hide delete confirmation
    const deleteConfirm = promptDetailSection.querySelector('#delete-confirmation');
    if (deleteConfirm) {
      deleteConfirm.classList.add('hidden');
    }
  };

  /**
   * View details of a prompt by ID
   * @param {string} promptId - ID of the prompt to view
   */
  const viewPromptDetails = async promptId => {
    try {
      // Find the prompt using the proper namespace
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

  // --- Event Handlers ---

  /**
   * Handle clicks on the prompt list
   * @param {Event} event - The click event
   */
  const handlePromptListClick = async event => {
    // Handle favorite toggle
    const favoriteBtn = event.target.closest('.toggle-favorite');
    if (favoriteBtn && favoriteBtn.dataset.id) {
      event.preventDefault();
      event.stopPropagation();
      await handleToggleFavorite(favoriteBtn.dataset.id);
      return;
    }

    // Handle view details
    const viewDetailsBtn = event.target.closest('.view-details');
    if (viewDetailsBtn && viewDetailsBtn.dataset.id) {
      event.preventDefault();
      await viewPromptDetails(viewDetailsBtn.dataset.id);
      return;
    }

    // Handle copy prompt
    const copyBtn = event.target.closest('.copy-prompt');
    if (copyBtn && copyBtn.dataset.id) {
      event.preventDefault();
      await handleCopyPrompt(copyBtn.dataset.id);
      return;
    }
  };

  /**
   * Handle form submission for adding a new prompt
   * @param {Event} event - The submit event
   */
  const handleAddPromptSubmit = async event => {
    event.preventDefault();

    const titleInput = document.getElementById('prompt-title');
    const textInput = document.getElementById('prompt-text');
    const categoryInput = document.getElementById('prompt-category');
    const tagsInput = document.getElementById('prompt-tags');
    const privateCheckbox = document.getElementById('prompt-private');

    if (!titleInput || !textInput) {
      Utils.handleError('Form elements missing');
      return;
    }

    const title = titleInput.value;
    const text = textInput.value;

    if (!title || !text) {
      Utils.handleError('Please enter both a title and prompt text.');
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
      const newPrompt = await PromptData.addPrompt({
        title,
        text,
        category,
        tags,
        isPrivate,
      });

      // Update local state
      allPrompts = await PromptData.loadPrompts();

      // Reset form
      const form = document.getElementById('add-prompt-form');
      if (form) form.reset();

      // Show confirmation
      Utils.showConfirmationMessage('Prompt added successfully!', {
        withButton: true,
        timeout: 5000,
      });

      // Go back to list view
      showPromptList();
      showTab(activeTab);
    } catch (error) {
      Utils.handleError(`Failed to add prompt: ${error.message}`, {
        userVisible: true,
        originalError: error,
      });
    }
  };

  /**
   * Handle toggling a prompt's favorite status
   * @param {string} promptId - ID of the prompt
   */
  const handleToggleFavorite = async promptId => {
    try {
      const updatedPrompt = await PromptData.toggleFavorite(promptId);

      // Update in the local array
      const index = allPrompts.findIndex(p => p.id === promptId);
      if (index !== -1) {
        allPrompts[index] = updatedPrompt;
      }

      // Update UI based on current view
      if (document.getElementById('prompt-details-section').classList.contains('hidden')) {
        // In list view
        showTab(activeTab);
      } else {
        // In detail view
        displayPromptDetails(updatedPrompt);
      }

      // Show confirmation
      const actionText = updatedPrompt.favorites === 1 ? 'added to' : 'removed from';
      Utils.showConfirmationMessage(`Prompt ${actionText} favorites!`);
    } catch (error) {
      Utils.handleError('Failed to update favorite status', {
        userVisible: true,
        originalError: error,
      });
    }
  };

  /**
   * Handle rating a prompt
   * @param {string} promptId - ID of the prompt
   * @param {number} rating - Rating value (1-5)
   */
  const handleRatePrompt = async (promptId, rating) => {
    try {
      const starRatingContainer = document.querySelector('#star-rating');
      if (!starRatingContainer) return;

      // Immediate UI update
      Utils.highlightStars(rating, starRatingContainer);

      // Persist the rating
      const updatedPrompt = await PromptData.updatePromptRating(promptId, rating);

      // Update in local array
      const index = allPrompts.findIndex(p => p.id === promptId);
      if (index !== -1) {
        allPrompts[index] = updatedPrompt;
      }

      // Update rating count display
      const countEl = document.querySelector('#rating-count');
      if (countEl) {
        const count = updatedPrompt.ratingCount || 0;
        countEl.textContent = `(${count} ${count === 1 ? 'rating' : 'ratings'})`;
      }

      // Update average rating display
      const avgValueEl = document.querySelector('#average-rating-value');
      if (avgValueEl) {
        const avgRating = updatedPrompt.rating || 0;
        avgValueEl.textContent = `(${avgRating.toFixed(1)})`;
      }

      // Re-highlight stars to new average rating
      const newAverageRating = Math.round(updatedPrompt.rating || 0);
      Utils.highlightStars(newAverageRating, starRatingContainer);

      // Show confirmation
      Utils.showConfirmationMessage(`Rated ${rating} stars!`);
    } catch (error) {
      Utils.handleError('Failed to update rating', {
        userVisible: true,
        originalError: error,
      });

      // Ensure UI is consistent with stored data
      try {
        const currentPrompt = await PromptData.findPromptById(promptId, allPrompts);
        if (currentPrompt) {
          const currentRating = Math.round(currentPrompt.rating || 0);
          const starRatingContainer = document.querySelector('#star-rating');
          Utils.highlightStars(currentRating, starRatingContainer);
        }
      } catch (e) {
        // Ignore secondary errors
      }
    }
  };

  /**
   * Handle copying a prompt to the clipboard
   * @param {string} promptId - ID of the prompt to copy
   */
  const handleCopyPrompt = async promptId => {
    try {
      const success = await PromptData.copyPromptToClipboard(promptId);
      if (success) {
        Utils.showConfirmationMessage('Prompt copied to clipboard!');
      }
    } catch (error) {
      Utils.handleError('Failed to copy prompt', {
        userVisible: true,
        originalError: error,
      });
    }
  };

  /**
   * Handle deleting a prompt
   * @param {string} promptId - ID of the prompt to delete
   */
  const handleDeletePrompt = async promptId => {
    try {
      const success = await PromptData.deletePrompt(promptId);
      if (success) {
        // Update local state
        allPrompts = allPrompts.filter(p => p.id !== promptId);

        // Show confirmation and go back to list
        Utils.showConfirmationMessage('Prompt deleted successfully!');
        showPromptList();
        showTab(activeTab);
      }
    } catch (error) {
      Utils.handleError('Failed to delete prompt', {
        userVisible: true,
        originalError: error,
      });
    }
  };

  // Return public API
  return {
    initializeUI,
    showPromptList,
    showPromptDetails,
    showAddPrompt,
    openDetachedAddPromptWindow,
    openDetachedEditWindow,
    showTab,
    displayPromptDetails,
    viewPromptDetails,
  };
})();
