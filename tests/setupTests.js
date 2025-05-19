import { jest } from '@jest/globals';

// Mock chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (typeof keys === 'string') result[keys] = null;
        else if (Array.isArray(keys)) keys.forEach(key => (result[key] = null));
        else Object.keys(keys).forEach(key => (result[key] = keys[key]));
        setTimeout(() => {
          if (typeof callback === 'function') callback(result);
        }, 0);
        return Promise.resolve(result);
      }),
      set: jest.fn((items, callback) => {
        setTimeout(() => {
          if (typeof callback === 'function') callback();
        }, 0);
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    lastError: null,
    getURL: jest.fn(path => `chrome-extension://mockextid/${path}`),
    sendMessage: jest.fn().mockResolvedValue({ status: 'mocked_response' }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(() => false),
    },
    getManifest: jest.fn(() => ({
      manifest_version: 3,
      name: 'Test Extension',
      oauth2: {
        client_id: 'mock_client_id_for_tests.apps.googleusercontent.com',
        scopes: ['openid', 'email', 'profile'],
      },
    })),
    getContexts: jest.fn().mockResolvedValue([]),
  },
  windows: {
    create: jest.fn().mockResolvedValue({ id: 123 }),
  },
  offscreen: {
    createDocument: jest.fn().mockResolvedValue(undefined),
    closeDocument: jest.fn().mockResolvedValue(undefined),
    hasDocument: jest.fn().mockResolvedValue(false),
  },
  identity: {
    getRedirectURL: jest.fn(path => `https://<extension-id>.chromiumapp.org/${path || ''}`),
    launchWebAuthFlow: jest.fn((options, callback) => {
      if (global.chrome.runtime.lastError) {
        if (typeof callback === 'function') callback(undefined);
        return Promise.reject(global.chrome.runtime.lastError);
      }
      const mockCallbackUrl = `https://<extension-id>.chromiumapp.org/#id_token=mock_id_token_for_test&state=mock_state`;
      if (typeof callback === 'function') callback(mockCallbackUrl);
      return Promise.resolve(mockCallbackUrl);
    }),
  },
};

if (typeof navigator !== 'undefined' && !navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
} else if (typeof navigator === 'undefined') {
  global.navigator = {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
  };
}

const mockUser = {
  uid: 'testUserId',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
};
const mockUserCredential = { user: mockUser };

let mockCurrentAuthUser = null;
let mockAuthStateChangedCallback = null;

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    get currentUser() {
      return mockCurrentAuthUser;
    },
  })),
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue(mockUserCredential),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue(mockUserCredential),
  signInWithCredential: jest.fn().mockResolvedValue(mockUserCredential),
  GoogleAuthProvider: {
    credential: jest.fn(idToken => ({ idToken, providerId: 'google.com' })),
  },
  signOut: jest.fn(() => {
    mockCurrentAuthUser = null;
    if (mockAuthStateChangedCallback) mockAuthStateChangedCallback(null);
    return Promise.resolve();
  }),
  onAuthStateChanged: jest.fn((authInstance, callback) => {
    mockAuthStateChangedCallback = callback;
    Promise.resolve().then(() => callback(mockCurrentAuthUser));
    return jest.fn();
  }),
  updateProfile: jest.fn().mockResolvedValue(undefined),
}));

global.simulateLogin = (user = mockUser) => {
  mockCurrentAuthUser = user;
  if (mockAuthStateChangedCallback) mockAuthStateChangedCallback(user);
};
global.simulateLogout = () => {
  mockCurrentAuthUser = null;
  if (mockAuthStateChangedCallback) mockAuthStateChangedCallback(null);
};

const mockFirestoreData = {};
let mockAddDocIdCounter = 0;

const getPathData = path => {
  if (!path) return undefined;
  const parts = path.split('/');
  let current = mockFirestoreData;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (
      !current ||
      typeof current !== 'object' ||
      !Object.prototype.hasOwnProperty.call(current, part)
    ) {
      return undefined;
    }
    current = current[part];
  }
  return current;
};

const processFieldValue = (currentValue, newValue) => {
  if (newValue && typeof newValue === 'object' && newValue._methodName === 'increment') {
    return (currentValue || 0) + newValue.value;
  }
  return newValue;
};

const setPathData = (path, data, isMerge = false) => {
  const parts = path.split('/');
  if (parts.length === 0) return;

  let currentRef = mockFirestoreData;
  for (let i = 0; i < parts.length - 1; i++) {
    const segment = parts[i];
    const segmentExists = Object.prototype.hasOwnProperty.call(currentRef, segment);
    const segmentIsNonNullObject =
      segmentExists && typeof currentRef[segment] === 'object' && currentRef[segment] !== null;

    if (!segmentIsNonNullObject) {
      currentRef[segment] = {};
    }
    currentRef = currentRef[segment];
  }

  const docId = parts[parts.length - 1];

  if (isMerge) {
    const docExists = Object.prototype.hasOwnProperty.call(currentRef, docId);
    const docIsNonNullObject =
      docExists && typeof currentRef[docId] === 'object' && currentRef[docId] !== null;

    let docToUpdate = {};
    if (docIsNonNullObject) {
      docToUpdate = currentRef[docId];
    }

    const mergedData = { ...docToUpdate };
    for (const key in data) {
      mergedData[key] = processFieldValue(docToUpdate[key], data[key]);
    }
    currentRef[docId] = mergedData;
  } else {
    const dataToSet = {};
    for (const keyInInputData in data) {
      dataToSet[keyInInputData] = processFieldValue(undefined, data[keyInInputData]);
    }
    currentRef[docId] = dataToSet;
  }
};

const deletePathData = path => {
  const parts = path.split('/');
  let current = mockFirestoreData;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
    if (!current) return;
  }
  delete current[parts[parts.length - 1]];
};

jest.mock('firebase/firestore', () => {
  const actualFirestore = jest.requireActual('firebase/firestore');
  return {
    ...actualFirestore,
    getFirestore: jest.fn(() => ({ mockName: 'MockFirestoreDBInstance' })),
    doc: jest.fn((db, collectionPath, ...documentIdSegments) => {
      const idPathPart = documentIdSegments.join('/');
      const actualId = documentIdSegments[documentIdSegments.length - 1];
      const path = `${collectionPath}/${idPathPart}`;
      return {
        id: actualId || 'mockDocId',
        path: path,
        type: 'docRef',
      };
    }),
    collection: jest.fn((db, path, ...subPaths) => {
      const fullPath = [path, ...subPaths].join('/');
      return {
        path: fullPath,
        type: 'collectionRef',
      };
    }),
    setDoc: jest.fn().mockImplementation(async (docRef, data, options) => {
      const path = docRef && docRef.path ? docRef.path : 'UNKNOWN_PATH_IN_SETDOC';
      if (path !== 'UNKNOWN_PATH_IN_SETDOC') {
        setPathData(path, data, options?.merge);
      }
      return Promise.resolve();
    }),
    addDoc: jest.fn(async (collectionRef, data) => {
      mockAddDocIdCounter++;
      const newId = `mockGeneratedId_${mockAddDocIdCounter}`;
      const path = `${collectionRef.path}/${newId}`;
      setPathData(path, data, false);
      return Promise.resolve({ id: newId, path: path, type: 'docRef' });
    }),
    getDoc: jest.fn(async docRef => {
      const data = getPathData(docRef.path);
      return Promise.resolve({
        id: docRef.id,
        exists: () => data !== undefined,
        data: () => data,
      });
    }),
    getDocs: jest.fn(async queryMock => {
      let collectionData = getPathData(queryMock.path);
      let results = [];
      if (collectionData && typeof collectionData === 'object') {
        results = Object.entries(collectionData).map(([id, data]) => ({
          id,
          data: () => data,
          exists: () => true,
        }));
      }
      if (queryMock.constraints) {
        queryMock.constraints.forEach(constraint => {
          results = results.filter(doc => {
            const val = doc.data()?.[constraint.field];
            if (constraint.op === '==') return val === constraint.value;
            if (constraint.op === '!=') return val !== constraint.value;
            return true;
          });
        });
      }
      return Promise.resolve({
        docs: results,
        empty: results.length === 0,
        forEach: cb => results.forEach(cb),
      });
    }),
    updateDoc: jest.fn(async (docRef, data) => {
      const existingData = getPathData(docRef.path);
      if (!existingData) return Promise.reject(new Error('Mock: Document not found for update'));
      setPathData(docRef.path, data, true);
      return Promise.resolve();
    }),
    deleteDoc: jest.fn(async docRef => {
      deletePathData(docRef.path);
      return Promise.resolve();
    }),
    query: jest.fn((collectionRef, ...constraints) => {
      return { path: collectionRef.path, constraints: constraints, type: 'query' };
    }),
    where: jest.fn((field, op, value) => ({ type: 'where', field, op, value })),
    increment: jest.fn(value => ({ _methodName: 'increment', value: value })),
    writeBatch: jest.fn(() => {
      const operations = [];
      const batch = {
        set: (docRef, data, options) => {
          operations.push({ type: 'set', ref: docRef, data, options });
          return batch;
        },
        update: (docRef, data) => {
          operations.push({ type: 'update', ref: docRef, data });
          return batch;
        },
        delete: docRef => {
          operations.push({ type: 'delete', ref: docRef });
          return batch;
        },
        commit: jest.fn(async () => {
          for (const op of operations) {
            const existingDoc = getPathData(op.ref.path);
            if (op.type === 'set') {
              setPathData(op.ref.path, op.data, op.options?.merge);
            } else if (op.type === 'update') {
              if (!existingDoc) {
                // In a real Firestore batch, an update to a non-existent doc would typically fail the batch.
                // For this mock, we'll log and allow setPathData to handle it (which might create it if merge acts like set).
                // console.error(`[Mock Batch Commit] Document not found for update: ${op.ref.path}`);
              }
              setPathData(op.ref.path, op.data, true);
            } else if (op.type === 'delete') {
              deletePathData(op.ref.path);
            }
          }
          return Promise.resolve();
        }),
      };
      return batch;
    }),
  };
});

global.mockFirestoreDb = {
  clear: () => {
    for (const key in mockFirestoreData) {
      delete mockFirestoreData[key];
    }
    mockAddDocIdCounter = 0;
  },
  seedData: (path, data) => {
    setPathData(path, data, false);
  },
  getPathData: getPathData,
  _getMockFirestoreDataSnapshot: () => JSON.parse(JSON.stringify(mockFirestoreData)),
};
