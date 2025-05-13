// js/firebase-init.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js"; // Optional: for Firebase Analytics

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB4mtpImQrsZtDZJ0EC5dsRmvXhBY7F0Cs", // IMPORTANT: Ensure your Firestore Security Rules are robust to protect your data.
    authDomain: "promptfinder-2a095.firebaseapp.com",
    projectId: "promptfinder-2a095",
    storageBucket: "promptfinder-2a095.firebasestorage.app",
    messagingSenderId: "1003470911937",
    appId: "1:1003470911937:web:9f7180cfa3c33535a89740",
    measurementId: "G-NS4KTS6DW6" // Optional: for Firebase Analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Initialize if you plan to use Firebase Analytics

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Export auth and app to be used in other parts of your extension
export { auth, app };
