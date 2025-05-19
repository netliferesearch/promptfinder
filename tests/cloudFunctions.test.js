import * as PromptData from '../js/promptData.js';
import * as Utils from '../js/utils.js';
import { httpsCallable } from 'firebase/functions';
// functions is imported but not used directly in this file
// it's used indirectly through the httpsCallable function

// Create mocks for Firebase functions
const mockFunctionsCallResults = {
  incrementUsageCount: { success: true },
  recalculateAllStats: { success: true, promptsUpdated: 5 },
};

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({ mockName: 'MockFunctionsInstance' })),
  httpsCallable: jest.fn((functions, functionName) => {
    return jest.fn(data => {
      // Simulate the behavior of each Cloud Function
      if (functionName === 'incrementUsageCount') {
        const promptId = data.promptId;
        if (!promptId) {
          return Promise.reject(new Error('Prompt ID is required'));
        }
        const promptPath = `prompts/${promptId}`;
        const promptData = global.mockFirestoreDb.getPathData(promptPath);
        if (!promptData) {
          return Promise.reject(new Error(`Prompt with ID ${promptId} not found`));
        }

        // Increment the usage count - use the existing data to preserve other fields
        const updatedData = {
          ...promptData,
          usageCount: (promptData.usageCount || 0) + 1,
        };
        global.mockFirestoreDb.seedData(promptPath, updatedData);

        return Promise.resolve({ data: mockFunctionsCallResults.incrementUsageCount });
      } else if (functionName === 'recalculateAllStats') {
        // For admin function, we just return a success result
        return Promise.resolve({ data: mockFunctionsCallResults.recalculateAllStats });
      }

      // Default behavior for unknown functions
      return Promise.resolve({ data: { success: true } });
    });
  }),
  connectFunctionsEmulator: jest.fn(),
}));

jest.mock('../js/utils.js', () => ({
  ...jest.requireActual('../js/utils.js'),
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn(),
}));

// Setup the clipboard mock
if (typeof navigator === 'undefined') {
  global.navigator = {};
}
global.navigator.clipboard = {
  writeText: jest.fn(),
};

const mockUser = { uid: 'testUserId', email: 'test@example.com', displayName: 'Test User' };

// Utility to mock recalculateRating behavior
const mockRecalculateRating = async promptId => {
  try {
    // Get all ratings for this prompt
    const ratingsPath = `prompts/${promptId}/ratings`;
    const ratings = global.mockFirestoreDb.getPathData(ratingsPath) || {};

    let totalRating = 0;
    let validRatingsCount = 0;

    // Process all ratings
    Object.values(ratings).forEach(ratingData => {
      if (ratingData && ratingData.rating && typeof ratingData.rating === 'number') {
        totalRating += ratingData.rating;
        validRatingsCount++;
      }
    });

    // Calculate new average
    const newAverageRating =
      validRatingsCount > 0 ? parseFloat((totalRating / validRatingsCount).toFixed(2)) : 0;

    // Update the prompt
    const promptPath = `prompts/${promptId}`;
    const promptData = global.mockFirestoreDb.getPathData(promptPath);

    if (promptData) {
      const updatedData = {
        ...promptData,
        averageRating: newAverageRating,
        totalRatingsCount: validRatingsCount,
      };
      global.mockFirestoreDb.seedData(promptPath, updatedData);
    }

    return true;
  } catch (error) {
    console.error(`Error in mock recalculateRating for prompt ${promptId}:`, error);
    return false;
  }
};

// Utility to mock updateFavoritesCount behavior
const mockUpdateFavoritesCount = async promptId => {
  try {
    // Get all favorites for this prompt
    const favoritesPath = `prompts/${promptId}/favoritedBy`;
    const favorites = global.mockFirestoreDb.getPathData(favoritesPath) || {};

    // Count the favorites
    const favoritesCount = Object.keys(favorites).length;

    // Update the prompt
    const promptPath = `prompts/${promptId}`;
    const promptData = global.mockFirestoreDb.getPathData(promptPath);

    if (promptData) {
      const updatedData = {
        ...promptData,
        favoritesCount: favoritesCount,
      };
      global.mockFirestoreDb.seedData(promptPath, updatedData);
    }

    return true;
  } catch (error) {
    console.error(`Error in mock updateFavoritesCount for prompt ${promptId}:`, error);
    return false;
  }
};

describe('Cloud Functions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.simulateLogin(mockUser);
    global.mockFirestoreDb.clear();
    navigator.clipboard.writeText.mockClear();
  });

  describe('incrementUsageCount Cloud Function', () => {
    const testPromptId = 'test-prompt-123';
    const testPrompt = {
      id: testPromptId,
      userId: 'anotherUserId',
      title: 'Test Prompt',
      text: 'This is a test prompt content',
      category: 'Testing',
      tags: ['test', 'jest'],
      targetAiTools: ['all'],
      isPrivate: false,
      averageRating: 4,
      totalRatingsCount: 1,
      favoritesCount: 0,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      // Seed test prompt data
      global.mockFirestoreDb.seedData(`prompts/${testPromptId}`, testPrompt);
    });

    test('should call incrementUsageCount function when copying a prompt', async () => {
      // Setup a test prompt with initial usageCount of 0
      const testPromptWithCount = {
        ...testPrompt,
        usageCount: 0,
      };

      // Ensure the prompt exists in our mock DB with usageCount = 0
      global.mockFirestoreDb.seedData(`prompts/${testPromptId}`, testPromptWithCount);

      // Setup the httpsCallable mock to actually increment usage count
      const incrementUsageCountSpy = jest.fn().mockImplementation(data => {
        // Manually increment the usage count in our mock database
        const promptData = global.mockFirestoreDb.getPathData(`prompts/${data.promptId}`);
        if (promptData) {
          global.mockFirestoreDb.seedData(`prompts/${data.promptId}`, {
            ...promptData,
            usageCount: (promptData.usageCount || 0) + 1,
          });
        }
        return Promise.resolve({ data: { success: true } });
      });

      httpsCallable.mockReturnValueOnce(incrementUsageCountSpy);

      // Execute the copy action
      const result = await PromptData.copyPromptToClipboard(testPromptId);

      // Verify the function was called with the correct prompt ID
      expect(incrementUsageCountSpy).toHaveBeenCalledWith({ promptId: testPromptId });

      // Verify the prompt text was copied to clipboard
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testPrompt.text);

      // Verify the operation succeeded
      expect(result).toBe(true);

      // Verify that the usage count was incremented
      const updatedPrompt = global.mockFirestoreDb.getPathData(`prompts/${testPromptId}`);
      expect(updatedPrompt.usageCount).toBe(1);
    });

    test('should handle errors when incrementUsageCount function fails', async () => {
      // Setup the httpsCallable mock to return an error
      const mockError = new Error('Function execution failed');
      const incrementUsageCountSpy = jest.fn().mockRejectedValue(mockError);
      httpsCallable.mockReturnValueOnce(incrementUsageCountSpy);

      // Execute the copy action
      const result = await PromptData.copyPromptToClipboard(testPromptId);

      // Verify the function was called
      expect(incrementUsageCountSpy).toHaveBeenCalledWith({ promptId: testPromptId });

      // Verify error was handled
      expect(Utils.handleError).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('Firestore Triggers for Rating and Favorites', () => {
    const testPromptId = 'test-prompt-for-triggers';
    const initialPromptData = {
      userId: 'anotherUserId',
      title: 'Test Trigger Prompt',
      text: 'This is a prompt for testing Firestore triggers',
      category: 'Testing',
      tags: ['test', 'triggers'],
      targetAiTools: ['all'],
      isPrivate: false,
      averageRating: 0,
      totalRatingsCount: 0,
      favoritesCount: 0,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      // Seed test prompt data
      global.mockFirestoreDb.seedData(`prompts/${testPromptId}`, initialPromptData);
    });

    test('should add a rating document and trigger recalculateRating function', async () => {
      // Execute rating action
      await PromptData.ratePrompt(testPromptId, 4);

      // Manually simulate the Cloud Function behavior
      await mockRecalculateRating(testPromptId);

      // Verify the rating document was created
      const ratingDoc = global.mockFirestoreDb.getPathData(
        `prompts/${testPromptId}/ratings/${mockUser.uid}`
      );
      expect(ratingDoc).toBeDefined();
      expect(ratingDoc.rating).toBe(4);
      expect(ratingDoc.userId).toBe(mockUser.uid);

      // Now verify that our Cloud Function simulator correctly updated the prompt
      const updatedPromptDoc = global.mockFirestoreDb.getPathData(`prompts/${testPromptId}`);
      expect(updatedPromptDoc.averageRating).toBe(4); // Single rating value
      expect(updatedPromptDoc.totalRatingsCount).toBe(1);
    });

    test('should toggle favorite and trigger updateFavoritesCount function', async () => {
      // Execute favorite toggling (favorite)
      await PromptData.toggleFavorite(testPromptId);

      // Manually simulate the Cloud Function behavior
      await mockUpdateFavoritesCount(testPromptId);

      // Verify the favorite document was created
      const favoriteDoc = global.mockFirestoreDb.getPathData(
        `prompts/${testPromptId}/favoritedBy/${mockUser.uid}`
      );
      expect(favoriteDoc).toBeDefined();
      expect(favoriteDoc.userId).toBe(mockUser.uid);

      // Verify count was updated by our mock Cloud Function
      const updatedPromptDoc = global.mockFirestoreDb.getPathData(`prompts/${testPromptId}`);
      expect(updatedPromptDoc.favoritesCount).toBe(1);

      // Now toggle favorite again (unfavorite)
      await PromptData.toggleFavorite(testPromptId);

      // Manually simulate the Cloud Function behavior
      await mockUpdateFavoritesCount(testPromptId);

      // Verify the favorite document was removed
      const removedFavoriteDoc = global.mockFirestoreDb.getPathData(
        `prompts/${testPromptId}/favoritedBy/${mockUser.uid}`
      );
      expect(removedFavoriteDoc).toBeUndefined();

      // Verify count was updated by our mock Cloud Function
      const finalPromptDoc = global.mockFirestoreDb.getPathData(`prompts/${testPromptId}`);
      expect(finalPromptDoc.favoritesCount).toBe(0);
    });
  });
});
