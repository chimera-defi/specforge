/**
 * Validation utility
 * Common validation functions and rules
 */

import { APP_CONFIG } from "@/lib/constants";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Filename validation
 */
export function isValidFilename(filename: string): ValidationResult {
  const errors: string[] = [];

  if (!filename || filename.trim().length === 0) {
    errors.push("Filename is required");
  }

  if (filename.length > APP_CONFIG.MAX_FILENAME_LENGTH) {
    errors.push(`Filename must be less than ${APP_CONFIG.MAX_FILENAME_LENGTH} characters`);
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(filename)) {
    errors.push("Filename contains invalid characters");
  }

  // Check for reserved names (Windows)
  const reservedNames = [
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
  ];
  const nameWithoutExt = filename.split(".")[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    errors.push("Filename is a reserved name");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  const errors: string[] = [];

  if (!value || value.trim().length === 0) {
    errors.push(`${fieldName} is required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];

  if (value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters`);
  }

  if (value.length > max) {
    errors.push(`${fieldName} must be at most ${max} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate against custom rules
 */
export function validateRules(
  value: string,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove invalid characters
  let sanitized = filename.replace(/[<>:"/\\|?*]/g, "_");
  
  // Remove leading/trailing spaces and dots
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, "");
  
  // Ensure filename is not empty after sanitization
  if (sanitized.length === 0) {
    sanitized = "untitled";
  }

  return sanitized;
}