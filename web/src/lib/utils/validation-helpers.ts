/**
 * Shared form validation helper functions
 */

export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Get error message for a specific field
 */
export function getFieldError(
  fieldName: string,
  validationErrors: ValidationError[]
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
export function hasFieldError(
  fieldName: string,
  validationErrors: ValidationError[]
): boolean {
  return getFieldError(fieldName, validationErrors) !== undefined;
}

/**
 * Generate screen reader announcement for validation errors
 */
export function getValidationAnnouncement(
  validationErrors: ValidationError[]
): string {
  if (validationErrors.length === 0) {
    return "";
  }
  return `Form has ${validationErrors.length} validation error${
    validationErrors.length === 1 ? "" : "s"
  }. Please correct the highlighted fields.`;
}