/**
 * Rate limiting middleware for API routes
 * 
 * For development: uses in-memory store
 * For production: should use Redis or similar distributed store
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class InMemoryRateLimitStore implements RateLimitStore {
  private store: RateLimitStore = {};

  get(key: string): { count: number; resetTime: number } | null {
    const item = this.store[key];
    if (!item) return null;

    // Clean up expired entries
    if (Date.now() > item.resetTime) {
      delete this.store[key];
      return null;
    }

    return item;
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store[key] = value;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    }
  }
}

const store = new InMemoryRateLimitStore();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => store.cleanup(), 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 60000 = 1 minute)
  maxRequests?: number; // Max requests per window (default: 100)
  identifier?: string; // Custom identifier (default: IP address)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Rate limit check
 * @param options Rate limiting options
 * @returns Rate limit result
 */
export function checkRateLimit(options: RateLimitOptions = {}): RateLimitResult {
  const {
    windowMs = 60000,
    maxRequests = 100,
    identifier = 'default',
  } = options;

  const now = Date.now();
  const key = identifier;

  const item = store.get(key);

  if (!item) {
    // First request or expired
    const resetTime = now + windowMs;
    store.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  if (now > item.resetTime) {
    // Window expired, reset
    const resetTime = now + windowMs;
    store.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  if (item.count >= maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTime: item.resetTime,
    };
  }

  // Increment counter
  item.count++;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - item.count,
    resetTime: item.resetTime,
  };
}

/**
 * Extract client identifier from request
 * Falls back to IP address or random ID
 */
export function getIdentifier(request: Request): string {
  // Try to get IP address from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a session-based identifier
  // In production, this should be a user ID or session ID
  return 'anonymous';
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function withRateLimit(options: Omit<RateLimitOptions, 'identifier'> = {}) {
  return (request: Request): RateLimitResult => {
    const identifier = getIdentifier(request);
    return checkRateLimit({
      ...options,
      identifier,
    });
  };
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      },
    }
  );
}