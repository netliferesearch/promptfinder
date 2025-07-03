# Unit Testing Cloud Functions

This document explains how to test Firebase Cloud Functions in the DesignPrompts project.

## Testing Approaches

There are two main approaches to testing Firebase Cloud Functions:

1. **Unit Testing** - Testing the client-side code that interacts with the Cloud Functions
2. **Integration Testing** - Testing the functions in a Firebase emulator environment

## Current Implementation

The current approach involves unit testing the client-side code that interacts with Cloud Functions. We've implemented:

1. **Mock Functions** - In `cloudFunctions.test.js`, we create mock implementations of Firebase functions
2. **Firestore Trigger Simulation** - We manually trigger the effects of Firestore triggers in our tests

## Test Coverage

Our tests cover:

1. **incrementUsageCount** - Testing that the function is called with the correct parameters when copying a prompt
2. **recalculateRating** - Testing that a prompt's ratings are correctly calculated
3. **updateFavoritesCount** - Testing that favorites count is correctly updated

## Running the Tests

```bash
npm test -- tests/cloudFunctions.test.js
```

## Future Improvements

For more comprehensive testing, consider:

1. **Running Tests Against Emulators** - Set up automated tests that run against the Firebase emulators
2. **CI/CD Pipeline Integration** - Add emulator testing to your CI/CD pipeline
3. **End-to-End Testing** - Implement full end-to-end tests with real Firebase services in a test environment

## Setting Up Emulator Testing

To test with Firebase emulators:

1. Start the emulators:

   ```bash
   npx firebase emulators:start
   ```

2. In your code, set useEmulators to true:

   ```javascript
   // In firebase-init.js
   const useEmulators = true;
   ```

3. Run your tests against the emulators:

   ```bash
   npm test
   ```

## Best Practices

- Always test both successful and error scenarios
- Test edge cases (e.g., no ratings, multiple ratings)
- Ensure proper security rules are tested
- Verify that functions correctly update the database
