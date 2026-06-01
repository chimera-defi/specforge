/**
 * Configuration validation utility
 * Validates environment variables and configuration at startup
 */

import { z } from "zod";
import { logger } from "../logger";

/**
 * Environment variable schema
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/).transform(Number).default("3000"),
  
  // Session security
  SPECFORGE_SESSION_SECRET: z.string().min(32).max(256),
  SPECFORGE_CSRF_SECRET: z.string().min(32).max(256),
  
  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  SPECFORGE_GITHUB_REDIRECT_URI: z.string().url().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),
  
  // Redis (optional)
  REDIS_URL: z.string().url().optional(),
  
  // Database (optional)
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PORT: z.string().regex(/^\d+$/).optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((err) => err.code === "invalid_type")
        .map((err) => err.path.join("."));

      logger.error("Environment validation failed", {
        errors: error.errors,
        missing: missingVars,
      });

      throw new Error(
        `Environment validation failed. Missing or invalid variables: ${missingVars.join(", ")}`
      );
    }
    throw error;
  }
}

/**
 * Check if GitHub auth is configured
 */
export function isGitHubAuthConfigured(): boolean {
  return !!(
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.SPECFORGE_GITHUB_REDIRECT_URI
  );
}

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

/**
 * Check if Postgres is configured
 */
export function isPostgresConfigured(): boolean {
  return !!(
    process.env.DATABASE_URL ||
    (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_DB)
  );
}

/**
 * Validate configuration and return validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfiguration(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    validateEnv();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  // Check for production-specific requirements
  if (process.env.NODE_ENV === "production") {
    if (!isGitHubAuthConfigured()) {
      warnings.push("GitHub OAuth not configured - auth will be limited to demo mode");
    }

    if (process.env.SPECFORGE_SESSION_SECRET === "change-me-in-production") {
      errors.push("SPECFORGE_SESSION_SECRET must be changed in production");
    }

    if (process.env.SPECFORGE_CSRF_SECRET === "change-me-in-production") {
      errors.push("SPECFORGE_CSRF_SECRET must be changed in production");
    }

    if (!isRedisConfigured()) {
      warnings.push("Redis not configured - rate limiting will use in-memory store (not recommended for production)");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate configuration on startup
 */
export function validateConfigurationOnStartup(): void {
  const result = validateConfiguration();

  if (!result.valid) {
    logger.error("Configuration validation failed", {
      errors: result.errors,
    });
    throw new Error(`Configuration validation failed:\n${result.errors.join("\n")}`);
  }

  if (result.warnings.length > 0) {
    logger.warn("Configuration warnings", {
      warnings: result.warnings,
    });
  }

  logger.info("Configuration validation passed", {
    nodeEnv: process.env.NODE_ENV,
    githubAuth: isGitHubAuthConfigured(),
    redis: isRedisConfigured(),
    postgres: isPostgresConfigured(),
  });
}