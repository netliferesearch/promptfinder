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

  // --- Firebase Authentication Functions ---

  /**
   * Signs up a new user with email and password.
   * @param {string} email - User's email.
   * @param {string} password - User's password.
   * @returns {Promise<firebase.auth.UserCredential | Error>} Firebase user credential or Error object on failure.
   */
  const signupUser = async (email, password) => {
    if (!window.firebaseAuth) {
      const err = new Error('Firebase Auth not initialized.');
      Utils.handleError(err.message, { userVisible: true, originalError: err });
      return err;
    }
    try {
      const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
      console.log("User signed up:", userCredential.user);
      return userCredential;
    } catch (error) {
      Utils.handleError(`Signup error: ${error.message}`, { userVisible: true, originalError: error });
      return error; // Return the error object
    }
  };

  /**
   * Logs in an existing user with email and password.
   * @param {string} email - User's email.
   * @param {string} password - User's password.
   * @returns {Promise<firebase.auth.UserCredential | Error>} Firebase user credential or Error object on failure.
   */
  const loginUser = async (email, password) => {
    if (!window.firebaseAuth) {
      const err = new Error('Firebase Auth not initialized.');
      Utils.handleError(err.message, { userVisible: true, originalError: err });
      return err;
    }
    try {
      const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
      console.log("User logged in:", userCredential.user);
      return userCredential;
    } catch (error) {
      Utils.handleError(`Login error: ${error.message}`, { userVisible: true, originalError: error });
      return error; // Return the error object
    }
  };

  /**
   * Logs out the current user.
   * @returns {Promise<boolean>} True if logout was successful, false otherwise.
   */
  const logoutUser = async () => {
    if (!window.firebaseAuth) {
      Utils.handleError('Firebase Auth not initialized.', { userVisible: true });
      return false;
    }
    try {
      await window.firebaseAuth.signOut();
      console.log("User logged out");
      return true;
    } catch (error) {
      Utils.handleError(`Logout error: ${error.message}`, { userVisible: true, originalError: error });
      return false;
    }
  };

  /**
   * Sets up an observer for Firebase authentication state changes.
   * @param {function} callback - Function to call with the user object (or null) when auth state changes.
   * @returns {function} Unsubscribe function from Firebase.
   */
  const onAuthStateChanged = (callback) => {
    if (!window.firebaseAuth) {
      Utils.handleError('Firebase Auth not initialized.', { userVisible: false });
      callback(null);
      return () => {}; 
    }
    return window.firebaseAuth.onAuthStateChanged(callback);
  };

  // --- Existing Prompt Functions (will be refactored for Firebase later) ---
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
      return []; 
    }
  };
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
      throw error; 
    }
  };
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
      throw error; 
    }
  };
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
        rating: newAvg, 
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
  const findPromptById = async (promptId, prompts = null, options = {}) => {
    const { throwIfNotFound = false, handleError = false } = options;
    if (!promptId) return Promise.resolve(null);
    try {
      let prompt = null;
      if (prompts) {
        prompt = prompts.find(p => p.id === promptId) || null;
      } else {
        const allPrompts = await loadPrompts();
        prompt = allPrompts.find(p => p.id === promptId) || null;
      }
      if (!prompt && throwIfNotFound) {
        throw new Error(`Prompt with ID ${promptId} not found`);
      }
      return prompt;
    } catch (error) {
      if (handleError) {
        Utils.handleError(`Error retrieving prompt`, {
          userVisible: true,
          originalError: error,
        });
      }
      return null;
    }
  };
  const filterPrompts = (prompts, filters) => {
    let result = [...prompts];
    if (filters.tab === 'favs') {
      result = result.filter(p => p.favorites === 1);
    } else if (filters.tab === 'private') {
      result = result.filter(p => p.isPrivate);
    }
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
    if (filters.minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= filters.minRating);
    }
    return result;
  };

  return {
    signupUser,
    loginUser,
    logoutUser,
    onAuthStateChanged,
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
