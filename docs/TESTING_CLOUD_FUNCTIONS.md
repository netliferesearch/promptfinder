# Testing Firebase Cloud Functions for PromptFinder

This guide outlines how to test the Firebase Cloud Functions after deployment.

## Prerequisites

- Firebase project set up with the Blaze (pay-as-you-go) plan
- Cloud Functions deployed to Firebase
- A user account in the app

## Test Cases

### 1. Testing `recalculateRating` Cloud Function

**Objective**: Verify that the `recalculateRating` function correctly calculates and updates the average rating and rating count when a rating is added or modified.

**Steps**:

1. Open the PromptFinder extension
2. Log in with your test account
3. Find a prompt to rate or create a new one
4. Rate the prompt (1-5 stars)
5. Wait a moment for the cloud function to process

**Verification**:

1. In the UI, check that the prompt's average rating and rating count are updated
2. For a deeper check, use the Firebase Console to verify the prompt document has the correct:
   - `averageRating`: The average of all ratings
   - `totalRatingsCount`: The number of ratings

### 2. Testing `updateFavoritesCount` Cloud Function

**Objective**: Verify that the `updateFavoritesCount` function correctly calculates and updates the number of users who have favorited a prompt.

**Steps**:

1. Open the PromptFinder extension
2. Log in with your test account
3. Find a prompt to favorite
4. Click the favorite button (star icon)
5. Then unfavorite the prompt by clicking again
6. Wait a moment after each action for the cloud function to process

**Verification**:

1. In the UI, check that the favorite count increases when favorited and decreases when unfavorited
2. In the Firebase Console, verify the prompt document has the correct:
   - `favoritesCount`: The number of users who have favorited the prompt

### 3. Testing `incrementUsageCount` Cloud Function

**Objective**: Verify that the `incrementUsageCount` function correctly increments the usage count when a prompt is copied.

**Steps**:

1. Open the PromptFinder extension
2. Log in with your test account
3. Find a prompt to copy
4. Click the copy button to copy the prompt text
5. Wait a moment for the cloud function to process

**Verification**:

1. In the Firebase Console, verify the prompt document has:
   - `usageCount`: An incremented value after each copy action

### 4. Testing Admin Function `recalculateAllStats`

**Objective**: Verify that the admin function correctly recalculates statistics for all prompts.

**Steps**:
This function can only be called by an admin. You have two options:

1. Call it directly from the Firebase console using the "Call function" option in the Functions section
2. Use Postman or a similar tool to call the HTTP endpoint with admin credentials

**Verification**:

1. In the Firebase Console, check the function logs to ensure it ran successfully
2. Verify several prompt documents to ensure they have the correct:
   - `averageRating`
   - `totalRatingsCount`
   - `favoritesCount`

## Edge Cases to Test

1. **No Ratings**:

   - Remove all ratings for a prompt and verify `averageRating = 0` and `totalRatingsCount = 0`

2. **Concurrent Operations**:

   - Have multiple users rate or favorite the same prompt concurrently
   - Verify the final counts are accurate

3. **Error Handling**:
   - Attempt to rate a non-existent prompt ID
   - Try to favorite a prompt without being logged in

## Troubleshooting

If you encounter issues during testing:

1. **Check Function Logs**:

   - Go to the Firebase Console > Functions section > Logs tab
   - Look for error messages or unexpected behavior

2. **Verify Database State**:

   - Check that all subcollections (ratings, favoritedBy) exist and have the expected documents

3. **Test Authentication**:

   - Ensure that the current user is properly authenticated
   - Check that user IDs in the favoritedBy collection match the authenticated users

4. **Force Recalculation**:
   - Use the `recalculateAllStats` admin function to force recalculation of all stats

## Next Steps

After successful testing, consider:

1. Setting up automated tests for these functions
2. Implementing monitoring for function performance and errors
3. Adding more granular logging for future debugging
