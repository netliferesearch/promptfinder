/**
 * Tests for the promptData.js module
 */
console.log('EXEC_ORDER: promptData.test.js - START (Top level)');

window.PromptFinder = window.PromptFinder || {}; 
window.PromptFinder.PromptData = {}; 

console.log('EXEC_ORDER: promptData.test.js - Before require(../js/promptData)');
require('../js/promptData'); 
console.log('EXEC_ORDER: promptData.test.js - After require(../js/promptData)');

const PromptData = window.PromptFinder.PromptData;
const Utils = window.PromptFinder.Utils; 

const mockUser = { uid: 'testUserId', email: 'test@example.com', displayName: 'Test User' };
const anotherUser = { uid: 'anotherUserId', email: 'another@example.com', displayName: 'Another User' };

describe('PromptData Module - Firestore Version', () => {
  console.log('EXEC_ORDER: promptData.test.js - Inside main describe block');
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
    targetAiTools: [], // Added for consistency with addPrompt structure
    description: '',    // Added for consistency
  };

  const samplePromptFS1 = { ...baseSamplePrompt, id: 'fs1', userId: mockUser.uid, title: 'My Firestore Prompt 1' };
  const samplePromptFS2 = { ...baseSamplePrompt, id: 'fs2', userId: anotherUser.uid, title: 'Other User FS Prompt' };
  let promptsCollectionMock; 
  let usersCollectionMock; 

  beforeEach(() => {
    console.log('EXEC_ORDER: promptData.test.js - beforeEach START');
    jest.clearAllMocks();
    chrome.runtime.lastError = null;

    if (window.firebaseAuth) {
        window.firebaseAuth.currentUser = null;
        if (window.firebaseAuth._authStateCallback) {
            window.firebaseAuth._simulateAuthStateChange(null); 
        }
    } else {
        console.error("CRITICAL_TEST_ERROR: window.firebaseAuth is undefined in promptData.test.js beforeEach!");
    }

    if (window.firebaseDb) {
        promptsCollectionMock = window.firebaseDb.collection('prompts'); 
        if (promptsCollectionMock && promptsCollectionMock._clearStore) promptsCollectionMock._clearStore();
        
        usersCollectionMock = window.firebaseDb.collection('users'); 
        if (usersCollectionMock && usersCollectionMock._clearStore) usersCollectionMock._clearStore();
    } else {
        console.error("CRITICAL_TEST_ERROR: window.firebaseDb is undefined in promptData.test.js beforeEach!");
    }
    console.log('EXEC_ORDER: promptData.test.js - beforeEach END');
  });

  // --- Authentication Function Tests ---
  describe('signupUser', () => {
    test('should call createUserWithEmailAndPassword and create user doc', async () => {
      window.firebaseAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
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
    beforeEach(() => { 
        if (window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(mockUser); 
    });
    test('should add a prompt to Firestore if user is logged in', async () => {
      const promptData = { title: 'Firestore Prompt', text: 'Text for Firestore' }; // Minimal data for test
      if(promptsCollectionMock) promptsCollectionMock.add.mockResolvedValueOnce({ id: 'firestoreDocId' });
      const result = await PromptData.addPrompt(promptData);
      if(promptsCollectionMock) expect(promptsCollectionMock.add).toHaveBeenCalledWith(expect.objectContaining({
         userId: mockUser.uid,
         title: 'Firestore Prompt',
         text: 'Text for Firestore',
         // Ensure other expected default fields are present based on addPrompt implementation
         isPrivate: false, // Assuming default from addPrompt if not provided
         authorDisplayName: mockUser.displayName || mockUser.email,
         createdAt: 'MOCK_SERVER_TIMESTAMP',
         updatedAt: 'MOCK_SERVER_TIMESTAMP' 
        }));
      if(result) expect(result.id).toBe('firestoreDocId'); else throw new Error('addPrompt returned null unexpectedly');
    });
     test('should return null if user is not logged in', async () => {
      if (window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(null); 
      const result = await PromptData.addPrompt({ title: 'test' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith("User must be logged in to add a prompt.", { userVisible: true });
      if(promptsCollectionMock) expect(promptsCollectionMock.add).not.toHaveBeenCalled(); 
    });
    test('should return null if Firestore add fails', async () => {
      if(promptsCollectionMock) promptsCollectionMock.add.mockRejectedValueOnce(new Error('Firestore add error'));
      const result = await PromptData.addPrompt({ title: 'test' });
      expect(result).toBeNull();
      expect(Utils.handleError).toHaveBeenCalledWith('Error adding prompt to Firestore: Firestore add error', expect.anything());
    });
  });

  describe('loadPrompts', () => {
    const mockDate = new Date(2024, 0, 15, 10, 30, 0);
    const mockTimestamp = { toDate: () => mockDate }; 

    test('should load only public prompts if user is not logged in', async () => {
      if(window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(null); 
      if(promptsCollectionMock) promptsCollectionMock._setDocs([
          {...samplePromptFS1, isPrivate: false, id: 'pub1' }, 
          {...samplePromptFS2, isPrivate: false, id: 'pub2' }, 
          { ...baseSamplePrompt, id:'private1', isPrivate: true, userId: mockUser.uid }
        ]);
      const result = await PromptData.loadPrompts();
      if(promptsCollectionMock) expect(promptsCollectionMock.where).toHaveBeenCalledWith('isPrivate', '==', false);
      expect(result.length).toBe(2); 
      expect(result.find(p => p.id === 'pub1')).toBeDefined();
      expect(result.find(p => p.id === 'pub2')).toBeDefined();
    });
    test('should load user's prompts (public & private) AND other users' public prompts if logged in', async () => {
      if(window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(mockUser);
      if(promptsCollectionMock) promptsCollectionMock._setDocs([
        { ...baseSamplePrompt, id: 'userPrivate1', userId: mockUser.uid, isPrivate: true, title: "User's Private" }, 
        { ...baseSamplePrompt, id: 'userPublic1', userId: mockUser.uid, isPrivate: false, title: "User's Public" },    
        { ...baseSamplePrompt, id: 'otherPublic1', userId: anotherUser.uid, isPrivate: false, title: "Another's Public" }, 
        { ...baseSamplePrompt, id:'anotherPrivate', userId: anotherUser.uid, isPrivate: true, title: "Another's Private"}
      ]);
      const result = await PromptData.loadPrompts();
      expect(result.length).toBe(3);
      expect(result.find(p => p.id === 'userPrivate1')).toBeDefined();
      expect(result.find(p => p.id === 'userPublic1')).toBeDefined();
      expect(result.find(p => p.id === 'otherPublic1')).toBeDefined();
      expect(result.find(p => p.id === 'anotherPrivate')).toBeUndefined();
    });
    test('should handle Firestore errors and return empty array', async () => {
      if(window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(null);
      if(promptsCollectionMock && promptsCollectionMock.get) promptsCollectionMock.get.mockRejectedValueOnce(new Error('Firestore query error'));
      else if (promptsCollectionMock && promptsCollectionMock.where) {
        // Mock the chained get call if .where().get() is the structure
        const chainedMock = { get: jest.fn().mockRejectedValueOnce(new Error('Firestore query error')) };
        promptsCollectionMock.where.mockReturnValue(chainedMock);
      }
      const result = await PromptData.loadPrompts();
      expect(Utils.handleError).toHaveBeenCalledWith(expect.stringContaining('Error loading prompts from Firestore'), expect.anything());
      expect(result).toEqual([]);
    });
    test('should correctly transform timestamps', async () => {
      if(window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(null);
      // Ensure the object passed to _setDocs is a complete prompt object as expected by loadPrompts transformation
      const promptForTimestampTest = {
        ...baseSamplePrompt, // Spread base to get all default fields
        id: 'tsTest', 
        userId: 'someUserId', // needs a userId even for public prompts
        isPrivate: false, // Explicitly public for this test case
        createdAt: mockTimestamp, 
        updatedAt: mockTimestamp 
      };
      if(promptsCollectionMock) promptsCollectionMock._setDocs([promptForTimestampTest]);
      
      const result = await PromptData.loadPrompts();
      expect(result.length).toBe(1);
      expect(result[0].createdAt).toBe(mockDate.toISOString());
      expect(result[0].updatedAt).toBe(mockDate.toISOString());
    });
  });

  describe('findPromptById', () => {
    const mockDate = new Date(2024, 0, 20, 12, 0, 0);
    const mockTimestamp = { toDate: () => mockDate };
    const promptWithTimestampInFS = { ...samplePromptFS1, createdAt: mockTimestamp, updatedAt: mockTimestamp };

    test('should find a prompt in a provided array if available', async () => {
      const localPrompts = [samplePromptFS1, samplePromptFS2];
      const result = await PromptData.findPromptById('fs1', localPrompts);
      expect(result).toEqual(samplePromptFS1);
      if(promptsCollectionMock) expect(promptsCollectionMock.doc).not.toHaveBeenCalled();
    });
    test('should fetch from Firestore if prompt not in provided array or no array given', async () => {
      if(promptsCollectionMock) promptsCollectionMock._setDocs([promptWithTimestampInFS]);
      const result = await PromptData.findPromptById('fs1');
      if(promptsCollectionMock) expect(promptsCollectionMock.doc).toHaveBeenCalledWith('fs1');
      expect(result.id).toBe('fs1');
      expect(result.createdAt).toBe(mockDate.toISOString());
    });
    test('should return null if prompt not found in Firestore and throwIfNotFound is false', async () => {
      if(promptsCollectionMock) promptsCollectionMock._setDocs([]);
      const result = await PromptData.findPromptById('nonExistentId');
      expect(result).toBeNull();
    });
    test('should throw error if prompt not found in Firestore and throwIfNotFound is true', async () => {
      if(promptsCollectionMock) promptsCollectionMock._setDocs([]);
      await expect(PromptData.findPromptById('nonExistentId', null, { throwIfNotFound: true }))
        .rejects.toThrow('Prompt with ID nonExistentId not found in Firestore');
      expect(Utils.handleError).toHaveBeenCalled();
    });
    test('should return null if no promptId is provided', async () => {
      const result = await PromptData.findPromptById(null);
      expect(result).toBeNull();
    });
  });

  describe('updatePrompt', () => {
    const existingPromptData = { ...samplePromptFS1, id: 'editId1', userId: mockUser.uid, title: 'Original Title' };
    beforeEach(() => {
      if (window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(mockUser); 
      if (promptsCollectionMock && promptsCollectionMock._setDocs) { 
        promptsCollectionMock._setDocs([existingPromptData]); 
      }
    });
    test('should update an existing prompt successfully', async () => {
      const updates = { title: 'Updated Title', text: 'Updated text' };
      const specificDocMock = promptsCollectionMock ? promptsCollectionMock.doc('editId1') : { get: jest.fn().mockResolvedValue({exists: true, data: () => existingPromptData}), update: jest.fn().mockResolvedValue(undefined) }; 
      const result = await PromptData.updatePrompt('editId1', updates);
      if(promptsCollectionMock) expect(promptsCollectionMock.doc).toHaveBeenCalledWith('editId1');
      if(specificDocMock) expect(specificDocMock.get).toHaveBeenCalled(); 
      if(specificDocMock) expect(specificDocMock.update).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Updated Title',
        text: 'Updated text',
        updatedAt: 'MOCK_SERVER_TIMESTAMP',
      }));
      if(result) expect(result.title).toBe('Updated Title'); else throw new Error('updatePrompt returned null unexpectedly');
    });
    test('should return null if user is not logged in', async () => {
      if (window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(null);
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
    const sampleFSData = [
        { id: 'fs1', userId: mockUser.uid, title: 'Public Favorite Alpha', text: 'alpha text', userIsFavorite: true, isPrivate: false, tags:['alpha'], category: 'A' },
        { id: 'fs2', userId: mockUser.uid, title: 'User1 Private Beta', text: 'beta text', userIsFavorite: false, isPrivate: true, tags:['beta'], category: 'B' },
        { id: 'fs3', userId: anotherUser.uid, title: 'Public Gamma', text: 'gamma text', userIsFavorite: false, isPrivate: false, tags:['gamma'], category: 'C' },
    ];
    beforeEach(() => { if(window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(mockUser); });
    test('should filter by favs tab correctly for logged in user', () => {
      const result = PromptData.filterPrompts(sampleFSData, { tab: 'favs' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('fs1');
    });
    test('should return empty for favs tab if logged out', () => {
      if(window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(null);
      const result = PromptData.filterPrompts(sampleFSData, { tab: 'favs' });
      expect(result.length).toBe(0);
    });
    test('should filter by private tab correctly for logged in user', () => {
      const result = PromptData.filterPrompts(sampleFSData, { tab: 'private' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('fs2');
    });
    test('should return empty for private tab if logged out', () => {
      if(window.firebaseAuth) window.firebaseAuth._simulateAuthStateChange(null);
      const result = PromptData.filterPrompts(sampleFSData, { tab: 'private' });
      expect(result.length).toBe(0);
    });
  });
});
