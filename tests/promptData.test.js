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
    // createdAt and updatedAt will be Firestore Timestamps or simulated as ISO strings post-fetch
  };

  const sampleUserPromptPrivate = { ...baseSamplePrompt, id: 'userPrivate1', userId: mockUser.uid, title: 'My Private Prompt', isPrivate: true, userIsFavorite: true };
  const sampleUserPromptPublic = { ...baseSamplePrompt, id: 'userPublic1', userId: mockUser.uid, title: 'My Public Prompt', isPrivate: false };
  const sampleOtherUserPublicPrompt = { ...baseSamplePrompt, id: 'otherPublic1', userId: anotherUser.uid, title: 'Another User Public Prompt', isPrivate: false };
  const samplePublicPromptNoOwner = { ...baseSamplePrompt, id: 'publicNoOwner', userId: 'someOtherUid', title: 'Generic Public Prompt', isPrivate: false };

  beforeEach(() => {
    jest.clearAllMocks();
    chrome.runtime.lastError = null;
    window.firebaseAuth.currentUser = null;
    if (window.firebaseAuth._authStateCallback) {
      window.firebaseAuth._simulateAuthStateChange(null); 
    }
    if (window.firebaseDb.collection('prompts')._clearStore) {
        window.firebaseDb.collection('prompts')._clearStore();
    }
    if (window.firebaseDb.collection('users')._clearStore) {
        window.firebaseDb.collection('users')._clearStore();
    }
  });

  // --- Authentication Function Tests (Keep existing or add more) ---
  describe('signupUser', () => {
    test('should call createUserWithEmailAndPassword and create user doc', async () => {
      window.firebaseAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      const usersCollectionMock = window.firebaseDb.collection('users');
      const userDocMock = usersCollectionMock.doc(mockUser.uid);
      // userDocMock.set = jest.fn().mockResolvedValueOnce(undefined); // Already mocked in setup if general

      const result = await PromptData.signupUser('new@example.com', 'password123');

      expect(window.firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'password123');
      expect(usersCollectionMock.doc).toHaveBeenCalledWith(mockUser.uid);
      expect(userDocMock.set).toHaveBeenCalledWith({
        email: mockUser.email,
        displayName: mockUser.email, 
        createdAt: 'MOCK_SERVER_TIMESTAMP',
      });
      expect(result.user).toEqual(mockUser);
    });
    test('should return error if signup fails', async () => {
      const authError = new Error('Firebase signup failed');
      window.firebaseAuth.createUserWithEmailAndPassword.mockRejectedValueOnce(authError);
      const result = await PromptData.signupUser('fail@example.com', 'password');
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Firebase signup failed');
      expect(Utils.handleError).toHaveBeenCalledWith(`Signup error: ${authError.message}`, expect.anything());
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
        const unsubscribe = PromptData.onAuthStateChanged(callback);
        expect(window.firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(callback);
        expect(typeof unsubscribe).toBe('function');
    });
  });

  // --- Prompt CRUD Function Tests ---
  describe('addPrompt', () => {
    beforeEach(() => { window.firebaseAuth._simulateAuthStateChange(mockUser); });
    test('should add a prompt to Firestore if user is logged in', async () => {
      const promptData = { title: 'Firestore Prompt', text: 'Text for Firestore', category: 'FS Category', tags: ['fs', 'test'], isPrivate: false, targetAiTools: ['ChatGPT'] };
      const promptsCollectionMock = window.firebaseDb.collection('prompts');
      promptsCollectionMock.add.mockResolvedValueOnce({ id: 'firestoreDocId' });
      const result = await PromptData.addPrompt(promptData);
      expect(promptsCollectionMock.add).toHaveBeenCalledWith(expect.objectContaining({ userId: mockUser.uid, title: 'Firestore Prompt', createdAt: 'MOCK_SERVER_TIMESTAMP' }));
      expect(result.id).toBe('firestoreDocId');
    });
    test('should return null if user is not logged in', async () => {
      window.firebaseAuth._simulateAuthStateChange(null);
      const result = await PromptData.addPrompt({ title: 'test' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith("User must be logged in to add a prompt.", { userVisible: true });
    });
    test('should return null if Firestore add fails', async () => {
      window.firebaseDb.collection('prompts').add.mockRejectedValueOnce(new Error('Firestore add error'));
      const result = await PromptData.addPrompt({ title: 'test' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith('Error adding prompt to Firestore: Firestore add error', expect.anything());
    });
  });

  describe('loadPrompts', () => {
    const promptsCollectionMock = window.firebaseDb.collection('prompts');

    test('should load only public prompts if user is not logged in', async () => {
      window.firebaseAuth._simulateAuthStateChange(null); // Logged out
      promptsCollectionMock._setDocs([sampleUserPromptPublic, sampleOtherUserPublicPrompt, sampleUserPromptPrivate]);
      
      const result = await PromptData.loadPrompts();
      
      expect(promptsCollectionMock.where).toHaveBeenCalledWith('isPrivate', '==', false);
      expect(result.length).toBe(2); // Only the two public prompts
      expect(result.find(p => p.id === 'userPublic1')).toBeDefined();
      expect(result.find(p => p.id === 'otherPublic1')).toBeDefined();
      expect(result.find(p => p.id === 'userPrivate1')).toBeUndefined();
    });

    test('should load user's prompts (public & private) AND other users' public prompts if logged in', async () => {
      window.firebaseAuth._simulateAuthStateChange(mockUser); // Logged in as mockUser
      promptsCollectionMock._setDocs([
        sampleUserPromptPrivate, // mockUser's private
        sampleUserPromptPublic,    // mockUser's public
        sampleOtherUserPublicPrompt, // anotherUser's public
        { ...baseSamplePrompt, id:'anotherPrivate', userId: anotherUser.uid, isPrivate: true, title: 'Another Private'} // anotherUser's private
      ]);

      const result = await PromptData.loadPrompts();

      // Check the where calls more specifically if needed by inspecting mock.calls
      // For now, we check the combined result.
      expect(result.length).toBe(3); // mockUser's private, mockUser's public, anotherUser's public
      expect(result.find(p => p.id === 'userPrivate1')).toBeDefined();
      expect(result.find(p => p.id === 'userPublic1')).toBeDefined();
      expect(result.find(p => p.id === 'otherPublic1')).toBeDefined();
      expect(result.find(p => p.id === 'anotherPrivate')).toBeUndefined(); // Should not be loaded
    });

    test('should handle Firestore errors and return empty array', async () => {
      window.firebaseAuth._simulateAuthStateChange(null);
      promptsCollectionMock.get.mockRejectedValueOnce(new Error('Firestore query error'));
      const result = await PromptData.loadPrompts();
      expect(Utils.handleError).toHaveBeenCalledWith('Error loading prompts from Firestore: Firestore query error', expect.anything());
      expect(result).toEqual([]);
    });

    test('should correctly transform timestamps', async () => {
      window.firebaseAuth._simulateAuthStateChange(null);
      const mockDate = new Date(2024, 0, 15, 10, 30, 0); // Jan 15, 2024, 10:30:00
      const mockTimestamp = { toDate: () => mockDate }; // Firestore Timestamp-like object
      promptsCollectionMock._setDocs([{ ...samplePublicPromptNoOwner, id: 'tsTest', createdAt: mockTimestamp, updatedAt: mockTimestamp }]);
      
      const result = await PromptData.loadPrompts();
      expect(result.length).toBe(1);
      expect(result[0].createdAt).toBe(mockDate.toISOString());
      expect(result[0].updatedAt).toBe(mockDate.toISOString());
    });
  });

  // TODO: Add/Refactor describe blocks for findPromptById, updatePrompt, deletePrompt, toggleFavorite, updatePromptRating

  describe('filterPrompts', () => {
    const sampleFSData = [
        { id: 'fs1', userId: mockUser.uid, title: 'Public Favorite Alpha', text: 'alpha text', userIsFavorite: true, isPrivate: false, tags:['alpha'], category: 'A' },
        { id: 'fs2', userId: mockUser.uid, title: 'User1 Private Beta', text: 'beta text', userIsFavorite: false, isPrivate: true, tags:['beta'], category: 'B' },
        { id: 'fs3', userId: anotherUser.uid, title: 'Public Gamma', text: 'gamma text', userIsFavorite: false, isPrivate: false, tags:['gamma'], category: 'C' },
    ];
    beforeEach(() => { window.firebaseAuth._simulateAuthStateChange(mockUser); });
    test('should filter by favs tab correctly for logged in user', () => {
      const result = PromptData.filterPrompts(sampleFSData, { tab: 'favs' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('fs1');
    });
    test('should return empty for favs tab if logged out', () => {
      window.firebaseAuth._simulateAuthStateChange(null);
      const result = PromptData.filterPrompts(sampleFSData, { tab: 'favs' });
      expect(result.length).toBe(0);
    });
    test('should filter by private tab correctly for logged in user', () => {
      const result = PromptData.filterPrompts(sampleFSData, { tab: 'private' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('fs2');
    });
    test('should return empty for private tab if logged out', () => {
      window.firebaseAuth._simulateAuthStateChange(null);
      const result = PromptData.filterPrompts(sampleFSData, { tab: 'private' });
      expect(result.length).toBe(0);
    });
  });
});
