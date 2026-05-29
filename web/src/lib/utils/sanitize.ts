/**
 * Input sanitization utilities for security
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
 * Sanitizes user input for use in markdown contexts
 * Allows basic markdown but removes HTML tags
 */
export function sanitizeMarkdown(input: string): string {
  if (!input) return "";

  return (
    input
      // Remove HTML tags but keep markdown syntax
      .replace(/<[^>]+>/g, "")
      // Remove javascript: in links
      .replace(/javascript:/gi, "")
      // Trim
      .trim()
  );
}

/**
 * Validates that a string doesn't contain potentially dangerous patterns
 */
export function isInputSafe(input: string): boolean {
  if (!input) return true;

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /data:\s*image\/svg\+xml/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(input));
}