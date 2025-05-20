# Error Handling, Logging, and Monitoring for Firebase Cloud Functions

This document outlines the error handling, logging, and monitoring approach implemented for the PromptFinder Chrome extension's Firebase Cloud Functions.

## Overview

We've implemented a comprehensive error handling and logging system that provides:

- Structured JSON logging with severity levels
- Standardized error classification
- Execution time tracking for performance monitoring
- Error handling wrappers for callable functions
- Consistent error reporting

## Error Handling Structure

### Error Types

The application uses a standardized set of error types (defined in `ErrorType` enum):

```typescript
export enum ErrorType {
  // Authentication/Authorization errors
  UNAUTHENTICATED = 'unauthenticated',
  PERMISSION_DENIED = 'permission-denied',

  // Request/input validation errors
  INVALID_ARGUMENT = 'invalid-argument',
  MISSING_REQUIRED_FIELD = 'missing-required-field',
  INVALID_FORMAT = 'invalid-format',

  // Data errors
  NOT_FOUND = 'not-found',
  ALREADY_EXISTS = 'already-exists',

  // Operational errors
  OPERATION_ABORTED = 'operation-aborted',
  DEADLINE_EXCEEDED = 'deadline-exceeded',
  RESOURCE_EXHAUSTED = 'resource-exhausted',

  // System errors
  INTERNAL = 'internal',
  UNAVAILABLE = 'unavailable',
  UNIMPLEMENTED = 'unimplemented',
  DATABASE_ERROR = 'database-error',
}
```

### Logging Functions

Three standardized logging functions are available:

1. `logInfo(message, details)`: Log informational messages
2. `logWarning(message, details)`: Log warnings
3. `logError(message, errorType, details)`: Log errors with type classification

All logs include:

- Timestamp
- Severity level
- Function name (automatically detected)
- User ID (when available)
- Execution time (when provided)
- Additional contextual information

### Error Handling Wrapper

The `withErrorHandling` function wraps Cloud Functions to provide consistent error handling:

```typescript
export function withErrorHandling<T, R>(
  fn: (data: T, context: functions.https.CallableContext) => Promise<R>,
  fnName: string
): (data: T, context: functions.https.CallableContext) => Promise<R>;
```

This wrapper:

- Logs function start and completion
- Tracks execution time
- Handles errors consistently
- Wraps unexpected errors with proper HTTP error types

## Usage Examples

### Callable Functions

```typescript
export const incrementUsageCount = functions.region('europe-west1').https.onCall(
  withErrorHandling(async (data, context) => {
    // Function implementation
  }, 'incrementUsageCount')
);
```

### Firestore Triggers

```typescript
try {
  logInfo('Starting operation', { contextDetails });

  // Function implementation

  logInfo('Operation completed', {
    results,
    executionTimeMs: Date.now() - startTime,
  });
} catch (error) {
  logError('Operation failed', ErrorType.DATABASE_ERROR, {
    contextDetails,
    executionTimeMs: Date.now() - startTime,
    originalError: error,
  });
}
```

## Monitoring Dashboard Setup

To monitor function performance and errors:

1. Go to the Firebase Console > Functions > Dashboard
2. Set up alerts for:
   - High error rates
   - Increased execution times
   - Memory usage spikes

## Best Practices

1. **Always track execution time**: Start with `const startTime = Date.now()` and include `executionTimeMs: Date.now() - startTime` in log entries.

2. **Structure error handling**:

   ```typescript
   try {
     // Function logic
   } catch (error) {
     logError('Clear message', ErrorType.APPROPRIATE_TYPE, {
       contextualDetails,
       executionTimeMs: Date.now() - startTime,
       originalError: error,
     });
   }
   ```

3. **Use error type classification**: Map errors to appropriate error types for better monitoring.

4. **Include context in logs**: Always include relevant IDs (promptId, userId) and operation names.

5. **Use createError for consistent error responses**:

   ```typescript
   throw createError('not-found', 'Resource not found', { resourceId });
   ```

## Query Logs

Use the Firebase Cloud Logging to query logs:

```
resource.type="cloud_function"
severity>=ERROR
jsonPayload.function="functionName"
```

Or filter by error type:

```
resource.type="cloud_function"
jsonPayload.errorType="database-error"
```
