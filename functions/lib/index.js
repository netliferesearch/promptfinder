"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementUsageCount = exports.recalculateAllStats = exports.updateFavoritesCount = exports.recalculateRating = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
/**
 * Recalculates the average rating for a prompt when a rating is added, updated, or removed
 */
exports.recalculateRating = functions
    .region('europe-west1')
    .firestore.document('prompts/{promptId}/ratings/{userId}')
    .onWrite(async (change, context) => {
    const promptId = context.params.promptId;
    // Reference to the parent prompt document
    const promptRef = db.collection('prompts').doc(promptId);
    try {
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
            console.log(`Updated prompt ${promptId} with no ratings`);
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
        console.log(`Updated prompt ${promptId} with new rating average: ${newAverageRating} from ${validRatingsCount} ratings`);
        return null;
    }
    catch (error) {
        console.error(`Error calculating ratings for prompt ${promptId}:`, error);
        return null;
    }
});
/**
 * Updates the favorites count for a prompt when it's favorited or unfavorited
 */
exports.updateFavoritesCount = functions
    .region('europe-west1')
    .firestore.document('prompts/{promptId}/favoritedBy/{userId}')
    .onWrite(async (change, context) => {
    const promptId = context.params.promptId;
    const promptRef = db.collection('prompts').doc(promptId);
    try {
        // Get the count of documents in the favoritedBy subcollection
        const favoritesSnapshot = await promptRef.collection('favoritedBy').get();
        const favoritesCount = favoritesSnapshot.size;
        // Update the prompt with the accurate count
        await promptRef.update({
            favoritesCount: favoritesCount,
        });
        console.log(`Updated favorites count for prompt ${promptId} to ${favoritesCount}`);
        return null;
    }
    catch (error) {
        console.error(`Error updating favorites count for prompt ${promptId}:`, error);
        return null;
    }
});
/**
 * Migration function to recalculate all ratings and favorites
 * This can be triggered manually or scheduled to run periodically
 */
exports.recalculateAllStats = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    var _a;
    // Require admin authentication for this sensitive operation
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can recalculate all stats');
    }
    try {
        const promptsSnapshot = await db.collection('prompts').get();
        let updatedCount = 0;
        const promptUpdates = promptsSnapshot.docs.map(async (promptDoc) => {
            // Using promptDoc.id directly in logs or for reference
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
        });
        await Promise.all(promptUpdates);
        return {
            success: true,
            promptsUpdated: updatedCount,
        };
    }
    catch (error) {
        console.error('Error recalculating all stats:', error);
        throw new functions.https.HttpsError('internal', 'Error recalculating stats');
    }
});
/**
 * Utility function to handle incrementing usage count
 * Ensures the count is only incremented by 1 each time
 */
exports.incrementUsageCount = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to track usage');
    }
    const promptId = data.promptId;
    if (!promptId) {
        throw new functions.https.HttpsError('invalid-argument', 'Prompt ID is required');
    }
    try {
        const promptRef = db.collection('prompts').doc(promptId);
        const promptDoc = await promptRef.get();
        if (!promptDoc.exists) {
            throw new functions.https.HttpsError('not-found', `Prompt with ID ${promptId} not found`);
        }
        await promptRef.update({
            usageCount: admin.firestore.FieldValue.increment(1),
        });
        return { success: true };
    }
    catch (error) {
        console.error(`Error incrementing usage count for prompt ${promptId}:`, error);
        throw new functions.https.HttpsError('internal', 'Error tracking usage');
    }
});
//# sourceMappingURL=index.js.map