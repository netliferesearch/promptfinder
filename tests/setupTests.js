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
        else if (Array.isArray(keys)) keys.forEach(key => (result[key] = null));
        else Object.keys(keys).forEach(key => (result[key] = keys[key]));
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
      if (callback) setTimeout(() => callback({ status: 'mocked_response' }), 0);
      return Promise.resolve({ status: 'mocked_response' });
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(() => false),
    },
    getContexts: jest.fn().mockResolvedValue([]), // Mock for chrome.runtime.getContexts
  },
  windows: {
    create: jest.fn((createData, callback) => {
      if (callback) setTimeout(() => callback({ id: 123 }), 0);
      return Promise.resolve({ id: 123 });
    }),
  },
  offscreen: {
    // Mock for chrome.offscreen API
    createDocument: jest.fn().mockResolvedValue(undefined),
    closeDocument: jest.fn().mockResolvedValue(undefined),
    hasDocument: jest.fn().mockResolvedValue(false), // or true depending on test needs
  },
};

if (typeof navigator !== 'undefined' && !navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: { writeText: jest.fn().mockImplementation(() => Promise.resolve()) },
  });
} else if (typeof navigator === 'undefined') {
  global.navigator = {
    clipboard: {
      writeText: jest.fn().mockImplementation(() => Promise.resolve()),
    },
  };
}

const mockUser = { uid: 'testUserId', email: 'test@example.com', displayName: 'Test User' };
const mockUserCredential = { user: mockUser };

global.window.firebaseAuth = {
  currentUser: null,
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue(mockUserCredential),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue(mockUserCredential),
  signInWithPopup: jest.fn().mockResolvedValue(mockUserCredential),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn(callback => {
    global.window.firebaseAuth._authStateCallback = callback;
    return jest.fn();
  }),
  _authStateCallback: null,
  _simulateAuthStateChange: user => {
    global.window.firebaseAuth.currentUser = user;
    if (global.window.firebaseAuth._authStateCallback) {
      global.window.firebaseAuth._authStateCallback(user);
    }
  },
};
console.log('EXEC_ORDER: setupTests.js - firebaseAuth mocked');

const mockDocSnapshot = (data, id) => ({
  id: id || data?.id || 'mockDocId',
  data: jest.fn(() => data),
  exists: data !== undefined && data !== null,
});

const createMockCollection = () => {
  const _docsStore = {};
  const _docMocks = {};
  let _queryFilters = [];

  const getOrCreateDocMock = docId => {
    if (!_docMocks[docId]) {
      _docMocks[docId] = {
        id: docId,
        get: jest.fn(async () => {
          console.log(`[Mock Firestore] doc('${docId}').get() called. Data:`, _docsStore[docId]);
          return Promise.resolve(mockDocSnapshot(_docsStore[docId], docId));
        }),
        update: jest.fn(async updateData => {
          console.log(`[Mock Firestore] doc('${docId}').update() called with:`, updateData);
          if (_docsStore[docId] !== undefined) {
            _docsStore[docId] = { ..._docsStore[docId], ...updateData };
            return Promise.resolve();
          }
          return Promise.reject(new Error(`Mock doc '${docId}' not found for update`));
        }),
        delete: jest.fn(async () => {
          console.log(`[Mock Firestore] doc('${docId}').delete() called.`);
          if (_docsStore[docId] !== undefined) {
            delete _docsStore[docId];
            delete _docMocks[docId];
            return Promise.resolve();
          }
          return Promise.reject(new Error(`Mock doc '${docId}' not found for delete`));
        }),
        set: jest.fn(async setData => {
          console.log(`[Mock Firestore] doc('${docId}').set() called with:`, setData);
          _docsStore[docId] = setData;
          return Promise.resolve();
        }),
      };
    }
    return _docMocks[docId];
  };

  const self = {
    add: jest.fn(async data => {
      const newId = `newMockId_${Object.keys(_docsStore).length}`;
      console.log(`[Mock Firestore] collection.add() called. New ID: ${newId}, Data:`, data);
      _docsStore[newId] = data;
      getOrCreateDocMock(newId);
      return Promise.resolve({ id: newId });
    }),
    doc: jest.fn(getOrCreateDocMock),
    where: jest.fn((field, op, value) => {
      _queryFilters.push({ field, op, value });
      return self;
    }),
    get: jest.fn(async () => {
      console.log(`[Mock Firestore] collection.get() called with filters:`, _queryFilters);
      let results = Object.entries(_docsStore).map(([id, data]) => mockDocSnapshot(data, id));
      _queryFilters.forEach(filter => {
        results = results.filter(docInstance => {
          const docData = docInstance.data();
          if (!docData || docData[filter.field] === undefined) return false;
          switch (filter.op) {
            case '==':
              return docData[filter.field] === filter.value;
            case '!=':
              return docData[filter.field] !== filter.value;
            default:
              return true;
          }
        });
      });
      _queryFilters = [];
      console.log(`[Mock Firestore] collection.get() returning ${results.length} docs.`);
      return Promise.resolve({
        docs: results,
        forEach: callback => results.forEach(callback),
        empty: results.length === 0,
      });
    }),
    _clearStore: () => {
      for (const id in _docsStore) delete _docsStore[id];
      for (const id in _docMocks) delete _docMocks[id];
      _queryFilters = [];
      self.add.mockClear();
      self.doc.mockClear();
      self.where.mockClear();
      self.get.mockClear();
    },
    _setDocs: docsArray => {
      self._clearStore();
      docsArray.forEach(doc => {
        if (doc && doc.id) _docsStore[doc.id] = doc;
      });
      console.log('[Mock Firestore] _setDocs completed. Store:', _docsStore);
    },
    _getDocStore: () => _docsStore,
  };
  return self;
};

const mockPromptsCollection = createMockCollection();
const mockUsersCollection = createMockCollection();

global.window.firebaseDb = {
  collection: jest.fn(collectionName => {
    if (collectionName === 'prompts') return mockPromptsCollection;
    if (collectionName === 'users') return mockUsersCollection;
    return createMockCollection();
  }),
};
console.log('EXEC_ORDER: setupTests.js - firebaseDb mocked with persistent collection mocks');

// Consolidate Firebase mock initialization
const firebaseAuthMock = global.window.firebaseAuth; // Keep existing auth mock logic
const firebaseDbMock = global.window.firebaseDb; // Keep existing db mock logic

global.window.firebase = {
  initializeApp: jest.fn(_config => ({})), // _config to avoid unused var
  auth: Object.assign(
    jest.fn(() => firebaseAuthMock),
    {
      GoogleAuthProvider: jest.fn(), // Still needed if GoogleAuthProvider is new-ed up somewhere
      // Add other static auth properties if needed by tests
    }
  ),
  firestore: Object.assign(
    jest.fn(() => firebaseDbMock),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'MOCK_SERVER_TIMESTAMP'),
        // Add other FieldValue static properties if needed
      },
      // Add other static firestore properties if needed by tests
    }
  ),
};
console.log('EXEC_ORDER: setupTests.js - global firebase object mocked');

window.PromptFinder = window.PromptFinder || {};
window.PromptFinder.Utils = {
  ...(window.PromptFinder.Utils || {}),
  handleError: jest.fn((_message, _options) => {
    // console.error("[MOCKED handleError Call]", _message, _options?.originalError?.message);
  }),
  displayAuthError: jest.fn(),
  showConfirmationMessage: jest.fn(),
  escapeHTML: jest.fn(str =>
    typeof str === 'string'
      ? str.replace(
          /[&<>"'/]/g,
          s =>
            ({
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#39;',
              '/': '&#x2F;',
            })[s]
        )
      : str
  ),
  highlightStars: jest.fn(),
  chromeStorageGet: global.chrome.storage.local.get,
  chromeStorageSet: global.chrome.storage.local.set,
};
console.log('EXEC_ORDER: setupTests.js - END');
