import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB4mtpImQrsZtDZJ0EC5dsRmvXhBY7F0Cs',
  authDomain: 'promptfinder-2a095.firebaseapp.com',
  projectId: 'promptfinder-2a095',
  storageBucket: 'promptfinder-2a095.appspot.com', // Ensure this is correct from your Firebase console
  messagingSenderId: '1003470911937',
  appId: '1:1003470911937:web:9f7180cfa3c33535a89740',
  measurementId: 'G-NS4KTS6DW6',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('Firebase v9 modular initialized (Auth, Firestore) and services exported.');

// Export the initialized services for other modules to import
export { app, auth, db };
