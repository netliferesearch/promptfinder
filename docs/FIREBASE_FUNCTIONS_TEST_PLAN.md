# Firebase Cloud Functions Testing Plan for DesignPrompts

## Testing Overview

This plan outlines approaches for testing Firebase Cloud Functions in the DesignPrompts Chrome extension. It covers unit testing, integration testing with Firebase emulators, and strategies for both local development and CI/CD.

## 1. Testing Approaches

### 1.1 Unit Testing Client-Side Integration

**Current Implementation**: `/tests/firebaseFunctions.test.js`

Tests focus on:

- Verifying client code correctly calls Cloud Functions with proper parameters
- Handling success and error responses from Cloud Functions
- Simulating Firestore triggers that modify data

**Test Functions**:

- `mockRecalculateRating` - Simulates the behavior of the `recalculateRating` Firestore trigger
- `mockUpdateFavoritesCount` - Simulates the behavior of the `updateFavoritesCount` Firestore trigger

### 1.2 Integration Testing with Firebase Emulators

**Implementation Status**: Planned but not yet implemented

This will involve:

- Running tests against actual Cloud Functions in the Firebase emulator environment
- Testing real database interactions without affecting production data
- Verifying the complete workflow from client action to database update

## 2. Functions Under Test

### 2.1 Client-Callable Functions

| Function Name         | Description                                         | Test Status        |
| --------------------- | --------------------------------------------------- | ------------------ |
| `incrementUsageCount` | Increments usage count when a prompt is copied      | ✅ Implemented     |
| `recalculateAllStats` | Admin function to recalculate all prompt statistics | ⬜ Not Implemented |

### 2.2 Firestore Triggers

| Function Name          | Trigger                                                     | Description                      | Test Status    |
| ---------------------- | ----------------------------------------------------------- | -------------------------------- | -------------- |
| `recalculateRating`    | Document write to `prompts/{promptId}/ratings/{userId}`     | Updates average rating and count | ✅ Implemented |
| `updateFavoritesCount` | Document write to `prompts/{promptId}/favoritedBy/{userId}` | Updates favorites count          | ✅ Implemented |

## 3. Test Cases

### 3.1 Unit Test Cases (Client Integration)

#### `incrementUsageCount`

- ✅ Should call function with correct parameters when copying a prompt
- ✅ Should handle success responses correctly
- ✅ Should handle error responses correctly
- ⬜ Should verify throttling/rate limiting (TO BE IMPLEMENTED)

#### `recalculateRating` (Firestore Trigger)

- ✅ Should correctly calculate average when adding a rating
- ⬜ Should handle multiple ratings from different users (TO BE IMPLEMENTED)
- ⬜ Should handle rating updates (TO BE IMPLEMENTED)
- ⬜ Should handle rating deletion (TO BE IMPLEMENTED)

#### `updateFavoritesCount` (Firestore Trigger)

- ✅ Should increment favorites count when adding a favorite
- ✅ Should decrement favorites count when removing a favorite
- ⬜ Should handle concurrent favorite operations (TO BE IMPLEMENTED)

#### `recalculateAllStats` (Admin Function)

- ⬜ Should verify admin permissions (TO BE IMPLEMENTED)
- ⬜ Should update all prompt statistics (TO BE IMPLEMENTED)

### 3.2 Integration Test Cases (Emulator)

#### General Emulator Tests

- ⬜ Should connect to and use emulators when flag is set
- ⬜ Should correctly initialize all required emulators (Firestore, Auth, Functions)

#### Function-Specific Integration Tests

- ⬜ Same test cases as unit tests but against actual emulator functions
- ⬜ End-to-end workflow tests that verify complete user scenarios

## 4. Implementation Plan

### 4.1 Current Implementation

- ✅ Basic unit tests for client integration with Cloud Functions
- ✅ Mock implementations for simulating Firestore triggers

### 4.2 Short-Term Improvements

1. ⬜ **Complete Unit Test Coverage**

   - Add tests for edge cases and error conditions
   - Add tests for admin functions
   - Add tests for multiple users and concurrent operations

2. ⬜ **Automate Firebase Emulator Tests**
   - Create npm script for running emulator tests: `npm run test:emulators`
   - Add examples for running emulator tests in documentation

### 4.3 Medium-Term Goals

1. ⬜ **CI/CD Integration**

   - Set up GitHub Actions workflow to run tests against emulators
   - Add status badges to README for test status

2. ⬜ **Monitoring**
   - Implement test coverage tracking
   - Track Cloud Function performance in tests

## 5. Test Environment Setup

### 5.1 Local Environment

**Unit Tests**:

```bash
# Run all tests
npm test

# Run only Firebase Cloud Function tests
npm test -- tests/firebaseFunctions.test.js
```

**Emulator Tests** (Planned):

```bash
# Start Firebase emulators
npx firebase emulators:start

# In a separate terminal, run emulator tests
npm run test:emulators
```

### 5.2 Configuration

**For Unit Tests**:

- Firebase mocks are set up in the test files
- No actual Firebase connection required

**For Emulator Tests** (Planned):

- Toggle `useEmulators` flag in `firebase-init.js` to `true`
- Tests will connect to local emulators instead of production services

## 6. Next Steps

1. Complete all "TO BE IMPLEMENTED" test cases in section 3.1
2. Set up and document emulator test configuration
3. Create CI/CD workflow for automated testing
4. Add test coverage reporting
