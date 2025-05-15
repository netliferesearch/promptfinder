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
    return jest.fn(); // Return an unsubscribe function
  }),
  _authStateCallback: null, // Store the callback
  _simulateAuthStateChange: (user) => { // Helper to trigger auth state change
    global.window.firebaseAuth.currentUser = user;
    if (global.window.firebaseAuth._authStateCallback) {
      global.window.firebaseAuth._authStateCallback(user);
    }
  }
};
console.log('EXEC_ORDER: setupTests.js - firebaseAuth mocked');

const mockDocSnapshot = (data, id) => ({
  id: id || data?.id || 'mockDocId',
  data: jest.fn(() => data),
  exists: data !== undefined && data !== null, 
});

// Create persistent mock instances for collections and their documents
const createMockCollection = () => {
    const _docsStore = {}; // Internal store for documents in this collection <docId, data>
    const _docMocks = {}; // Cache for document mock objects <docId, mockDocObject>
    let _queryFilters = [];

    const getOrCreateDocMock = (docId) => {
        if (!_docMocks[docId]) {
            _docMocks[docId] = {
                id: docId,
                get: jest.fn(async () => Promise.resolve(mockDocSnapshot(_docsStore[docId], docId))),
                update: jest.fn(async (updateData) => {
                    if (_docsStore[docId] !== undefined) { // Check for undefined to allow null values
                        _docsStore[docId] = { ..._docsStore[docId], ...updateData };
                        return Promise.resolve();
                    }
                    return Promise.reject(new Error(`Mock doc '${docId}' not found for update`));
                }),
                delete: jest.fn(async () => {
                    if (_docsStore[docId] !== undefined) {
                        delete _docsStore[docId];
                        delete _docMocks[docId]; // Remove doc mock too
                        return Promise.resolve();
                    }
                    return Promise.reject(new Error(`Mock doc '${docId}' not found for delete`));
                }),
                set: jest.fn(async (setData) => {
                    _docsStore[docId] = setData;
                    return Promise.resolve();
                })
            };
        }
        return _docMocks[docId];
    };

    const self = {
      add: jest.fn(async (data) => {
        const newId = `newMockId_${Object.keys(_docsStore).length}`;
        _docsStore[newId] = data; 
        getOrCreateDocMock(newId); 
        return Promise.resolve({ id: newId }); // Firestore add returns a DocumentReference-like object with an id
      }),
      doc: jest.fn(getOrCreateDocMock),
      where: jest.fn((field, op, value) => {
        _queryFilters.push({ field, op, value });
        return self; 
      }),
      get: jest.fn(async () => {
        let results = Object.entries(_docsStore).map(([id, data]) => mockDocSnapshot(data, id));
        _queryFilters.forEach(filter => {
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
        _queryFilters = []; 
        return Promise.resolve({
          docs: results,
          forEach: (callback) => results.forEach(callback),
          empty: results.length === 0,
        });
      }),
      _clearStore: () => { 
          for(const id in _docsStore) delete _docsStore[id];
          for(const id in _docMocks) delete _docMocks[id];
          _queryFilters = []; 
          self.add.mockClear();
          self.doc.mockClear();
          self.where.mockClear();
          self.get.mockClear();
      }, 
      _setDocs: (docsArray) => { 
        self._clearStore(); 
        docsArray.forEach(doc => { if(doc && doc.id) _docsStore[doc.id] = doc; });
      },
      _getDocStore: () => _docsStore 
    };
    return self;
};

const mockPromptsCollection = createMockCollection();
const mockUsersCollection = createMockCollection();

global.window.firebaseDb = {
  collection: jest.fn(collectionName => {
    if (collectionName === 'prompts') return mockPromptsCollection;
    if (collectionName === 'users') return mockUsersCollection;
    return createMockCollection(); // Fallback for any other collection
  })
};
console.log('EXEC_ORDER: setupTests.js - firebaseDb mocked with persistent collection mocks');

global.window.firebase = {
  initializeApp: jest.fn(config => ({})),
  auth: jest.fn(() => global.window.firebaseAuth), // Main way to get auth instance
  firestore: jest.fn(() => global.window.firebaseDb), // Main way to get firestore instance
  // For compat version, firebase.auth.X and firebase.firestore.X might also be used directly
  auth: Object.assign(jest.fn(() => global.window.firebaseAuth), { // Ensures firebase.auth is a function and an object
    GoogleAuthProvider: jest.fn(),
    // Spreading the actual auth methods directly onto firebase.auth if compat SDK accesses them that way
    // This might be redundant if the above auth: jest.fn() is always used by the SDK
    ...Object.keys(global.window.firebaseAuth).reduce((acc, key) => {
        if (typeof global.window.firebaseAuth[key] === 'function') {
            acc[key] = global.window.firebaseAuth[key];
        }
        return acc;
    }, {}),
  }),
  firestore: Object.assign(jest.fn(() => global.window.firebaseDb), {
    FieldValue: {
      serverTimestamp: jest.fn(() => 'MOCK_SERVER_TIMESTAMP'),
    },
    // Spreading collection, doc etc. if SDK accesses firebase.firestore.collection directly
    ...Object.keys(global.window.firebaseDb).reduce((acc, key) => {
        if (typeof global.window.firebaseDb[key] === 'function') {
            acc[key] = global.window.firebaseDb[key];
        }
        return acc;
    }, {}),
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
