// Firebase v9 Modular SDK Initialization - Chrome Extension Compatible
// Minimal Firebase setup to avoid ALL modules that might contain remote script loading

import { initializeApp } from 'firebase/app';
// DO NOT import firebase/auth - it contains reCAPTCHA modules with remote script loading
// We'll implement a basic auth alternative using only Firestore

import {
  getFirestore,
  enableNetwork,
  disableNetwork,
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
  Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB4mtpImQrsZtDZJ0EC5dsRmvXhBY7F0Cs',
  authDomain: 'promptfinder-2a095.firebaseapp.com',
  projectId: 'promptfinder-2a095',
  storageBucket: 'promptfinder-2a095.firebasestorage.app',
  messagingSenderId: '1003470911937',
  appId: '1:1003470911937:web:9f7180cfa3c33535a89740',
  measurementId: 'G-NS4KTS6DW6',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app, 'europe-west1');

// Instead of Firebase Auth, we'll use Firebase Admin functions for authentication
// This completely avoids the client-side auth modules that contain reCAPTCHA

console.log(
  'Firebase initialized without client-side auth modules for Chrome Web Store compliance'
);

// Helper function to handle connection issues
const handleFirestoreConnection = async () => {
  try {
    await enableNetwork(db);
    console.log('Firestore network enabled successfully');
  } catch (error) {
    console.warn('Firestore network enable warning:', error);
  }
};

// Initialize connection when module loads
handleFirestoreConnection();

// Auth functionality using Cloud Functions instead of client-side Firebase Auth
// This completely avoids any reCAPTCHA or remote script loading

let currentUser = null;
const authStateListeners = [];

// Create user using Cloud Function
const createUserWithEmailAndPassword = async (authInstance, email, password) => {
  try {
    const createUser = httpsCallable(functions, 'createUser');
    const result = await createUser({ email, password });

    if (result.data.success) {
      currentUser = {
        uid: result.data.uid,
        email: email,
        emailVerified: false,
      };
      // Notify listeners
      authStateListeners.forEach(listener => listener(currentUser));
      return { user: currentUser };
    } else {
      throw new Error(result.data.error || 'Account creation failed');
    }
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

// Sign in using Cloud Function
const signInWithEmailAndPassword = async (authInstance, email, password) => {
  try {
    const signIn = httpsCallable(functions, 'signInUser');
    const result = await signIn({ email, password });

    if (result.data.success) {
      currentUser = {
        uid: result.data.uid,
        email: email,
        emailVerified: result.data.emailVerified || false,
      };
      // Notify listeners
      authStateListeners.forEach(listener => listener(currentUser));
      return { user: currentUser };
    } else {
      throw new Error(result.data.error || 'Sign in failed');
    }
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out
const firebaseSignOut = async () => {
  currentUser = null;
  // Notify listeners
  authStateListeners.forEach(listener => listener(null));
  return Promise.resolve();
};

// Auth state listener
const firebaseOnAuthStateChanged = callback => {
  authStateListeners.push(callback);
  // Call immediately with current state
  callback(currentUser);

  // Return unsubscribe function
  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
};

// Mock auth object for compatibility
const auth = {
  get currentUser() {
    return currentUser;
  },
  app: app,
};

// Password reset using Cloud Function
const sendPasswordResetEmail = async (authInstance, email) => {
  try {
    const resetPassword = httpsCallable(functions, 'sendPasswordReset');
    const result = await resetPassword({ email });

    if (!result.data.success) {
      throw new Error(result.data.error || 'Password reset failed');
    }
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Email verification using Cloud Function
const firebaseSendEmailVerification = async user => {
  try {
    const sendVerification = httpsCallable(functions, 'sendEmailVerification');
    const result = await sendVerification({ uid: user.uid });

    if (!result.data.success) {
      throw new Error(result.data.error || 'Email verification failed');
    }
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

// Reload user data
const firebaseReload = async _user => {
  // Refresh user data from server
  if (currentUser) {
    const getUserData = httpsCallable(functions, 'getUserData');
    const result = await getUserData({ uid: currentUser.uid });

    if (result.data.success) {
      currentUser.emailVerified = result.data.emailVerified;
      // Notify listeners
      authStateListeners.forEach(listener => listener(currentUser));
    }
  }
};

// Update profile using Cloud Function
const updateProfile = async (user, profileData) => {
  try {
    const updateUserProfile = httpsCallable(functions, 'updateProfile');
    const result = await updateUserProfile({
      uid: user.uid,
      displayName: profileData.displayName,
    });

    if (!result.data.success) {
      throw new Error(result.data.error || 'Profile update failed');
    }

    // Update local user object
    if (currentUser) {
      currentUser.displayName = profileData.displayName;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

// Mock Google Auth Provider for compatibility
const GoogleAuthProvider = {
  credential: () => {
    throw new Error('Google Sign-In not available in Chrome extension mode');
  },
};

const signInWithCredential = async () => {
  throw new Error('Google Sign-In not available in Chrome extension mode');
};

// Export Firebase instances and functions
export {
  auth,
  db,
  functions,
  enableNetwork,
  disableNetwork,
  // Auth functions - using Cloud Function implementations
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  firebaseSignOut,
  firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
  sendPasswordResetEmail,
  firebaseSendEmailVerification,
  firebaseReload,
  // Firestore functions
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
  Timestamp,
  // Functions
  httpsCallable,
};
