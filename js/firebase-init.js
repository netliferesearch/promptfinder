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
// The firebase.app.App and firebase.auth.Auth types are for type hinting if using JSDoc or TypeScript

/** @type {import("../../node_modules/firebase/app").FirebaseApp} */
const app = firebase.initializeApp(firebaseConfig); // Use global firebase.initializeApp

/** @type {import("../../node_modules/firebase/auth").Auth} */
const auth = firebase.auth(); // Use global firebase.auth()

// TODO: Initialize other Firebase services here, e.g.:
// const db = firebase.firestore();

// Make auth (and other services) available globally for other scripts
window.firebaseApp = app;
window.firebaseAuth = auth;
// window.firebaseDb = db; // if you initialize db

console.log("Firebase initialized using global SDKs and exposed on window.");
