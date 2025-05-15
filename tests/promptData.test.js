/**
 * Tests for the promptData.js module
 */

window.PromptFinder = window.PromptFinder || {}; 
window.PromptFinder.PromptData = {}; 

require('../js/promptData'); 

const PromptData = window.PromptFinder.PromptData;
const Utils = window.PromptFinder.Utils; 

const mockUser = { uid: 'testUserId', email: 'test@example.com', displayName: 'Test User' };
const anotherUser = { uid: 'anotherUserId', email: 'another@example.com', displayName: 'Another User' };

describe('PromptData Module - Firestore Version', () => {
  const baseSamplePrompt = {
    title: 'Sample Prompt',
    text: 'Sample text',
    category: 'Testing',
    tags: ['test', 'sample'],
    isPrivate: false,
    userRating: 0,
    userIsFavorite: false,
    averageRating: 0,
    totalRatingsCount: 0,
    favoritesCount: 0,
    usageCount: 0,
  };

  const samplePromptFS1 = { ...baseSamplePrompt, id: 'fs1', userId: mockUser.uid, title: 'My Firestore Prompt 1' };
  const samplePromptFS2 = { ...baseSamplePrompt, id: 'fs2', userId: anotherUser.uid, title: 'Other User FS Prompt' };

  beforeEach(() => {
    jest.clearAllMocks();
    chrome.runtime.lastError = null;
    window.firebaseAuth.currentUser = null;
    if (window.firebaseAuth._authStateCallback) {
      window.firebaseAuth._simulateAuthStateChange(null); 
    }
    const promptsCollectionMock = window.firebaseDb.collection('prompts');
    if (promptsCollectionMock._clearStore) promptsCollectionMock._clearStore();
    
    const usersCollectionMock = window.firebaseDb.collection('users');
    if (usersCollectionMock._clearStore) usersCollectionMock._clearStore();
  });

  // --- Authentication Function Tests ---
  // ... (signupUser, loginUser, logoutUser, onAuthStateChanged tests remain as is) ...
  describe('signupUser', () => {
    test('should call createUserWithEmailAndPassword and create user doc', async () => {
      window.firebaseAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      const usersCollectionMock = window.firebaseDb.collection('users');
      const userDocMock = usersCollectionMock.doc(mockUser.uid);
      const result = await PromptData.signupUser('new@example.com', 'password123');
      expect(window.firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'password123');
      expect(usersCollectionMock.doc).toHaveBeenCalledWith(mockUser.uid);
      expect(userDocMock.set).toHaveBeenCalledWith(expect.objectContaining({ email: mockUser.email, createdAt: 'MOCK_SERVER_TIMESTAMP' }));
      expect(result.user).toEqual(mockUser);
    });
    test('should return error if signup fails', async () => {
      const authError = new Error('Firebase signup failed');
      window.firebaseAuth.createUserWithEmailAndPassword.mockRejectedValueOnce(authError);
      const result = await PromptData.signupUser('fail@example.com', 'password');
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('loginUser', () => {
    test('should call signInWithEmailAndPassword', async () => {
        window.firebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
        const result = await PromptData.loginUser('test@example.com', 'password');
        expect(window.firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password');
        expect(result.user).toEqual(mockUser);
    });
  });

  describe('logoutUser', () => {
    test('should call signOut', async () => {
        await PromptData.logoutUser();
        expect(window.firebaseAuth.signOut).toHaveBeenCalled();
    });
  });

  describe('onAuthStateChanged', () => {
    test('should call Firebase onAuthStateChanged and pass callback', () => {
        const callback = jest.fn();
        PromptData.onAuthStateChanged(callback);
        expect(window.firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(callback);
    });
  });

  // --- Prompt CRUD Function Tests ---
  describe('addPrompt', () => {
    beforeEach(() => { window.firebaseAuth._simulateAuthStateChange(mockUser); });
    test('should add a prompt to Firestore if user is logged in', async () => {
      const promptData = { title: 'Firestore Prompt', text: 'Text for Firestore' };
      const promptsCollectionMock = window.firebaseDb.collection('prompts');
      promptsCollectionMock.add.mockResolvedValueOnce({ id: 'firestoreDocId' });
      const result = await PromptData.addPrompt(promptData);
      expect(promptsCollectionMock.add).toHaveBeenCalledWith(expect.objectContaining({ userId: mockUser.uid, title: 'Firestore Prompt' }));
      expect(result.id).toBe('firestoreDocId');
    });
    // ... other addPrompt tests ...
  });

  describe('loadPrompts', () => {
    // ... existing refactored loadPrompts tests ...
  });

  describe('findPromptById', () => {
    // ... existing refactored findPromptById tests ...
  });

  describe('updatePrompt', () => {
    const promptsCollectionMock = window.firebaseDb.collection('prompts');
    const existingPrompt = { ...samplePromptFS1, id: 'editId1', userId: mockUser.uid, title: 'Original Title' };

    beforeEach(() => {
      window.firebaseAuth._simulateAuthStateChange(mockUser); // Log in user
      promptsCollectionMock._setDocs([existingPrompt]); // Set up an existing prompt by the user
    });

    test('should update an existing prompt successfully', async () => {
      const updates = { title: 'Updated Title', text: 'Updated text' };
      const result = await PromptData.updatePrompt('editId1', updates);

      expect(promptsCollectionMock.doc).toHaveBeenCalledWith('editId1');
      const docMock = promptsCollectionMock.doc(); // Get the mock doc reference
      expect(docMock.get).toHaveBeenCalled();
      expect(docMock.update).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Updated Title',
        text: 'Updated text',
        updatedAt: 'MOCK_SERVER_TIMESTAMP',
      }));
      expect(result).toBeDefined();
      expect(result.id).toBe('editId1');
      expect(result.title).toBe('Updated Title');
      expect(result.text).toBe('Updated text');
    });

    test('should return null if user is not logged in', async () => {
      window.firebaseAuth._simulateAuthStateChange(null);
      const result = await PromptData.updatePrompt('editId1', { title: 'New' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith("User must be logged in to update a prompt.", { userVisible: true });
    });

    test('should return null if prompt not found', async () => {
      const result = await PromptData.updatePrompt('nonExistentId', { title: 'New' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith("Prompt with ID nonExistentId not found for update.", { userVisible: true });
    });

    test('should return null if user does not own the prompt', async () => {
      const otherUserPrompt = { ...samplePromptFS2, id: 'otherUserEditId', userId: anotherUser.uid };
      promptsCollectionMock._setDocs([otherUserPrompt]); // Add another user's prompt
      
      const result = await PromptData.updatePrompt('otherUserEditId', { title: 'New Title by me' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith("You do not have permission to update this prompt.", { userVisible: true });
    });

    test('should return null if no updates are provided', async () => {
        const result = await PromptData.updatePrompt('editId1', {});
        expect(result).toBeNull();
        expect(Utils.handleError).toHaveBeenCalledWith("No updates provided for the prompt.", { userVisible: true });
    });

    test('should return null if Firestore update fails', async () => {
        const docMock = promptsCollectionMock.doc();
        docMock.update.mockRejectedValueOnce(new Error('Firestore update error'));
        const result = await PromptData.updatePrompt('editId1', { title: 'New' });
        expect(result).toBeNull();
        expect(Utils.handleError).toHaveBeenCalledWith('Error updating prompt editId1 in Firestore: Firestore update error', expect.anything());
    });
  });

  // TODO: Refactor tests for deletePrompt, toggleFavorite, updatePromptRating

  describe('filterPrompts', () => {
    // ... existing refactored filterPrompts tests ...
  });
});
