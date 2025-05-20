// Firebase v9 Modular SDK Initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

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
const functions = getFunctions(app, 'europe-west1'); // Use your region if different

export { auth, db, functions };
