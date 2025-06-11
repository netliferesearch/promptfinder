// Firebase v9 Modular SDK Initialization
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

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: 'AIzaSyB4mtpImQrsZtDZJ0EC5dsRmvXhBY7F0Cs',
  authDomain: 'promptfinder-2a095.firebaseapp.com',
  projectId: 'promptfinder-2a095',
  storageBucket: 'promptfinder-2a095.firebasestorage.app',
  messagingSenderId: '1003470911937',
  appId: '1:1003470911937:web:9f7180cfa3c33535a89740',
  measurementId: 'G-NS4KTS6DW6',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configure Firestore for Chrome extension environment
try {
  // Enable offline persistence and configure settings
  if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
    // Chrome extension environment - use more conservative settings
    console.log('Initializing Firestore in Chrome extension environment');
  }
} catch (error) {
  console.warn('Firestore settings configuration warning:', error);
}

const functions = getFunctions(app, 'europe-west1'); // Use your region if different

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

export {
  auth,
  db,
  functions,
  enableNetwork,
  disableNetwork,
  // Auth functions
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
