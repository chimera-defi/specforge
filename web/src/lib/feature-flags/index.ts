/**
 * Feature Flags System
 * Provides feature flag management for gradual rollouts and A/B testing
 */

import { logger } from "../logger";

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  percentage: number; // 0-100 for gradual rollout
  conditions?: FeatureFlagCondition[];
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagCondition {
  type: "user" | "workspace" | "environment" | "custom";
  key: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "in" | "not_in";
  value: string | string[];
}

export interface FeatureFlagContext {
  userId?: string;
  workspaceId?: string;
  environment?: string;
  custom?: Record<string, string>;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private overrides: Map<string, boolean> = new Map(); // User-specific overrides

  /**
   * Register a feature flag
   */
  register(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
    logger.info("Feature flag registered", {
      id: flag.id,
      name: flag.name,
      enabled: flag.enabled,
      percentage: flag.percentage,
    });
  }

  /**
   * Check if a feature flag is enabled for a given context
   */
  isEnabled(flagId: string, context?: FeatureFlagContext): boolean {
    const flag = this.flags.get(flagId);
    
    if (!flag) {
      logger.warn("Feature flag not found", { flagId });
      return false;
    }

    // Check user-specific override
    if (context?.userId) {
      const overrideKey = `${flagId}:${context.userId}`;
      if (this.overrides.has(overrideKey)) {
        return this.overrides.get(overrideKey)!;
      }
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check conditions
    if (flag.conditions && context) {
      const conditionsMet = this.checkConditions(flag.conditions, context);
      if (!conditionsMet) {
        return false;
      }
    }

    // Check percentage rollout
    if (flag.percentage < 100) {
      const hash = this.hashContext(flagId, context);
      const rollout = (hash % 100);
      return rollout < flag.percentage;
    }

    return true;
  }

  /**
   * Check if conditions are met
   */
  private checkConditions(conditions: FeatureFlagCondition[], context: FeatureFlagContext): boolean {
    for (const condition of conditions) {
      if (!this.checkCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check a single condition
   */
  private checkCondition(condition: FeatureFlagCondition, context: FeatureFlagContext): boolean {
    let value: string | undefined;

    switch (condition.type) {
      case "user":
        value = context?.userId;
        break;
      case "workspace":
        value = context?.workspaceId;
        break;
      case "environment":
        value = context?.environment || process.env.NODE_ENV;
        break;
      case "custom":
        value = context?.custom?.[condition.key];
        break;
    }

    if (!value) {
      return false;
    }

    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      case "contains":
        return value.includes(condition.value as string);
      case "not_contains":
        return !value.includes(condition.value as string);
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(value);
      case "not_in":
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Hash context for percentage rollout
   */
  private hashContext(flagId: string, context?: FeatureFlagContext): number {
    const input = `${flagId}:${context?.userId || "anonymous"}:${context?.workspaceId || "default"}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Set user-specific override
   */
  setOverride(flagId: string, userId: string, enabled: boolean): void {
    const overrideKey = `${flagId}:${userId}`;
    this.overrides.set(overrideKey, enabled);
    logger.info("Feature flag override set", { flagId, userId, enabled });
  }

  /**
   * Clear user-specific override
   */
  clearOverride(flagId: string, userId: string): void {
    const overrideKey = `${flagId}:${userId}`;
    this.overrides.delete(overrideKey);
    logger.info("Feature flag override cleared", { flagId, userId });
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get flag by ID
   */
  getFlag(flagId: string): FeatureFlag | undefined {
    return this.flags.get(flagId);
  }

  /**
   * Update flag
   */
  updateFlag(flagId: string, updates: Partial<FeatureFlag>): void {
    const flag = this.flags.get(flagId);
    if (!flag) {
      throw new Error(`Feature flag ${flagId} not found`);
    }

    const updated = { ...flag, ...updates };
    this.flags.set(flagId, updated);
    logger.info("Feature flag updated", { flagId, updates });
  }

  /**
   * Delete flag
   */
  deleteFlag(flagId: string): void {
    this.flags.delete(flagId);
    logger.info("Feature flag deleted", { flagId });
  }

  /**
   * Get flag usage statistics
   */
  getStats() {
    return {
      total: this.flags.size,
      enabled: Array.from(this.flags.values()).filter((f) => f.enabled).length,
      disabled: Array.from(this.flags.values()).filter((f) => !f.enabled).length,
      overrides: this.overrides.size,
    };
  }
}

// Singleton instance
let featureFlagManager: FeatureFlagManager | null = null;

export function getFeatureFlagManager(): FeatureFlagManager {
  if (!featureFlagManager) {
    featureFlagManager = new FeatureFlagManager();
  }
  return featureFlagManager;
}

/**
 * Check if a feature flag is enabled (convenience function)
 */
export function isFeatureEnabled(flagId: string, context?: FeatureFlagContext): boolean {
  return getFeatureFlagManager().isEnabled(flagId, context);
}

/**
 * Register default feature flags
 */
export function registerDefaultFlags(): void {
  const manager = getFeatureFlagManager();

  manager.register({
    id: "new_document_wizard",
    name: "New Document Wizard",
    description: "Enable the new document creation wizard",
    enabled: true,
    percentage: 100,
  });

  manager.register({
    id: "ai_patch_review",
    name: "AI Patch Review",
    description: "Enable AI-powered patch review suggestions",
    enabled: true,
    percentage: 50, // Gradual rollout at 50%
  });

  manager.register({
    id: "real_time_collaboration",
    name: "Real-time Collaboration",
    description: "Enable real-time collaboration features",
    enabled: true,
    percentage: 100,
  });

  manager.register({
    id: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Enable advanced analytics dashboard",
    enabled: false,
    percentage: 0,
  });

  manager.register({
    id: "export_v2",
    name: "Export V2",
    description: "Enable new export format",
    enabled: false,
    percentage: 0,
    conditions: [
      {
        type: "workspace",
        key: "plan",
        operator: "in",
        value: ["pro", "team", "enterprise"],
      },
    ],
  });

  logger.info("Default feature flags registered", { count: 5 });
}