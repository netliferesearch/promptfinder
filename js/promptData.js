/**
 * PromptFinder Extension - Prompt Data Operations
 * Contains functions for managing prompts data (CRUD operations).
 */

window.PromptFinder = window.PromptFinder || {};

window.PromptFinder.PromptData = (function () {
  const Utils = window.PromptFinder.Utils;
  
  // --- Firebase Authentication Functions ---
  const signupUser = async (email, password) => {
    if (!window.firebaseAuth) {
      const err = new Error('Firebase Auth not initialized.');
      Utils.handleError(err.message, { userVisible: true, originalError: err });
      return err;
    }
    try {
      const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
      console.log("User signed up:", userCredential.user);
      if (window.firebaseDb) { 
        try { 
          await window.firebaseDb.collection('users').doc(userCredential.user.uid).set({
            email: userCredential.user.email,
            displayName: userCredential.user.email, 
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log("User document created in Firestore for UID:", userCredential.user.uid);
        } catch (dbError) { 
          console.error('Error creating user document in Firestore:', dbError);
          Utils.handleError('Could not save user details after signup.', { userVisible: true, originalError: dbError });
        } 
      }
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

  // --- Prompt Functions (Firestore) ---
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
      const locallySimulatedTimestamps = { createdAt: new Date(), updatedAt: new Date() };
      return { ...newPromptDoc, ...locallySimulatedTimestamps, id: docRef.id }; 
    } catch (error) {
      Utils.handleError(`Error adding prompt to Firestore: ${error.message}`, { userVisible: true, originalError: error });
      return null;
    }
  };

  const loadPrompts = async () => {
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
    const db = window.firebaseDb;
    if (!db) {
      Utils.handleError("Firestore not initialized for loading prompts.", { userVisible: true });
      return [];
    }
    let allPrompts = [];
    const fetchedPromptIds = new Set();
    try {
      if (currentUser) {
        const userPromptsQuery = db.collection('prompts').where('userId', '==', currentUser.uid);
        const userPromptsSnapshot = await userPromptsQuery.get();
        userPromptsSnapshot.forEach(doc => {
          if (!fetchedPromptIds.has(doc.id)) {
            const data = doc.data();
            allPrompts.push({ id: doc.id, ...data, createdAt: data.createdAt?.toDate().toISOString(), updatedAt: data.updatedAt?.toDate().toISOString() });
            fetchedPromptIds.add(doc.id);
          }
        });
        const publicPromptsQuery = db.collection('prompts').where('isPrivate', '==', false).where('userId', '!=', currentUser.uid); 
        const publicPromptsSnapshot = await publicPromptsQuery.get();
        publicPromptsSnapshot.forEach(doc => {
          if (!fetchedPromptIds.has(doc.id)) { 
            const data = doc.data();
            allPrompts.push({ id: doc.id, ...data, createdAt: data.createdAt?.toDate().toISOString(), updatedAt: data.updatedAt?.toDate().toISOString() });
            fetchedPromptIds.add(doc.id);
          }
        });
      } else {
        const publicPromptsQuery = db.collection('prompts').where('isPrivate', '==', false);
        const publicPromptsSnapshot = await publicPromptsQuery.get();
        publicPromptsSnapshot.forEach(doc => {
          const data = doc.data();
          allPrompts.push({ id: doc.id, ...data, createdAt: data.createdAt?.toDate().toISOString(), updatedAt: data.updatedAt?.toDate().toISOString() });
        });
      }
      console.log("Prompts loaded from Firestore:", allPrompts.length);
      return allPrompts;
    } catch (error) {
      Utils.handleError(`Error loading prompts from Firestore: ${error.message}`, { userVisible: true, originalError: error });
      return [];
    }
  };
  
  const findPromptById = async (promptId, prompts = null, options = {}) => {
    const { throwIfNotFound = false, handleError = true } = options; 
    if (!promptId) {
        console.warn("[findPromptById] No promptId provided.");
        return Promise.resolve(null);
    }
    const db = window.firebaseDb;
    if (!db) {
        const msg = "[findPromptById] Firestore not initialized.";
        console.error(msg);
        if (handleError) Utils.handleError(msg, { userVisible: true });
        return null;
    }
    try {
      if (prompts && Array.isArray(prompts) && prompts.length > 0) {
        const promptFromList = prompts.find(p => p.id === promptId) || null;
        if (promptFromList) return promptFromList;
      }
      const docRef = db.collection('prompts').doc(promptId);
      const docSnap = await docRef.get();
      if (docSnap.exists) { 
        const data = docSnap.data();
        return { id: docSnap.id, ...data, createdAt: data.createdAt?.toDate().toISOString(), updatedAt: data.updatedAt?.toDate().toISOString() };
      } else {
        const err = new Error(`Prompt with ID ${promptId} not found in Firestore`);
        console.warn(`[findPromptById] ${err.message}`);
        if (throwIfNotFound) {
          if (handleError && Utils && Utils.handleError) Utils.handleError(err.message, { userVisible: true, originalError: err });
          throw err; 
        }
        return null;
      }
    } catch (error) {
      console.error(`[findPromptById] Error during Firestore fetch for ${promptId}:`, error);
      if (handleError || throwIfNotFound) { 
        Utils.handleError(`Error retrieving prompt ${promptId}: ${error.message}`, { userVisible: true, originalError: error });
      }
      return null;
    }
  };

  const updatePrompt = async (promptId, updates) => {
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
    const db = window.firebaseDb;
    if (!currentUser) {
      Utils.handleError("User must be logged in to update a prompt.", { userVisible: true });
      return null;
    }
    if (!db) {
      Utils.handleError("Firestore not initialized.", { userVisible: true });
      return null;
    }
    if (!promptId) {
      Utils.handleError("No prompt ID provided for update.", { userVisible: true });
      return null;
    }
    if (!updates || Object.keys(updates).length === 0) {
        Utils.handleError("No updates provided for the prompt.", { userVisible: true });
        return null;
    }
    try {
      const docRef = db.collection('prompts').doc(promptId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        Utils.handleError(`Prompt with ID ${promptId} not found for update.`, { userVisible: true });
        return null;
      }
      if (docSnap.data().userId !== currentUser.uid) {
        Utils.handleError("You do not have permission to update this prompt.", { userVisible: true });
        return null;
      }
      const updateData = { ...updates, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      await docRef.update(updateData);
      console.log(`Prompt with ID ${promptId} updated successfully in Firestore.`);
      const updatedDoc = { ...docSnap.data(), ...updateData, id: promptId, updatedAt: new Date() }; 
      return updatedDoc;
    } catch (error) {
      Utils.handleError(`Error updating prompt ${promptId} in Firestore: ${error.message}`, {
        userVisible: true,
        originalError: error,
      });
      return null;
    }
  };

  const deletePrompt = async (promptId) => {
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
    const db = window.firebaseDb;
    if (!currentUser) {
      Utils.handleError("User must be logged in to delete a prompt.", { userVisible: true });
      return false;
    }
    if (!db) {
      Utils.handleError("Firestore not initialized.", { userVisible: true });
      return false;
    }
    if (!promptId) {
      Utils.handleError("No prompt ID provided for deletion.", { userVisible: true });
      return false;
    }
    try {
      const docRef = db.collection('prompts').doc(promptId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        Utils.handleError(`Prompt with ID ${promptId} not found for deletion.`, { userVisible: true });
        return false;
      }
      if (docSnap.data().userId !== currentUser.uid) {
        Utils.handleError("You do not have permission to delete this prompt.", { userVisible: true });
        return false;
      }
      await docRef.delete();
      console.log(`Prompt with ID ${promptId} deleted successfully from Firestore.`);
      return true;
    } catch (error) {
      Utils.handleError(`Error deleting prompt ${promptId} from Firestore: ${error.message}`, {
        userVisible: true,
        originalError: error,
      });
      return false;
    }
  };

  const toggleFavorite = async (promptId) => {
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
    const db = window.firebaseDb;
    if (!currentUser) {
      Utils.handleError("User must be logged in to change favorite status.", { userVisible: true });
      return null;
    }
    if (!db) {
      Utils.handleError("Firestore not initialized.", { userVisible: true });
      return null;
    }
    if (!promptId) {
      Utils.handleError("No prompt ID provided for toggling favorite.", { userVisible: true });
      return null;
    }
    try {
      const docRef = db.collection('prompts').doc(promptId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        Utils.handleError(`Prompt with ID ${promptId} not found.`, { userVisible: true });
        return null;
      }
      const promptData = docSnap.data();
      if (promptData.userId !== currentUser.uid) {
        Utils.handleError("You can only favorite/unfavorite your own prompts directly.", { userVisible: true });
        return null;
      }
      const newFavoriteStatus = !promptData.userIsFavorite;
      const updates = { userIsFavorite: newFavoriteStatus, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      await docRef.update(updates);
      console.log(`Prompt ${promptId} favorite status updated to ${newFavoriteStatus}.`);
      return { ...promptData, ...updates, id: promptId, updatedAt: new Date() };
    } catch (error) {
      Utils.handleError(`Error toggling favorite for prompt ${promptId}: ${error.message}`, { userVisible: true, originalError: error });
      return null;
    }
  };

  const updatePromptRating = async (promptId, rating) => {
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
    const db = window.firebaseDb;
    if (!currentUser) {
      Utils.handleError("User must be logged in to rate a prompt.", { userVisible: true });
      return null;
    }
    if (!db) {
      Utils.handleError("Firestore not initialized.", { userVisible: true });
      return null;
    }
    if (!promptId) {
      Utils.handleError("No prompt ID provided for rating.", { userVisible: true });
      return null;
    }
    if (typeof rating !== 'number' || rating < 0 || rating > 5) { 
        Utils.handleError("Invalid rating value. Must be a number between 0 and 5.", { userVisible: true });
        return null;
    }
    try {
      const docRef = db.collection('prompts').doc(promptId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        Utils.handleError(`Prompt with ID ${promptId} not found.`, { userVisible: true });
        return null;
      }
      const promptData = docSnap.data();
      if (promptData.userId !== currentUser.uid) {
        Utils.handleError("You can only rate your own prompts this way.", { userVisible: true });
        return null;
      }
      const updates = { userRating: rating, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      await docRef.update(updates);
      console.log(`Prompt ${promptId} userRating updated to ${rating}.`);
      return { ...promptData, ...updates, id: promptId, updatedAt: new Date() };
    } catch (error) {
      Utils.handleError(`Error updating userRating for prompt ${promptId}: ${error.message}`, { userVisible: true, originalError: error });
      return null;
    }
  };
  
  const copyPromptToClipboard = async promptId => {
    try {
      const prompt = await findPromptById(promptId); 
      if (!prompt) throw new Error(`Prompt with ID ${promptId} not found for copying`);
      await navigator.clipboard.writeText(prompt.text);
      return true;
    } catch (error) {
      Utils.handleError(`Error copying to clipboard: ${error.message}`, { userVisible: true, originalError: error });
      return false;
    }
  };

  const filterPrompts = (prompts, filters) => {
    let result = [...prompts];
    const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;

    if (filters.tab === 'favs') {
      if (!currentUser) return []; 
      result = result.filter(p => p.userId === currentUser.uid && p.userIsFavorite === true);
    } else if (filters.tab === 'private') {
      if (!currentUser) return []; 
      result = result.filter(p => p.isPrivate && p.userId === currentUser.uid);
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
      result = result.filter(p => {
        if (currentUser && p.userId === currentUser.uid) {
            return (p.userRating || 0) >= filters.minRating;
        } else if (!p.isPrivate) {
            return (p.averageRating || 0) >= filters.minRating;
        }
        return false; 
      });
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
    loadPrompts, 
    updatePrompt, 
    deletePrompt, 
    updatePromptRating, 
    toggleFavorite, 
    copyPromptToClipboard,
    findPromptById, 
    filterPrompts,
  };
})();
