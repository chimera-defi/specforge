/**
 * Global Error Handler
 * Captures errors and reports them to Sentry
 */

import { captureError, addBreadcrumb } from "../sentry";
import { logger } from "../logger";

/**
 * Handle async errors
 */
export function handleAsyncError(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  addBreadcrumb("Async error occurred", "error", "error");
  captureError(error, context);
  logger.error("Async error", { error, context });
}

/**
 * Handle API errors
 */
export function handleApiError(
  error: Error | unknown,
  endpoint: string,
  context?: Record<string, unknown>
): void {
  addBreadcrumb(`API error: ${endpoint}`, "api", "error");
  captureError(error, {
    ...context,
    endpoint,
    type: "api_error",
  });
  logger.error("API error", { error, endpoint, context });
}

/**
 * Handle database errors
 */
export function handleDatabaseError(
  error: Error | unknown,
  operation: string,
  context?: Record<string, unknown>
): void {
  addBreadcrumb(`Database error: ${operation}`, "database", "error");
  captureError(error, {
    ...context,
    operation,
    type: "database_error",
  });
  logger.error("Database error", { error, operation, context });
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  error: Error | unknown,
  field: string,
  context?: Record<string, unknown>
): void {
  addBreadcrumb(`Validation error: ${field}`, "validation", "warning");
  captureError(error, {
    ...context,
    field,
    type: "validation_error",
  });
  logger.warn("Validation error", { error, field, context });
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleAsyncError(error, context);
      throw error;
    }
  }) as T;
}