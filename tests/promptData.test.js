/**
 * Tests for the promptData.js module (ESM/v9 compatible)
 */
import { jest } from '@jest/globals';
import * as PromptData from '../js/promptData.js';
import * as Utils from '../js/utils.js';

// Firebase functions are globally mocked by setupTests.js
// We only need to import them here if we want to directly access their mock API (e.g., .mockResolvedValueOnce)
import {
  createUserWithEmailAndPassword, // For direct mock control if needed
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  // FirebaseError, // If you need to assert specific error types
} from 'firebase/auth';

import {
  addDoc,
  getDoc,
  getDocs,
  // doc, // Not directly used in tests, but used by promptData.js
  // setDoc,
  // updateDoc,
  // deleteDoc,
  // collection,
  // query,
  // where,
  // serverTimestamp,
  // Timestamp,
  // increment,
  // writeBatch
} from 'firebase/firestore';

jest.mock('../js/utils.js', () => ({
  ...jest.requireActual('../js/utils.js'),
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn(),
}));

const mockUser = { uid: 'testUserId', email: 'test@example.com', displayName: 'Test User' };
const anotherUser = {
  uid: 'anotherUserId',
  email: 'another@example.com',
  displayName: 'Another User',
};

describe('PromptData Module - Firestore v9', () => {
  // baseSamplePrompt removed as it was unused in the refactored tests

  beforeEach(() => {
    jest.clearAllMocks();
    if (global.chrome && global.chrome.runtime) {
      // Ensure chrome mock is always available
      global.chrome.runtime.lastError = null;
    }
    global.simulateLogout();
    global.mockFirestoreDb.clear();
  });

  describe('signupUser', () => {
    test('should call createUserWithEmailAndPassword, updateProfile, and setDoc for user', async () => {
      createUserWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'newUserUid', email: 'new@example.com' },
      });
      updateProfile.mockResolvedValueOnce(undefined);
      // setDoc is globally mocked, we don't need to mock it again here unless for specific behavior
      // setDoc.mockResolvedValueOnce(undefined);

      const result = await PromptData.signupUser('new@example.com', 'password123', 'New User');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'new@example.com',
        'password123'
      );
      expect(updateProfile).toHaveBeenCalledWith(
        { uid: 'newUserUid', email: 'new@example.com' },
        { displayName: 'New User' }
      );
      // We trust the global setDoc mock to have been called by the SUT
      // To verify setDoc call more specifically, we would need to spy on it or check mockFirestoreData
      expect(result.user.uid).toBe('newUserUid');
    });

    test('should return Promise.reject if signup fails', async () => {
      const authError = new Error('Firebase signup failed');
      createUserWithEmailAndPassword.mockRejectedValueOnce(authError);
      await expect(PromptData.signupUser('fail@example.com', 'password', 'Fail User')).rejects.toBe(
        authError
      );
      expect(Utils.handleError).toHaveBeenCalledWith(
        expect.stringContaining('Firebase signup failed'),
        expect.anything()
      );
    });
  });

  describe('loginUser', () => {
    test('should call signInWithEmailAndPassword', async () => {
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      const result = await PromptData.loginUser('test@example.com', 'password');
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password'
      );
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
      const promptData = {
        title: 'Firestore Prompt',
        text: 'Text for Firestore',
        description: 'Desc',
        category: 'Cat',
        targetAiTools: ['Tool'],
      };
      addDoc.mockResolvedValueOnce({ id: 'firestoreDocId' });

      const result = await PromptData.addPrompt(promptData);

      expect(addDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'prompts' }),
        expect.objectContaining({
          userId: mockUser.uid,
          title: 'Firestore Prompt',
          text: 'Text for Firestore',
          description: 'Desc',
          category: 'Cat',
          targetAiTools: ['Tool'],
          isPrivate: false,
          authorDisplayName: mockUser.displayName,
        })
      );
      expect(result.id).toBe('firestoreDocId');
      expect(result.title).toBe('Firestore Prompt');
      expect(result.currentUserIsFavorite).toBe(false);
      expect(result.currentUserRating).toBe(0);
    });

    test('should return null if user is not logged in', async () => {
      global.simulateLogout();
      const result = await PromptData.addPrompt({ title: 'test' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith('User must be logged in to add a prompt.', {
        userVisible: true,
      });
      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  describe('loadPrompts', () => {
    test('should load public prompts and user-specific data if logged in', async () => {
      global.simulateLogin(mockUser);
      const prompt1 = {
        id: 'p1',
        userId: mockUser.uid,
        title: 'My Private',
        isPrivate: true,
        averageRating: 0,
        totalRatingsCount: 0,
        favoritesCount: 0,
      };
      const prompt2 = {
        id: 'p2',
        userId: mockUser.uid,
        title: 'My Public',
        isPrivate: false,
        averageRating: 0,
        totalRatingsCount: 0,
        favoritesCount: 0,
      };
      const prompt3 = {
        id: 'p3',
        userId: anotherUser.uid,
        title: 'Other Public',
        isPrivate: false,
        averageRating: 0,
        totalRatingsCount: 0,
        favoritesCount: 0,
      };
      // const _prompt4 = { id: 'p4', userId: anotherUser.uid, title: 'Other Private', isPrivate: true, averageRating: 0, totalRatingsCount: 0, favoritesCount: 0 };

      getDocs.mockImplementation(async queryObj => {
        if (
          queryObj.constraints &&
          queryObj.constraints.some(c => c.field === 'userId' && c.value === mockUser.uid)
        ) {
          return {
            docs: [
              { id: 'p1', data: () => prompt1 },
              { id: 'p2', data: () => prompt2 },
            ],
            empty: false,
            forEach: function (_cb) {
              this.docs.forEach(_cb);
            },
          };
        } else if (
          queryObj.constraints &&
          queryObj.constraints.some(c => c.field === 'isPrivate' && c.value === false)
        ) {
          // This mock should return all public prompts (p2 and p3)
          return {
            docs: [
              { id: 'p2', data: () => prompt2 },
              { id: 'p3', data: () => prompt3 },
            ],
            empty: false,
            forEach: function (_cb) {
              this.docs.forEach(_cb);
            },
          };
        }
        return { docs: [], empty: true, forEach: _cb => [] };
      });

      getDoc.mockImplementation(async docRef => {
        if (docRef.path.startsWith('prompts/p2/ratings') && docRef.id === mockUser.uid)
          return { exists: () => true, data: () => ({ rating: 4 }) };
        if (docRef.path.startsWith('prompts/p3/favoritedBy') && docRef.id === mockUser.uid)
          return { exists: () => true, data: () => ({ favoritedAt: 'mock_timestamp' }) };
        return { exists: () => false, data: () => undefined };
      });

      const results = await PromptData.loadPrompts();
      expect(results.length).toBe(3);
      expect(results.find(p => p.id === 'p1')).toBeDefined();
      expect(results.find(p => p.id === 'p2')).toBeDefined();
      expect(results.find(p => p.id === 'p3')).toBeDefined();

      const p2Result = results.find(p => p.id === 'p2');
      expect(p2Result.currentUserRating).toBe(4);
      expect(p2Result.currentUserIsFavorite).toBe(false);

      const p3Result = results.find(p => p.id === 'p3');
      expect(p3Result.currentUserIsFavorite).toBe(true);
    });
  });

  describe('findPromptById', () => {
    test('should fetch from Firestore and include user-specific data', async () => {
      global.simulateLogin(mockUser);
      const promptData = {
        id: 'testId',
        userId: anotherUser.uid,
        title: 'Details Test',
        isPrivate: false,
      };

      getDoc.mockImplementation(async docRef => {
        if (docRef.path === 'prompts/testId')
          return { exists: () => true, data: () => promptData, id: 'testId' };
        if (docRef.path === `prompts/testId/ratings/${mockUser.uid}`)
          return { exists: () => true, data: () => ({ rating: 5 }) };
        if (docRef.path === `prompts/testId/favoritedBy/${mockUser.uid}`)
          return { exists: () => false };
        return { exists: () => false, data: () => undefined };
      });

      const result = await PromptData.findPromptById('testId');
      expect(getDoc).toHaveBeenCalledWith(expect.objectContaining({ path: 'prompts/testId' }));
      expect(result.title).toBe('Details Test');
      expect(result.currentUserRating).toBe(5);
      expect(result.currentUserIsFavorite).toBe(false);
    });
  });
});
