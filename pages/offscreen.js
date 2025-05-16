// pages/offscreen.js
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../js/firebase-init.js'; // Import the initialized auth service

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.target !== 'offscreen') {
    return false; // Not for us
  }

  if (request.action === 'firebase-google-signin') {
    console.log('Offscreen document (v9 module): Received firebase-google-signin request.');

    if (!auth) {
      console.error(
        'Offscreen (v9 module): Firebase Auth service not available from firebase-init.js.'
      );
      sendResponse({
        success: false,
        error: { message: 'Firebase Auth service not available in offscreen document.' },
      });
      return true; // Indicate async response
    }

    const provider = new GoogleAuthProvider();

    try {
      console.log('Offscreen (v9 module): Attempting signInWithPopup...');
      const userCredential = await signInWithPopup(auth, provider);
      console.log('Offscreen document (v9 module): Google Sign-In successful.', userCredential);
      sendResponse({
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          // Add any other user properties you need to pass back
        },
      });
      // Optional: Close the offscreen document after a short delay
      // setTimeout(() => window.close(), 1000);
    } catch (error) {
      console.error('Offscreen document (v9 module): Google Sign-In error:', error);
      sendResponse({ success: false, error: { message: error.message, code: error.code } });
    }
    return true; // Indicates that the response is sent asynchronously.
  }
  return false;
});

console.log('Offscreen document script (v9 module) loaded and listener attached.');
