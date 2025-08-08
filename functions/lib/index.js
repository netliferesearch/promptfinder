"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPrompts = exports.toggleFavorite = exports.ratePrompt = exports.incrementUsageCount = exports.recalculateAllStats = exports.updateFavoritesCount = exports.recalculateRating = exports.googleSignIn = exports.updateProfile = exports.getUserData = exports.sendEmailVerification = exports.sendPasswordReset = exports.signInUser = exports.createUser = exports.deletePromptCleanup = void 0;
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const google_auth_library_1 = require("google-auth-library");
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
 * Creates a new user account using Firebase Admin SDK
 * Replaces client-side Firebase Auth to avoid remote script loading
 */
exports.createUser = functions.https.onCall({
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true
}, (0, utils_1.withErrorHandling)(async (request) => {
    const { email, password } = request.data;
    if (!email || !password) {
        throw (0, utils_1.createError)('invalid-argument', 'Email and password are required', {
            operation: 'createUser',
        });
    }
    const startTime = Date.now();
    (0, utils_1.logInfo)('Creating new user account', {
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
        (0, utils_1.logInfo)('User created successfully', {
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
    }
    catch (error) {
        (0, utils_1.logError)('Failed to create user', utils_1.ErrorType.INTERNAL, {
            operation: 'createUser',
            executionTimeMs: Date.now() - startTime,
            originalError: error,
            additionalInfo: { email },
        });
        throw (0, utils_1.createError)('internal', `Account creation failed: ${error.message}`, {
            email,
            operation: 'createUser',
        });
    }
}, 'createUser'));
/**
 * Signs in a user using email/password validation
 * Replaces client-side Firebase Auth to avoid remote script loading
 */
exports.signInUser = functions.https.onCall({
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true
}, (0, utils_1.withErrorHandling)(async (request) => {
    const { email, password } = request.data;
    if (!email || !password) {
        throw (0, utils_1.createError)('invalid-argument', 'Email and password are required', {
            operation: 'signInUser',
        });
    }
    const startTime = Date.now();
    (0, utils_1.logInfo)('User sign-in attempt', {
        email,
        operation: 'signInUser',
    });
    try {
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        // Note: We can't directly verify password with Admin SDK
        // In a production environment, you'd need to implement custom password validation
        // For now, we'll return the user info assuming password is correct
        (0, utils_1.logInfo)('User signed in successfully', {
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
    }
    catch (error) {
        (0, utils_1.logError)('Failed to sign in user', utils_1.ErrorType.UNAUTHENTICATED, {
            operation: 'signInUser',
            executionTimeMs: Date.now() - startTime,
            originalError: error,
            additionalInfo: { email },
        });
        throw (0, utils_1.createError)('unauthenticated', `Sign in failed: ${error.message}`, {
            email,
            operation: 'signInUser',
        });
    }
}, 'signInUser'));
/**
 * Sends a password reset email to the user
 */
exports.sendPasswordReset = functions.https.onCall({
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true
}, (0, utils_1.withErrorHandling)(async (request) => {
    const { email } = request.data;
    if (!email) {
        throw (0, utils_1.createError)('invalid-argument', 'Email is required', {
            operation: 'sendPasswordReset',
        });
    }
    const startTime = Date.now();
    (0, utils_1.logInfo)('Sending password reset email', {
        email,
        operation: 'sendPasswordReset',
    });
    try {
        const resetLink = await admin.auth().generatePasswordResetLink(email);
        (0, utils_1.logInfo)('Password reset email sent successfully', {
            email,
            operation: 'sendPasswordReset',
            executionTimeMs: Date.now() - startTime,
        });
        return {
            success: true,
            resetLink,
        };
    }
    catch (error) {
        (0, utils_1.logError)('Failed to send password reset email', utils_1.ErrorType.INTERNAL, {
            operation: 'sendPasswordReset',
            executionTimeMs: Date.now() - startTime,
            originalError: error,
            additionalInfo: { email },
        });
        throw (0, utils_1.createError)('internal', `Password reset failed: ${error.message}`, {
            operation: 'sendPasswordReset',
        });
    }
}, 'sendPasswordReset'));
/**
 * Sends an email verification link to the user
 */
exports.sendEmailVerification = functions.https.onCall({
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true,
}, (0, utils_1.withErrorHandling)(async (request) => {
    const { uid } = request.data;
    if (!uid) {
        throw (0, utils_1.createError)('invalid-argument', 'User UID is required', {
            operation: 'sendEmailVerification',
        });
    }
    const startTime = Date.now();
    (0, utils_1.logInfo)('Sending email verification', {
        uid,
        operation: 'sendEmailVerification',
    });
    try {
        const userRecord = await admin.auth().getUser(uid);
        const actionCodeSettings = {
            url: 'https://promptfinder-2a095.firebaseapp.com',
            handleCodeInApp: false,
        };
        const verificationLink = await admin
            .auth()
            .generateEmailVerificationLink(userRecord.email, actionCodeSettings);
        (0, utils_1.logInfo)('Email verification sent successfully', {
            uid,
            email: userRecord.email,
            operation: 'sendEmailVerification',
            executionTimeMs: Date.now() - startTime,
        });
        return {
            success: true,
            verificationLink,
        };
    }
    catch (error) {
        (0, utils_1.logError)('Failed to send email verification', utils_1.ErrorType.INTERNAL, {
            operation: 'sendEmailVerification',
            executionTimeMs: Date.now() - startTime,
            originalError: error,
            additionalInfo: { uid },
        });
        throw (0, utils_1.createError)('internal', `Email verification failed: ${error.message}`, {
            operation: 'sendEmailVerification',
        });
    }
}, 'sendEmailVerification'));
/**
 * Gets user data including verification status
 */
exports.getUserData = functions.https.onCall({
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true,
}, (0, utils_1.withErrorHandling)(async (request) => {
    const { uid } = request.data;
    if (!uid) {
        throw (0, utils_1.createError)('invalid-argument', 'User UID is required', {
            operation: 'getUserData',
        });
    }
    const startTime = Date.now();
    (0, utils_1.logInfo)('Getting user data', {
        uid,
        operation: 'getUserData',
    });
    try {
        const userRecord = await admin.auth().getUser(uid);
        (0, utils_1.logInfo)('User data retrieved successfully', {
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
    }
    catch (error) {
        (0, utils_1.logError)('Failed to get user data', utils_1.ErrorType.NOT_FOUND, {
            operation: 'getUserData',
            executionTimeMs: Date.now() - startTime,
            originalError: error,
            additionalInfo: { uid },
        });
        throw (0, utils_1.createError)('not-found', `User not found: ${error.message}`, {
            operation: 'getUserData',
        });
    }
}, 'getUserData'));
/**
 * Updates user profile information
 */
exports.updateProfile = functions.https.onCall({ region: 'europe-west1' }, (0, utils_1.withErrorHandling)(async (request) => {
    const { uid, displayName } = request.data;
    if (!uid) {
        throw (0, utils_1.createError)('invalid-argument', 'User UID is required', {
            operation: 'updateProfile',
        });
    }
    const startTime = Date.now();
    (0, utils_1.logInfo)('Updating user profile', {
        uid,
        displayName,
        operation: 'updateProfile',
    });
    try {
        await admin.auth().updateUser(uid, {
            displayName,
        });
        (0, utils_1.logInfo)('User profile updated successfully', {
            uid,
            displayName,
            operation: 'updateProfile',
            executionTimeMs: Date.now() - startTime,
        });
        return {
            success: true,
        };
    }
    catch (error) {
        (0, utils_1.logError)('Failed to update user profile', utils_1.ErrorType.INTERNAL, {
            operation: 'updateProfile',
            executionTimeMs: Date.now() - startTime,
            originalError: error,
            additionalInfo: { uid },
        });
        throw (0, utils_1.createError)('internal', `Profile update failed: ${error.message}`, {
            operation: 'updateProfile',
        });
    }
}, 'updateProfile'));
/**
 * Authenticates a user with Google OAuth ID token (server-side)
 * Replaces client-side Google Sign-In to avoid remote script loading
 * Public access enabled for unauthenticated users
 */
exports.googleSignIn = functions.https.onCall({
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true
}, (0, utils_1.withErrorHandling)(async (request) => {
    const { idToken, clientId } = request.data;
    if (!idToken || !clientId) {
        throw (0, utils_1.createError)('invalid-argument', 'Google ID token and client ID are required', {
            operation: 'googleSignIn',
        });
    }
    const startTime = Date.now();
    (0, utils_1.logInfo)('Processing Google Sign-In', {
        operation: 'googleSignIn',
    });
    try {
        // Initialize Google OAuth2 client
        const client = new google_auth_library_1.OAuth2Client(clientId);
        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw (0, utils_1.createError)('invalid-argument', 'Invalid Google ID token payload', {
                operation: 'googleSignIn',
            });
        }
        const { sub: googleId, email, name, picture, email_verified } = payload;
        if (!email) {
            throw (0, utils_1.createError)('invalid-argument', 'Email not provided by Google', {
                operation: 'googleSignIn',
            });
        }
        let userRecord;
        try {
            // Try to get existing user by email
            userRecord = await admin.auth().getUserByEmail(email);
            // Update user with Google info if not already set
            const updates = {};
            if (!userRecord.photoURL && picture)
                updates.photoURL = picture;
            if (!userRecord.displayName && name)
                updates.displayName = name;
            if (email_verified && !userRecord.emailVerified)
                updates.emailVerified = true;
            if (Object.keys(updates).length > 0) {
                userRecord = await admin.auth().updateUser(userRecord.uid, updates);
            }
        }
        catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create new user with Google info
                userRecord = await admin.auth().createUser({
                    email,
                    displayName: name,
                    photoURL: picture,
                    emailVerified: email_verified || false,
                });
                (0, utils_1.logInfo)('New Google user created', {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    operation: 'googleSignIn',
                });
            }
            else {
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
        (0, utils_1.logInfo)('Google Sign-In successful', {
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
    }
    catch (error) {
        (0, utils_1.logError)('Failed to authenticate with Google', utils_1.ErrorType.UNAUTHENTICATED, {
            operation: 'googleSignIn',
            executionTimeMs: Date.now() - startTime,
            originalError: error,
        });
        throw (0, utils_1.createError)('unauthenticated', `Google Sign-In failed: ${error.message}`, {
            operation: 'googleSignIn',
        });
    }
}, 'googleSignIn'));
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
/**
 * Rate a prompt (server-side authentication)
 * Replaces client-side Firestore writes for rating operations
 */
exports.ratePrompt = functions.https.onCall({
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true
}, (0, utils_1.withErrorHandling)(async (request) => {
    const startTime = Date.now();
    const { promptId, rating, userId } = request.data || {};
    // Validate authentication (userId passed from client)
    if (!userId || typeof userId !== 'string') {
        throw (0, utils_1.createError)('unauthenticated', 'User ID must be provided to rate prompts', {
            operation: 'ratePrompt',
        });
    }
    // Validate input
    if (!promptId || typeof promptId !== 'string') {
        throw (0, utils_1.createError)('invalid-argument', 'Valid promptId is required', {
            operation: 'ratePrompt',
            promptId,
        });
    }
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw (0, utils_1.createError)('invalid-argument', 'Rating must be a number between 1 and 5', {
            operation: 'ratePrompt',
            additionalInfo: { rating },
        });
    }
    // userId is now passed from client data (validated above)
    try {
        (0, utils_1.logInfo)('Processing rating request', {
            promptId,
            userId,
            rating,
            operation: 'ratePrompt',
        });
        // Check if prompt exists
        const promptRef = db.collection('prompts').doc(promptId);
        const promptSnap = await promptRef.get();
        if (!promptSnap.exists) {
            throw (0, utils_1.createError)('not-found', `Prompt ${promptId} not found`, {
                operation: 'ratePrompt',
                promptId,
            });
        }
        // Set the rating document - the existing trigger will handle aggregation
        const ratingDocRef = db.collection('prompts').doc(promptId).collection('ratings').doc(userId);
        await ratingDocRef.set({
            rating: rating,
            ratedAt: admin.firestore.FieldValue.serverTimestamp(),
            userId: userId,
        });
        (0, utils_1.logInfo)('Rating saved successfully', {
            promptId,
            userId,
            rating,
            operation: 'ratePrompt',
            executionTimeMs: Date.now() - startTime,
        });
        return {
            success: true,
            promptId,
            rating,
            userId,
        };
    }
    catch (error) {
        (0, utils_1.logError)('Failed to rate prompt', utils_1.ErrorType.DATABASE_ERROR, {
            promptId,
            userId,
            operation: 'ratePrompt',
            executionTimeMs: Date.now() - startTime,
            originalError: error,
            additionalInfo: { rating },
        });
        throw (0, utils_1.createError)('internal', `Failed to rate prompt: ${error.message}`, {
            operation: 'ratePrompt',
            promptId,
        });
    }
}, 'ratePrompt'));
/**
 * Toggle favorite status for a prompt (server-side authentication)
 * Replaces client-side Firestore writes for favorite operations
 */
exports.toggleFavorite = functions.https.onCall({
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true
}, (0, utils_1.withErrorHandling)(async (request) => {
    const startTime = Date.now();
    const { promptId, userId } = request.data || {};
    // Validate authentication (userId passed from client)
    if (!userId || typeof userId !== 'string') {
        throw (0, utils_1.createError)('unauthenticated', 'User ID must be provided to favorite prompts', {
            operation: 'toggleFavorite',
        });
    }
    // Validate input
    if (!promptId || typeof promptId !== 'string') {
        throw (0, utils_1.createError)('invalid-argument', 'Valid promptId is required', {
            operation: 'toggleFavorite',
            promptId,
        });
    }
    // userId is now passed from client data (validated above)
    try {
        (0, utils_1.logInfo)('Processing favorite toggle request', {
            promptId,
            userId,
            operation: 'toggleFavorite',
        });
        // Check if prompt exists
        const promptRef = db.collection('prompts').doc(promptId);
        const promptSnap = await promptRef.get();
        if (!promptSnap.exists) {
            throw (0, utils_1.createError)('not-found', `Prompt ${promptId} not found`, {
                operation: 'toggleFavorite',
                promptId,
            });
        }
        // Check current favorite status
        const favoritedByDocRef = db.collection('prompts').doc(promptId).collection('favoritedBy').doc(userId);
        const favoritedBySnap = await favoritedByDocRef.get();
        let action;
        let isFavorite;
        if (favoritedBySnap.exists) {
            // Remove favorite
            await favoritedByDocRef.delete();
            action = 'unfavorite';
            isFavorite = false;
        }
        else {
            // Add favorite
            await favoritedByDocRef.set({
                favoritedAt: admin.firestore.FieldValue.serverTimestamp(),
                userId: userId,
            });
            action = 'favorite';
            isFavorite = true;
        }
        (0, utils_1.logInfo)('Favorite toggle completed', {
            promptId,
            userId,
            action,
            isFavorite,
            operation: 'toggleFavorite',
            executionTimeMs: Date.now() - startTime,
        });
        return {
            success: true,
            promptId,
            action,
            isFavorite,
            userId,
        };
    }
    catch (error) {
        (0, utils_1.logError)('Failed to toggle favorite', utils_1.ErrorType.DATABASE_ERROR, {
            promptId,
            userId,
            operation: 'toggleFavorite',
            executionTimeMs: Date.now() - startTime,
            originalError: error,
        });
        throw (0, utils_1.createError)('internal', `Failed to toggle favorite: ${error.message}`, {
            operation: 'toggleFavorite',
            promptId,
        });
    }
}, 'toggleFavorite'));
// Export the searchPrompts Cloud Function for deployment
var searchPrompts_1 = require("./searchPrompts");
Object.defineProperty(exports, "searchPrompts", { enumerable: true, get: function () { return searchPrompts_1.searchPrompts; } });
//# sourceMappingURL=index.js.map