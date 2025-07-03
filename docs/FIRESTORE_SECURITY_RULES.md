# Firestore Security Rules Implementation

This document explains the implementation of Firestore security rules for the DesignPrompts Chrome extension. These rules ensure proper data security, validation, and access control.

## Overview

The security rules implementation follows these key principles:

1. **Authentication-Based Access**: All operations require authentication
2. **Data Validation**: Validate field types, required fields, and value constraints
3. **Permission-Based Access**: Different access levels for owners vs. other users
4. **Admin Functions**: Special permissions for admin operations
5. **Data Integrity**: Prevent manipulation of sensitive fields

## Rule Structure

### Helper Functions

The rules use several helper functions to improve readability and maintainability:

#### Authentication & Access Control

```js
function isAuthenticated() {
  return request.auth != null;
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

function isAdmin() {
  return isAuthenticated() && request.auth.token.admin == true;
}
```

#### Data Validation

```js
function isValidPrompt() {
  /* ... */
}
function isValidPromptUpdate() {
  /* ... */
}
function isValidRating() {
  /* ... */
}
function isValidFavorite() {
  /* ... */
}
```

### Collection-Specific Rules

The rules cover three main collections:

1. **Users Collection**: Personal profile data
2. **Prompts Collection**: The main prompt data, plus subcollections
   - **Ratings Subcollection**: Per-user ratings
   - **Favorites Subcollection**: Per-user favorites
3. **Admin Collection**: For administrative operations

## Detailed Rules Explanation

### Default Rule

By default, all access is denied:

```js
match /{document=**} {
  allow read, write: if false;
}
```

### Users Collection

```js
match /users/{userId} {
  // Allow users to read their own user document
  allow read: if isOwner(userId);

  // Allow users to create/update their own profile
  allow create: if isOwner(userId) &&
                 request.resource.data.keys().hasAll(['email', 'displayName', 'createdAt']);

  allow update: if isOwner(userId) &&
                 !request.resource.data.diff(resource.data).affectedKeys().hasAny(['email', 'createdAt']);
}
```

- **Read Access**: Only the user can read their own profile
- **Create Access**: Validates required fields during creation
- **Update Access**: Prevents changing immutable fields like email and createdAt

### Prompts Collection

```js
match /prompts/{promptId} {
  // Read access rules
  allow read: if isAuthenticated() &&
               (!resource.data.isPrivate || resource.data.userId == request.auth.uid);

  // Create, update, delete rules
  allow create: if isAuthenticated() && isValidPrompt();
  allow update: if isAuthenticated() &&
                 resource.data.userId == request.auth.uid &&
                 isValidPromptUpdate();
  allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;

  // Special rule for Cloud Functions and stats updates
  allow update: if isAdmin() ||
                 (request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['averageRating', 'totalRatingsCount', 'favoritesCount', 'usageCount', 'updatedAt']));

  // Subcollection rules
  match /ratings/{userId} { /* ... */ }
  match /favoritedBy/{userId} { /* ... */ }
}
```

- **Read Access**:
  - Public prompts: All authenticated users
  - Private prompts: Only the owner
- **Create Access**:
  - All authenticated users can create prompts
  - Validates prompt data structure and required fields
  - Prevents users from creating prompts on behalf of others
- **Update Access**:

  - Only the owner can update their prompts
  - Validates that protected fields (stats, userId) aren't changed
  - Special rule for Cloud Functions to update stats fields

- **Delete Access**: Only the owner can delete their prompts

### Ratings Subcollection

```js
match /ratings/{userId} {
  allow read: if isAuthenticated();

  allow create, update: if isAuthenticated() &&
                         userId == request.auth.uid &&
                         isValidRating();

  allow delete: if isAuthenticated() && userId == request.auth.uid;
}
```

- **Read Access**: Any authenticated user can see ratings
- **Write Access**: Users can only create/update/delete their own ratings
- **Validation**: Ensures rating is between 1-5 and belongs to the current user

### Favorites Subcollection

```js
match /favoritedBy/{userId} {
  allow read: if isAuthenticated();

  allow create: if isAuthenticated() &&
                 userId == request.auth.uid &&
                 isValidFavorite();

  allow delete: if isAuthenticated() && userId == request.auth.uid;
}
```

- **Read Access**: Any authenticated user can see who favorited a prompt
- **Write Access**: Users can only favorite/unfavorite for themselves

### Admin Collection

```js
match /admin/{document=**} {
  allow read, write: if isAdmin();
}
```

- Only users with admin status can access this collection
- Used for administrative tasks and configuration

## Data Validation Details

### Prompt Validation

The `isValidPrompt()` function ensures:

1. **Required Fields**: title, text, userId, authorDisplayName, isPrivate, createdAt, updatedAt
2. **Field Type Validation**: Checks that each field has the correct type
3. **Content Validation**:
   - Non-empty title with maximum length of 100 characters
   - Non-empty text
   - Boolean isPrivate flag
   - Maximum description length of 500 characters
   - Maximum category length of 50 characters
   - Tags and targetAiTools must be lists
4. **Statistics Protection**: Prevents users from manipulating rating counts, favorites counts, etc.

### Update Validation

The `isValidPromptUpdate()` function ensures:

1. **Protected Fields**: Prevents changing userId, stats fields, etc.
2. **Field Validation**: Same validation as create, but only for fields being updated

## Testing

To test these rules:

1. Use the Firebase Emulator Suite to test rules locally
2. The test cases should verify:
   - Authenticated vs. unauthenticated access
   - Owner vs. non-owner access to private prompts
   - Data validation for create/update operations
   - Protection of sensitive fields

## Security Considerations

These rules implement several important security principles:

1. **Principle of Least Privilege**: Users only have access to what they need
2. **Data Validation**: Prevents malformed data and injection attacks
3. **Authentication Required**: All operations need authentication
4. **Ownership Protection**: Users can only modify their own data
5. **Field-Level Security**: Protected fields cannot be manipulated by regular users
