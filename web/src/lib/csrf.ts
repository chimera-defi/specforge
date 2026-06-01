/**
 * CSRF token generation and validation
 * 
 * Provides CSRF protection for state-changing operations
 * Note: GitHub OAuth already has state verification for CSRF protection
 */

import crypto from 'crypto';

const CSRF_SECRET = process.env.SPECFORGE_CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 3600 * 1000; // 1 hour in milliseconds

interface CSRFTokenData {
  token: string;
  expiresAt: number;
}

const tokenStore = new Map<string, CSRFTokenData>();

// Clean up expired tokens every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of tokenStore.entries()) {
      if (now > data.expiresAt) {
        tokenStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Generate a CSRF token
 * @param sessionId Optional session identifier for token binding
 * @returns CSRF token
 */
export function generateCSRFToken(sessionId?: string): string {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const expiresAt = Date.now() + CSRF_TOKEN_EXPIRY;
  
  // Store token with expiration
  tokenStore.set(token, {
    token,
    expiresAt,
  });
  
  return token;
}

/**
 * Validate a CSRF token
 * @param token CSRF token to validate
 * @returns true if token is valid, false otherwise
 */
export function validateCSRFToken(token: string): boolean {
  const data = tokenStore.get(token);
  
  if (!data) {
    return false;
  }
  
  // Check if token has expired
  if (Date.now() > data.expiresAt) {
    tokenStore.delete(token);
    return false;
  }
  
  return true;
}

/**
 * Invalidate a CSRF token after use
 * @param token CSRF token to invalidate
 */
export function invalidateCSRFToken(token: string): void {
  tokenStore.delete(token);
}

/**
 * Generate a CSRF token with a signed hash for additional security
 * This is useful for scenarios where you need to verify the token without server-side state
 */
export function generateSignedCSRFToken(sessionId?: string): string {
  const token = generateCSRFToken(sessionId);
  const timestamp = Date.now();
  const message = `${token}:${timestamp}`;
  
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(message)
    .digest('hex');
  
  return `${token}:${timestamp}:${signature}`;
}

/**
 * Validate a signed CSRF token
 * @param signedToken Signed CSRF token
 * @returns true if token is valid, false otherwise
 */
export function validateSignedCSRFToken(signedToken: string): boolean {
  const parts = signedToken.split(':');
  if (parts.length !== 3) {
    return false;
  }
  
  const [token, timestamp, signature] = parts;
  const message = `${token}:${timestamp}`;
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(message)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return false;
  }
  
  // Check timestamp (prevent replay attacks, 5 minute window)
  const tokenTime = parseInt(timestamp, 10);
  const now = Date.now();
  const timeDiff = now - tokenTime;
  
  if (timeDiff > 5 * 60 * 1000 || timeDiff < 0) {
    return false;
  }
  
  // Validate the underlying token
  return validateCSRFToken(token);
}

/**
 * Middleware to validate CSRF token for state-changing operations
 * @param request Request object
 * @returns Response with 403 if invalid, null if valid
 */
export function validateCSRFMiddleware(request: Request): Response | null {
  const token = request.headers.get('x-csrf-token');
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'CSRF token missing' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  if (!validateCSRFToken(token)) {
    return new Response(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  return null;
}

/**
 * Middleware to validate signed CSRF token
 * @param request Request object
 * @returns Response with 403 if invalid, null if valid
 */
export function validateSignedCSRFMiddleware(request: Request): Response | null {
  const token = request.headers.get('x-csrf-token');
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'CSRF token missing' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  if (!validateSignedCSRFToken(token)) {
    return new Response(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  return null;
}