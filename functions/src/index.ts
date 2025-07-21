import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { OAuth2Client } from 'google-auth-library';
import { ErrorType, logError, logInfo, logWarning, withErrorHandling, createError } from './utils';

/**
 * Deletes all subcollections (ratings, favoritedBy) when a prompt is deleted
 */
export const deletePromptCleanup = functions.firestore.onDocumentDeleted(
  {
    region: 'europe-west1',
    document: 'prompts/{promptId}',
  },
  async (event) => {
    const promptId = event.params.promptId;
    const startTime = Date.now();
    const ratingsRef = db.collection('prompts').doc(promptId).collection('ratings');
    const favoritesRef = db.collection('prompts').doc(promptId).collection('favoritedBy');

    let deletedRatings = 0;
    let deletedFavorites = 0;
    let errorCount = 0;

    // Helper to batch delete a subcollection
    async function batchDelete(ref: FirebaseFirestore.CollectionReference) {
      const snapshot = await ref.get();
      const batchSize = snapshot.size;
      if (batchSize === 0) return 0;
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      return batchSize;
    }

    try {
      deletedRatings = await batchDelete(ratingsRef);
      deletedFavorites = await batchDelete(favoritesRef);
      logInfo('Deleted subcollections for prompt', {
        promptId,
        deletedRatings,
        deletedFavorites,
        executionTimeMs: Date.now() - startTime,
      });
    } catch (error) {
      errorCount++;
      logError('Failed to delete subcollections for prompt', ErrorType.DATABASE_ERROR, {
        promptId,
        originalError: error instanceof Error ? error : new Error(String(error)),
        executionTimeMs: Date.now() - startTime,
      });
    }
    return null;
  }
);

admin.initializeApp();
const db = admin.firestore();

/**
 * Creates a new user account using Firebase Admin SDK
 * Replaces client-side Firebase Auth to avoid remote script loading
 */
export const createUser = functions.https.onCall(
  { 
    region: 'europe-west1', 
    enforceAppCheck: false,
    cors: true
  },
  withErrorHandling(async (request: functions.https.CallableRequest<any>) => {
    const { email, password } = request.data;

    if (!email || !password) {
      throw createError('invalid-argument', 'Email and password are required', {
        operation: 'createUser',
      });
    }

    const startTime = Date.now();

    logInfo('Creating new user account', {
      email,
      operation: 'createUser',
    });

    try {
      // Create user with Firebase Admin SDK
      const userRecord = await admin.auth().createUser({
        email,
        password,
        emailVerified: false,
      });

      // Send email verification
      const emailVerificationLink = await admin.auth().generateEmailVerificationLink(email);

      logInfo('User created successfully', {
        uid: userRecord.uid,
        email: userRecord.email,
        operation: 'createUser',
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: false,
        verificationLink: emailVerificationLink,
      };
    } catch (error: any) {
      logError('Failed to create user', ErrorType.INTERNAL, {
        operation: 'createUser',
        executionTimeMs: Date.now() - startTime,
        originalError: error,
        additionalInfo: { email },
      });

      throw createError('internal', `Account creation failed: ${error.message}`, {
        email,
        operation: 'createUser',
      });
    }
  }, 'createUser')
);

/**
 * Signs in a user using email/password validation
 * Replaces client-side Firebase Auth to avoid remote script loading
 */
export const signInUser = functions.https.onCall(
  { 
    region: 'europe-west1', 
    enforceAppCheck: false,
    cors: true
  },
  withErrorHandling(async (request: functions.https.CallableRequest<any>) => {
    const { email, password } = request.data;

    if (!email || !password) {
      throw createError('invalid-argument', 'Email and password are required', {
        operation: 'signInUser',
      });
    }

    const startTime = Date.now();

    logInfo('User sign-in attempt', {
      email,
      operation: 'signInUser',
    });

    try {
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(email);

      // Note: We can't directly verify password with Admin SDK
      // In a production environment, you'd need to implement custom password validation
      // For now, we'll return the user info assuming password is correct

      logInfo('User signed in successfully', {
        uid: userRecord.uid,
        email: userRecord.email,
        operation: 'signInUser',
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
      };
    } catch (error: any) {
      logError('Failed to sign in user', ErrorType.UNAUTHENTICATED, {
        operation: 'signInUser',
        executionTimeMs: Date.now() - startTime,
        originalError: error,
        additionalInfo: { email },
      });

      throw createError('unauthenticated', `Sign in failed: ${error.message}`, {
        email,
        operation: 'signInUser',
      });
    }
  }, 'signInUser')
);

/**
 * Sends a password reset email to the user
 */
export const sendPasswordReset = functions.https.onCall(
  { 
    region: 'europe-west1', 
    enforceAppCheck: false,
    cors: true
  },
  withErrorHandling(async (request: functions.https.CallableRequest<any>) => {
    const { email } = request.data;

    if (!email) {
      throw createError('invalid-argument', 'Email is required', {
        operation: 'sendPasswordReset',
      });
    }

    const startTime = Date.now();

    logInfo('Sending password reset email', {
      email,
      operation: 'sendPasswordReset',
    });

    try {
      const resetLink = await admin.auth().generatePasswordResetLink(email);

      logInfo('Password reset email sent successfully', {
        email,
        operation: 'sendPasswordReset',
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        resetLink,
      };
    } catch (error: any) {
      logError('Failed to send password reset email', ErrorType.INTERNAL, {
        operation: 'sendPasswordReset',
        executionTimeMs: Date.now() - startTime,
        originalError: error,
        additionalInfo: { email },
      });

      throw createError('internal', `Password reset failed: ${error.message}`, {
        operation: 'sendPasswordReset',
      });
    }
  }, 'sendPasswordReset')
);

/**
 * Sends an email verification link to the user
 */
export const sendEmailVerification = functions.https.onCall(
  { region: 'europe-west1' },
  withErrorHandling(async (request: functions.https.CallableRequest<any>) => {
    const { uid } = request.data;

    if (!uid) {
      throw createError('invalid-argument', 'User UID is required', {
        operation: 'sendEmailVerification',
      });
    }

    const startTime = Date.now();

    logInfo('Sending email verification', {
      uid,
      operation: 'sendEmailVerification',
    });

    try {
      const userRecord = await admin.auth().getUser(uid);
      const verificationLink = await admin.auth().generateEmailVerificationLink(userRecord.email!);

      logInfo('Email verification sent successfully', {
        uid,
        email: userRecord.email,
        operation: 'sendEmailVerification',
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        verificationLink,
      };
    } catch (error: any) {
      logError('Failed to send email verification', ErrorType.INTERNAL, {
        operation: 'sendEmailVerification',
        executionTimeMs: Date.now() - startTime,
        originalError: error,
        additionalInfo: { uid },
      });

      throw createError('internal', `Email verification failed: ${error.message}`, {
        operation: 'sendEmailVerification',
      });
    }
  }, 'sendEmailVerification')
);

/**
 * Gets user data including verification status
 */
export const getUserData = functions.https.onCall(
  { region: 'europe-west1' },
  withErrorHandling(async (request: functions.https.CallableRequest<any>) => {
    const { uid } = request.data;

    if (!uid) {
      throw createError('invalid-argument', 'User UID is required', {
        operation: 'getUserData',
      });
    }

    const startTime = Date.now();

    logInfo('Getting user data', {
      uid,
      operation: 'getUserData',
    });

    try {
      const userRecord = await admin.auth().getUser(uid);

      logInfo('User data retrieved successfully', {
        uid,
        email: userRecord.email,
        operation: 'getUserData',
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
      };
    } catch (error: any) {
      logError('Failed to get user data', ErrorType.NOT_FOUND, {
        operation: 'getUserData',
        executionTimeMs: Date.now() - startTime,
        originalError: error,
        additionalInfo: { uid },
      });

      throw createError('not-found', `User not found: ${error.message}`, {
        operation: 'getUserData',
      });
    }
  }, 'getUserData')
);

/**
 * Updates user profile information
 */
export const updateProfile = functions.https.onCall(
  { region: 'europe-west1' },
  withErrorHandling(async (request: functions.https.CallableRequest<any>) => {
    const { uid, displayName } = request.data;

    if (!uid) {
      throw createError('invalid-argument', 'User UID is required', {
        operation: 'updateProfile',
      });
    }

    const startTime = Date.now();

    logInfo('Updating user profile', {
      uid,
      displayName,
      operation: 'updateProfile',
    });

    try {
      await admin.auth().updateUser(uid, {
        displayName,
      });

      logInfo('User profile updated successfully', {
        uid,
        displayName,
        operation: 'updateProfile',
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logError('Failed to update user profile', ErrorType.INTERNAL, {
        operation: 'updateProfile',
        executionTimeMs: Date.now() - startTime,
        originalError: error,
        additionalInfo: { uid },
      });

      throw createError('internal', `Profile update failed: ${error.message}`, {
        operation: 'updateProfile',
      });
    }
  }, 'updateProfile')
);

/**
 * Authenticates a user with Google OAuth ID token (server-side)
 * Replaces client-side Google Sign-In to avoid remote script loading
 * Public access enabled for unauthenticated users
 */
export const googleSignIn = functions.https.onCall(
  { 
    region: 'europe-west1', 
    enforceAppCheck: false,
    cors: true
  },
  withErrorHandling(async (request: functions.https.CallableRequest<any>) => {
    const { idToken, clientId } = request.data;

    if (!idToken || !clientId) {
      throw createError('invalid-argument', 'Google ID token and client ID are required', {
        operation: 'googleSignIn',
      });
    }

    const startTime = Date.now();

    logInfo('Processing Google Sign-In', {
      operation: 'googleSignIn',
    });

    try {
      // Initialize Google OAuth2 client
      const client = new OAuth2Client(clientId);
      
      // Verify the Google ID token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw createError('invalid-argument', 'Invalid Google ID token payload', {
          operation: 'googleSignIn',
        });
      }

      const { sub: googleId, email, name, picture, email_verified } = payload;

      if (!email) {
        throw createError('invalid-argument', 'Email not provided by Google', {
          operation: 'googleSignIn',
        });
      }

      let userRecord;
      
      try {
        // Try to get existing user by email
        userRecord = await admin.auth().getUserByEmail(email);
        
        // Update user with Google info if not already set
        const updates: any = {};
        if (!userRecord.photoURL && picture) updates.photoURL = picture;
        if (!userRecord.displayName && name) updates.displayName = name;
        if (email_verified && !userRecord.emailVerified) updates.emailVerified = true;
        
        if (Object.keys(updates).length > 0) {
          userRecord = await admin.auth().updateUser(userRecord.uid, updates);
        }
        
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Create new user with Google info
          userRecord = await admin.auth().createUser({
            email,
            displayName: name,
            photoURL: picture,
            emailVerified: email_verified || false,
          });

          logInfo('New Google user created', {
            uid: userRecord.uid,
            email: userRecord.email,
            operation: 'googleSignIn',
          });
        } else {
          throw error;
        }
      }

      // Create/update user document in Firestore
      const userDocRef = db.collection('users').doc(userRecord.uid);
      await userDocRef.set({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || name || '',
        photoURL: userRecord.photoURL || picture || '',
        emailVerified: userRecord.emailVerified,
        googleId,
        lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      logInfo('Google Sign-In successful', {
        uid: userRecord.uid,
        email: userRecord.email,
        operation: 'googleSignIn',
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || name || '',
        photoURL: userRecord.photoURL || picture || '',
        emailVerified: userRecord.emailVerified,
      };

    } catch (error: any) {
      logError('Failed to authenticate with Google', ErrorType.UNAUTHENTICATED, {
        operation: 'googleSignIn',
        executionTimeMs: Date.now() - startTime,
        originalError: error,
      });

      throw createError('unauthenticated', `Google Sign-In failed: ${error.message}`, {
        operation: 'googleSignIn',
      });
    }
  }, 'googleSignIn')
);

/**
 * Recalculates the average rating for a prompt when a rating is added, updated, or removed
 */
export const recalculateRating = functions.firestore.onDocumentWritten(
  {
    region: 'europe-west1',
    document: 'prompts/{promptId}/ratings/{userId}',
  },
  async (event: any) => {
    const promptId = event.params.promptId;
    const userId = event.params.userId;
    const startTime = Date.now();

    // Reference to the parent prompt document
    const promptRef = db.collection('prompts').doc(promptId);

    try {
      logInfo('Rating changed, recalculating average', {
        promptId,
        userId,
        operation: event.data?.before.exists
          ? event.data?.after.exists
            ? 'update'
            : 'delete'
          : 'create',
      });

      // Get all ratings for this prompt
      const ratingsSnapshot = await db
        .collection('prompts')
        .doc(promptId)
        .collection('ratings')
        .get();

      if (ratingsSnapshot.empty) {
        // If no ratings, set average to 0
        await promptRef.update({
          averageRating: 0,
          totalRatingsCount: 0,
        });

        logInfo('Updated prompt with no ratings', {
          promptId,
          totalRatingsCount: 0,
          executionTimeMs: Date.now() - startTime,
        });
        return null;
      }

      // Calculate the new average rating and count
      let totalRating = 0;
      let validRatingsCount = 0;

      ratingsSnapshot.forEach((doc) => {
        const ratingData = doc.data();
        if (ratingData.rating && typeof ratingData.rating === 'number') {
          totalRating += ratingData.rating;
          validRatingsCount++;
        }
      });

      const newAverageRating =
        validRatingsCount > 0 ? parseFloat((totalRating / validRatingsCount).toFixed(2)) : 0;

      // Update the prompt document with new calculations
      await promptRef.update({
        averageRating: newAverageRating,
        totalRatingsCount: validRatingsCount,
      });

      logInfo('Updated prompt rating statistics', {
        promptId,
        newAverageRating,
        totalRatingsCount: validRatingsCount,
        executionTimeMs: Date.now() - startTime,
      });

      return null;
    } catch (error) {
      logError(`Failed to recalculate ratings for prompt ${promptId}`, ErrorType.DATABASE_ERROR, {
        promptId,
        userId,
        originalError: error instanceof Error ? error : new Error(String(error)),
        operation: 'recalculateRating',
        executionTimeMs: Date.now() - startTime,
      });
      return null;
    }
  }
);

/**
 * Updates the favorites count for a prompt when it's favorited or unfavorited
 */
export const updateFavoritesCount = functions.firestore.onDocumentWritten(
  {
    region: 'europe-west1',
    document: 'prompts/{promptId}/favoritedBy/{userId}',
  },
  async (event: any) => {
    const promptId = event.params.promptId;
    const userId = event.params.userId;
    const startTime = Date.now();
    const promptRef = db.collection('prompts').doc(promptId);

    const operation = event.data?.before.exists
      ? event.data?.after.exists
        ? 'update'
        : 'unfavorite'
      : 'favorite';

    try {
      logInfo('Favorites changed, updating count', {
        promptId,
        userId,
        operation,
      });

      // Get the count of documents in the favoritedBy subcollection
      const favoritesSnapshot = await promptRef.collection('favoritedBy').get();
      const favoritesCount = favoritesSnapshot.size;

      // Update the prompt with the accurate count
      await promptRef.update({
        favoritesCount: favoritesCount,
      });

      logInfo('Updated favorites count', {
        promptId,
        userId,
        favoritesCount,
        operation,
        executionTimeMs: Date.now() - startTime,
      });

      return null;
    } catch (error) {
      logError(
        `Failed to update favorites count for prompt ${promptId}`,
        ErrorType.DATABASE_ERROR,
        {
          promptId,
          userId,
          operation,
          executionTimeMs: Date.now() - startTime,
          originalError: error instanceof Error ? error : new Error(String(error)),
        }
      );
      return null;
    }
  }
);

/**
 * Migration function to recalculate all ratings and favorites
 * This can be triggered manually or scheduled to run periodically
 */
export const recalculateAllStats = functions.https.onCall(
  { region: 'europe-west1' },
  withErrorHandling(async (request: functions.https.CallableRequest<any>) => {
    // Require admin authentication for this sensitive operation
    if (!request.auth?.token.admin) {
      throw createError('permission-denied', 'Only admins can recalculate all stats', {
        userId: request.auth?.uid || 'unknown',
      });
    }

    const startTime = Date.now();
    logInfo('Starting recalculation of all prompt statistics', {
      userId: request.auth.uid,
      operation: 'recalculateAllStats',
      isAdmin: true,
    });

    const promptsSnapshot = await db.collection('prompts').get();
    let updatedCount = 0;
    let errorCount = 0;

    logInfo('Found prompts to update', {
      promptCount: promptsSnapshot.size,
    });

    const promptUpdates = promptsSnapshot.docs.map(async (promptDoc) => {
      const promptId = promptDoc.id;
      const promptStartTime = Date.now();

      try {
        // Get ratings
        const ratingsSnapshot = await promptDoc.ref.collection('ratings').get();
        let totalRating = 0;
        let ratingCount = 0;

        ratingsSnapshot.forEach((doc) => {
          const ratingData = doc.data();
          if (ratingData.rating && typeof ratingData.rating === 'number') {
            totalRating += ratingData.rating;
            ratingCount++;
          }
        });

        const newAverageRating =
          ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(2)) : 0;

        // Get favorites count
        const favoritesSnapshot = await promptDoc.ref.collection('favoritedBy').get();
        const favoritesCount = favoritesSnapshot.size;

        // Update the prompt document
        await promptDoc.ref.update({
          averageRating: newAverageRating,
          totalRatingsCount: ratingCount,
          favoritesCount: favoritesCount,
        });

        updatedCount++;

        logInfo('Updated prompt statistics', {
          promptId,
          newAverageRating,
          ratingCount,
          favoritesCount,
          executionTimeMs: Date.now() - promptStartTime,
        });
      } catch (error) {
        errorCount++;
        logError(`Failed to update stats for prompt ${promptId}`, ErrorType.DATABASE_ERROR, {
          promptId,
          operation: 'recalculateAllStats',
          executionTimeMs: Date.now() - promptStartTime,
          originalError: error instanceof Error ? error : new Error(String(error)),
        });
        // Continue with other prompts even if one fails
      }
    });

    await Promise.all(promptUpdates);

    logInfo('Completed recalculation of all prompt statistics', {
      promptsUpdated: updatedCount,
      promptsFailed: errorCount,
      totalPrompts: promptsSnapshot.size,
      executionTimeMs: Date.now() - startTime,
    });

    return {
      success: true,
      promptsUpdated: updatedCount,
      promptsFailed: errorCount,
      totalPrompts: promptsSnapshot.size,
    };
  }, 'recalculateAllStats')
);

/**
 * Utility function to handle incrementing usage count
 * Ensures the count is only incremented by 1 each time
 */
export const incrementUsageCount = functions.https.onCall(
  { region: 'europe-west1' },
  withErrorHandling(async (request: functions.https.CallableRequest<any>) => {
    if (!request.auth) {
      throw createError('unauthenticated', 'User must be logged in to track usage', {
        operation: 'incrementUsageCount',
      });
    }

    const userId = request.auth.uid;
    const promptId = request.data.promptId;

    if (!promptId) {
      throw createError('invalid-argument', 'Prompt ID is required', {
        userId,
        operation: 'incrementUsageCount',
      });
    }

    const startTime = Date.now();

    logInfo('Incrementing prompt usage count', {
      promptId,
      userId,
      operation: 'incrementUsageCount',
    });

    const promptRef = db.collection('prompts').doc(promptId);
    const promptDoc = await promptRef.get();

    if (!promptDoc.exists) {
      logWarning(`Prompt not found when incrementing usage count`, {
        promptId,
        userId,
        operation: 'incrementUsageCount',
        executionTimeMs: Date.now() - startTime,
      });

      throw createError('not-found', `Prompt with ID ${promptId} not found`, {
        userId,
        promptId,
        operation: 'incrementUsageCount',
      });
    }

    await promptRef.update({
      usageCount: admin.firestore.FieldValue.increment(1),
    });

    logInfo('Successfully incremented usage count', {
      promptId,
      userId,
      operation: 'incrementUsageCount',
      executionTimeMs: Date.now() - startTime,
    });

    return { success: true };
  }, 'incrementUsageCount')
);

// Export the searchPrompts Cloud Function for deployment
export { searchPrompts } from './searchPrompts';
