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

  // Sample prompts for testing, mirroring Firestore structure (without live timestamps initially)
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
    const promptsCollectionMock = window.firebaseDb.collection('prompts');
    test('should load only public prompts if user is not logged in', async () => {
      window.firebaseAuth._simulateAuthStateChange(null); 
      promptsCollectionMock._setDocs([samplePromptFS1, samplePromptFS2, { ...samplePromptFS1, id:'private1', isPrivate: true, userId: mockUser.uid }]);
      const result = await PromptData.loadPrompts();
      expect(promptsCollectionMock.where).toHaveBeenCalledWith('isPrivate', '==', false);
      expect(result.length).toBe(2); 
      expect(result.find(p => p.id === 'fs1')).toBeDefined();
      expect(result.find(p => p.id === 'fs2')).toBeDefined();
    });
     // ... other loadPrompts tests ...
  });

  describe('findPromptById', () => {
    const promptsCollectionMock = window.firebaseDb.collection('prompts');
    const mockDate = new Date(2024, 0, 20, 12, 0, 0);
    const mockTimestamp = { toDate: () => mockDate }; // Firestore Timestamp-like object
    const promptWithTimestamp = { ...samplePromptFS1, createdAt: mockTimestamp, updatedAt: mockTimestamp };

    test('should find a prompt in a provided array if available', async () => {
      const localPrompts = [samplePromptFS1, samplePromptFS2];
      const result = await PromptData.findPromptById('fs1', localPrompts);
      expect(result).toEqual(samplePromptFS1);
      expect(promptsCollectionMock.doc).not.toHaveBeenCalled();
    });

    test('should fetch from Firestore if prompt not in provided array or no array given', async () => {
      promptsCollectionMock._setDocs([promptWithTimestamp]);
      const result = await PromptData.findPromptById('fs1');
      expect(promptsCollectionMock.doc).toHaveBeenCalledWith('fs1');
      expect(result).toBeDefined();
      expect(result.id).toBe('fs1');
      expect(result.title).toBe(samplePromptFS1.title);
      expect(result.createdAt).toBe(mockDate.toISOString()); // Check timestamp transformation
    });

    test('should return null if prompt not found in Firestore and throwIfNotFound is false', async () => {
      promptsCollectionMock._setDocs([]); // Ensure collection is empty or doesn't have the ID
      const result = await PromptData.findPromptById('nonExistentId');
      expect(result).toBeNull();
      expect(Utils.handleError).not.toHaveBeenCalled(); // If handleError option is false/default
    });

    test('should throw error if prompt not found in Firestore and throwIfNotFound is true', async () => {
      promptsCollectionMock._setDocs([]);
      await expect(PromptData.findPromptById('nonExistentId', null, { throwIfNotFound: true }))
        .rejects.toThrow('Prompt with ID nonExistentId not found in Firestore');
      expect(Utils.handleError).toHaveBeenCalled(); // As findPromptById calls it if throwIfNotFound
    });

    test('should return null if no promptId is provided', async () => {
      const result = await PromptData.findPromptById(null);
      expect(result).toBeNull();
      expect(promptsCollectionMock.doc).not.toHaveBeenCalled();
    });

    test('should return null and handle error if Firestore is not initialized', async () => {
        const originalDb = window.firebaseDb;
        window.firebaseDb = null; // Simulate uninitialized Firestore
        const result = await PromptData.findPromptById('fs1');
        expect(result).toBeNull();
        expect(Utils.handleError).toHaveBeenCalledWith("[findPromptById] Firestore not initialized.", {userVisible: true});
        window.firebaseDb = originalDb; // Restore for other tests
    });
  });

  // TODO: Refactor tests for updatePrompt, deletePrompt, toggleFavorite, updatePromptRating

  describe('filterPrompts', () => {
    // ... existing refactored filterPrompts tests ...
  });
});
