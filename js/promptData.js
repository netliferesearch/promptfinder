/**
 * PromptFinder Extension - Prompt Data Operations
 * Contains functions for managing prompts data (CRUD operations).
 * Using namespace pattern for Chrome extension compatibility.
 */

// Extend the namespace
window.PromptFinder = window.PromptFinder || {};

// Prompt Data module
window.PromptFinder.PromptData = (function () {
  // Private reference to Utils namespace
  const Utils = window.PromptFinder.Utils;

  /**
   * Load all prompts from storage
   * @returns {Promise<Array>} Array of prompt objects
   */
  const loadPrompts = async () => {
    try {
      const data = await Utils.chromeStorageGet('prompts');
      return data.prompts || [];
    } catch (error) {
      Utils.handleError(`Error loading prompts`, {
        userVisible: true,
        originalError: error,
        timeout: 7000,
      });
      return []; // Return empty array on error
    }
  };

  /**
   * Save all prompts to storage
   * @param {Array} prompts Array of prompt objects to save
   * @returns {Promise<void>}
   */
  const savePrompts = async prompts => {
    try {
      await Utils.chromeStorageSet({ prompts });
      return true;
    } catch (error) {
      Utils.handleError(`Error saving prompts`, {
        userVisible: true,
        originalError: error,
      });
      return false;
    }
  };

  /**
   * Create a new prompt
   * @param {Object} promptData Prompt data object
   * @returns {Object} The newly created prompt object
   */
  const createPrompt = promptData => {
    return {
      id: Date.now().toString(),
      title: promptData.title || '',
      text: promptData.text || '',
      category: promptData.category || '',
      tags: promptData.tags || [],
      isPrivate: !!promptData.isPrivate,
      rating: 0,
      ratingCount: 0,
      ratingSum: 0,
      favorites: 0,
      dateAdded: new Date().toISOString(),
    };
  };

  /**
   * Add a prompt to storage
   * @param {Object} promptData Prompt data to add
   * @returns {Promise<Object>} The added prompt
   */
  const addPrompt = async promptData => {
    try {
      const allPrompts = await loadPrompts();
      const newPrompt = createPrompt(promptData);

      allPrompts.push(newPrompt);
      await savePrompts(allPrompts);

      return newPrompt;
    } catch (error) {
      Utils.handleError(`Error adding prompt`, {
        userVisible: true,
        originalError: error,
      });
      throw error; // Re-throw to allow handling upstream
    }
  };

  /**
   * Update an existing prompt
   * @param {string} promptId ID of the prompt to update
   * @param {Object} updates Object containing the fields to update
   * @returns {Promise<Object>} The updated prompt
   */
  const updatePrompt = async (promptId, updates) => {
    try {
      const allPrompts = await loadPrompts();
      const promptIndex = allPrompts.findIndex(p => p.id === promptId);

      if (promptIndex === -1) {
        throw new Error(`Prompt with ID ${promptId} not found`);
      }

      allPrompts[promptIndex] = {
        ...allPrompts[promptIndex],
        ...updates,
      };

      await savePrompts(allPrompts);
      return allPrompts[promptIndex];
    } catch (error) {
      Utils.handleError(`Error updating prompt`, {
        userVisible: true,
        originalError: error,
      });
      throw error; // Re-throw to allow handling upstream
    }
  };

  /**
   * Delete a prompt
   * @param {string} promptId ID of the prompt to delete
   * @returns {Promise<boolean>} Success status
   */
  const deletePrompt = async promptId => {
    try {
      const allPrompts = await loadPrompts();
      const updatedPrompts = allPrompts.filter(p => p.id !== promptId);

      if (updatedPrompts.length === allPrompts.length) {
        throw new Error(`Prompt with ID ${promptId} not found`);
      }

      await savePrompts(updatedPrompts);
      return true;
    } catch (error) {
      Utils.handleError(`Error deleting prompt`, {
        userVisible: true,
        originalError: error,
      });
      return false;
    }
  };

  /**
   * Update a prompt's rating
   * @param {string} promptId ID of the prompt to rate
   * @param {number} rating New rating value to add (1-5)
   * @returns {Promise<Object>} The updated prompt with new average rating
   */
  const updatePromptRating = async (promptId, rating) => {
    try {
      const allPrompts = await loadPrompts();
      const promptIndex = allPrompts.findIndex(p => p.id === promptId);

      if (promptIndex === -1) {
        throw new Error(`Prompt with ID ${promptId} not found in collection`);
      }

      const old = allPrompts[promptIndex];
      const newCount = (old.ratingCount || 0) + 1;
      const newSum = (old.ratingSum || 0) + rating;
      const newAvg = newSum / newCount;

      allPrompts[promptIndex] = {
        ...old,
        ratingSum: newSum,
        ratingCount: newCount,
        rating: newAvg, // Store the calculated average rating
      };

      await savePrompts(allPrompts);
      return allPrompts[promptIndex];
    } catch (error) {
      Utils.handleError(`Error updating prompt rating`, {
        userVisible: true,
        originalError: error,
      });
      throw error;
    }
  };

  /**
   * Toggle favorite status for a prompt
   * @param {string} promptId ID of the prompt to toggle favorite status
   * @returns {Promise<Object>} The updated prompt
   */
  const toggleFavorite = async promptId => {
    try {
      const allPrompts = await loadPrompts();
      const promptIndex = allPrompts.findIndex(p => p.id === promptId);

      if (promptIndex === -1) {
        throw new Error(`Prompt with ID ${promptId} not found in collection`);
      }

      const wasFavorite = allPrompts[promptIndex].favorites === 1;
      allPrompts[promptIndex].favorites = wasFavorite ? 0 : 1;

      await savePrompts(allPrompts);
      return allPrompts[promptIndex];
    } catch (error) {
      Utils.handleError(`Error toggling favorite status`, {
        userVisible: true,
        originalError: error,
      });
      throw error;
    }
  };

  /**
   * Copy a prompt to clipboard
   * @param {string} promptId ID of the prompt to copy
   * @returns {Promise<boolean>} Success status
   */
  const copyPromptToClipboard = async promptId => {
    try {
      const allPrompts = await loadPrompts();
      const prompt = allPrompts.find(p => p.id === promptId);

      if (!prompt) {
        throw new Error(`Prompt with ID ${promptId} not found`);
      }

      await navigator.clipboard.writeText(prompt.text);
      return true;
    } catch (error) {
      Utils.handleError(`Error copying to clipboard: ${error.message}`, {
        userVisible: true,
        originalError: error,
      });
      return false;
    }
  };

  /**
   * Get a prompt by ID
   * @param {string} promptId ID of the prompt to find
   * @returns {Promise<Object|null>} The found prompt or null
   */
  const getPromptById = async promptId => {
    try {
      const allPrompts = await loadPrompts();
      const prompt = allPrompts.find(p => p.id === promptId);

      if (!prompt) {
        throw new Error(`Prompt with ID ${promptId} not found`);
      }

      return prompt;
    } catch (error) {
      Utils.handleError(`Error retrieving prompt`, {
        userVisible: true,
        originalError: error,
      });
      return null;
    }
  };

  /**
   * Find a prompt by ID
   * @param {string} promptId ID of the prompt to find
   * @param {Array} [prompts] Optional array of prompts to search in
   * @returns {Object|null} The found prompt or null
   */
  const findPromptById = (promptId, prompts = null) => {
    if (!promptId) return null;

    if (prompts) {
      return prompts.find(p => p.id === promptId) || null;
    }

    // If prompts not provided, load from storage
    return loadPrompts()
      .then(allPrompts => allPrompts.find(p => p.id === promptId) || null)
      .catch(() => null);
  };

  /**
   * Filter prompts based on criteria
   * @param {Array} prompts Array of prompts to filter
   * @param {Object} filters Filter criteria
   * @param {string} [filters.searchTerm] Text to search for in title, text, category, tags
   * @param {string} [filters.tab] Tab filter: 'all', 'favs', or 'private'
   * @param {number} [filters.minRating] Minimum rating filter
   * @returns {Array} Filtered prompts
   */
  const filterPrompts = (prompts, filters) => {
    let result = [...prompts];

    // Apply tab filter
    if (filters.tab === 'favs') {
      result = result.filter(p => p.favorites === 1);
    } else if (filters.tab === 'private') {
      result = result.filter(p => p.isPrivate);
    }

    // Apply search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        p =>
          p.title.toLowerCase().includes(term) ||
          p.text.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= filters.minRating);
    }

    return result;
  };

  // Return public API
  return {
    loadPrompts,
    savePrompts,
    createPrompt,
    addPrompt,
    updatePrompt,
    deletePrompt,
    updatePromptRating,
    toggleFavorite,
    copyPromptToClipboard,
    findPromptById,
    filterPrompts,
  };
})();
