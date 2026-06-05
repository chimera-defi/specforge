/**
 * Environment Variable Schema
 * Comprehensive validation for all environment variables
 */

import { z } from "zod";

/**
 * Environment schema
 */
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Server
  PORT: z.string().default("3000"),
  HOST: z.string().default("localhost"),

  // Session secrets
  SPECFORGE_SESSION_SECRET: z.string().min(32, "Session secret must be at least 32 characters"),
  SPECFORGE_CSRF_SECRET: z.string().min(32, "CSRF secret must be at least 32 characters"),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1, "GitHub client ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GitHub client secret is required"),
  SPECFORGE_GITHUB_REDIRECT_URI: z.string().url("GitHub redirect URI must be a valid URL"),

  // Database (optional - pglite is default)
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PORT: z.string().default("5432"),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DATABASE: z.string().optional(),

  // Redis (optional - for production rate limiting)
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().optional(),

  // Sentry (optional - for production error tracking)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().transform(Number).pipe(z.number().min(0).max(1)).optional(),
  SENTRY_PROFILES_SAMPLE_RATE: z.string().transform(Number).pipe(z.number().min(0).max(1)).optional(),

  // Email (optional - for notifications)
  EMAIL_PROVIDER: z.enum(["console", "sendgrid", "mailgun", "ses"]).default("console"),
  SENDGRID_API_KEY: z.string().optional(),
  MAILGUN_API_KEY: z.string().optional(),
  SES_ACCESS_KEY_ID: z.string().optional(),
  SES_SECRET_ACCESS_KEY: z.string().optional(),
  SES_REGION: z.string().default("us-east-1"),

  // Storage (optional - for backups)
  BACKUP_DESTINATION: z.string().default(".backups"),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).pipe(z.number().min(1)).default(30),

  // API (optional - for external access)
  API_VERSION: z.string().default("v1"),
  API_RATE_LIMIT_ENABLED: z.string().transform((v) => v === "true").default(true),
  API_RATE_LIMIT_DEFAULT: z.string().transform(Number).pipe(z.number().min(1)).default(100),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),
  LOG_FORMAT: z.enum(["json", "text"]).default("json"),

  // Feature flags
  FEATURE_FLAGS_ENABLED: z.string().transform((v) => v === "true").default(true),

  // Collab server
  COLLAB_SERVER_URL: z.string().url().optional(),
  COLLAB_SERVER_PORT: z.string().default("4322"),

  // Monitoring
  METRICS_ENABLED: z.string().transform((v) => v === "true").default(true),
  HEALTH_CHECK_ENABLED: z.string().transform((v) => v === "true").default(true),

  // OpenTelemetry (optional - for distributed tracing)
  OTEL_ENABLED: z.string().transform((v) => v === "true").default(false),
  OTEL_SERVICE_NAME: z.string().default("specforge-web"),
});

export type Env = z.infer<typeof envSchema>;

declare global {
  var _validatedEnv: Env | undefined;
}

/**
 * Validate environment variables
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment configuration:");
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error("Environment validation failed");
    }
    throw error;
  }
}

/**
 * Get environment variable with validation
 */
export function getEnv(): Env {
  // Cache the validated env
  if (!global._validatedEnv) {
    global._validatedEnv = validateEnv();
  }
  return global._validatedEnv;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === "development";
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === "test";
}
