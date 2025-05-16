import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

import { auth, db } from '../js/firebase-init.js';
import * as Utils from '../js/utils.js';

// --- Firebase Authentication Functions ---
export const signupUser = async (email, password) => {
  if (!auth) {
    const err = new Error('Firebase Auth not available from firebase-init.js.');
    Utils.handleError(err.message, { userVisible: true, originalError: err });
    return Promise.reject(err);
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User signed up:', userCredential.user);
    if (db) {
      try {
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, {
          email: userCredential.user.email,
          displayName: userCredential.user.email,
          createdAt: serverTimestamp(),
        });
        console.log('User document created in Firestore for UID:', userCredential.user.uid);
      } catch (dbError) {
        console.error('Error creating user document in Firestore:', dbError);
        Utils.handleError('Could not save user details after signup.', {
          userVisible: true,
          originalError: dbError,
        });
      }
    }
    return userCredential;
  } catch (error) {
    Utils.handleError(`Signup error: ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
    return Promise.reject(error);
  }
};

export const loginUser = async (email, password) => {
  if (!auth) {
    const err = new Error('Firebase Auth not available from firebase-init.js.');
    Utils.handleError(err.message, { userVisible: true, originalError: err });
    return Promise.reject(err);
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', userCredential.user);
    return userCredential;
  } catch (error) {
    Utils.handleError(`Login error: ${error.message}`, { userVisible: true, originalError: error });
    return Promise.reject(error);
  }
};

export const signInWithGoogle = async () => {
  console.log("signInWithGoogle (v9 - chrome.identity) called");
  if (typeof chrome === 'undefined' || !chrome.identity || !chrome.identity.getAuthToken) {
    const errMsg = "chrome.identity API not available. Google Sign-In cannot proceed.";
    console.error(errMsg);
    Utils.handleError(errMsg, { userVisible: true });
    return Promise.reject(new Error(errMsg));
  }
  if (!auth) {
    const errMsg = "Firebase Auth service not initialized.";
    console.error(errMsg);
    Utils.handleError(errMsg, { userVisible: true });
    return Promise.reject(new Error(errMsg));
  }

  try {
    console.log("Requesting Google ID token via chrome.identity.getAuthToken...");
    const tokenInfo = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });

    if (!tokenInfo) {
      const errMsg = "Google Sign-In failed: No token received from chrome.identity.";
      console.error(errMsg);
      Utils.handleError(errMsg, { userVisible: true });
      return Promise.reject(new Error(errMsg));
    }

    console.log("Google ID token received, creating Firebase credential...");
    const credential = GoogleAuthProvider.credential(tokenInfo); // tokenInfo here is the ID token string
    
    console.log("Signing into Firebase with Google credential...");
    const userCredential = await signInWithCredential(auth, credential);
    console.log("Firebase Sign-In with Google credential successful:", userCredential.user);
    
    // Check if this is a new user to Firestore and create a document if so
    if (db && userCredential.user) {
        const userDocRef = doc(db, "users", userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
            console.log("New Google Sign-In user, creating user document in Firestore...");
            try {
                await setDoc(userDocRef, {
                    email: userCredential.user.email,
                    displayName: userCredential.user.displayName || userCredential.user.email,
                    createdAt: serverTimestamp(),
                    photoURL: userCredential.user.photoURL || null
                });
                console.log("User document created for Google user:", userCredential.user.uid);
            } catch (dbError) {
                console.error('Error creating user document for Google user:', dbError);
                Utils.handleError('Could not save Google user details after signup.', { userVisible: true, originalError: dbError });
            }
        }
    }
    return userCredential; // Return the Firebase userCredential

  } catch (error) {
    console.error("Error in signInWithGoogle (chrome.identity) flow:", error);
    const errMsg = error.message || "An unknown error occurred during Google Sign-In.";
    Utils.handleError(errMsg, { userVisible: true, originalError: error });
    return Promise.reject(error);
  }
};

export const logoutUser = async () => {
  if (!auth) {
    Utils.handleError('Firebase Auth not available from firebase-init.js.', { userVisible: true });
    return Promise.resolve(false);
  }
  try {
    await firebaseSignOut(auth);
    console.log('User logged out (v9)');
    return true;
  } catch (error) {
    Utils.handleError(`Logout error (v9): ${error.message}`, { userVisible: true, originalError: error });
    return false;
  }
};

export const onAuthStateChanged = (callback) => {
  if (!auth) {
    Utils.handleError('Firebase Auth not available from firebase-init.js.', { userVisible: false });
    callback(null);
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, callback);
};

// --- Prompt Functions (Firestore) ---
export const addPrompt = async (promptData) => {
  const currentUser = auth ? auth.currentUser : null;
  if (!currentUser) {
    Utils.handleError('User must be logged in to add a prompt.', { userVisible: true });
    return null;
  }
  if (!db) {
    Utils.handleError('Firestore not available from firebase-init.js.', { userVisible: true });
    return null;
  }
  try {
    const newPromptDocData = {
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
      averageRating: 0, 
      totalRatingsCount: 0,
      favoritesCount: 0,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'prompts'), newPromptDocData);
    console.log('Prompt added with ID (v9): ', docRef.id);
    const locallySimulatedTimestamps = { createdAt: new Date(), updatedAt: new Date() };
    return { ...newPromptDocData, ...locallySimulatedTimestamps, id: docRef.id };
  } catch (error) {
    Utils.handleError(`Error adding prompt to Firestore (v9): ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
    return null;
  }
};

const formatLoadedPrompt = (docSnapshot) => {
  const data = docSnapshot.data();
  const convertTimestamp = (ts) =>
    ts instanceof Timestamp ? ts.toDate().toISOString() : ts ? new Date(ts).toISOString() : null;
  return {
    id: docSnapshot.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const loadPrompts = async () => {
  const currentUser = auth ? auth.currentUser : null;
  if (!db) {
    Utils.handleError('Firestore not available for loading prompts (v9).', { userVisible: true });
    return [];
  }
  let allPrompts = [];
  const fetchedPromptIds = new Set();
  try {
    if (currentUser) {
      const userPromptsQuery = query(
        collection(db, 'prompts'),
        where('userId', '==', currentUser.uid)
      );
      const userPromptsSnapshot = await getDocs(userPromptsQuery);
      userPromptsSnapshot.forEach(doc => {
        if (!fetchedPromptIds.has(doc.id)) {
          allPrompts.push(formatLoadedPrompt(doc));
          fetchedPromptIds.add(doc.id);
        }
      });

      const publicPromptsQuery = query(
        collection(db, 'prompts'),
        where('isPrivate', '==', false),
        where('userId', '!=', currentUser.uid)
      );
      const publicPromptsSnapshot = await getDocs(publicPromptsQuery);
      publicPromptsSnapshot.forEach(doc => {
        if (!fetchedPromptIds.has(doc.id)) {
          allPrompts.push(formatLoadedPrompt(doc));
          fetchedPromptIds.add(doc.id);
        }
      });
    } else {
      const publicPromptsQuery = query(collection(db, 'prompts'), where('isPrivate', '==', false));
      const publicPromptsSnapshot = await getDocs(publicPromptsQuery);
      publicPromptsSnapshot.forEach(doc => {
        allPrompts.push(formatLoadedPrompt(doc));
      });
    }
    console.log('Prompts loaded from Firestore (v9):', allPrompts.length);
    return allPrompts;
  } catch (error) {
    Utils.handleError(`Error loading prompts from Firestore (v9): ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
    return [];
  }
};

export const findPromptById = async (promptId, prompts = null, options = {}) => {
  const { throwIfNotFound = false, handleError = true } = options;
  if (!promptId) {
    console.warn('[findPromptById (v9)] No promptId provided.');
    return null;
  }
  if (!db) {
    const msg = '[findPromptById (v9)] Firestore not available.';
    console.error(msg);
    if (handleError && Utils && Utils.handleError) Utils.handleError(msg, { userVisible: true });
    return null;
  }

  try {
    if (prompts && Array.isArray(prompts) && prompts.length > 0) {
      const promptFromList = prompts.find(p => p.id === promptId) || null;
      if (promptFromList) return promptFromList;
    }

    const docRef = doc(db, 'prompts', promptId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return formatLoadedPrompt(docSnap);
    } else {
      const err = new Error(`Prompt with ID ${promptId} not found in Firestore (v9)`);
      console.warn(`[findPromptById (v9)] ${err.message}`);
      if (handleError && Utils && Utils.handleError) {
        Utils.handleError(err.message, { userVisible: true, originalError: err });
      }
      if (throwIfNotFound) {
        throw err;
      }
      return null;
    }
  } catch (error) {
    console.error(`[findPromptById (v9)] Error for ${promptId}:`, error.message);
    if (handleError && Utils && Utils.handleError) {
      if (!(error.message.includes('not found in Firestore') && throwIfNotFound)) {
        Utils.handleError(`Error retrieving prompt ${promptId} (v9): ${error.message}`, {
          userVisible: true,
          originalError: error,
        });
      }
    }
    if (throwIfNotFound && error.message.includes('not found in Firestore')) throw error;
    return null;
  }
};

export const updatePrompt = async (promptId, updates) => {
  const currentUser = auth ? auth.currentUser : null;
  if (!currentUser) {
    Utils.handleError('User must be logged in to update a prompt.', { userVisible: true });
    return null;
  }
  if (!db) {
    Utils.handleError('Firestore not available.', { userVisible: true });
    return null;
  }
  if (!promptId) {
    Utils.handleError('No prompt ID provided for update.', { userVisible: true });
    return null;
  }
  if (!updates || Object.keys(updates).length === 0) {
    Utils.handleError('No updates provided for the prompt.', { userVisible: true });
    return null;
  }

  try {
    const docRef = doc(db, 'prompts', promptId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      Utils.handleError(`Prompt with ID ${promptId} not found for update (v9).`, {
        userVisible: true,
      });
      return null;
    }
    if (docSnap.data().userId !== currentUser.uid) {
      Utils.handleError('You do not have permission to update this prompt (v9).', {
        userVisible: true,
      });
      return null;
    }

    const updateData = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(docRef, updateData);
    console.log(`Prompt with ID ${promptId} updated successfully in Firestore (v9).`);

    const updatedDataFromServer = { ...docSnap.data(), ...updates, updatedAt: new Date() }; // Simulate for return
    return formatLoadedPrompt({ id: promptId, data: () => updatedDataFromServer });
  } catch (error) {
    Utils.handleError(`Error updating prompt ${promptId} in Firestore (v9): ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
    return null;
  }
};

export const deletePrompt = async promptId => {
  const currentUser = auth ? auth.currentUser : null;
  if (!currentUser) {
    Utils.handleError('User must be logged in to delete a prompt.', { userVisible: true });
    return false;
  }
  if (!db) {
    Utils.handleError('Firestore not available.', { userVisible: true });
    return false;
  }
  if (!promptId) {
    Utils.handleError('No prompt ID provided for deletion.', { userVisible: true });
    return false;
  }

  try {
    const docRef = doc(db, 'prompts', promptId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      Utils.handleError(`Prompt with ID ${promptId} not found for deletion (v9).`, {
        userVisible: true,
      });
      return false;
    }
    if (docSnap.data().userId !== currentUser.uid) {
      Utils.handleError('You do not have permission to delete this prompt (v9).', {
        userVisible: true,
      });
      return false;
    }
    await deleteDoc(docRef);
    console.log(`Prompt with ID ${promptId} deleted successfully from Firestore (v9).`);
    return true;
  } catch (error) {
    Utils.handleError(`Error deleting prompt ${promptId} (v9): ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
    return false;
  }
};

export const toggleFavorite = async promptId => {
  const currentUser = auth ? auth.currentUser : null;
  if (!currentUser) {
    Utils.handleError('User must be logged in to change favorite status.', { userVisible: true });
    return null;
  }
  if (!db) {
    Utils.handleError('Firestore not available.', { userVisible: true });
    return null;
  }
  if (!promptId) {
    Utils.handleError('No prompt ID provided for toggling favorite.', { userVisible: true });
    return null;
  }

  try {
    const docRef = doc(db, 'prompts', promptId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      Utils.handleError(`Prompt with ID ${promptId} not found (v9).`, { userVisible: true });
      return null;
    }
    const promptData = docSnap.data();
    if (promptData.userId !== currentUser.uid) {
      Utils.handleError('You can only favorite/unfavorite your own prompts directly (v9).', {
        userVisible: true,
      });
      return null;
    }

    const newFavoriteStatus = !promptData.userIsFavorite;
    const updates = { userIsFavorite: newFavoriteStatus, updatedAt: serverTimestamp() };
    await updateDoc(docRef, updates);
    console.log(`Prompt ${promptId} favorite status updated to ${newFavoriteStatus} (v9).`);
    const updatedDataFromServer = { ...promptData, ...updates, updatedAt: new Date() }; // Simulate for return
    return formatLoadedPrompt({ id: promptId, data: () => updatedDataFromServer });
  } catch (error) {
    Utils.handleError(`Error toggling favorite for prompt ${promptId} (v9): ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
    return null;
  }
};

export const updatePromptRating = async (promptId, rating) => {
  const currentUser = auth ? auth.currentUser : null;
  if (!currentUser) {
    Utils.handleError('User must be logged in to rate a prompt.', { userVisible: true });
    return null;
  }
  if (!db) {
    Utils.handleError('Firestore not available.', { userVisible: true });
    return null;
  }
  if (!promptId) {
    Utils.handleError('No prompt ID provided for rating.', { userVisible: true });
    return null;
  }
  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    Utils.handleError('Invalid rating value. Must be a number between 0 and 5.', {
      userVisible: true,
    });
    return null;
  }

  try {
    const docRef = doc(db, 'prompts', promptId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      Utils.handleError(`Prompt with ID ${promptId} not found (v9).`, { userVisible: true });
      return null;
    }
    const promptData = docSnap.data();
    if (promptData.userId !== currentUser.uid) {
      Utils.handleError('You can only rate your own prompts this way (v9).', { userVisible: true });
      return null;
    }

    const updates = { userRating: rating, updatedAt: serverTimestamp() };
    await updateDoc(docRef, updates);
    console.log(`Prompt ${promptId} userRating updated to ${rating} (v9).`);
    const updatedDataFromServer = { ...promptData, ...updates, updatedAt: new Date() }; // Simulate for return
    return formatLoadedPrompt({ id: promptId, data: () => updatedDataFromServer });
  } catch (error) {
    Utils.handleError(`Error updating userRating for prompt ${promptId} (v9): ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
    return null;
  }
};

export const copyPromptToClipboard = async promptId => {
  try {
    const prompt = await findPromptById(promptId);
    if (!prompt) throw new Error(`Prompt with ID ${promptId} not found for copying (v9)`);
    await navigator.clipboard.writeText(prompt.text);
    return true;
  } catch (error) {
    Utils.handleError(`Error copying to clipboard (v9): ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
    return false;
  }
};

export const filterPrompts = (prompts, filters) => {
  let result = [...prompts];
  const currentUser = auth ? auth.currentUser : null;

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
