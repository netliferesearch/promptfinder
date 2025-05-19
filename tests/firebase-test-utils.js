const fs = require('fs');
const path = require('path');

/**
 * Reads the Firestore rules file from the project
 * @returns {string} The Firestore rules as a string
 */
function readFirestoreRules() {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  return fs.readFileSync(rulesPath, 'utf8');
}

/**
 * Creates a mock server timestamp for testing
 * @returns {Object} A mock server timestamp
 */
function mockServerTimestamp() {
  return { __type__: 'serverTimestamp' };
}

/**
 * Creates a timestamp from a date
 * @param {Date} date The date to convert to a timestamp
 * @returns {Object} A Firestore timestamp object
 */
function mockTimestamp(date = new Date()) {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    __type__: 'timestamp',
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
  };
}

/**
 * Helper to set up test data in an admin context
 * @param {Object} testEnv The test environment
 * @param {Object} data The data to set up, keyed by document path
 */
async function setupTestData(testEnv, data) {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const batch = db.batch();

    for (const [path, docData] of Object.entries(data)) {
      const docRef = db.doc(path);
      batch.set(docRef, docData);
    }

    await batch.commit();
  });
}

module.exports = {
  readFirestoreRules,
  mockServerTimestamp,
  mockTimestamp,
  setupTestData,
};
