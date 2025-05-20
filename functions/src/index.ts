import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ErrorType, logError, logInfo, logWarning, withErrorHandling, createError } from './utils';

admin.initializeApp();
const db = admin.firestore();

/**
 * Recalculates the average rating for a prompt when a rating is added, updated, or removed
 */
export const recalculateRating = functions
  .region('europe-west1')
  .firestore.document('prompts/{promptId}/ratings/{userId}')
  .onWrite(async (change, context) => {
    const promptId = context.params.promptId;
    const userId = context.params.userId;
    const startTime = Date.now();

    // Reference to the parent prompt document
    const promptRef = db.collection('prompts').doc(promptId);

    try {
      logInfo('Rating changed, recalculating average', {
        promptId,
        userId,
        operation: change.before.exists ? (change.after.exists ? 'update' : 'delete') : 'create'
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
          executionTimeMs: Date.now() - startTime
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
        executionTimeMs: Date.now() - startTime
      });
      
      return null;
    } catch (error) {
      logError(
        `Failed to recalculate ratings for prompt ${promptId}`, 
        ErrorType.DATABASE_ERROR, 
        {
          promptId,
          userId,
          originalError: error instanceof Error ? error : new Error(String(error)),
          operation: 'recalculateRating',
          executionTimeMs: Date.now() - startTime
        }
      );
      return null;
    }
  });

/**
 * Updates the favorites count for a prompt when it's favorited or unfavorited
 */
export const updateFavoritesCount = functions
  .region('europe-west1')
  .firestore.document('prompts/{promptId}/favoritedBy/{userId}')
  .onWrite(async (change, context) => {
    const promptId = context.params.promptId;
    const userId = context.params.userId;
    const startTime = Date.now();
    const promptRef = db.collection('prompts').doc(promptId);
    
    const operation = change.before.exists
      ? (change.after.exists ? 'update' : 'unfavorite')
      : 'favorite';

    try {
      logInfo('Favorites changed, updating count', {
        promptId,
        userId,
        operation
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
        executionTimeMs: Date.now() - startTime
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
          originalError: error instanceof Error ? error : new Error(String(error))
        }
      );
      return null;
    }
  });

/**
 * Migration function to recalculate all ratings and favorites
 * This can be triggered manually or scheduled to run periodically
 */
export const recalculateAllStats = functions
  .region('europe-west1')
  .https.onCall(withErrorHandling(async (data, context) => {
    // Require admin authentication for this sensitive operation
    if (!context.auth?.token.admin) {
      throw createError(
        'permission-denied',
        'Only admins can recalculate all stats',
        { userId: context.auth?.uid || 'unknown' }
      );
    }

    const startTime = Date.now();
    logInfo('Starting recalculation of all prompt statistics', {
      userId: context.auth.uid,
      operation: 'recalculateAllStats',
      isAdmin: true
    });

    const promptsSnapshot = await db.collection('prompts').get();
    let updatedCount = 0;
    let errorCount = 0;
    
    logInfo('Found prompts to update', {
      promptCount: promptsSnapshot.size
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
          executionTimeMs: Date.now() - promptStartTime
        });
      } catch (error) {
        errorCount++;
        logError(`Failed to update stats for prompt ${promptId}`, ErrorType.DATABASE_ERROR, {
          promptId,
          operation: 'recalculateAllStats',
          executionTimeMs: Date.now() - promptStartTime,
          originalError: error instanceof Error ? error : new Error(String(error))
        });
        // Continue with other prompts even if one fails
      }
    });

    await Promise.all(promptUpdates);
    
    logInfo('Completed recalculation of all prompt statistics', {
      promptsUpdated: updatedCount,
      promptsFailed: errorCount,
      totalPrompts: promptsSnapshot.size,
      executionTimeMs: Date.now() - startTime
    });

    return {
      success: true,
      promptsUpdated: updatedCount,
      promptsFailed: errorCount,
      totalPrompts: promptsSnapshot.size
    };
  }, 'recalculateAllStats'));

/**
 * Utility function to handle incrementing usage count
 * Ensures the count is only incremented by 1 each time
 */
export const incrementUsageCount = functions
  .region('europe-west1')
  .https.onCall(withErrorHandling(async (data, context) => {
    if (!context.auth) {
      throw createError(
        'unauthenticated',
        'User must be logged in to track usage',
        { operation: 'incrementUsageCount' }
      );
    }

    const userId = context.auth.uid;
    const promptId = data.promptId;
    
    if (!promptId) {
      throw createError(
        'invalid-argument', 
        'Prompt ID is required',
        { userId, operation: 'incrementUsageCount' }
      );
    }

    const startTime = Date.now();
    
    logInfo('Incrementing prompt usage count', {
      promptId,
      userId,
      operation: 'incrementUsageCount'
    });

    const promptRef = db.collection('prompts').doc(promptId);
    const promptDoc = await promptRef.get();

    if (!promptDoc.exists) {
      logWarning(`Prompt not found when incrementing usage count`, {
        promptId,
        userId,
        operation: 'incrementUsageCount',
        executionTimeMs: Date.now() - startTime
      });
      
      throw createError(
        'not-found', 
        `Prompt with ID ${promptId} not found`,
        { 
          userId,
          promptId,
          operation: 'incrementUsageCount'
        }
      );
    }

    await promptRef.update({
      usageCount: admin.firestore.FieldValue.increment(1),
    });

    logInfo('Successfully incremented usage count', {
      promptId,
      userId,
      operation: 'incrementUsageCount',
      executionTimeMs: Date.now() - startTime
    });

    return { success: true };
  }, 'incrementUsageCount');

/**
 * Deletes all documents in subcollections of a prompt when the prompt is deleted.
 */
export const onPromptDeleted = functions
  .region('europe-west1')
  .firestore.document('prompts/{promptId}')
  .onDelete(async (snap, context) => {
    const promptId = context.params.promptId;
    const startTime = Date.now();

    logInfo('Prompt deleted, cleaning up subcollections', {
      promptId,
      operation: 'onPromptDeleted',
    });

    const subcollections = ['ratings', 'favoritedBy'];
    const batch = db.batch();

    for (const subcollectionName of subcollections) {
      try {
        const snapshot = await db
          .collection('prompts')
          .doc(promptId)
          .collection(subcollectionName)
          .get();

        if (!snapshot.empty) {
          logInfo(`Found documents in subcollection '${subcollectionName}' to delete`, {
            promptId,
            count: snapshot.size,
            operation: 'onPromptDeleted',
          });
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
        }
      } catch (error) {
        logError(
          `Error fetching documents from ${subcollectionName} for prompt ${promptId}`,
          ErrorType.DATABASE_ERROR,
          {
            promptId,
            operation: 'onPromptDeleted',
            originalError: error instanceof Error ? error : new Error(String(error)),
          }
        );
        // Optionally, rethrow or handle to prevent commit if critical
      }
    }

    try {
      await batch.commit();
      logInfo('Successfully deleted subcollections for prompt', {
        promptId,
        operation: 'onPromptDeleted',
        executionTimeMs: Date.now() - startTime,
      });
    } catch (error) {
      logError(
        `Error committing batch delete for subcollections of prompt ${promptId}`,
        ErrorType.DATABASE_ERROR,
        {
          promptId,
          operation: 'onPromptDeleted',
          executionTimeMs: Date.now() - startTime,
          originalError: error instanceof Error ? error : new Error(String(error)),
        }
      );
    }
    return null;
  });
