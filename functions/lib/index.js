"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementUsageCount = exports.recalculateAllStats = exports.updateFavoritesCount = exports.recalculateRating = exports.deletePromptCleanup = void 0;
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const utils_1 = require("./utils");
/**
 * Deletes all subcollections (ratings, favoritedBy) when a prompt is deleted
 */
exports.deletePromptCleanup = functions.firestore.onDocumentDeleted({
    region: 'europe-west1',
    document: 'prompts/{promptId}',
}, async (event) => {
    const promptId = event.params.promptId;
    const startTime = Date.now();
    const ratingsRef = db.collection('prompts').doc(promptId).collection('ratings');
    const favoritesRef = db.collection('prompts').doc(promptId).collection('favoritedBy');
    let deletedRatings = 0;
    let deletedFavorites = 0;
    let errorCount = 0;
    // Helper to batch delete a subcollection
    async function batchDelete(ref) {
        const snapshot = await ref.get();
        const batchSize = snapshot.size;
        if (batchSize === 0)
            return 0;
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        return batchSize;
    }
    try {
        deletedRatings = await batchDelete(ratingsRef);
        deletedFavorites = await batchDelete(favoritesRef);
        (0, utils_1.logInfo)('Deleted subcollections for prompt', {
            promptId,
            deletedRatings,
            deletedFavorites,
            executionTimeMs: Date.now() - startTime,
        });
    }
    catch (error) {
        errorCount++;
        (0, utils_1.logError)('Failed to delete subcollections for prompt', utils_1.ErrorType.DATABASE_ERROR, {
            promptId,
            originalError: error instanceof Error ? error : new Error(String(error)),
            executionTimeMs: Date.now() - startTime,
        });
    }
    return null;
});
admin.initializeApp();
const db = admin.firestore();
/**
 * Recalculates the average rating for a prompt when a rating is added, updated, or removed
 */
exports.recalculateRating = functions.firestore.onDocumentWritten({
    region: 'europe-west1',
    document: 'prompts/{promptId}/ratings/{userId}',
}, async (event) => {
    var _a, _b;
    const promptId = event.params.promptId;
    const userId = event.params.userId;
    const startTime = Date.now();
    // Reference to the parent prompt document
    const promptRef = db.collection('prompts').doc(promptId);
    try {
        (0, utils_1.logInfo)('Rating changed, recalculating average', {
            promptId,
            userId,
            operation: ((_a = event.data) === null || _a === void 0 ? void 0 : _a.before.exists)
                ? ((_b = event.data) === null || _b === void 0 ? void 0 : _b.after.exists)
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
            (0, utils_1.logInfo)('Updated prompt with no ratings', {
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
        const newAverageRating = validRatingsCount > 0 ? parseFloat((totalRating / validRatingsCount).toFixed(2)) : 0;
        // Update the prompt document with new calculations
        await promptRef.update({
            averageRating: newAverageRating,
            totalRatingsCount: validRatingsCount,
        });
        (0, utils_1.logInfo)('Updated prompt rating statistics', {
            promptId,
            newAverageRating,
            totalRatingsCount: validRatingsCount,
            executionTimeMs: Date.now() - startTime,
        });
        return null;
    }
    catch (error) {
        (0, utils_1.logError)(`Failed to recalculate ratings for prompt ${promptId}`, utils_1.ErrorType.DATABASE_ERROR, {
            promptId,
            userId,
            originalError: error instanceof Error ? error : new Error(String(error)),
            operation: 'recalculateRating',
            executionTimeMs: Date.now() - startTime,
        });
        return null;
    }
});
/**
 * Updates the favorites count for a prompt when it's favorited or unfavorited
 */
exports.updateFavoritesCount = functions.firestore.onDocumentWritten({
    region: 'europe-west1',
    document: 'prompts/{promptId}/favoritedBy/{userId}',
}, async (event) => {
    var _a, _b;
    const promptId = event.params.promptId;
    const userId = event.params.userId;
    const startTime = Date.now();
    const promptRef = db.collection('prompts').doc(promptId);
    const operation = ((_a = event.data) === null || _a === void 0 ? void 0 : _a.before.exists)
        ? ((_b = event.data) === null || _b === void 0 ? void 0 : _b.after.exists)
            ? 'update'
            : 'unfavorite'
        : 'favorite';
    try {
        (0, utils_1.logInfo)('Favorites changed, updating count', {
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
        (0, utils_1.logInfo)('Updated favorites count', {
            promptId,
            userId,
            favoritesCount,
            operation,
            executionTimeMs: Date.now() - startTime,
        });
        return null;
    }
    catch (error) {
        (0, utils_1.logError)(`Failed to update favorites count for prompt ${promptId}`, utils_1.ErrorType.DATABASE_ERROR, {
            promptId,
            userId,
            operation,
            executionTimeMs: Date.now() - startTime,
            originalError: error instanceof Error ? error : new Error(String(error)),
        });
        return null;
    }
});
/**
 * Migration function to recalculate all ratings and favorites
 * This can be triggered manually or scheduled to run periodically
 */
exports.recalculateAllStats = functions.https.onCall({ region: 'europe-west1' }, (0, utils_1.withErrorHandling)(async (request) => {
    var _a, _b;
    // Require admin authentication for this sensitive operation
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
        throw (0, utils_1.createError)('permission-denied', 'Only admins can recalculate all stats', {
            userId: ((_b = request.auth) === null || _b === void 0 ? void 0 : _b.uid) || 'unknown',
        });
    }
    const startTime = Date.now();
    (0, utils_1.logInfo)('Starting recalculation of all prompt statistics', {
        userId: request.auth.uid,
        operation: 'recalculateAllStats',
        isAdmin: true,
    });
    const promptsSnapshot = await db.collection('prompts').get();
    let updatedCount = 0;
    let errorCount = 0;
    (0, utils_1.logInfo)('Found prompts to update', {
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
            const newAverageRating = ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(2)) : 0;
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
            (0, utils_1.logInfo)('Updated prompt statistics', {
                promptId,
                newAverageRating,
                ratingCount,
                favoritesCount,
                executionTimeMs: Date.now() - promptStartTime,
            });
        }
        catch (error) {
            errorCount++;
            (0, utils_1.logError)(`Failed to update stats for prompt ${promptId}`, utils_1.ErrorType.DATABASE_ERROR, {
                promptId,
                operation: 'recalculateAllStats',
                executionTimeMs: Date.now() - promptStartTime,
                originalError: error instanceof Error ? error : new Error(String(error)),
            });
            // Continue with other prompts even if one fails
        }
    });
    await Promise.all(promptUpdates);
    (0, utils_1.logInfo)('Completed recalculation of all prompt statistics', {
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
}, 'recalculateAllStats'));
/**
 * Utility function to handle incrementing usage count
 * Ensures the count is only incremented by 1 each time
 */
exports.incrementUsageCount = functions.https.onCall({ region: 'europe-west1' }, (0, utils_1.withErrorHandling)(async (request) => {
    if (!request.auth) {
        throw (0, utils_1.createError)('unauthenticated', 'User must be logged in to track usage', {
            operation: 'incrementUsageCount',
        });
    }
    const userId = request.auth.uid;
    const promptId = request.data.promptId;
    if (!promptId) {
        throw (0, utils_1.createError)('invalid-argument', 'Prompt ID is required', {
            userId,
            operation: 'incrementUsageCount',
        });
    }
    const startTime = Date.now();
    (0, utils_1.logInfo)('Incrementing prompt usage count', {
        promptId,
        userId,
        operation: 'incrementUsageCount',
    });
    const promptRef = db.collection('prompts').doc(promptId);
    const promptDoc = await promptRef.get();
    if (!promptDoc.exists) {
        (0, utils_1.logWarning)(`Prompt not found when incrementing usage count`, {
            promptId,
            userId,
            operation: 'incrementUsageCount',
            executionTimeMs: Date.now() - startTime,
        });
        throw (0, utils_1.createError)('not-found', `Prompt with ID ${promptId} not found`, {
            userId,
            promptId,
            operation: 'incrementUsageCount',
        });
    }
    await promptRef.update({
        usageCount: admin.firestore.FieldValue.increment(1),
    });
    (0, utils_1.logInfo)('Successfully incremented usage count', {
        promptId,
        userId,
        operation: 'incrementUsageCount',
        executionTimeMs: Date.now() - startTime,
    });
    return { success: true };
}, 'incrementUsageCount'));
//# sourceMappingURL=index.js.map