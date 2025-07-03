# DesignPrompts Cloud Functions Testing Guide

## Overview

This test plan will help verify that the Fireb## Verification Methods

### For both Production and Emulator Testing

1. **UI Verification**:

   - Check if the UI displays updated values for ratings, favorites, and usage counts

2. **Direct Firestore Inspection**:

   - For production: Use the Firebase console to inspect documents
   - For emulators: Use the Emulator UI at <http://127.0.0.1:4000/firestore>

3. **Function Logs**:
   - For production: Check Cloud Functions logs in Firebase Console (europe-west1 region)
   - For emulators: Check logs in the terminal where emulators are runningtions are working correctly both in the production environment and with local emulators.

## Setup

### For Production Testing

1. Ensure the DesignPrompts extension is using the production Firebase configuration (default).
   - In `firebase-init.js`, make sure `useEmulators` is set to `false`.

### For Local Testing with Emulators

1. Start the Firebase emulators:

   ```bash
   cd /Users/tor-andershansen/Desktop/Projects/promptfinder
   npx firebase emulators:start
   ```

2. Enable emulator mode in the DesignPrompts extension:
   - In `firebase-init.js`, set `useEmulators` to `true`.
   - Reload the extension.

## Test Cases

### 1. Rating a Prompt

**Objective**: Verify the `recalculateRating` cloud function correctly updates averages and counts.

**Steps**:

1. Log in to DesignPrompts
2. Find an existing prompt or create a new one
3. Rate the prompt with 4 stars
4. Wait a moment for the cloud function to process
5. Refresh the page

**Expected Results**:

- The prompt's `averageRating` should be updated to reflect the new rating
- The prompt's `totalRatingsCount` should be incremented
- Changes should be visible in the UI

**Additional Test Cases**:

- Change the rating from 4 to 2 stars and verify the average updates
- Have multiple users rate the same prompt to test concurrent operations

### 2. Favoriting a Prompt

**Objective**: Verify the `updateFavoritesCount` cloud function correctly tracks favorites.

**Steps**:

1. Log in to DesignPrompts
2. Find a prompt to favorite
3. Click the favorite (star) icon
4. Wait a moment for the cloud function to process
5. Refresh the page

**Expected Results**:

- The prompt's `favoritesCount` should be incremented
- The star icon should remain highlighted
- If you unfavorite, the count should decrement

### 3. Tracking Usage

**Objective**: Verify the `incrementUsageCount` cloud function correctly tracks prompt usage.

**Steps**:

1. Log in to DesignPrompts
2. Find a prompt and note its current usage count
3. Click the copy button to copy the prompt to clipboard
4. Wait a moment for the cloud function to process
5. Refresh the page

**Expected Results**:

- The prompt's `usageCount` should be incremented by 1
- Multiple copies should increase the count accordingly

### 4. Admin Function (Optional)

**Objective**: Verify the `recalculateAllStats` function correctly updates all prompts.

**Note**: This requires admin access and is typically done in development/testing environments.

**Steps** (Using Firebase Emulators UI):

1. Navigate to the Emulator UI at <http://127.0.0.1:4000/>
2. Go to the Functions tab
3. Find the `recalculateAllStats` function
4. Click "Call function" and send an empty payload
5. Check the logs for success message

**Expected Results**:

- All prompts should have their statistics recalculated
- Function should return a success message with the number of updated prompts

## Verification Methods

### For both Production and Emulator Testing

1. **UI Verification**:

   - Check if the UI displays updated values for ratings, favorites, and usage counts

2. **Direct Firestore Inspection**:

   - For production: Use the Firebase console to inspect documents
   - For emulators: Use the Emulator UI at <http://127.0.0.1:4000/firestore>

3. **Function Logs**:
   - For production: Check Cloud Functions logs in Firebase Console
   - For emulators: Check logs in the terminal where emulators are running

## Troubleshooting

### Common Issues

1. **Functions not triggering**:

   - Check if the document paths match exactly what's expected in the function triggers
   - Verify authentication is working correctly

2. **Inconsistent results**:

   - There may be a slight delay in cloud function execution
   - Try refreshing or waiting a few seconds

3. **Emulator connection issues**:
   - Verify that `useEmulators` is set to `true` in `firebase-init.js`
   - Check if the emulators are running (<http://127.0.0.1:4000/>)

## Next Steps After Testing

1. If all tests pass in both environments, the implementation is complete
2. Consider adding automated tests for these functions
3. Monitor function performance in production
