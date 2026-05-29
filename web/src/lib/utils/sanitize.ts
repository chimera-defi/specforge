/**
 * Input sanitization and validation utilities
 */

/**
 * Sanitizes a string to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  return (
    input
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove onclick, onerror, etc.
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
      // Remove javascript: protocol
      .replace(/javascript:/gi, "")
      // Remove data: URLs that could execute scripts
      .replace(/data:\s*image\/svg\+xml/gi, "")
      // Remove other potentially dangerous protocols
      .replace(/vbscript:/gi, "")
      .replace(/about:/gi, "")
      // Trim whitespace
      .trim()
  );
}

/**
 * Get error message for a specific field
 */
export function getFieldError<T extends { field: string; message: string }>(
  fieldName: string,
  validationErrors: T[]
): string | undefined {
  return validationErrors.find((error) => error.field === fieldName)?.message;
}

/**
 * Generate unique ID for field error message
 */
export function getFieldErrorId(fieldName: string): string {
  return `${fieldName}-error`;
}

/**
 * Check if a field has validation errors
 */
export function hasFieldError<T extends { field: string; message: string }>(
  fieldName: string,
  validationErrors: T[]
): boolean {
  return getFieldError(fieldName, validationErrors) !== undefined;
}

/**
 * Generate screen reader announcement for validation errors
 */
export function getValidationAnnouncement<T extends { field: string; message: string }>(
  validationErrors: T[]
): string {
  if (validationErrors.length === 0) {
    return "";
  }
  return `Form has ${validationErrors.length} validation error${
    validationErrors.length === 1 ? "" : "s"
  }. Please correct the highlighted fields.`;
}