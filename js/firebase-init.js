// js/firebase-init.js

// Ensure Firebase SDKs have been loaded via <script> tags in HTML files first.

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

// Initialize Firebase using the global firebase object
const app = firebase.initializeApp(firebaseConfig); 
const auth = firebase.auth(); 
const db = firebase.firestore(); // Initialize Firestore

// Make services available globally for other scripts
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db; // Expose Firestore instance

console.log("Firebase initialized (Auth, Firestore) using global SDKs and exposed on window.");
