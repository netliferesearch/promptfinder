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
      // Example: if (window.firebaseDb) { try { await window.firebaseDb.collection('users').doc(userCredential.user.uid).set({ email: userCredential.user.email, createdAt: firebase.firestore.FieldValue.serverTimestamp(), displayName: userCredential.user.email }); } catch (dbError) { console.error('Error creating user doc:', dbError); } }
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
        authorDisplayName: currentUser.displayName || currentUser.email,
        title: promptData.title || '',
        text: promptData.text || '',
        description: promptData.description || '',
        category: promptData.category || '',
        tags: promptData.tags || [],
        isPrivate: !!promptData.isPrivate, 
        targetAiTools: promptData.targetAiTools || [],
        userRating: promptData.isPrivate ? (promptData.userRating || 0) : 0,
        userIsFavorite: promptData.isPrivate ? (promptData.userIsFavorite || false) : false,
        averageRating: !promptData.isPrivate ? 0 : 0, 
        totalRatingsCount: !promptData.isPrivate ? 0 : 0,
        favoritesCount: !promptData.isPrivate ? 0 : 0,
        usageCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('prompts').add(newPromptDoc);
      console.log("Prompt added with ID: ", docRef.id);
      // For immediate UI use, we can simulate the server timestamps with client-side new Date()
      // The actual server timestamps will be on the doc in Firestore
      const locallySimulatedTimestamps = {
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return { ...newPromptDoc, ...locallySimulatedTimestamps, id: docRef.id }; 
    } catch (error) {
      Utils.handleError(`Error adding prompt to Firestore: ${error.message}`, {
        userVisible: true,
        originalError: error,
      });
      return null;
    }
  };

  /**
   * Load prompts from Firestore.
   * If a user is logged in, loads their prompts (public/private) + other users' public prompts.
   * If not logged in, loads only public prompts.
   * @returns {Promise<Array>} Array of prompt objects.
   */
  const loadPrompts = async () => {
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
    const db = window.firebaseDb;

    if (!db) {
      Utils.handleError("Firestore not initialized for loading prompts.", { userVisible: true });
      return [];
    }

    let allPrompts = [];
    const fetchedPromptIds = new Set(); // To handle potential duplicates

    try {
      if (currentUser) {
        // 1. Get all prompts authored by the current user
        const userPromptsQuery = db.collection('prompts').where('userId', '==', currentUser.uid);
        const userPromptsSnapshot = await userPromptsQuery.get();
        userPromptsSnapshot.forEach(doc => {
          if (!fetchedPromptIds.has(doc.id)) {
            const data = doc.data();
            allPrompts.push({
              id: doc.id,
              ...data,
              // Convert Firestore Timestamps to JS Date objects or ISO strings for consistency
              createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
              updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
            });
            fetchedPromptIds.add(doc.id);
          }
        });

        // 2. Get all public prompts NOT authored by the current user
        const publicPromptsQuery = db.collection('prompts')
                                     .where('isPrivate', '==', false)
                                     .where('userId', '!=', currentUser.uid); // Firestore allows this negative comparison
        const publicPromptsSnapshot = await publicPromptsQuery.get();
        publicPromptsSnapshot.forEach(doc => {
          if (!fetchedPromptIds.has(doc.id)) { // Should be redundant due to query, but good practice
            const data = doc.data();
            allPrompts.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
              updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
            });
            fetchedPromptIds.add(doc.id);
          }
        });

      } else {
        // No user logged in, fetch only public prompts
        const publicPromptsQuery = db.collection('prompts').where('isPrivate', '==', false);
        const publicPromptsSnapshot = await publicPromptsQuery.get();
        publicPromptsSnapshot.forEach(doc => {
          // No need to check fetchedPromptIds here as it's a single query set
          const data = doc.data();
          allPrompts.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          });
        });
      }
      console.log("Prompts loaded from Firestore:", allPrompts.length);
      return allPrompts;
    } catch (error) {
      Utils.handleError(`Error loading prompts from Firestore: ${error.message}`, {
        userVisible: true,
        originalError: error,
      });
      return [];
    }
  };
  
  // TODO: Refactor updatePrompt, deletePrompt, etc., for Firestore
  const updatePrompt = async (promptId, updates) => {
    console.warn(`updatePrompt for ID ${promptId} is still using chrome.storage.local.`);
    return null;
  };

  const deletePrompt = async (promptId) => {
    console.warn(`deletePrompt for ID ${promptId} is still using chrome.storage.local.`);
    return false;
  };

  const updatePromptRating = async (promptId, rating) => {
    console.warn(`updatePromptRating for ID ${promptId} is still using chrome.storage.local.`);
    return null;
  };

  const toggleFavorite = async promptId => {
    console.warn(`toggleFavorite for ID ${promptId} is still using chrome.storage.local.`);
    return null;
  };
  
  const savePrompts = async prompts => {
    console.warn("savePrompts is for chrome.storage.local and will be removed.");
    return false;
  };
  const copyPromptToClipboard = async promptId => {
    try {
      // This will use the new loadPrompts which gets data from Firestore.
      // However, this means it loads ALL prompts just to copy one if not already loaded.
      // Optimization: pass loaded prompts array or fetch single doc by ID if needed.
      const allPrompts = await loadPrompts(); 
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
    const { throwIfNotFound = false, handleError = false } = options;
    if (!promptId) return Promise.resolve(null);
    const db = window.firebaseDb;
    if (!db) {
        Utils.handleError("Firestore not initialized for findPromptById.", { userVisible: true });
        return null;
    }
    try {
      if (prompts) { // If an array is passed, search within it (e.g., already loaded data)
        const prompt = prompts.find(p => p.id === promptId) || null;
        if (!prompt && throwIfNotFound) throw new Error(`Prompt with ID ${promptId} not found in provided list`);
        return prompt;
      } else { // Fetch directly from Firestore
        const docRef = db.collection('prompts').doc(promptId);
        const docSnap = await docRef.get();
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          };
        } else {
          if (throwIfNotFound) throw new Error(`Prompt with ID ${promptId} not found in Firestore`);
          return null;
        }
      }
    } catch (error) {
      if (handleError || throwIfNotFound) { // Ensure error is handled if it was meant to throw
        Utils.handleError(`Error retrieving prompt ${promptId}: ${error.message}`, { userVisible: true, originalError: error });
      }
      return null;
    }
  };
  const filterPrompts = (prompts, filters) => {
    let result = [...prompts];
    if (filters.tab === 'favs') {
      // For Firestore, userIsFavorite for private, and a separate mechanism for shared needed
      result = result.filter(p => p.userIsFavorite === true); // Simplification: only shows user's direct favorites for now
    } else if (filters.tab === 'private') {
      const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
      if (currentUser) {
          result = result.filter(p => p.isPrivate && p.userId === currentUser.uid);
      } else {
          result = []; // No private prompts if not logged in
      }
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
    addPrompt, 
    loadPrompts, // Refactored
    updatePrompt, 
    deletePrompt, 
    updatePromptRating, 
    toggleFavorite, 
    // savePrompts, // To be removed
    copyPromptToClipboard,
    findPromptById, // Refactored for direct Firestore fetch
    filterPrompts,
  };
})();
