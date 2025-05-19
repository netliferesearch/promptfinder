// filepath: /Users/tor-andershansen/Desktop/Projects/promptfinder/tests/firebase-functions-mock.js
// Mock Firebase Functions
const admin = require('firebase-admin');

// Mock functionsTest instead of requiring the actual package
// This prevents the "Unexpected token export" error
const functionsTest = {
  cleanup: jest.fn(),
  wrap: jest.fn(fn => fn),
};

// Create a custom HttpsError class to match Firebase Functions structure
class HttpsError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'HttpsError';
  }
}

// Assign HttpsError to the mock functionsTest
functionsTest.HttpsError = HttpsError;

/**
 * Sets up a Firebase test environment with mocked Cloud Functions
 * @returns {Object} Test setup with adminApp and functions
 */
async function setupFirebaseTest() {
  // Initialize the admin app with a test project
  const adminApp = admin.initializeApp(
    {
      projectId: 'test-project-id',
    },
    'errorHandlingTests'
  );

  // Mock the Cloud Functions
  const myFunctions = {
    incrementUsageCount: jest.fn((data, context) => {
      if (!context.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in to track usage');
      }

      const promptId = data.promptId;
      if (!promptId) {
        throw new HttpsError('invalid-argument', 'Prompt ID is required');
      }

      // Check if prompt exists (mocking a not-found scenario)
      throw new HttpsError('not-found', `Prompt with ID ${promptId} not found`);
    }),

    recalculateAllStats: jest.fn((data, context) => {
      if (!context.auth?.token.admin) {
        throw new HttpsError('permission-denied', 'Only admins can recalculate all stats');
      }

      return {
        success: true,
        promptsUpdated: 5,
        promptsFailed: 0,
        totalPrompts: 5,
      };
    }),
  };

  return {
    adminApp,
    testEnv: functionsTest,
    functions: myFunctions,
  };
}

/**
 * Tears down the Firebase test environment
 * @param {Object} adminApp The admin app instance
 */
async function teardownFirebaseTest(adminApp) {
  try {
    if (adminApp) {
      await adminApp.delete();
    }
    // No need to call testEnv.cleanup() since it is a mock
  } catch (error) {
    console.error('Error tearing down Firebase test environment:', error);
  }
}

// Export the Firebase HttpsError for use in tests
const firebaseFunctions = {
  https: {
    HttpsError,
  },
};

// Export the setup and teardown functions for use in tests
module.exports = {
  setupFirebaseTest,
  teardownFirebaseTest,
  HttpsError,
  firebaseFunctions,
};
