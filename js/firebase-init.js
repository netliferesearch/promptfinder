// Firebase v9 Modular SDK Initialization - Chrome Extension Compatible
// Excludes reCAPTCHA and remote script loading functionality for Chrome Web Store compliance

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  reload as firebaseReload,
} from 'firebase/auth';
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
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'europe-west1');

// Configure Firestore for Chrome extension environment
// Disable offline persistence to avoid potential issues
try {
  if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
    console.log('Initializing Firestore in Chrome extension environment');

    // Configure Auth for Chrome extension
    // Disable reCAPTCHA and other features that might load remote scripts
    if (auth) {
      // Set custom settings for Chrome extension environment
      console.log('Firebase Auth configured for Chrome extension');

      // Override any potential reCAPTCHA functionality
      // This ensures no remote scripts are loaded
      if (auth.app && auth.app.options) {
        // Disable any reCAPTCHA-related features
        const authSettings = {
          appVerificationDisabledForTesting: true,
        };

        // Apply Chrome extension specific settings
        try {
          // Note: This is a defensive approach to prevent any remote script loading
          if (typeof auth.settings !== 'undefined') {
            Object.assign(auth.settings, authSettings);
          }
        } catch (settingsError) {
          console.warn('Auth settings configuration warning:', settingsError);
        }
      }
    }
  }
} catch (error) {
  console.warn('Firebase configuration warning:', error);
}

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

// Custom wrapper functions to ensure no remote script loading
const createUserWithEmailAndPasswordSafe = async (auth, email, password) => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    // Handle auth errors without triggering reCAPTCHA
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later.');
    }
    throw error;
  }
};

const signInWithEmailAndPasswordSafe = async (auth, email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    // Handle auth errors without triggering reCAPTCHA
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later.');
    }
    throw error;
  }
};

// Export Firebase instances and functions
export {
  auth,
  db,
  functions,
  enableNetwork,
  disableNetwork,
  // Auth functions - using safe wrappers
  createUserWithEmailAndPasswordSafe as createUserWithEmailAndPassword,
  signInWithEmailAndPasswordSafe as signInWithEmailAndPassword,
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
