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
 * Generic field validation helper
 */
export function validateField(
  value: string | undefined,
  fieldName: string,
  minLength: number,
  example: string
): string | undefined {
  if (!value || value.trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters (${example})`;
  }
  return undefined;
}

/**
 * Validate multiple fields at once
 */
export function validateFields<T extends string>(
  fields: Record<T, string | undefined>,
  rules: Record<T, { minLength: number; example: string; displayName?: string }>
): { field: T; message: string }[] {
  const errors: { field: T; message: string }[] = [];

  for (const [fieldKey, fieldValue] of Object.entries(fields) as [T, string | undefined][]) {
    const rule = rules[fieldKey];
    if (!rule) continue;

    const error = validateField(
      fieldValue,
      rule.displayName || fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1),
      rule.minLength,
      rule.example
    );
    if (error) {
      errors.push({ field: fieldKey, message: error });
    }
  }

  return errors;
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

/**
 * Convert text to bullet list format (internal helper)
 */
function toBulletLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^-+\s*/, ""));
}

/**
 * Format a markdown section with heading and bullet content
 */
export function toSection(heading: string, body: string, fallback: string): string {
  const trimmed = body.trim();
  const lines = trimmed.length > 0 ? toBulletLines(trimmed) : [fallback];

  return [`## ${heading}`, "", ...lines.map((l) => `- ${l}`)].join("\n");
}