// Test suite for PromptFinder Cloud Functions with error scenarios
const { setupFirebaseTest, teardownFirebaseTest } = require('./firebase-functions-mock');
const assert = require('assert');

let myFunctions, adminApp;

describe('PromptFinder Cloud Functions Error Handling', () => {
  beforeAll(async () => {
    // Setup Firebase test environment
    const setup = await setupFirebaseTest();
    adminApp = setup.adminApp;
    myFunctions = setup.functions;
  });

  afterAll(async () => {
    await teardownFirebaseTest(adminApp);
  });

  describe('incrementUsageCount', () => {
    it('should throw unauthenticated when no auth context is provided', async () => {
      const incrementUsageCount = myFunctions.incrementUsageCount;
      const noAuthContext = { auth: null };

      try {
        await incrementUsageCount({ promptId: 'test-prompt-id' }, noAuthContext);
        assert.fail('Function should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.code, 'unauthenticated');
        assert.strictEqual(error.message, 'User must be logged in to track usage');
      }
    });

    it('should throw invalid-argument when promptId is not provided', async () => {
      const incrementUsageCount = myFunctions.incrementUsageCount;
      const authContext = {
        auth: {
          uid: 'test-user-id',
          token: {},
        },
      };

      try {
        await incrementUsageCount({}, authContext);
        assert.fail('Function should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.code, 'invalid-argument');
        assert.strictEqual(error.message, 'Prompt ID is required');
      }
    });

    it('should throw not-found when promptId does not exist', async () => {
      const incrementUsageCount = myFunctions.incrementUsageCount;
      const authContext = {
        auth: {
          uid: 'test-user-id',
          token: {},
        },
      };

      try {
        await incrementUsageCount({ promptId: 'non-existent-id' }, authContext);
        assert.fail('Function should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.code, 'not-found');
        assert.strictEqual(error.message, 'Prompt with ID non-existent-id not found');
      }
    });
  });

  describe('recalculateAllStats', () => {
    it('should throw permission-denied when user is not admin', async () => {
      const recalculateAllStats = myFunctions.recalculateAllStats;
      const nonAdminContext = {
        auth: {
          uid: 'test-user-id',
          token: { admin: false },
        },
      };

      try {
        await recalculateAllStats({}, nonAdminContext);
        assert.fail('Function should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.code, 'permission-denied');
        assert.strictEqual(error.message, 'Only admins can recalculate all stats');
      }
    });

    // We cant test database errors easily since we mocked everything,
    // so we just test the success case
    it('should return success stats for admin user', async () => {
      const recalculateAllStats = myFunctions.recalculateAllStats;
      const adminContext = {
        auth: {
          uid: 'admin-user-id',
          token: { admin: true },
        },
      };

      const result = await recalculateAllStats({}, adminContext);
      // Should complete successfully
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.promptsUpdated, 5);
      assert.strictEqual(result.promptsFailed, 0);
      assert.strictEqual(result.totalPrompts, 5);
    });
  });
});
