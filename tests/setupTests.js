/**
 * Jest setup file for PromptFinder extension tests
 */
console.log('EXEC_ORDER: setupTests.js - START');

global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (typeof keys === 'string') result[keys] = null;
        else if (Array.isArray(keys)) keys.forEach(key => result[key] = null);
        else Object.keys(keys).forEach(key => result[key] = keys[key]); 
        setTimeout(() => callback(result), 0);
      }),
      set: jest.fn((items, callback) => {
        setTimeout(() => callback(), 0);
      }),
    },
  },
  runtime: {
    lastError: null,
    getURL: jest.fn(path => `chrome-extension://mockextid/${path}`),
    sendMessage: jest.fn((message, callback) => {
      if (callback) setTimeout(() => callback({ status: "mocked_response" }), 0);
      return Promise.resolve({ status: "mocked_response" });
    }),
    onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        hasListener: jest.fn(() => false)
    }
  },
  windows: {
    create: jest.fn((createData, callback) => {
        if(callback) setTimeout(() => callback({ id: 123 }), 0);
        return Promise.resolve({ id: 123 });
    })
  }
};

global.fetch = jest.fn();

if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: { writeText: jest.fn().mockImplementation(() => Promise.resolve()) },
  });
}

const mockUser = { uid: 'testUserId', email: 'test@example.com', displayName: 'Test User' };
const mockUserCredential = { user: mockUser };

global.window.firebaseAuth = {
  currentUser: null, 
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue(mockUserCredential),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue(mockUserCredential),
  signInWithPopup: jest.fn().mockResolvedValue(mockUserCredential), 
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn((callback) => {
    global.window.firebaseAuth._authStateCallback = callback;
    return jest.fn(); 
  }),
  _authStateCallback: null, 
  _simulateAuthStateChange: (user) => { 
    global.window.firebaseAuth.currentUser = user;
    if (global.window.firebaseAuth._authStateCallback) {
      global.window.firebaseAuth._authStateCallback(user);
    }
  }
};
console.log('EXEC_ORDER: setupTests.js - firebaseAuth mocked');

const mockDoc = (data, id) => ({
  id: id || data?.id || 'mockDocId',
  data: jest.fn(() => data),
  exists: data !== undefined && data !== null, 
});

// Create persistent mock instances for collections
const createMockCollection = () => {
    const mockDocs = {}; 
    let queryFilters = []; // Store filters for the current query chain
    const self = {
      add: jest.fn(async (data) => {
        const newId = `newMockId_${Object.keys(mockDocs).length}`;
        mockDocs[newId] = data; // Store by ID
        return Promise.resolve({ id: newId, ...mockDoc(data, newId) }); // Return a doc-like structure with id
      }),
      doc: jest.fn((docId) => ({
        id: docId, // Store the id on the doc mock itself for easier access in tests
        get: jest.fn(async () => Promise.resolve(mockDoc(mockDocs[docId], docId))),
        update: jest.fn(async (updateData) => {
            if (mockDocs[docId]) {
                mockDocs[docId] = { ...mockDocs[docId], ...updateData };
                return Promise.resolve();
            }
            return Promise.reject(new Error(`Mock doc '${docId}' not found for update`));
        }),
        delete: jest.fn(async () => {
            if (mockDocs[docId]) {
                delete mockDocs[docId];
                return Promise.resolve();
            }
            return Promise.reject(new Error(`Mock doc '${docId}' not found for delete`));
        }),
        set: jest.fn(async (setData) => {
            mockDocs[docId] = setData;
            return Promise.resolve();
        })
      })),
      where: jest.fn((field, op, value) => {
        queryFilters.push({ field, op, value });
        return self; // Return self for chaining
      }),
      get: jest.fn(async () => {
        let results = Object.entries(mockDocs).map(([id, data]) => mockDoc(data, id));
        // Apply filters accumulated in queryFilters
        queryFilters.forEach(filter => {
          results = results.filter(docInstance => {
            const docData = docInstance.data();
            if (!docData || docData[filter.field] === undefined) return false;
            switch (filter.op) {
              case '==': return docData[filter.field] === filter.value;
              case '!=': return docData[filter.field] !== filter.value;
              default: return true;
            }
          });
        });
        queryFilters = []; // Reset filters for the next independent get() call
        return Promise.resolve({
          docs: results,
          forEach: (callback) => results.forEach(callback),
          empty: results.length === 0,
        });
      }),
      _clearStore: () => { 
          for(const id in mockDocs) delete mockDocs[id]; 
          queryFilters = []; // Also clear filters
          // Deep clear jest.fn() calls for methods of this specific instance
          self.add.mockClear();
          self.doc.mockClear();
          // For doc().get, .update, .delete, .set, they are new jest.fn() per doc call, so doc() mockClear is enough.
          self.where.mockClear();
          self.get.mockClear();
      }, 
      _setDocs: (docsArray) => { 
        self._clearStore(); // Clear before setting new docs
        docsArray.forEach(doc => { if(doc && doc.id) mockDocs[doc.id] = doc; });
      },
      _getDocStore: () => mockDocs // Helper for tests to inspect internal store
    };
    return self;
};

const mockPromptsCollection = createMockCollection();
const mockUsersCollection = createMockCollection();

global.window.firebaseDb = {
  collection: jest.fn(collectionName => {
    if (collectionName === 'prompts') return mockPromptsCollection;
    if (collectionName === 'users') return mockUsersCollection;
    // Fallback for any other collection name, though we might not need it
    return createMockCollection(); 
  })
};
console.log('EXEC_ORDER: setupTests.js - firebaseDb mocked with persistent collection mocks');

global.window.firebase = {
  initializeApp: jest.fn(config => ({})),
  auth: jest.fn(() => global.window.firebaseAuth),
  firestore: jest.fn(() => global.window.firebaseDb),
  auth: Object.assign(jest.fn(() => global.window.firebaseAuth), {
    GoogleAuthProvider: jest.fn(),
    ...global.window.firebaseAuth 
  }),
  firestore: Object.assign(jest.fn(() => global.window.firebaseDb), {
    FieldValue: {
      serverTimestamp: jest.fn(() => 'MOCK_SERVER_TIMESTAMP'),
    },
    ...global.window.firebaseDb 
  }),
};
console.log('EXEC_ORDER: setupTests.js - global firebase object mocked');

window.PromptFinder = window.PromptFinder || {};
window.PromptFinder.Utils = {
  ...(window.PromptFinder.Utils || {}), 
  handleError: jest.fn((message, options) => {}),
  displayAuthError: jest.fn(),
  showConfirmationMessage: jest.fn(),
  escapeHTML: jest.fn(str => str), 
  highlightStars: jest.fn(),
  chromeStorageGet: global.chrome.storage.local.get, 
  chromeStorageSet: global.chrome.storage.local.set,
};
console.log('EXEC_ORDER: setupTests.js - END');
