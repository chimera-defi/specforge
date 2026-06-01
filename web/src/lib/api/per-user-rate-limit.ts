/**
 * Per-User Rate Limiting Middleware
 * Rate limits based on user identity (GitHub login or IP)
 */

import { NextResponse } from "next/server";
import { logger } from "../logger";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface UserRateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

class PerUserRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private userCache: Map<string, string> = new Map(); // IP -> user mapping

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get user identifier from request
   */
  private getUserId(request: Request): string {
    // Try to get user from session (would need to be implemented)
    // For now, use IP address
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
    return ip;
  }

  /**
   * Check rate limit for a user
   */
  checkRateLimit(userId: string, config: UserRateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.store.get(userId);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      this.store.set(userId, newEntry);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(userId, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Record successful request (for skipSuccessfulRequests option)
   */
  recordSuccess(userId: string): void {
    // Optionally don't count successful requests
    // For now, we'll just log it
    logger.debug("Rate limit success recorded", { userId });
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(userId);
      }
    }
  }

  /**
   * Reset rate limit for a user (for testing or admin)
   */
  resetUser(userId: string): void {
    this.store.delete(userId);
  }

  /**
   * Get current rate limit status for a user
   */
  getStatus(userId: string): {
    count: number;
    maxRequests: number;
    resetTime: number;
  } | null {
    const entry = this.store.get(userId);
    if (!entry) {
      return null;
    }
    return {
      count: entry.count,
      maxRequests: 100, // Default max
      resetTime: entry.resetTime,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
    this.userCache.clear();
  }
}

// Singleton instance
let perUserRateLimiter: PerUserRateLimiter | null = null;

export function getPerUserRateLimiter(): PerUserRateLimiter {
  if (!perUserRateLimiter) {
    perUserRateLimiter = new PerUserRateLimiter();
  }
  return perUserRateLimiter;
}

/**
 * Middleware to apply per-user rate limiting
 */
export function withPerUserRateLimit<T>(
  handler: (request: Request, context?: unknown) => Promise<NextResponse<T>>,
  config: UserRateLimitConfig
): (request: Request, context?: unknown) => Promise<NextResponse<T>> {
  return async (request: Request, context?: unknown) => {
    const limiter = getPerUserRateLimiter();
    const userId = limiter.getUserId(request);
    const result = limiter.checkRateLimit(userId, config);

    if (!result.allowed) {
      logger.warn("Rate limit exceeded", {
        userId,
        count: config.maxRequests,
        windowMs: config.windowMs,
      });

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = await handler(request, context);

    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", new Date(result.resetTime).toISOString());

    if (config.skipSuccessfulRequests && response.status < 400) {
      limiter.recordSuccess(userId);
    }

    return response;
  };
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimitConfigs = {
  strict: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: false,
  },
  moderate: {
    maxRequests: 50,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: false,
  },
  lenient: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: false,
  },
  burst: {
    maxRequests: 200,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: false,
  },
  auth: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: false,
  },
  api: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: true, // Don't count successful requests
  },
  export: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: false,
  },
};