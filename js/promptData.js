/**
 * PromptFinder Extension - Prompt Data Operations
 * Contains functions for managing prompts data (CRUD operations).
 */

window.PromptFinder = window.PromptFinder || {};

window.PromptFinder.PromptData = (function () {
  const Utils = window.PromptFinder.Utils;
  
  // --- Firebase Authentication Functions (already implemented) ---
  const signupUser = async (email, password) => {
    if (!window.firebaseAuth) {
      const err = new Error('Firebase Auth not initialized.');
      Utils.handleError(err.message, { userVisible: true, originalError: err });
      return err;
    }
    try {
      const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
      console.log("User signed up:", userCredential.user);
      // TODO: Create a user document in Firestore 'users' collection here
      return userCredential;
    } catch (error) {
      Utils.handleError(`Signup error: ${error.message}`, { userVisible: true, originalError: error });
      return error;
    }
  };

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
      return error;
    }
  };

  const signInWithGoogle = async () => {
    if (!window.firebaseAuth || !window.firebase || !window.firebase.auth || !window.firebase.auth.GoogleAuthProvider) {
      const err = new Error('Firebase Auth or GoogleAuthProvider not initialized.');
      Utils.handleError(err.message, { userVisible: true, originalError: err });
      return err;
    }
    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      const message = 'Google Sign-In with popup requires an Offscreen Document in Manifest V3. This feature is not fully implemented yet.';
      alert(message);
      console.warn(message);
      const err = new Error(message);
      Utils.displayAuthError(message, document.getElementById('auth-error-message'));
      return err;
    } catch (error) {
      Utils.handleError(`Google Sign-In error: ${error.message}`, { userVisible: true, originalError: error });
      return error;
    }
  };

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

  const onAuthStateChanged = (callback) => {
    if (!window.firebaseAuth) {
      Utils.handleError('Firebase Auth not initialized.', { userVisible: false });
      callback(null);
      return () => {}; 
    }
    return window.firebaseAuth.onAuthStateChanged(callback);
  };

  // --- Prompt Functions (Refactored for Firebase Firestore) ---

  /**
   * Add a prompt to Firestore.
   * User must be logged in.
   * @param {Object} promptData - Data for the new prompt (title, text, category, tags, isPrivate, targetAiTools).
   * @returns {Promise<Object | null>} The added prompt data (with ID) or null on error.
   */
  const addPrompt = async (promptData) => {
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
    const db = window.firebaseDb;

    if (!currentUser) {
      Utils.handleError("User must be logged in to add a prompt.", { userVisible: true });
      return null;
    }
    if (!db) {
      Utils.handleError("Firestore not initialized.", { userVisible: true });
      return null;
    }

    try {
      const newPromptDoc = {
        userId: currentUser.uid,
        authorDisplayName: currentUser.displayName || currentUser.email, // Capture current display name or email
        title: promptData.title || '',
        text: promptData.text || '',
        description: promptData.description || '',
        category: promptData.category || '',
        tags: promptData.tags || [],
        isPrivate: !!promptData.isPrivate, // Ensure boolean
        targetAiTools: promptData.targetAiTools || [],
        // For private prompts, user-specific rating/favorite is on the prompt itself
        userRating: promptData.isPrivate ? (promptData.userRating || 0) : 0,
        userIsFavorite: promptData.isPrivate ? (promptData.userIsFavorite || false) : false,
        // For shared prompts, these are aggregates (initialized to 0 or defaults)
        averageRating: !promptData.isPrivate ? 0 : 0, 
        totalRatingsCount: !promptData.isPrivate ? 0 : 0,
        favoritesCount: !promptData.isPrivate ? 0 : 0,
        usageCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Use global firebase for FieldValue
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('prompts').add(newPromptDoc);
      console.log("Prompt added with ID: ", docRef.id);
      return { ...newPromptDoc, id: docRef.id, createdAt: new Date(), updatedAt: new Date() }; // Return with ID and approximate client-side timestamps for immediate UI use
    } catch (error) {
      Utils.handleError(`Error adding prompt to Firestore: ${error.message}`, {
        userVisible: true,
        originalError: error,
      });
      return null;
    }
  };
  
  // Deprecate or remove old createPrompt as addPrompt now handles full object creation for Firestore.
  // const createPrompt = promptData => { ... }; 

  // TODO: Refactor loadPrompts, updatePrompt, deletePrompt, etc., for Firestore
  const loadPrompts = async () => {
    console.warn("loadPrompts is still using chrome.storage.local and needs refactoring for Firestore.");
    try {
      const data = await Utils.chromeStorageGet('prompts');
      return data.prompts || [];
    } catch (error) {
      Utils.handleError(`Error loading prompts (local): ${error.message}`, { userVisible: true, originalError: error });
      return [];
    }
  };

  const updatePrompt = async (promptId, updates) => {
    console.warn(`updatePrompt for ID ${promptId} is still using chrome.storage.local.`);
    // Placeholder - needs Firestore implementation
    return null;
  };

  const deletePrompt = async (promptId) => {
    console.warn(`deletePrompt for ID ${promptId} is still using chrome.storage.local.`);
    // Placeholder - needs Firestore implementation
    return false;
  };

  const updatePromptRating = async (promptId, rating) => {
    console.warn(`updatePromptRating for ID ${promptId} is still using chrome.storage.local.`);
    // Placeholder - needs Firestore implementation
    return null;
  };

  const toggleFavorite = async promptId => {
    console.warn(`toggleFavorite for ID ${promptId} is still using chrome.storage.local.`);
    // Placeholder - needs Firestore implementation
    return null;
  };
  
  // --- Helper/Existing functions that might not need immediate refactoring or will be refactored alongside UI --- 
  const savePrompts = async prompts => {
    // This function will be removed once all data ops use Firestore directly
    console.warn("savePrompts is for chrome.storage.local and will be removed.");
    try {
      await Utils.chromeStorageSet({ prompts });
      return true;
    } catch (error) {
      Utils.handleError(`Error saving prompts (local): ${error.message}`, { userVisible: true, originalError: error });
      return false;
    }
  };
  const copyPromptToClipboard = async promptId => {
    // This function might need to load the specific prompt from Firestore if not already loaded
    // For now, it will rely on the existing loadPrompts structure.
    try {
      const allPrompts = await loadPrompts(); // This needs to become Firestore-aware
      const prompt = allPrompts.find(p => p.id === promptId);
      if (!prompt) throw new Error(`Prompt with ID ${promptId} not found`);
      await navigator.clipboard.writeText(prompt.text);
      return true;
    } catch (error) {
      Utils.handleError(`Error copying to clipboard: ${error.message}`, { userVisible: true, originalError: error });
      return false;
    }
  };
  const findPromptById = async (promptId, prompts = null, options = {}) => {
    // This will also need to be Firestore-aware if `prompts` is not passed
    console.warn("findPromptById might use chrome.storage.local if prompts array not provided.");
    // ... (rest of existing logic, will fail if prompts not provided and loadPrompts not updated)
    const { throwIfNotFound = false, handleError = false } = options;
    if (!promptId) return Promise.resolve(null);
    try {
      let prompt = null;
      if (prompts) {
        prompt = prompts.find(p => p.id === promptId) || null;
      } else {
        const allPrompts = await loadPrompts(); // This needs to become Firestore-aware
        prompt = allPrompts.find(p => p.id === promptId) || null;
      }
      if (!prompt && throwIfNotFound) {
        throw new Error(`Prompt with ID ${promptId} not found`);
      }
      return prompt;
    } catch (error) {
      if (handleError) {
        Utils.handleError(`Error retrieving prompt: ${error.message}`, { userVisible: true, originalError: error });
      }
      return null;
    }
  };
  const filterPrompts = (prompts, filters) => {
    // This function operates on an array; how it gets that array will change with Firestore.
    // The filtering logic itself might remain similar.
    let result = [...prompts];
    if (filters.tab === 'favs') {
      result = result.filter(p => p.userIsFavorite || p.favorites === 1); // Adjust for new data model
    } else if (filters.tab === 'private') {
      result = result.filter(p => p.isPrivate);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        p =>
          (p.title && p.title.toLowerCase().includes(term)) ||
          (p.text && p.text.toLowerCase().includes(term)) ||
          (p.category && p.category.toLowerCase().includes(term)) ||
          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(term))) || 
          (p.targetAiTools && p.targetAiTools.some(tool => tool.toLowerCase().includes(term)))
      );
    }
    if (filters.minRating > 0) {
      // Adjust for new data model: userRating for private, averageRating for shared
      result = result.filter(p => (p.isPrivate ? (p.userRating || 0) : (p.averageRating || 0)) >= filters.minRating);
    }
    return result;
  };

  return {
    signupUser,
    loginUser,
    signInWithGoogle,
    logoutUser,
    onAuthStateChanged,
    addPrompt, // Refactored
    loadPrompts, // Needs refactoring
    updatePrompt, // Needs refactoring
    deletePrompt, // Needs refactoring
    updatePromptRating, // Needs refactoring
    toggleFavorite, // Needs refactoring
    // --- Helper or to be removed/refactored --- 
    // createPrompt, // Deprecated by addPrompt's direct object creation
    // savePrompts, // To be removed once all ops use Firestore
    copyPromptToClipboard,
    findPromptById,
    filterPrompts,
  };
})();
