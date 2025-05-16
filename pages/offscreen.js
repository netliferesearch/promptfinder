// pages/offscreen.js

// Ensure Firebase is initialized (this might be redundant if already initialized elsewhere,
// but it's safe to include if this document is the first point of Firebase interaction for this specific flow).
// Note: Configuration details should ideally be managed globally or passed securely.
// For this example, we assume firebase-init.js handles this, and the core firebaseApp is available.

// Helper to ensure Firebase app is initialized
async function ensureFirebaseInitialized() {
    if (!window.firebase?.apps?.length) {
        // This assumes you have a firebase-init.js or similar that sets up firebaseConfig
        // and that firebase-init.js is included or its logic is available.
        // If firebase-init.js is meant to be run, we might need a more robust way 
        // to ensure its execution or replicate its core initialization here.
        // For now, let's log an error if firebase app isn't found, 
        // as it should be initialized by firebase-init.js included in offscreen.html (if added there)
        // or by the service worker/popup.
        console.error("Firebase app not initialized. Ensure firebase-init.js is included and configured.");
        // A more robust solution might involve trying to initialize it here if firebaseConfig is accessible.
        // For now, we rely on prior initialization via firebase-app.js and firebase-auth.js in offscreen.html
    }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.target !== 'offscreen') {
    return false; // Not for us
  }

  if (request.action === 'firebase-google-signin') {
    console.log("Offscreen document: Received firebase-google-signin request.");

    await ensureFirebaseInitialized(); // Ensure Firebase is ready

    if (!window.firebase || !window.firebase.auth || !window.firebase.auth.GoogleAuthProvider) {
      console.error("Offscreen: Firebase Auth or GoogleAuthProvider not available.");
      sendResponse({ success: false, error: { message: 'Firebase Auth or GoogleAuthProvider not available in offscreen document.' } });
      return true; // Indicate async response
    }

    const auth = window.firebase.auth();
    const provider = new window.firebase.auth.GoogleAuthProvider();

    try {
      const userCredential = await auth.signInWithPopup(provider);
      console.log("Offscreen document: Google Sign-In successful.", userCredential);
      // After successful sign-in, Firebase Auth automatically notifies listeners 
      // (like onAuthStateChanged in your service worker or popup).
      // So, we just need to confirm success and close the offscreen document.
      sendResponse({ success: true, user: userCredential.user });
      // Optional: close the offscreen document if its only purpose was this one sign-in operation
      // setTimeout(() => window.close(), 500); // Give time for message to send
    } catch (error) {
      console.error("Offscreen document: Google Sign-In error:", error);
      sendResponse({ success: false, error: { message: error.message, code: error.code } });
    }
    return true; // Indicates that the response is sent asynchronously.
  }
  return false;
});

console.log("Offscreen document script loaded and listener attached.");
