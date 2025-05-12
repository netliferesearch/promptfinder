// popup.js

document.addEventListener('DOMContentLoaded', () => {
  // Initialize using our modular structure
  window.PromptFinder.UI.initializeUI();

  // Legacy code below - being gradually migrated to the modular structure
  // All section visibility management functions have been moved to UI module

  // References to UI module functions for legacy code
  const UI = window.PromptFinder.UI;

  // DOM element references - many of these will be moved to the UI module
  const promptsListSection = document.getElementById('prompts-list');
  let allPrompts = [];
  let activeTab = 'all';
  const promptDetailSection = document.getElementById('prompt-details-section');
  const addPromptButton = document.getElementById('add-prompt-button'); // Main button in bottom-bar
  const addPromptSection = document.getElementById('add-prompt-section');
  const addPromptForm = document.getElementById('add-prompt-form');
  const promptsList = document.getElementById('prompts-list');
  const confirmationMessage = document.getElementById('confirmation-message');
  const searchInput = document.getElementById('search-input'); // Inside .controls
  const errorMessage = document.getElementById('error-message');

  // Ensure these selectors are correct and target the intended elements
  const tabsEl = document.querySelector('.tabs');
  const controlsEl = document.querySelector('.controls');
  const bottomBar = document.querySelector('.bottom-bar'); // Bar with main "Add Prompt" button
  const addPromptBar = document.querySelector('.add-prompt-bar'); // New add prompt button container
  const ratingFilterPanel = document.getElementById('rating-filter');
  const minRatingSelect = document.getElementById('min-rating');
  const filterButton = document.getElementById('filter-button');

  /* Section Visibility Management has been moved to UI module
     Use these functions from the UI module instead:
     - UI.showPromptList()
     - UI.showPromptDetails() 
     - UI.showAddPrompt()
  */

  // --- Using Utils module for error handling ---
  const Utils = window.PromptFinder.Utils;
  const PromptData = window.PromptFinder.PromptData;

  // Note: handleError function has been moved to the Utils module
  // Use Utils.handleError() instead throughout the code

  const updatePromptInStorage = async (promptId, updates) => {
    try {
      const promptIndex = allPrompts.findIndex(p => p.id === promptId);
      if (promptIndex === -1) {
        throw new Error(`Prompt with ID ${promptId} not found in collection`);
      }

      const old = allPrompts[promptIndex];
      // updates.rating is the value of the star clicked (e.g., 4)
      const newRatingValue = updates.rating || 0;

      const newCount = (old.ratingCount || 0) + 1;
      const newSum = (old.ratingSum || 0) + newRatingValue;
      const newAvg = newSum / newCount;

      allPrompts[promptIndex] = {
        ...old,
        ratingSum: newSum,
        ratingCount: newCount,
        rating: newAvg, // Store the calculated average rating
      };

      // Save to storage
      await Utils.chromeStorageSet({ prompts: allPrompts });

      // Return the updated prompt
      return allPrompts[promptIndex];
    } catch (error) {
      Utils.handleError(`Error updating prompt rating`, {
        userVisible: true,
        originalError: error,
      });
      // Re-throw to allow the calling function to handle the error if needed
      throw error;
    }
  };

  const findPromptById = promptId => {
    return allPrompts.find(prompt => prompt.id === promptId);
  };

  // --- Display Functions ---

  const displayPrompts = prompts => {
    // sort alphabetically by title
    const sorted = [...prompts].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );
    promptsList.innerHTML = '';
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

  // Using the UI module's implementation
  const displayPromptDetails = prompt => {
    // Just a wrapper around the UI module implementation
    UI.displayPromptDetails(prompt);
    lastActiveSectionShowFunction = () => displayPromptDetails(prompt); // Update last active function

    const titleEl = promptDetailSection.querySelector('#prompt-detail-title');
    if (titleEl) titleEl.textContent = prompt.title;
    // set the favorite button's target promptId and update heart icon state
    const favBtn = promptDetailSection.querySelector('#toggle-fav-detail');
    if (favBtn) {
      favBtn.dataset.id = prompt.id;
      const icon = favBtn.querySelector('i');
      if (icon) {
        icon.className = prompt.favorites === 1 ? 'fas fa-heart' : 'far fa-heart';
      }
    }
    const textEl = promptDetailSection.querySelector('#prompt-detail-text');
    if (textEl) textEl.textContent = prompt.text;
    const categoryEl = promptDetailSection.querySelector('#prompt-detail-category');
    if (categoryEl) categoryEl.textContent = prompt.category;
    const tagsEl = promptDetailSection.querySelector('#prompt-detail-tags');
    if (tagsEl) tagsEl.textContent = prompt.tags.join(', ');

    // Update the average rating value and the rating count display (Initial display)
    const avgValueEl = promptDetailSection.querySelector('#average-rating-value');
    if (avgValueEl) {
      const avgRating = prompt.rating || 0; // This is the calculated average
      avgValueEl.textContent = `(${avgRating.toFixed(1)})`;
    }

    const countEl = promptDetailSection.querySelector('#rating-count');
    if (countEl) {
      const count = prompt.ratingCount || 0;
      countEl.textContent = `(${count} ${count === 1 ? 'rating' : 'ratings'})`;
    }

    // Rebuild the star container and attach per-star click handlers
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
        star.setAttribute('tabindex', '0'); // Make focusable with keyboard
        star.innerHTML =
          i <= currentRating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        if (i <= currentRating) star.classList.add('filled');

        // Add keyboard support
        star.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            // Enter or Space key
            e.preventDefault();
            star.click(); // Trigger the click handler
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

        star.addEventListener('click', async e => {
          e.stopPropagation();
          const clickedStarValue = i; // The value of the star that was clicked (1-5)

          if (typeof prompt.id === 'undefined') {
            Utils.handleError('Internal error: Prompt ID missing for rating.', {
              type: 'error',
              userVisible: true,
            });
            return;
          }

          try {
            // 1. Immediate UI update to reflect the click
            Utils.highlightStars(clickedStarValue, starRatingContainer);

            // 2. Persist the rating. updatePromptInStorage will calculate and store the new average.
            const updatedPrompt = await updatePromptInStorage(prompt.id, {
              rating: clickedStarValue,
            });

            // 3. Update the rating count display with the new count and format
            const countEl = promptDetailSection.querySelector('#rating-count');
            if (countEl) {
              const count = updatedPrompt.ratingCount || 0;
              countEl.textContent = `(${count} ${count === 1 ? 'rating' : 'ratings'})`;
            }

            // 4. Update the average rating value display
            const avgValueEl = promptDetailSection.querySelector('#average-rating-value');
            if (avgValueEl) {
              const avgRating = updatedPrompt.rating || 0;
              avgValueEl.textContent = `(${avgRating.toFixed(1)})`;
            }

            // 5. Re-highlight stars to the new *average* rating.
            const newAverageRating = Math.round(updatedPrompt.rating || 0);
            Utils.highlightStars(newAverageRating, starRatingContainer);

            // 6. Show confirmation message
            if (confirmationMessage) {
              confirmationMessage.classList.remove('hidden');
              confirmationMessage.innerHTML = `Rated ${clickedStarValue} stars!`;
              confirmationMessage.style.display = 'block';

              setTimeout(() => {
                confirmationMessage.style.display = 'none';
                confirmationMessage.classList.add('hidden');
              }, 5000);
            }
          } catch (error) {
            // Error is already handled in updatePromptInStorage
            // Just ensure UI is consistent with the stored data
            const currentPrompt = findPromptById(prompt.id);
            if (currentPrompt) {
              const currentRating = Math.round(currentPrompt.rating || 0);
              Utils.highlightStars(currentRating, starRatingContainer);
            }
          }
        });
        starRatingContainer.appendChild(star);
      }
    }

    // Now wire up the back & copy buttons directly
    const backBtn = promptDetailSection.querySelector('#back-to-list-button');
    if (backBtn) backBtn.addEventListener('click', UI.showPromptList);

    const copyBtn = promptDetailSection.querySelector('#copy-prompt-button');
    if (copyBtn)
      copyBtn.addEventListener('click', () => {
        copyPrompt(prompt.id);
      });

    // Hide confirmation by default
    const deleteConfirm = promptDetailSection.querySelector('#delete-confirmation');
    if (deleteConfirm) deleteConfirm.classList.add('hidden');

    // Wire delete icon
    const deleteIcon = promptDetailSection.querySelector('#delete-prompt-icon');
    if (deleteIcon) {
      deleteIcon.addEventListener('click', () => {
        if (deleteConfirm) deleteConfirm.classList.remove('hidden');
      });
    }
    // Wire cancel
    const cancelBtn = promptDetailSection.querySelector('#cancel-delete-button');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (deleteConfirm) deleteConfirm.classList.add('hidden');
      });
    }
    // Wire confirm
    const confirmBtn = promptDetailSection.querySelector('#confirm-delete-button');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        deletePrompt(prompt.id);
      });
    }
  };

  // Delegate detail-view favorite toggles
  promptDetailSection.addEventListener('click', event => {
    const fav = event.target.closest('#toggle-fav-detail');
    if (fav && fav.dataset.id) {
      toggleFavorite(fav.dataset.id);
    }
  });
  // --- Event Handling ---

  // Event listener for the "Add New Prompt" button
  if (addPromptButton) {
    addPromptButton.addEventListener('click', UI.showAddPrompt);
  }

  // Event listener for adding a new prompt
  if (addPromptForm) {
    addPromptForm.addEventListener('submit', event => {
      event.preventDefault();

      const title = document.getElementById('prompt-title').value;
      const text = document.getElementById('prompt-text').value;

      if (!title || !text) {
        Utils.handleError('Please enter both a title and prompt text.');
        return;
      }

      //   const category = document.getElementById("prompt-category").value;
      //    const tags = document
      //  .getElementById("prompt-tags")
      //    .value.split(",")
      //      .map((tag) => tag.trim())
      //        .filter((tag) => tag !== ""); // Filter out empty tags
      // Safely grab category & tags only if those inputs exist
      const categoryInput = document.getElementById('prompt-category');
      const tagsInput = document.getElementById('prompt-tags');
      const category = categoryInput ? categoryInput.value : '';
      const tags = tagsInput
        ? tagsInput.value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '')
        : [];
      const isPrivate = document.getElementById('prompt-private').checked;

      const newPrompt = {
        id: Date.now().toString(),
        title: title,
        text: text,
        category: category,
        tags: tags,
        isPrivate: isPrivate,
        rating: 0, // current average / last‐click value
        ratingCount: 0, // number of times rated
        ratingSum: 0, // total of all individual ratings
        favorites: 0,
        dateAdded: new Date().toISOString(),
      };

      allPrompts.push(newPrompt);
      Utils.chromeStorageSet({ prompts: allPrompts })
        .then(() => {
          // Show confirmation with a View Prompt button
          if (confirmationMessage) {
            confirmationMessage.classList.remove('hidden'); // ensure it's visible
            confirmationMessage.innerHTML =
              'Prompt added successfully! <button id="view-new-prompt-button">View Prompt</button>';
            confirmationMessage.style.display = 'block';
            const btn = document.getElementById('view-new-prompt-button');
            if (btn) {
              btn.addEventListener('click', () => {
                confirmationMessage.style.display = 'none';
                viewPromptDetails(newPrompt.id);
              });
            }
          }
          // Ensure list remains visible and UI elements are correctly shown/hidden
          UI.showPromptList(); // This will also make search, tabs, and controls visible
          addPromptForm.reset();
        })
        .catch(error => {
          Utils.handleError(`Error setting prompts after adding new: ${error.message}`);
        });
    });

    // Event listener for the cancel button in the add prompt form
    const cancelAddPromptButton = document.getElementById('cancel-add-prompt');
    if (cancelAddPromptButton) {
      cancelAddPromptButton.addEventListener('click', () => {
        addPromptForm.reset();
        if (typeof lastActiveSectionShowFunction === 'function') {
          lastActiveSectionShowFunction(); // This should call showPromptList or showPromptDetails
        } else {
          UI.showPromptList(); // Default to showing the list
        }
        // The called function (showPromptList/showPromptDetails) handles visibility of tabs/controls.
      });
    }
  }

  // Add event listeners for filtering

  // Search input event listener is now handled in the UI module

  // Add event listener for filter button
  if (filterButton) {
    filterButton.addEventListener('click', () => {
      // Toggle filter panel visibility
      if (ratingFilterPanel) {
        ratingFilterPanel.classList.toggle('hidden');

        // Update button appearance based on filter panel visibility
        filterButton.classList.toggle('active', !ratingFilterPanel.classList.contains('hidden'));
      }
    });
  }

  // Add event listener for minimum rating select
  if (minRatingSelect) {
    minRatingSelect.addEventListener('change', () => {
      // Re-apply current tab filter with the new rating filter
      UI.showTab(activeTab);
    });
  }

  // Event delegation for the prompts list section
  if (promptsList) {
    promptsList.addEventListener('click', event => {
      // 1) toggle favorite from list
      const favBtn = event.target.closest('.toggle-favorite');
      if (favBtn) {
        toggleFavorite(favBtn.dataset.id);
        return;
      }
      const target = event.target;
      const promptId = target.dataset.id;

      if (target.classList.contains('copy-prompt')) {
        copyPrompt(promptId);
      } else if (target.classList.contains('view-details')) {
        viewPromptDetails(promptId);
      }
    });
  }

  // --- Star Rating Event Handling (Mouseover/Mouseout) ---
  // Using event delegation on the promptDetailSection

  if (promptDetailSection) {
    promptDetailSection.addEventListener('mouseover', event => {
      const targetStar = event.target.closest('.star'); // Use closest to handle clicks on the i tag inside span
      if (targetStar) {
        const starRatingContainer = targetStar.closest('#star-rating');
        if (starRatingContainer) {
          const value = parseInt(targetStar.dataset.value);
          Utils.highlightStars(value, starRatingContainer);
        }
      }
    });

    promptDetailSection.addEventListener('mouseout', event => {
      const relatedTarget = event.relatedTarget;
      const starRatingContainer = promptDetailSection.querySelector('#star-rating');
      // Check if the mouse is moving out of the star rating container completely
      if (starRatingContainer && (!relatedTarget || !starRatingContainer.contains(relatedTarget))) {
        // Reset stars to the current saved rating when mouse leaves the container
        const promptId = starRatingContainer.dataset.id;
        const prompt = findPromptById(promptId);
        if (prompt && prompt.rating) {
          Utils.highlightStars(prompt.rating, starRatingContainer);
        } else {
          Utils.highlightStars(0, starRatingContainer); // Or clear all if no rating
        }
      }
    });
  }

  // Note: highlightStars has been moved to the Utils module
  // Use Utils.highlightStars() instead
  // --- End Star Rating Event Handling ---

  // Function to copy prompt text
  const copyPrompt = promptId => {
    Utils.chromeStorageGet('prompts')
      .then(data => {
        const prompts = data.prompts || [];
        const prompt = prompts.find(p => p.id === promptId);
        if (prompt && navigator.clipboard) {
          navigator.clipboard
            .writeText(prompt.text)
            .then(() => {
              Utils.showConfirmationMessage('Prompt copied!');
            })
            .catch(err => {
              console.error('Failed to copy prompt: ', err);
            });
        }
      })
      .catch(error => {
        Utils.handleError(`Error getting prompt for copy: ${error.message}`);
      });
  };

  // Toggle favorite on a prompt (simple on/off)
  const toggleFavorite = promptId => {
    const idx = allPrompts.findIndex(p => p.id === promptId);
    if (idx === -1) return;
    const wasFav = allPrompts[idx].favorites === 1;
    allPrompts[idx].favorites = wasFav ? 0 : 1;

    Utils.chromeStorageSet({ prompts: allPrompts })
      .then(() => {
        Utils.showConfirmationMessage(wasFav ? 'Removed favorite' : 'Added favorite');
        // Re-render list according to active tab
        UI.showTab(activeTab);
        // Refresh detail if open
        const current = findPromptById(promptId);
        if (current && !promptsListSection.classList.contains('hidden')) {
          // list is visible; already updated
        } else if (current) {
          UI.displayPromptDetails(current);
        }
      })
      .catch(error => {
        Utils.handleError(`Error updating favorite: ${error.message}`);
      });
  };

  const deletePrompt = promptId => {
    allPrompts = allPrompts.filter(p => p.id !== promptId);

    Utils.chromeStorageSet({ prompts: allPrompts })
      .then(() => {
        Utils.showConfirmationMessage('Prompt deleted.');
        UI.displayPrompts(allPrompts);
        UI.showPromptList();
      })
      .catch(error => {
        Utils.handleError(`Error deleting prompt: ${error.message}`);
      });
  };

  // Legacy filter function for backward compatibility
  const filterPrompts = (searchTerm, prompts) => {
    if (!searchTerm) {
      return prompts;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return prompts.filter(
      prompt =>
        prompt.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        prompt.text.toLowerCase().includes(lowerCaseSearchTerm) ||
        prompt.category.toLowerCase().includes(lowerCaseSearchTerm) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm))
    );
  };

  // View a specific prompt's details

  const viewPromptDetails = promptId => {
    const prompt = findPromptById(promptId);
    if (prompt) {
      UI.displayPromptDetails(prompt);
    } else {
      Utils.handleError(`Prompt with ID ${promptId} not found.`);
    }
  };

  // Note: showConfirmationMessage has been moved to the Utils module
  // Use Utils.showConfirmationMessage() instead

  // Load prompts when the popup is opened
  const loadAndDisplayPrompts = async () => {
    try {
      const data = await Utils.chromeStorageGet('prompts');
      allPrompts = data.prompts || [];
      UI.showTab(activeTab); // Initial display based on active tab
    } catch (error) {
      Utils.handleError(`Error loading prompts`, {
        userVisible: true,
        originalError: error,
        timeout: 7000,
      });
    }
  };

  // Tab switching: All vs. Favorites vs. Private
  const tabAll = document.getElementById('tab-all');
  const tabFavs = document.getElementById('tab-favs');
  const tabPrivate = document.getElementById('tab-private');

  function showTab(which) {
    // Using the UI module's implementation
    UI.showTab(which);
    activeTab = which; // Keep the activeTab state in sync
    // This function now just delegates to the UI module
  }

  // Tab event listeners are now handled in the UI module

  loadAndDisplayPrompts(); // Initial load when popup opens
}); // End of DOMContentLoaded listener

// Temporary test listener outside DOMContentLoaded
document.body.addEventListener('click', function (event) {
  if (event.target.tagName === 'I' && event.target.classList.contains('fa')) {
    console.log('Direct click on FA i tag detected!', event.target);
  }
});

// --- All Chrome API Helpers and Data Storage Functions ---
// Have been moved to the Utils and PromptData modules
