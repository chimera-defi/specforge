/**
 * Database Migration System
 * Provides schema migrations for database evolution
 */

import { logger } from "../logger";
import { isPostgresConfigured } from "../validation/config-validation";

export interface Migration {
  id: string;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  timestamp: number;
}

export interface MigrationRecord {
  id: string;
  name: string;
  timestamp: number;
  appliedAt: string;
}

class MigrationRunner {
  private migrations: Map<string, Migration> = new Map();
  private appliedMigrations: Set<string> = new Set();

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    if (this.migrations.has(migration.id)) {
      throw new Error(`Migration ${migration.id} already registered`);
    }
    this.migrations.set(migration.id, migration);
    logger.info("Migration registered", { id: migration.id, name: migration.name });
  }

  /**
   * Get all migrations sorted by timestamp
   */
  getMigrations(): Migration[] {
    return Array.from(this.migrations.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations(): Migration[] {
    return this.getMigrations().filter((m) => !this.appliedMigrations.has(m.id));
  }

  /**
   * Get applied migrations
   */
  getAppliedMigrations(): Migration[] {
    return this.getMigrations().filter((m) => this.appliedMigrations.has(m.id));
  }

  /**
   * Load applied migrations from database
   */
  async loadAppliedMigrations(): Promise<void> {
    // For pglite, this would query a migrations table
    // For now, we'll use in-memory tracking
    logger.info("Applied migrations loaded", { count: this.appliedMigrations.size });
  }

  /**
   * Run pending migrations
   */
  async migrate(): Promise<void> {
    const pending = this.getPendingMigrations();
    
    if (pending.length === 0) {
      logger.info("No pending migrations");
      return;
    }

    logger.info("Running migrations", { count: pending.length });

    for (const migration of pending) {
      try {
        logger.info("Running migration", { id: migration.id, name: migration.name });
        await migration.up();
        this.appliedMigrations.add(migration.id);
        logger.info("Migration completed", { id: migration.id });
      } catch (error) {
        logger.error("Migration failed", {
          id: migration.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }

    logger.info("All migrations completed", { count: pending.length });
  }

  /**
   * Rollback last migration
   */
  async rollback(): Promise<void> {
    const applied = this.getAppliedMigrations();
    
    if (applied.length === 0) {
      logger.info("No migrations to rollback");
      return;
    }

    const lastMigration = applied[applied.length - 1];
    
    try {
      logger.info("Rolling back migration", { id: lastMigration.id, name: lastMigration.name });
      await lastMigration.down();
      this.appliedMigrations.delete(lastMigration.id);
      logger.info("Rollback completed", { id: lastMigration.id });
    } catch (error) {
      logger.error("Rollback failed", {
        id: lastMigration.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get migration status
   */
  getStatus() {
    const all = this.getMigrations();
    const applied = this.getAppliedMigrations();
    const pending = this.getPendingMigrations();

    return {
      total: all.length,
      applied: applied.length,
      pending: pending.length,
      appliedMigrations: applied.map((m) => m.id),
      pendingMigrations: pending.map((m) => m.id),
    };
  }
}

// Singleton instance
let migrationRunner: MigrationRunner | null = null;

export function getMigrationRunner(): MigrationRunner {
  if (!migrationRunner) {
    migrationRunner = new MigrationRunner();
  }
  return migrationRunner;
}

/**
 * Create a migration
 */
export function createMigration(
  id: string,
  name: string,
  up: () => Promise<void>,
  down: () => Promise<void>
): Migration {
  return {
    id,
    name,
    up,
    down,
    timestamp: Date.now(),
  };
}

/**
 * Run migrations on startup
 */
export async function runMigrations(): Promise<void> {
  if (!isPostgresConfigured()) {
    logger.info("PostgreSQL not configured, skipping migrations");
    return;
  }

  const runner = getMigrationRunner();
  await runner.loadAppliedMigrations();
  await runner.migrate();
}