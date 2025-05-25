/**
 * Firebase Connection Handler for Chrome Extension
 * Handles Firestore WebChannel connection errors and provides retry logic
 */

import { enableNetwork, disableNetwork } from './firebase-init.js';
import { db } from './firebase-init.js';

let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Handle Firestore connection errors
 * @param {Error} error - The connection error
 */
export const handleConnectionError = async error => {
  console.warn('Firestore connection error:', error);

  // Check if this is a WebChannel error
  if (error.message && error.message.includes('WebChannelConnection')) {
    console.log('Detected WebChannel connection error, attempting recovery...');
    await attemptConnectionRecovery();
  }
};

/**
 * Attempt to recover from connection errors
 */
const attemptConnectionRecovery = async () => {
  if (connectionRetryCount >= MAX_RETRY_ATTEMPTS) {
    console.error('Max connection retry attempts reached. Connection recovery failed.');
    return;
  }

  connectionRetryCount++;
  console.log(`Connection recovery attempt ${connectionRetryCount}/${MAX_RETRY_ATTEMPTS}`);

  try {
    // Disable and re-enable network to force reconnection
    await disableNetwork(db);
    console.log('Firestore network disabled');

    // Wait before re-enabling
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

    await enableNetwork(db);
    console.log('Firestore network re-enabled');

    // Reset retry count on successful recovery
    connectionRetryCount = 0;
    console.log('Connection recovery successful');
  } catch (recoveryError) {
    console.error('Connection recovery failed:', recoveryError);

    // Wait before next attempt
    setTimeout(() => {
      attemptConnectionRecovery();
    }, RETRY_DELAY * connectionRetryCount);
  }
};

/**
 * Initialize connection monitoring
 */
export const initializeConnectionMonitoring = () => {
  // Monitor for connection errors in the global error handler
  if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (
        errorMessage.includes('WebChannelConnection') ||
        errorMessage.includes('transport errored')
      ) {
        handleConnectionError(new Error(errorMessage));
      }
      originalConsoleError.apply(console, args);
    };
  }
};

/**
 * Reset connection retry counter
 */
export const resetConnectionRetryCount = () => {
  connectionRetryCount = 0;
};
