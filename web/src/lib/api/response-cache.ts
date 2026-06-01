/**
 * Response Caching Middleware
 * Caches GET requests based on URL and headers
 */

import { NextResponse } from "next/server";
import { logger } from "../logger";

interface CacheEntry {
  body: string;
  headers: HeadersInit;
  status: number;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  varyHeaders?: string[]; // Headers that affect cache key
  skipCache?: (request: Request) => boolean;
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(request: Request, varyHeaders?: string[]): string {
    const url = new URL(request.url);
    let key = `${request.method}:${url.pathname}${url.search}`;

    // Include vary headers in cache key
    if (varyHeaders) {
      for (const header of varyHeaders) {
        const value = request.headers.get(header);
        if (value) {
          key += `:${header}:${value}`;
        }
      }
    }

    return key;
  }

  /**
   * Get cached response
   */
  get(request: Request, config: CacheConfig): CacheEntry | null {
    // Skip cache if configured
    if (config.skipCache && config.skipCache(request)) {
      return null;
    }

    // Only cache GET requests
    if (request.method !== "GET") {
      return null;
    }

    const key = this.generateCacheKey(request, config.varyHeaders);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    logger.debug("Cache hit", { key, url: request.url });
    return entry;
  }

  /**
   * Set cached response
   */
  set(request: Request, response: NextResponse, config: CacheConfig): void {
    // Only cache GET requests
    if (request.method !== "GET") {
      return;
    }

    // Don't cache error responses
    if (response.status >= 400) {
      return;
    }

    // Skip cache if configured
    if (config.skipCache && config.skipCache(request)) {
      return;
    }

    const key = this.generateCacheKey(request, config.varyHeaders);

    const entry: CacheEntry = {
      body: response.body ? response.body.toString() : "",
      headers: Object.fromEntries(response.headers.entries()),
      status: response.status,
      timestamp: Date.now(),
      expiresAt: Date.now() + config.ttl,
    };

    this.cache.set(key, entry);
    logger.debug("Cache set", { key, ttl: config.ttl, url: request.url });
  }

  /**
   * Invalidate cache by pattern
   */
  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate all cache
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
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
    this.cache.clear();
  }
}

// Singleton instance
let responseCache: ResponseCache | null = null;

export function getResponseCache(): ResponseCache {
  if (!responseCache) {
    responseCache = new ResponseCache();
  }
  return responseCache;
}

/**
 * Middleware to cache responses
 */
export function withResponseCache<T>(
  handler: (request: Request, context?: unknown) => Promise<NextResponse<T>>,
  config: CacheConfig
) {
  return async (request: Request, context?: unknown): Promise<NextResponse<T>> => {
    const cache = getResponseCache();

    // Try to get cached response
    const cached = cache.get(request, config);
    if (cached) {
      const response = new NextResponse(cached.body, {
        status: cached.status,
        headers: cached.headers,
      });
      response.headers.set("X-Cache", "HIT");
      response.headers.set("X-Cache-TTL", Math.max(0, cached.expiresAt - Date.now()).toString());
      return response as NextResponse<T>;
    }

    // Execute handler
    const response = await handler(request, context);

    // Cache the response
    cache.set(request, response, config);
    response.headers.set("X-Cache", "MISS");

    return response;
  };
}

/**
 * Pre-configured cache configs for different use cases
 */
export const cacheConfigs = {
  short: {
    ttl: 60000, // 1 minute
    varyHeaders: ["accept-encoding"],
  },
  medium: {
    ttl: 300000, // 5 minutes
    varyHeaders: ["accept-encoding"],
  },
  long: {
    ttl: 3600000, // 1 hour
    varyHeaders: ["accept-encoding"],
  },
  static: {
    ttl: 86400000, // 24 hours
    varyHeaders: ["accept-encoding"],
  },
  api: {
    ttl: 60000, // 1 minute
    varyHeaders: ["accept", "authorization"],
    skipCache: (request) => {
      // Skip cache for POST/PUT/DELETE
      return request.method !== "GET";
    },
  },
};