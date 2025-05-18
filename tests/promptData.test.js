// import { jest } from '@jest/globals'; // Already globally available via Jest execution
import * as PromptData from '../js/promptData.js';
import * as Utils from '../js/utils.js';

// Firebase functions are globally mocked by setupTests.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'; 
import {
  addDoc,
  getDoc,
  getDocs, 
  setDoc,  
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch // Ensure writeBatch is imported if toggleFavorite uses it
} from 'firebase/firestore'; 

jest.mock('../js/utils.js', () => ({
  ...jest.requireActual('../js/utils.js'), 
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn(),
}));

if (typeof navigator === 'undefined') {
  global.navigator = {};
}
global.navigator.clipboard = {
  writeText: jest.fn(),
};

const mockUser = { uid: 'testUserId', email: 'test@example.com', displayName: 'Test User' };
const anotherUser = {
  uid: 'anotherUserId',
  email: 'another@example.com',
  displayName: 'Another User',
};


describe('PromptData Module - Firestore v9', () => {
  beforeEach(() => {
    jest.clearAllMocks(); 
    if (global.chrome && global.chrome.runtime) {
      global.chrome.runtime.lastError = null;
    }
    global.simulateLogout(); 
    global.mockFirestoreDb.clear(); 
    navigator.clipboard.writeText.mockClear();
  });

  describe('signupUser', () => {
    test('should call createUserWithEmailAndPassword, updateProfile, and setDoc for user', async () => {
      createUserWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'newUserUid', email: 'new@example.com' },
      });
      updateProfile.mockResolvedValueOnce(undefined);

      const result = await PromptData.signupUser('new@example.com', 'password123', 'New User');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(),'new@example.com','password123');
      expect(updateProfile).toHaveBeenCalledWith({ uid: 'newUserUid', email: 'new@example.com' },{ displayName: 'New User' });
      expect(result.user.uid).toBe('newUserUid');
      
      const userDoc = global.mockFirestoreDb.getPathData(`users/newUserUid`);
      expect(userDoc).toBeDefined();
      expect(userDoc.email).toBe('new@example.com');
      expect(userDoc.displayName).toBe('New User');
    });

    test('should return Promise.reject if signup fails', async () => {
      const authError = new Error('Firebase signup failed');
      createUserWithEmailAndPassword.mockRejectedValueOnce(authError);
      await expect(PromptData.signupUser('fail@example.com', 'password', 'Fail User')).rejects.toBe(authError);
      expect(Utils.handleError).toHaveBeenCalledWith(expect.stringContaining('Firebase signup failed'),expect.anything());
    });
  });

  describe('loginUser', () => {
    test('should call signInWithEmailAndPassword', async () => {
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      const result = await PromptData.loginUser('test@example.com', 'password');
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(),'test@example.com','password');
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('logoutUser', () => {
    test('should call signOut', async () => {
      await PromptData.logoutUser();
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('onAuthStateChanged', () => {
    test('should call Firebase onAuthStateChanged and pass callback', () => {
      const callback = jest.fn();
      PromptData.onAuthStateChanged(callback);
      expect(onAuthStateChanged).toHaveBeenCalledWith(expect.anything(), callback);
    });
  });

  describe('addPrompt', () => {
    beforeEach(() => {
      global.simulateLogin(mockUser);
    });

    test('should add a prompt to Firestore if user is logged in', async () => {
      const promptData = {title: 'Firestore Prompt',text: 'Text for Firestore',description: 'Desc',category: 'Cat',targetAiTools: ['Tool'],};
      const result = await PromptData.addPrompt(promptData);

      expect(addDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'prompts' }), 
        expect.objectContaining({
          userId: mockUser.uid,
          title: 'Firestore Prompt',
          isPrivate: false, 
          authorDisplayName: mockUser.displayName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );
      expect(result.id).toBeDefined(); 
      expect(result.title).toBe('Firestore Prompt');
      const addedPromptInDb = global.mockFirestoreDb.getPathData(`prompts/${result.id}`);
      expect(addedPromptInDb).toBeDefined();
      expect(addedPromptInDb.title).toBe('Firestore Prompt');
    });

    test('should return null if user is not logged in', async () => {
      global.simulateLogout();
      const result = await PromptData.addPrompt({ title: 'test' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith('User must be logged in to add a prompt.', { userVisible: true });
      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  describe('loadPrompts', () => {
    test('should load public prompts and user-specific data if logged in', async () => {
      global.simulateLogin(mockUser);
      const p1Data = {userId: mockUser.uid, title: 'My Private', isPrivate: true, averageRating: 0, totalRatingsCount: 0, favoritesCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};
      const p2Data = {userId: mockUser.uid, title: 'My Public', isPrivate: false, averageRating: 0, totalRatingsCount: 0, favoritesCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};
      const p3Data = {userId: anotherUser.uid, title: 'Other Public', isPrivate: false, averageRating: 0, totalRatingsCount: 0, favoritesCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};
      
      global.mockFirestoreDb.seedData('prompts/p1', p1Data);
      global.mockFirestoreDb.seedData('prompts/p2', p2Data);
      global.mockFirestoreDb.seedData('prompts/p3', p3Data);
      global.mockFirestoreDb.seedData(`prompts/p2/ratings/${mockUser.uid}`, { rating: 4, userId: mockUser.uid });
      global.mockFirestoreDb.seedData(`prompts/p3/favoritedBy/${mockUser.uid}`, { favoritedAt: serverTimestamp(), userId: mockUser.uid });

      const results = await PromptData.loadPrompts();
      
      expect(results.length).toBe(3);
      const p1Result = results.find(p => p.id === 'p1');
      const p2Result = results.find(p => p.id === 'p2');
      const p3Result = results.find(p => p.id === 'p3');

      expect(p1Result).toBeDefined();
      expect(p1Result.title).toBe('My Private');
      
      expect(p2Result).toBeDefined();
      expect(p2Result.title).toBe('My Public');
      expect(p2Result.currentUserRating).toBe(4);
      expect(p2Result.currentUserIsFavorite).toBe(false);

      expect(p3Result).toBeDefined();
      expect(p3Result.title).toBe('Other Public');
      expect(p3Result.currentUserIsFavorite).toBe(true);
    });
  });

  describe('findPromptById', () => {
    test('should fetch from Firestore and include user-specific data', async () => {
      global.simulateLogin(mockUser);
      const promptId = 'testDetailsId';
      const promptDataFromDb = {userId: anotherUser.uid, title: 'Details Test', isPrivate: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};
      global.mockFirestoreDb.seedData(`prompts/${promptId}`, promptDataFromDb);
      global.mockFirestoreDb.seedData(`prompts/${promptId}/ratings/${mockUser.uid}`, { rating: 5, userId: mockUser.uid });

      const result = await PromptData.findPromptById(promptId);

      expect(result.title).toBe('Details Test');
      expect(result.currentUserRating).toBe(5);
      expect(result.currentUserIsFavorite).toBe(false);
    });
  });

  describe('copyPromptToClipboard', () => {
    const promptId = 'testCopyPrompt';
    const promptText = 'Text to copy';
    const initialPromptData = { text: promptText, usageCount: 0, userId: 'anyUser', title:'Copy Title', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

    beforeEach(() => {
        global.mockFirestoreDb.seedData(`prompts/${promptId}`, {...initialPromptData, id: promptId }); 
        navigator.clipboard.writeText.mockResolvedValue(undefined);
    });

    test('should copy text and increment usageCount successfully', async () => {
      const success = await PromptData.copyPromptToClipboard(promptId);
      expect(success).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(promptText);
      const updatedPrompt = global.mockFirestoreDb.getPathData(`prompts/${promptId}`);
      expect(updatedPrompt.usageCount).toBe(1);
    });
    
    test('should return false and handle error if prompt not found', async () => {
      global.mockFirestoreDb.clear();
      const result = await PromptData.copyPromptToClipboard('nonExistentId');
      expect(result).toBe(false);
      expect(Utils.handleError).toHaveBeenCalledWith(expect.stringContaining('not found'), expect.anything());
    });

    test('should return false if clipboard write fails', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      const result = await PromptData.copyPromptToClipboard(promptId);
      expect(result).toBe(false);
      expect(Utils.handleError).toHaveBeenCalledWith(expect.stringContaining('Clipboard error'), expect.anything());
      const promptAfterAttempt = global.mockFirestoreDb.getPathData(`prompts/${promptId}`);
      expect(promptAfterAttempt.usageCount).toBe(0);
    });
  });

  describe('ratePrompt', () => {
    const promptId = 'testPromptForRating';
    const basePromptData = {
      userId: anotherUser.uid, title: 'Rating Test Prompt', text: 'Some prompt text',
      category: 'Test Category', tags: ['test'], targetAiTools: ['TestTool'],
      isPrivate: false, favoritesCount: 0, usageCount: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      global.simulateLogin(mockUser);
      global.mockFirestoreDb.clear();
      global.mockFirestoreDb.seedData(`prompts/${promptId}`, { 
        ...basePromptData, 
        averageRating: 3, 
        totalRatingsCount: 1 
      });
      global.mockFirestoreDb.seedData(`prompts/${promptId}/ratings/${anotherUser.uid}`, { 
        rating: 3, userId: anotherUser.uid, ratedAt: serverTimestamp() 
      });
    });

    test('should successfully add a new rating', async () => {
      const ratingValue = 4;
      const result = await PromptData.ratePrompt(promptId, ratingValue);

      const userRating = global.mockFirestoreDb.getPathData(`prompts/${promptId}/ratings/${mockUser.uid}`);
      expect(userRating).toEqual(expect.objectContaining({ rating: ratingValue, userId: mockUser.uid }));

      const updatedPrompt = global.mockFirestoreDb.getPathData(`prompts/${promptId}`);
      expect(updatedPrompt.averageRating).toBe(3.5);
      expect(updatedPrompt.totalRatingsCount).toBe(2);

      expect(result).not.toBeNull();
      expect(result.id).toBe(promptId);
      expect(result.currentUserRating).toBe(ratingValue);
      expect(result.averageRating).toBe(3.5);
      expect(result.totalRatingsCount).toBe(2);
    });

    test('should successfully update an existing rating', async () => {
      const initialUserRatingValue = 2;
      const updatedRatingValue = 5;
      
      global.mockFirestoreDb.seedData(`prompts/${promptId}/ratings/${mockUser.uid}`, { 
          rating: initialUserRatingValue, userId: mockUser.uid, ratedAt: serverTimestamp() 
      });
      // No longer re-seeding main prompt doc here, SUT will handle aggregate updates.

      const result = await PromptData.ratePrompt(promptId, updatedRatingValue);
      
      const userRating = global.mockFirestoreDb.getPathData(`prompts/${promptId}/ratings/${mockUser.uid}`);
      expect(userRating).toEqual(expect.objectContaining({ rating: updatedRatingValue, userId: mockUser.uid }));

      const otherRating = global.mockFirestoreDb.getPathData(`prompts/${promptId}/ratings/${anotherUser.uid}`);
      expect(otherRating).toEqual(expect.objectContaining({ rating: 3, userId: anotherUser.uid }));

      const updatedPrompt = global.mockFirestoreDb.getPathData(`prompts/${promptId}`);
      expect(updatedPrompt.averageRating).toBe(4); 
      expect(updatedPrompt.totalRatingsCount).toBe(2);
      
      expect(result).not.toBeNull();
      expect(result.currentUserRating).toBe(updatedRatingValue);
      expect(result.averageRating).toBe(4);
      expect(result.totalRatingsCount).toBe(2);
    });

    test.each([
      [0, 'Invalid rating value. Must be a number between 1 and 5.'],
      [6, 'Invalid rating value. Must be a number between 1 and 5.'],
      ['invalid', 'Invalid rating value. Must be a number between 1 and 5.']
    ])('should handle invalid rating value %p', async (invalidRating, expectedErrorMsg) => {
      const result = await PromptData.ratePrompt(promptId, invalidRating);
      expect(Utils.handleError).toHaveBeenCalledWith(expectedErrorMsg, { userVisible: true });
      expect(result).toBeNull();
      const ratings = global.mockFirestoreDb.getPathData(`prompts/${promptId}/ratings`);
      expect(Object.keys(ratings).length).toBe(1); 
      expect(ratings[anotherUser.uid]).toBeDefined();
    });

    test('should handle user not logged in', async () => {
      global.simulateLogout(); 
      const result = await PromptData.ratePrompt(promptId, 3);
      expect(Utils.handleError).toHaveBeenCalledWith('User must be logged in to rate a prompt.', { userVisible: true });
      expect(result).toBeNull();
    });
  });

  describe('toggleFavorite', () => {
    const promptId = 'testPromptForFavorite';
    const initialPromptData = {
      userId: anotherUser.uid, 
      title: 'Favorite Test Prompt',
      text: 'Prompt text for testing favorites.',
      category: 'Test Category',
      tags: ['favTest'],
      targetAiTools: ['TestTool'],
      isPrivate: false,
      averageRating: 0,
      totalRatingsCount: 0,
      favoritesCount: 0, 
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: "2024-01-01T12:00:00.000Z", 
    };
    let originalUpdatedAt; 

    beforeEach(() => {
      global.simulateLogin(mockUser); 
      global.mockFirestoreDb.clear();
      
      const promptDataForSeed = JSON.parse(JSON.stringify(initialPromptData));
      originalUpdatedAt = promptDataForSeed.updatedAt;

      global.mockFirestoreDb.seedData(`prompts/${promptId}`, promptDataForSeed);
    });

    test('should return null and call handleError if user is not logged in', async () => {
      global.simulateLogout();
      const result = await PromptData.toggleFavorite(promptId);
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith(
        'User must be logged in to change favorite status.',
        { userVisible: true }
      );
    });

    test('should return null and call handleError if no promptId is provided', async () => {
      const result = await PromptData.toggleFavorite(null);
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith(
        'No prompt ID provided for toggling favorite.',
        { userVisible: true }
      );
    });

    test('should favorite a prompt for the first time and update counts', async () => {
      const result = await PromptData.toggleFavorite(promptId);

      const favoriteDoc = global.mockFirestoreDb.getPathData(`prompts/${promptId}/favoritedBy/${mockUser.uid}`);
      expect(favoriteDoc).toBeDefined();
      expect(favoriteDoc.userId).toBe(mockUser.uid);
      expect(favoriteDoc.favoritedAt).toEqual(serverTimestamp()); 

      const mainPromptDoc = global.mockFirestoreDb.getPathData(`prompts/${promptId}`);
      expect(mainPromptDoc.favoritesCount).toBe(1);
      expect(mainPromptDoc.updatedAt).toEqual(originalUpdatedAt); 

      expect(result).not.toBeNull();
      expect(result.id).toBe(promptId);
      expect(result.currentUserIsFavorite).toBe(true);
      expect(result.favoritesCount).toBe(1);
      expect(result.updatedAt).toEqual(originalUpdatedAt);
    });

    test('should unfavorite an already favorited prompt and update counts', async () => {
      const favoritedPromptState = JSON.parse(JSON.stringify(initialPromptData));
      favoritedPromptState.favoritesCount = 1;
      originalUpdatedAt = favoritedPromptState.updatedAt; 

      global.mockFirestoreDb.seedData(`prompts/${promptId}`, favoritedPromptState);
      global.mockFirestoreDb.seedData(`prompts/${promptId}/favoritedBy/${mockUser.uid}`, { 
          favoritedAt: serverTimestamp(), userId: mockUser.uid 
      });

      const result = await PromptData.toggleFavorite(promptId);

      const favoriteDoc = global.mockFirestoreDb.getPathData(`prompts/${promptId}/favoritedBy/${mockUser.uid}`);
      expect(favoriteDoc).toBeUndefined();

      const mainPromptDoc = global.mockFirestoreDb.getPathData(`prompts/${promptId}`);
      expect(mainPromptDoc.favoritesCount).toBe(0);
      expect(mainPromptDoc.updatedAt).toEqual(originalUpdatedAt);

      expect(result).not.toBeNull();
      expect(result.id).toBe(promptId);
      expect(result.currentUserIsFavorite).toBe(false);
      expect(result.favoritesCount).toBe(0);
      expect(result.updatedAt).toEqual(originalUpdatedAt);
    });

    test('should correctly toggle favorite status multiple times ensuring updatedAt unchanged', async () => {
      let result = await PromptData.toggleFavorite(promptId); // Favorite
      expect(result.currentUserIsFavorite).toBe(true);
      expect(result.favoritesCount).toBe(1);
      let promptDoc = global.mockFirestoreDb.getPathData(`prompts/${promptId}`);
      expect(promptDoc.favoritesCount).toBe(1);
      expect(global.mockFirestoreDb.getPathData(`prompts/${promptId}/favoritedBy/${mockUser.uid}`)).toBeDefined();
      expect(promptDoc.updatedAt).toEqual(originalUpdatedAt);

      result = await PromptData.toggleFavorite(promptId); // Unfavorite
      expect(result.currentUserIsFavorite).toBe(false);
      expect(result.favoritesCount).toBe(0);
      promptDoc = global.mockFirestoreDb.getPathData(`prompts/${promptId}`);
      expect(promptDoc.favoritesCount).toBe(0);
      expect(global.mockFirestoreDb.getPathData(`prompts/${promptId}/favoritedBy/${mockUser.uid}`)).toBeUndefined();
      expect(promptDoc.updatedAt).toEqual(originalUpdatedAt);

      result = await PromptData.toggleFavorite(promptId); // Favorite again
      expect(result.currentUserIsFavorite).toBe(true);
      expect(result.favoritesCount).toBe(1);
      promptDoc = global.mockFirestoreDb.getPathData(`prompts/${promptId}`);
      expect(promptDoc.favoritesCount).toBe(1);
      expect(global.mockFirestoreDb.getPathData(`prompts/${promptId}/favoritedBy/${mockUser.uid}`)).toBeDefined();
      expect(promptDoc.updatedAt).toEqual(originalUpdatedAt); 
    });
  }); // End of describe('toggleFavorite', ...)

}); // End of describe('PromptData Module - Firestore v9', ...)
