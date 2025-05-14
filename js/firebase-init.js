// js/firebase-init.js

// Import Firebase from local files (downloaded from CDN)
import { initializeApp } from '../lib/firebase/firebase-app.js';
import { getAuth } from '../lib/firebase/firebase-auth.js';
// TODO: Add other Firebase SDKs here as needed, e.g.:
// import { getFirestore } from '../lib/firebase/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB4mtpImQrsZtDZJ0EC5dsRmvXhBY7F0Cs",
    authDomain: "promptfinder-2a095.firebaseapp.com",
    projectId: "promptfinder-2a095",
    storageBucket: "promptfinder-2a095.firebasestorage.app",
    messagingSenderId: "1003470911937",
    appId: "1:1003470911937:web:9f7180cfa3c33535a89740",
    measurementId: "G-NS4KTS6DW6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// TODO: Initialize other Firebase services here, e.g.:
// const db = getFirestore(app);

// Make auth available globally for non-module scripts (use with caution)
window.firebaseAuth = auth;
// if you initialize db, also do: window.firebaseDb = db;

// Export services for other ES modules if any still need it
export { auth, app /*, db */ };
