/**
 * API Key Management System
 * Provides API key generation, validation, and rate limiting per key
 */

import { logger } from "../logger";
import crypto from "crypto";

export interface ApiKey {
  id: string;
  key: string;
  keyPrefix: string;
  name: string;
  userId: string;
  workspaceId?: string;
  scopes: string[];
  rateLimit: number; // requests per minute
  expiresAt?: number;
  createdAt: number;
  lastUsedAt?: number;
  active: boolean;
}

export interface ApiKeyUsage {
  apiKeyId: string;
  requests: number;
  lastReset: number;
}

class ApiKeyManager {
  private keys: Map<string, ApiKey> = new Map();
  private usage: Map<string, ApiKeyUsage> = new Map();

  /**
   * Generate an API key
   */
  generateApiKey(prefix: string = "sf"): string {
    const randomBytes = crypto.randomBytes(32);
    const key = `${prefix}_${randomBytes.toString("hex")}`;
    return key;
  }

  /**
   * Create an API key
   */
  createApiKey(config: {
    name: string;
    userId: string;
    workspaceId?: string;
    scopes?: string[];
    rateLimit?: number;
    expiresIn?: number;
  }): ApiKey {
    const key = this.generateApiKey();
    const now = Date.now();

    const apiKey: ApiKey = {
      id: this.generateKeyId(),
      key,
      keyPrefix: key.split("_")[0],
      name: config.name,
      userId: config.userId,
      workspaceId: config.workspaceId,
      scopes: config.scopes || ["read", "write"],
      rateLimit: config.rateLimit || 100,
      expiresAt: config.expiresIn ? now + config.expiresIn : undefined,
      createdAt: now,
      active: true,
    };

    this.keys.set(apiKey.id, apiKey);
    this.usage.set(apiKey.id, {
      apiKeyId: apiKey.id,
      requests: 0,
      lastReset: now,
    });

    logger.info("API key created", {
      id: apiKey.id,
      name: apiKey.name,
      userId: config.userId,
      keyPrefix: apiKey.keyPrefix,
    });

    return apiKey;
  }

  /**
   * Validate an API key
   */
  validateApiKey(key: string): { valid: boolean; apiKey?: ApiKey } {
    const apiKey = this.findApiKeyByKey(key);

    if (!apiKey) {
      return { valid: false };
    }

    if (!apiKey.active) {
      return { valid: false };
    }

    if (apiKey.expiresAt && Date.now() > apiKey.expiresAt) {
      return { valid: false };
    }

    return { valid: true, apiKey };
  }

  /**
   * Find API key by the key string
   */
  private findApiKeyByKey(key: string): ApiKey | undefined {
    return Array.from(this.keys.values()).find((k) => k.key === key);
  }

  /**
   * Get API key by ID
   */
  getApiKey(keyId: string): ApiKey | undefined {
    return this.keys.get(keyId);
  }

  /**
   * Get all API keys for a user
   */
  getUserApiKeys(userId: string): ApiKey[] {
    return Array.from(this.keys.values()).filter((k) => k.userId === userId);
  }

  /**
   * Get all API keys for a workspace
   */
  getWorkspaceApiKeys(workspaceId: string): ApiKey[] {
    return Array.from(this.keys.values()).filter((k) => k.workspaceId === workspaceId);
  }

  /**
   * Update API key
   */
  updateApiKey(keyId: string, updates: Partial<ApiKey>): void {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      throw new Error(`API key ${keyId} not found`);
    }

    const updated = { ...apiKey, ...updates };
    this.keys.set(keyId, updated);
    logger.info("API key updated", { keyId, updates });
  }

  /**
   * Revoke API key
   */
  revokeApiKey(keyId: string): void {
    const apiKey = this.keys.get(keyId);
    if (apiKey) {
      apiKey.active = false;
      this.keys.set(keyId, apiKey);
      logger.info("API key revoked", { keyId });
    }
  }

  /**
   * Delete API key
   */
  deleteApiKey(keyId: string): void {
    this.keys.delete(keyId);
    this.usage.delete(keyId);
    logger.info("API key deleted", { keyId });
  }

  /**
   * Check rate limit for API key
   */
  checkRateLimit(keyId: string): { allowed: boolean; remaining: number; resetAt: number } {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return { allowed: false, remaining: 0, resetAt: Date.now() + 60000 };
    }

    const usage = this.usage.get(keyId);
    if (!usage) {
      return { allowed: true, remaining: apiKey.rateLimit, resetAt: Date.now() + 60000 };
    }

    const now = Date.now();
    const minute = 60000;
    const currentMinute = Math.floor(now / minute) * minute;

    // Reset if new minute
    if (usage.lastReset < currentMinute) {
      usage.requests = 0;
      usage.lastReset = currentMinute;
    }

    if (usage.requests >= apiKey.rateLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: currentMinute + minute,
      };
    }

    return {
      allowed: true,
      remaining: apiKey.rateLimit - usage.requests,
      resetAt: currentMinute + minute,
    };
  }

  /**
   * Record API key usage
   */
  recordUsage(keyId: string): void {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return;
    }

    apiKey.lastUsedAt = Date.now();
    this.keys.set(keyId, apiKey);

    const usage = this.usage.get(keyId);
    if (usage) {
      usage.requests++;
      this.usage.set(keyId, usage);
    }
  }

  /**
   * Get API key usage statistics
   */
  getUsageStats(keyId: string): ApiKeyUsage | undefined {
    return this.usage.get(keyId);
  }

  /**
   * Get all API keys
   */
  getAllApiKeys(): ApiKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * Get statistics
   */
  getStats() {
    const keys = Array.from(this.keys.values());

    return {
      total: keys.length,
      active: keys.filter((k) => k.active).length,
      inactive: keys.filter((k) => !k.active).length,
      expired: keys.filter((k) => k.expiresAt && Date.now() > k.expiresAt).length,
      byScope: this.getScopeBreakdown(keys),
    };
  }

  /**
   * Get scope breakdown
   */
  private getScopeBreakdown(keys: ApiKey[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const key of keys) {
      for (const scope of key.scopes) {
        breakdown[scope] = (breakdown[scope] || 0) + 1;
      }
    }

    return breakdown;
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired keys
   */
  cleanupExpiredKeys(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [keyId, apiKey] of this.keys.entries()) {
      if (apiKey.expiresAt && now > apiKey.expiresAt) {
        this.keys.delete(keyId);
        this.usage.delete(keyId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info("Expired API keys cleaned up", { count: cleaned });
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval(intervalMs: number = 3600000): void {
    setInterval(() => this.cleanupExpiredKeys(), intervalMs);
    logger.info("API key cleanup interval started", { intervalMs });
  }
}

// Singleton instance
let apiKeyManager: ApiKeyManager | null = null;

export function getApiKeyManager(): ApiKeyManager {
  if (!apiKeyManager) {
    apiKeyManager = new ApiKeyManager();
    apiKeyManager.startCleanupInterval();
  }
  return apiKeyManager;
}

/**
 * Create an API key (convenience function)
 */
export function createApiKey(config: {
  name: string;
  userId: string;
  workspaceId?: string;
  scopes?: string[];
  rateLimit?: number;
  expiresIn?: number;
}): ApiKey {
  const manager = getApiKeyManager();
  return manager.createApiKey(config);
}

/**
 * Validate an API key (convenience function)
 */
export function validateApiKey(key: string): { valid: boolean; apiKey?: ApiKey } {
  const manager = getApiKeyManager();
  return manager.validateApiKey(key);
}