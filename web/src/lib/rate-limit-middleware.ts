/**
 * Rate limiting middleware wrapper for Next.js API routes
 * 
 * Usage:
 * import { rateLimit } from '@/lib/rate-limit-middleware';
 * 
 * export async function GET(request: Request) {
 *   const result = rateLimit(request, { maxRequests: 10, windowMs: 60000 });
 *   if (!result.success) {
 *     return createRateLimitResponse(result);
 *   }
 *   // Your route logic here
 * }
 */

import { checkRateLimit, createRateLimitResponse, getIdentifier, type RateLimitOptions } from './rate-limit';

export function rateLimit(request: Request, options: Omit<RateLimitOptions, 'identifier'> = {}) {
  const identifier = getIdentifier(request);
  return checkRateLimit({
    ...options,
    identifier,
  });
}

export { createRateLimitResponse };

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // Strict: 10 requests per minute for sensitive operations
  strict: (request: Request) => rateLimit(request, { maxRequests: 10, windowMs: 60000 }),
  
  // Moderate: 60 requests per minute for general API
  moderate: (request: Request) => rateLimit(request, { maxRequests: 60, windowMs: 60000 }),
  
  // Lenient: 300 requests per minute for read-heavy operations
  lenient: (request: Request) => rateLimit(request, { maxRequests: 300, windowMs: 60000 }),
  
  // Burst: 100 requests per 10 seconds for burst handling
  burst: (request: Request) => rateLimit(request, { maxRequests: 100, windowMs: 10000 }),
};