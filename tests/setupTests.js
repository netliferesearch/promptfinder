
import { jest } from '@jest/globals';

console.log('EXEC_ORDER: setupTests.js - START - v9 Mocks');

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
    sendMessage: jest.fn().mockResolvedValue({ status: "mocked_response" }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(() => false),
    },
    getManifest: jest.fn(() => ({ 
        manifest_version: 3,
        name: "Test Extension",
        oauth2: {
            client_id: "mock_client_id_for_tests.apps.googleusercontent.com",
            scopes: ["openid", "email", "profile"]
        }
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
    getRedirectURL: jest.fn((path) => `https://<extension-id>.chromiumapp.org/${path || ''}`),
    launchWebAuthFlow: jest.fn((options, callback) => {
      if (global.chrome.runtime.lastError) {
        if (typeof callback === 'function') callback(undefined);
        return Promise.reject(global.chrome.runtime.lastError);
      }
      const mockCallbackUrl = `https://<extension-id>.chromiumapp.org/#id_token=mock_id_token_for_test&state=mock_state`;
      if (typeof callback === 'function') callback(mockCallbackUrl);
      return Promise.resolve(mockCallbackUrl);
    })
  }
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

const mockUser = { uid: 'testUserId', email: 'test@example.com', displayName: 'Test User', photoURL: null };
const mockUserCredential = { user: mockUser };

let mockCurrentAuthUser = null; 
let mockAuthStateChangedCallback = null; 

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ 
    get currentUser() { return mockCurrentAuthUser; }, // Use a getter here
  })),
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue(mockUserCredential),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue(mockUserCredential),
  signInWithCredential: jest.fn().mockResolvedValue(mockUserCredential), 
  GoogleAuthProvider: {
      credential: jest.fn(idToken => ({ idToken, providerId: 'google.com' })) 
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

console.log('EXEC_ORDER: setupTests.js - firebase/auth mocked');

const mockFirestoreData = {}; 

const getPathData = (path) => {
    const parts = path.split('/');
    let current = mockFirestoreData;
    for (let i = 0; i < parts.length; i += 2) { 
        const collectionId = parts[i];
        const docId = parts[i+1];
        if (!current[collectionId] || (docId && !current[collectionId][docId])) return undefined;
        current = docId ? current[collectionId][docId] : current[collectionId];
    }
    return current;
};

const processFieldValue = (currentValue, newValue) => {
  if (newValue && typeof newValue === 'object' && newValue._methodName === 'increment') {
    return (currentValue || 0) + newValue.value;
  }
  // Potentially handle other field values like serverTimestamp, arrayUnion, etc. here if needed
  return newValue;
};

const setPathData = (path, data, isMerge = false) => {
    const parts = path.split('/');
    let currentCollection = mockFirestoreData;
    for (let i = 0; i < parts.length - 2; i += 2) {
        const collectionId = parts[i];
        const docId = parts[i+1];
        if (!currentCollection[collectionId]) currentCollection[collectionId] = {};
        if (!currentCollection[collectionId][docId]) currentCollection[collectionId][docId] = {};
        currentCollection = currentCollection[collectionId][docId];
    }
    const finalCollectionId = parts[parts.length - 2];
    const finalDocId = parts[parts.length - 1];

    if (!currentCollection[finalCollectionId]) currentCollection[finalCollectionId] = {};
    
    let existingDocData = currentCollection[finalCollectionId][finalDocId];

    if (isMerge) {
        if (!existingDocData) existingDocData = {};
        const updatedData = { ...existingDocData };
        for (const key in data) {
            updatedData[key] = processFieldValue(existingDocData[key], data[key]);
        }
        currentCollection[finalCollectionId][finalDocId] = updatedData;
    } else {
        // For setDoc without merge, we replace the whole document.
        // FieldValue processing might be needed if setDoc can create fields with FieldValues.
        const processedData = {};
        for (const key in data) {
            processedData[key] = processFieldValue(undefined, data[key]);
        }
        currentCollection[finalCollectionId][finalDocId] = processedData;
    }
};

const deletePathData = (path) => {
    const parts = path.split('/');
    let current = mockFirestoreData;
    for (let i = 0; i < parts.length - 2; i += 2) {
        current = current[parts[i]]?.[parts[i+1]];
        if (!current) return;
    }
    delete current[parts[parts.length - 2]]?.[parts[parts.length - 1]];
};


jest.mock('firebase/firestore', () => {
  const actualFirestore = jest.requireActual('firebase/firestore'); 
  return {
    ...actualFirestore, 
    getFirestore: jest.fn(() => ({ mockName: 'MockFirestoreDBInstance' })), 
    doc: jest.fn((db, collectionPath, ...documentPathParts) => {
      const path = `${collectionPath}/${documentPathParts.join('/')}`;
      return { 
          id: documentPathParts[documentPathParts.length-1] || 'mockDocId', 
          path: path,
      };
    }),
    collection: jest.fn((db, path) => ({
      path: path,
    })),
    setDoc: jest.fn(async (docRef, data, options) => {
      console.log(`[Mock Firestore] setDoc(${docRef.path}) with:`, data, options);
      setPathData(docRef.path, data, options?.merge);
      return Promise.resolve();
    }),
    addDoc: jest.fn(async (collectionRef, data) => {
      const newId = `mockId_${Date.now()}`;
      const path = `${collectionRef.path}/${newId}`;
      console.log(`[Mock Firestore] addDoc to ${collectionRef.path} (new id: ${newId}) with:`, data);
      // AddDoc is like setDoc without merge, for a new document.
      setPathData(path, data, false);
      return Promise.resolve({ id: newId, path: path });
    }),
    getDoc: jest.fn(async (docRef) => {
      console.log(`[Mock Firestore] getDoc(${docRef.path})`);
      const data = getPathData(docRef.path);
      return Promise.resolve({ 
          id: docRef.id, 
          exists: () => data !== undefined, 
          data: () => data 
      });
    }),
    getDocs: jest.fn(async (queryMock) => {
      console.log(`[Mock Firestore] getDocs for query on path: ${queryMock.path}, constraints:`, queryMock.constraints);
      let collectionData = getPathData(queryMock.path);
      let results = [];
      if (collectionData) {
          results = Object.entries(collectionData).map(([id, data]) => ({ id, data: () => data, exists: () => true }));
      }
      if (queryMock.constraints) {
          queryMock.constraints.forEach(constraint => {
              results = results.filter(doc => {
                  const val = doc.data()[constraint.field];
                  if (constraint.op === '==') return val === constraint.value;
                  if (constraint.op === '!=') return val !== constraint.value;
                  // Add other operators here if needed by the application
                  return true;
              });
          });
      }
      return Promise.resolve({ docs: results, empty: results.length === 0, forEach: (cb) => results.forEach(cb) });
    }),
    updateDoc: jest.fn(async (docRef, data) => {
      console.log(`[Mock Firestore] updateDoc(${docRef.path}) with:`, data);
      const existingData = getPathData(docRef.path);
      if (!existingData) return Promise.reject(new Error("Mock: Document not found for update"));
      // updateDoc implies merge: true, and processes FieldValues
      setPathData(docRef.path, data, true); 
      return Promise.resolve();
    }),
    deleteDoc: jest.fn(async (docRef) => {
      console.log(`[Mock Firestore] deleteDoc(${docRef.path})`);
      deletePathData(docRef.path);
      return Promise.resolve();
    }),
    query: jest.fn((collectionRef, ...constraints) => {
      return { path: collectionRef.path, constraints: constraints, type: 'query' };
    }),
    where: jest.fn((field, op, value) => ({ type: 'where', field, op, value })),
    // Return a simple object that our processFieldValue function can identify.
    increment: jest.fn(value => ({ _methodName: 'increment', value: value })), 
    // serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })), // Example for serverTimestamp
    writeBatch: jest.fn(() => {
      const operations = [];
      const batch = {
          set: (docRef, data, options) => {
            operations.push({ type: 'set', ref: docRef, data, options });
            return batch; // Return the batch for chaining
          },
          update: (docRef, data) => {
            operations.push({ type: 'update', ref: docRef, data });
            return batch;
          },
          delete: (docRef) => {
            operations.push({ type: 'delete', ref: docRef });
            return batch;
          },
          commit: jest.fn(async () => {
              console.log("[Mock Firestore Batch] Committing operations:", operations);
              for (const op of operations) {
                  const existingDoc = getPathData(op.ref.path);
                  if (op.type === 'set') {
                      setPathData(op.ref.path, op.data, op.options?.merge);
                  }
                  else if (op.type === 'update') {
                      if (!existingDoc) return Promise.reject(new Error(`Mock Batch: Doc ${op.ref.path} not found for update`));
                      setPathData(op.ref.path, op.data, true); // Updates imply merge
                  } 
                  else if (op.type === 'delete') {
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
    },
    seedData: (path, data) => {
        // Seed data should not process field values by default, store them as is.
        const parts = path.split('/');
        let currentCollection = mockFirestoreData;
        for (let i = 0; i < parts.length - 2; i += 2) {
            const collectionId = parts[i];
            const docId = parts[i+1];
            if (!currentCollection[collectionId]) currentCollection[collectionId] = {};
            if (!currentCollection[collectionId][docId]) currentCollection[collectionId][docId] = {};
            currentCollection = currentCollection[collectionId][docId];
        }
        const finalCollectionId = parts[parts.length - 2];
        const finalDocId = parts[parts.length - 1];
        if (!currentCollection[finalCollectionId]) currentCollection[finalCollectionId] = {};
        currentCollection[finalCollectionId][finalDocId] = data;
    }
};

console.log('EXEC_ORDER: setupTests.js - firebase/firestore mocked');

console.log('EXEC_ORDER: setupTests.js - END - v9 Mocks');
