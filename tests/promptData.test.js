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
  let promptsCollectionMock; // Define here, assign in beforeEach
  let usersCollectionMock; // Define here, assign in beforeEach

  beforeEach(() => {
    jest.clearAllMocks();
    chrome.runtime.lastError = null;
    window.firebaseAuth.currentUser = null;
    if (window.firebaseAuth._authStateCallback) {
      window.firebaseAuth._simulateAuthStateChange(null); 
    }
    promptsCollectionMock = window.firebaseDb.collection('prompts'); // Assign here
    if (promptsCollectionMock._clearStore) promptsCollectionMock._clearStore();
    
    usersCollectionMock = window.firebaseDb.collection('users'); // Assign here
    if (usersCollectionMock._clearStore) usersCollectionMock._clearStore();
  });

  // --- Authentication Function Tests ---
  describe('signupUser', () => {
    test('should call createUserWithEmailAndPassword and create user doc', async () => {
      window.firebaseAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      // usersCollectionMock is already defined and refers to the 'users' collection mock
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
      promptsCollectionMock.add.mockResolvedValueOnce({ id: 'firestoreDocId' });
      const result = await PromptData.addPrompt(promptData);
      expect(promptsCollectionMock.add).toHaveBeenCalledWith(expect.objectContaining({ userId: mockUser.uid, title: 'Firestore Prompt' }));
      expect(result.id).toBe('firestoreDocId');
    });
    // ... other addPrompt tests from previous correct version ...
     test('should return null if user is not logged in', async () => {
      window.firebaseAuth._simulateAuthStateChange(null); // Log out user
      const result = await PromptData.addPrompt({ title: 'test' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith("User must be logged in to add a prompt.", { userVisible: true });
      expect(promptsCollectionMock.add).not.toHaveBeenCalled();
    });
    test('should return null if Firestore add fails', async () => {
      promptsCollectionMock.add.mockRejectedValueOnce(new Error('Firestore add error'));
      const result = await PromptData.addPrompt({ title: 'test' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith('Error adding prompt to Firestore: Firestore add error', expect.anything());
    });
  });

  describe('loadPrompts', () => {
    // ... existing refactored loadPrompts tests ...
    test('should load only public prompts if user is not logged in', async () => {
      window.firebaseAuth._simulateAuthStateChange(null); 
      promptsCollectionMock._setDocs([samplePromptFS1, samplePromptFS2, { ...samplePromptFS1, id:'private1', isPrivate: true, userId: mockUser.uid }]);
      const result = await PromptData.loadPrompts();
      expect(promptsCollectionMock.where).toHaveBeenCalledWith('isPrivate', '==', false);
      expect(result.length).toBe(2); 
      expect(result.find(p => p.id === 'fs1')).toBeDefined();
      expect(result.find(p => p.id === 'fs2')).toBeDefined();
    });
  });

  describe('findPromptById', () => {
    // ... existing refactored findPromptById tests ...
    test('should fetch from Firestore if prompt not in provided array or no array given', async () => {
      promptsCollectionMock._setDocs([samplePromptFS1]);
      const result = await PromptData.findPromptById('fs1');
      expect(promptsCollectionMock.doc).toHaveBeenCalledWith('fs1');
      expect(result.id).toBe('fs1');
    });
  });

  describe('updatePrompt', () => {
    const existingPromptData = { ...samplePromptFS1, id: 'editId1', userId: mockUser.uid, title: 'Original Title' };

    beforeEach(() => {
      window.firebaseAuth._simulateAuthStateChange(mockUser); 
      promptsCollectionMock._setDocs([existingPromptData]); 
    });

    test('should update an existing prompt successfully', async () => {
      const updates = { title: 'Updated Title', text: 'Updated text' };
      const specificDocMock = promptsCollectionMock.doc('editId1'); 
      const result = await PromptData.updatePrompt('editId1', updates);
      expect(promptsCollectionMock.doc).toHaveBeenCalledWith('editId1');
      expect(specificDocMock.get).toHaveBeenCalled(); 
      expect(specificDocMock.update).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Updated Title',
        text: 'Updated text',
        updatedAt: 'MOCK_SERVER_TIMESTAMP',
      }));
      expect(result.title).toBe('Updated Title');
    });
    // ... other updatePrompt tests from previous correct version ...
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
  });

  describe('filterPrompts', () => {
    // ... existing refactored filterPrompts tests ...
  });
});
