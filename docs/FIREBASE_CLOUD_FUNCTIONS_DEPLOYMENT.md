# Firebase Cloud Functions Deployment Guide

This guide explains how to complete the deployment of the Firebase Cloud Functions for PromptFinder.

## What's Been Implemented

1. Cloud Functions have been set up in the `functions/src/` directory:

   - `searchPrompts`: Callable function for prioritized, weighted, typo-tolerant prompt search (see `src/searchPrompts.ts`)
   - `recalculateRating`: Listens for changes to prompt ratings and updates aggregated values
   - `updateFavoritesCount`: Manages favorites count when users favorite/unfavorite prompts
   - `recalculateAllStats`: Admin function to batch update all prompt statistics
   - `incrementUsageCount`: HTTPS callable function to safely increment usage counters

2. Client-side code has been updated to use these cloud functions:

   - `firebase-init.js` has been modified to initialize Firebase Functions with the europe-west1 region
   - `promptData.js` has been updated to remove client-side aggregation and use cloud functions:
     - `ratePrompt`: Now just sets the rating document and lets cloud functions handle the rest
     - `toggleFavorite`: Simplified to just add/remove favorites documents
     - `copyPromptToClipboard`: Now calls cloud function to increment usage count
   - `searchPrompts` is called for all main search queries (see `js/promptData.js`)

3. Region Configuration:
   - All functions are deployed to the `europe-west1` region for optimal performance with Firestore
   - Client-side code is configured to use the same region

## Next Steps for Deployment

### 1. Set Up Firebase Billing

To deploy Cloud Functions, you need to upgrade your Firebase project to the Blaze (pay-as-you-go) plan:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select the project: `promptfinder-2a095`
3. Click on "Upgrade" to choose the Blaze plan
4. Add a payment method and complete the upgrade process

> **Note**: The free tier of the Blaze plan includes:
>
> - 2 million function invocations per month
> - 400,000 GB-seconds of compute time per month
> - 200,000 CPU-seconds of compute time per month
>
> For most small to medium extensions, you'll stay within these limits and won't be charged.

### 2. Deploy the Functions

After setting up billing, you can deploy the functions with:

```bash
cd /Users/tor-andershansen/Desktop/Projects/promptfinder
npx firebase deploy --only functions
```

### 3. Test the Cloud Functions

After deployment, test the functions to ensure they're working correctly:

1. **Test searching for prompts**

   - Use the main search bar in the extension
   - Verify that results are prioritized, annotated, and returned quickly (see badges and timing info)
   - Check Cloud Function logs for search timing and query info

2. **Test rating a prompt**

   - Add a rating to a prompt
   - Verify that the `averageRating` and `totalRatingsCount` fields are updated properly

3. **Test favoriting a prompt**

   - Favorite and unfavorite a prompt
   - Verify that the `favoritesCount` field is updated properly

4. **Test usage tracking**
   - Copy a prompt to clipboard
   - Verify that the `usageCount` field increments

### 4. Optional: Set Up Local Emulators

For local development, you can set up Firebase emulators to test functions without deploying:

1. Install Java (required for Firebase emulators):

   ```bash
   # For macOS:
   brew install java
   ```

2. Start the emulators:

   ```bash
   cd /Users/tor-andershansen/Desktop/Projects/promptfinder
   npx firebase emulators:start
   ```

3. Uncomment these lines in `firebase-init.js` when developing locally:

   ```javascript
   // import { connectFunctionsEmulator } from 'firebase/functions';
   // import { connectFirestoreEmulator } from 'firebase/firestore';
   // import { connectAuthEmulator } from 'firebase/auth';
   // connectFunctionsEmulator(functions, 'localhost', 5001);
   // connectFirestoreEmulator(db, 'localhost', 8080);
   // connectAuthEmulator(auth, 'http://localhost:9099');
   ```

## Potential Future Improvements

1. **Function Optimization**

   - Consider using batched writes for high-traffic scenarios
   - Add more error handling and retry logic

2. **Security Rules**

   - Further tighten Firestore security rules to protect aggregated data

3. **Scheduled Functions**

   - Add a scheduled version of `recalculateAllStats` to run nightly
   - Monitor for data inconsistencies and fix them automatically

4. **Monitoring**
   - Set up Firebase alerts for function errors
   - Add more detailed logging for debugging
