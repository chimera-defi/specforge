/**
 * Database Connection Pool Configuration
 * Provides connection pooling for PostgreSQL
 */

import { isPostgresConfigured } from "../validation/config-validation";
import { logger } from "../logger";

export interface PoolConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export const DEFAULT_POOL_CONFIG: PoolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

/**
 * Get pool configuration from environment
 */
export function getPoolConfig(): PoolConfig {
  const config: PoolConfig = {
    ...DEFAULT_POOL_CONFIG,
    host: process.env.POSTGRES_HOST || process.env.DATABASE_HOST,
    port: parseInt(process.env.POSTGRES_PORT || process.env.DATABASE_PORT || "5432"),
    database: process.env.POSTGRES_DB || process.env.DATABASE_NAME,
    user: process.env.POSTGRES_USER || process.env.DATABASE_USER,
    password: process.env.POSTGRES_PASSWORD || process.env.DATABASE_PASSWORD,
  };

  // Override with env vars if specified
  if (process.env.DB_POOL_MIN) {
    config.min = parseInt(process.env.DB_POOL_MIN);
  }
  if (process.env.DB_POOL_MAX) {
    config.max = parseInt(process.env.DB_POOL_MAX);
  }
  if (process.env.DB_POOL_IDLE_TIMEOUT) {
    config.idleTimeoutMillis = parseInt(process.env.DB_POOL_IDLE_TIMEOUT);
  }
  if (process.env.DB_POOL_CONNECTION_TIMEOUT) {
    config.connectionTimeoutMillis = parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT);
  }

  return config;
}

/**
 * Validate pool configuration
 */
export function validatePoolConfig(config: PoolConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.min !== undefined && config.min < 0) {
    errors.push("DB_POOL_MIN must be >= 0");
  }

  if (config.max !== undefined && config.max < 1) {
    errors.push("DB_POOL_MAX must be >= 1");
  }

  if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
    errors.push("DB_POOL_MIN must be <= DB_POOL_MAX");
  }

  if (config.idleTimeoutMillis !== undefined && config.idleTimeoutMillis < 0) {
    errors.push("DB_POOL_IDLE_TIMEOUT must be >= 0");
  }

  if (config.connectionTimeoutMillis !== undefined && config.connectionTimeoutMillis < 0) {
    errors.push("DB_POOL_CONNECTION_TIMEOUT must be >= 0");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log pool configuration
 */
export function logPoolConfig(config: PoolConfig): void {
  logger.info("Database pool configuration", {
    host: config.host,
    port: config.port,
    database: config.database,
    min: config.min,
    max: config.max,
    idleTimeoutMillis: config.idleTimeoutMillis,
    connectionTimeoutMillis: config.connectionTimeoutMillis,
  });
}

/**
 * Get pool configuration for different environments
 */
export function getPoolConfigForEnvironment(): PoolConfig {
  const nodeEnv = process.env.NODE_ENV || "development";
  const baseConfig = getPoolConfig();

  switch (nodeEnv) {
    case "production":
      return {
        ...baseConfig,
        min: 5,
        max: 20,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 10000,
      };
    case "test":
      return {
        ...baseConfig,
        min: 1,
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
      };
    default:
      return baseConfig;
  }
}

/**
 * Get connection string from configuration
 */
export function getConnectionString(config: PoolConfig): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const { host, port, database, user, password } = config;
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

/**
 * Initialize connection pool (placeholder for actual pool implementation)
 */
export function initializePool() {
  if (!isPostgresConfigured()) {
    logger.info("PostgreSQL not configured, using pglite");
    return null;
  }

  const config = getPoolConfigForEnvironment();
  const validation = validatePoolConfig(config);

  if (!validation.valid) {
    throw new Error(`Invalid pool configuration: ${validation.errors.join(", ")}`);
  }

  logPoolConfig(config);

  // Placeholder for actual pool initialization
  // In a real implementation, you would use pg.Pool here
  logger.info("Connection pool initialized", {
    connectionString: getConnectionString(config),
  });

  return null;
}

/**
 * Get pool statistics (placeholder)
 */
export function getPoolStats() {
  // Placeholder for actual pool stats
  return {
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  };
}

/**
 * Close connection pool (placeholder)
 */
export function closePool(): void {
  // Placeholder for actual pool closing
  logger.info("Connection pool closed");
}