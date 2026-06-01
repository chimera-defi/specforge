/**
 * Example Database Migrations
 * These are placeholder migrations for when the app migrates to PostgreSQL
 */

import { createMigration, getMigrationRunner } from "./migrations";
import { logger } from "../logger";

/**
 * Migration 001: Create users table
 */
export const migration001 = createMigration(
  "001_create_users_table",
  "Create users table",
  async () => {
    // Placeholder for actual SQL
    logger.info("Creating users table");
    // await db.query(`
    //   CREATE TABLE IF NOT EXISTS users (
    //     id SERIAL PRIMARY KEY,
    //     github_id VARCHAR(255) UNIQUE NOT NULL,
    //     github_login VARCHAR(255) NOT NULL,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);
  },
  async () => {
    logger.info("Dropping users table");
    // await db.query(`DROP TABLE IF EXISTS users;`);
  }
);

/**
 * Migration 002: Create workspaces table
 */
export const migration002 = createMigration(
  "002_create_workspaces_table",
  "Create workspaces table",
  async () => {
    logger.info("Creating workspaces table");
    // await db.query(`
    //   CREATE TABLE IF NOT EXISTS workspaces (
    //     id VARCHAR(255) PRIMARY KEY,
    //     name VARCHAR(255) NOT NULL,
    //     plan VARCHAR(50) DEFAULT 'free',
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);
  },
  async () => {
    logger.info("Dropping workspaces table");
    // await db.query(`DROP TABLE IF EXISTS workspaces;`);
  }
);

/**
 * Migration 003: Create workspace_memberships table
 */
export const migration003 = createMigration(
  "003_create_workspace_memberships_table",
  "Create workspace_memberships table",
  async () => {
    logger.info("Creating workspace_memberships table");
    // await db.query(`
    //   CREATE TABLE IF NOT EXISTS workspace_memberships (
    //     id SERIAL PRIMARY KEY,
    //     workspace_id VARCHAR(255) REFERENCES workspaces(id) ON DELETE CASCADE,
    //     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    //     role VARCHAR(50) DEFAULT 'member',
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     UNIQUE(workspace_id, user_id)
    //   );
    // `);
  },
  async () => {
    logger.info("Dropping workspace_memberships table");
    // await db.query(`DROP TABLE IF EXISTS workspace_memberships;`);
  }
);

/**
 * Migration 004: Create documents table
 */
export const migration004 = createMigration(
  "004_create_documents_table",
  "Create documents table",
  async () => {
    logger.info("Creating documents table");
    // await db.query(`
    //   CREATE TABLE IF NOT EXISTS documents (
    //     id VARCHAR(255) PRIMARY KEY,
    //     workspace_id VARCHAR(255) REFERENCES workspaces(id) ON DELETE CASCADE,
    //     title VARCHAR(500) NOT NULL,
    //     content TEXT,
    //     version INTEGER DEFAULT 1,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);
  },
  async () => {
    logger.info("Dropping documents table");
    // await db.query(`DROP TABLE IF EXISTS documents;`);
  }
);

/**
 * Migration 005: Create patches table
 */
export const migration005 = createMigration(
  "005_create_patches_table",
  "Create patches table",
  async () => {
    logger.info("Creating patches table");
    // await db.query(`
    //   CREATE TABLE IF NOT EXISTS patches (
    //     id VARCHAR(255) PRIMARY KEY,
    //     document_id VARCHAR(255) REFERENCES documents(id) ON DELETE CASCADE,
    //     user_id INTEGER REFERENCES users(id),
    //     content TEXT NOT NULL,
    //     status VARCHAR(50) DEFAULT 'pending',
    //     fingerprint VARCHAR(255) NOT NULL,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);
  },
  async () => {
    logger.info("Dropping patches table");
    // await db.query(`DROP TABLE IF EXISTS patches;`);
  }
);

/**
 * Migration 006: Create audit_events table
 */
export const migration006 = createMigration(
  "006_create_audit_events_table",
  "Create audit_events table",
  async () => {
    logger.info("Creating audit_events table");
    // await db.query(`
    //   CREATE TABLE IF NOT EXISTS audit_events (
    //     id SERIAL PRIMARY KEY,
    //     document_id VARCHAR(255) REFERENCES documents(id) ON DELETE CASCADE,
    //     user_id INTEGER REFERENCES users(id),
    //     event_type VARCHAR(100) NOT NULL,
    //     event_data JSONB,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);
  },
  async () => {
    logger.info("Dropping audit_events table");
    // await db.query(`DROP TABLE IF EXISTS audit_events;`);
  }
);

/**
 * Register all migrations
 */
export function registerMigrations(): void {
  const runner = getMigrationRunner();
  
  runner.register(migration001);
  runner.register(migration002);
  runner.register(migration003);
  runner.register(migration004);
  runner.register(migration005);
  runner.register(migration006);
  
  logger.info("All migrations registered", { count: 6 });
}