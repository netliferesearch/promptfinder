import * as functions from 'firebase-functions/v2';

/**
 * Error types for PromptFinder Cloud Functions
 * Used to categorize errors for monitoring and logging
 */
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

/**
 * Structure for error details to enhance logging
 */
interface ErrorDetails {
  userId?: string;
  promptId?: string;
  operation?: string;
  resourceType?: string;
  resourceId?: string;
  functionName?: string;
  executionTimeMs?: number;
  additionalInfo?: Record<string, any>;
  originalError?: Error;
}

/**
 * Structure for log entry
 */
interface LogEntry {
  severity: string;
  message: string;
  timestamp: string;
  function: string;
  errorType?: ErrorType;
  userId?: string;
  promptId?: string;
  operation?: string;
  resourceType?: string;
  resourceId?: string;
  executionTimeMs?: number;
  functionName?: string;
  additionalInfo?: Record<string, any>;
  errorMessage?: string;
  stackTrace?: string;
  [key: string]: any;
}

/**
 * Standardized logging function for errors
 *
 * @param message Main error message
 * @param errorType Category of error from ErrorType enum
 * @param details Additional structured data for error context
 */
export function logError(message: string, errorType: ErrorType, details?: ErrorDetails): void {
  // Create structured log entry that will be easier to query and analyze
  const logEntry: LogEntry = {
    severity: 'ERROR',
    message,
    errorType,
    timestamp: new Date().toISOString(),
    function: getCallerFunctionName(),
  };

  // Add all details to the log entry
  if (details) {
    Object.assign(logEntry, details);
  }

  // If there's an original error, add its message and stack trace
  if (details?.originalError) {
    logEntry.errorMessage = details.originalError.message;
    logEntry.stackTrace = details.originalError.stack;
  }

  // Log as structured JSON for better querying in Cloud Logging
  console.error(JSON.stringify(logEntry));
}

/**
 * Standardized logging function for information
 *
 * @param message Informational message
 * @param details Additional structured data for context
 */
export function logInfo(message: string, details?: Record<string, any>): void {
  // Create structured log entry
  const logEntry: LogEntry = {
    severity: 'INFO',
    message,
    timestamp: new Date().toISOString(),
    function: getCallerFunctionName(),
  };

  // Add all details to the log entry
  if (details) {
    Object.assign(logEntry, details);
  }

  // Log as structured JSON for better querying in Cloud Logging
  console.log(JSON.stringify(logEntry));
}

/**
 * Standardized logging function for warnings
 *
 * @param message Warning message
 * @param details Additional structured data for context
 */
export function logWarning(message: string, details?: Record<string, any>): void {
  // Create structured log entry
  const logEntry: LogEntry = {
    severity: 'WARNING',
    message,
    timestamp: new Date().toISOString(),
    function: getCallerFunctionName(),
  };

  // Add all details to the log entry
  if (details) {
    Object.assign(logEntry, details);
  }

  // Log as structured JSON for better querying in Cloud Logging
  console.warn(JSON.stringify(logEntry));
}

/**
 * Helper to get the name of the function that called the logger
 * This helps identify which Cloud Function generated a log entry
 */
function getCallerFunctionName(): string {
  const stackLines = new Error().stack?.split('\n') || [];
  // Skip first two lines (Error and this function) to get caller
  const callerLine = stackLines[3] || '';

  // Extract function name - basic implementation
  const functionNameMatch = callerLine.match(/at\s+([\w.<>]+)\s+/);
  return functionNameMatch ? functionNameMatch[1] : 'unknown';
}

/**
 * Wraps a Cloud Function execution with timing metrics, logging, and error handling
 *
 * @param fn The function implementation to wrap
 * @param fnName The name of the function (for logging)
 * @returns The wrapped function
 */
export function withErrorHandling<T, R>(
  fn: (request: functions.https.CallableRequest<T>) => Promise<R>,
  fnName: string
): (request: functions.https.CallableRequest<T>) => Promise<R> {
  return async (request: functions.https.CallableRequest<T>): Promise<R> => {
    const startTime = Date.now();

    try {
      // Log the function invocation with user ID if available
      logInfo(`${fnName} started`, {
        userId: request.auth?.uid || 'unauthenticated',
        functionName: fnName,
      });

      // Execute the original function
      const result = await fn(request);

      // Calculate execution time for performance monitoring
      const executionTime = Date.now() - startTime;

      // Log successful completion with timing
      logInfo(`${fnName} completed successfully`, {
        userId: request.auth?.uid || 'unauthenticated',
        functionName: fnName,
        executionTimeMs: executionTime,
      });

      return result;
    } catch (error) {
      // Calculate execution time even for failures
      const executionTime = Date.now() - startTime;

      // Handle different types of errors
      if (error instanceof functions.https.HttpsError) {
        // Already a properly formatted error, just log it
        logError(`${fnName} failed with HttpsError`, error.code as ErrorType, {
          userId: request.auth?.uid || 'unauthenticated',
          functionName: fnName,
          executionTimeMs: executionTime,
          originalError: error,
        });
        throw error;
      } else {
        // Unexpected error, wrap it as an internal error
        const wrappedError = new functions.https.HttpsError(
          'internal',
          `Unexpected error in ${fnName}`,
          error instanceof Error ? error.message : String(error)
        );

        logError(`${fnName} failed with unexpected error`, ErrorType.INTERNAL, {
          userId: request.auth?.uid || 'unauthenticated',
          functionName: fnName,
          executionTimeMs: executionTime,
          originalError: error instanceof Error ? error : new Error(String(error)),
        });

        throw wrappedError;
      }
    }
  };
}

/**
 * Creates a Firebase HttpsError with standardized formatting
 *
 * @param code The error code
 * @param message User-facing error message
 * @param details Additional details (only visible in logs)
 * @returns Formatted HttpsError
 */
export function createError(
  code: functions.https.FunctionsErrorCode,
  message: string,
  details?: Record<string, any>
): functions.https.HttpsError {
  return new functions.https.HttpsError(code, message, details);
}
