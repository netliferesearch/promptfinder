// js/firebase-init.js

// Import Firebase from local files instead of CDN
import { initializeApp } from '../lib/firebase/firebase-app.esm.js';
import { getAuth } from '../lib/firebase/firebase-auth.esm.js';
// import { getAnalytics } from "../lib/firebase/firebase-analytics.esm.js"; // Optional: if you also copy analytics

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
// const analytics = getAnalytics(app); // Initialize if you plan to use Firebase Analytics

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Export auth and app to be used in other parts of your extension
export { auth, app };
