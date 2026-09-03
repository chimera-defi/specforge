/**
 * Production logging configuration
 * Provides structured logging with log levels and context
 */

import { logger } from "../logger";

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

class ProductionLogger {
  private environment: string;
  private minimumLevel: LogLevel;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.minimumLevel = this.getMinimumLevel();
  }

  private getMinimumLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (envLevel && Object.values(LogLevel).includes(envLevel as LogLevel)) {
      return envLevel as LogLevel;
    }
    return this.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.minimumLevel);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // In production, this would send to a log aggregation service
    // For now, we use the existing logger
    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(message, context);
        break;
      case LogLevel.INFO:
        logger.info(message, context);
        break;
      case LogLevel.WARN:
        logger.warn(message, context);
        break;
      case LogLevel.ERROR:
        logger.error(message, context instanceof Error ? context : undefined, context);
        break;
      case LogLevel.FATAL:
        logger.error(message, context instanceof Error ? context : undefined, context);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, { ...context, error });
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, { ...context, error });
  }
}

// Singleton instance
let productionLogger: ProductionLogger | null = null;

export function getProductionLogger(): ProductionLogger {
  if (!productionLogger) {
    productionLogger = new ProductionLogger();
  }
  return productionLogger;
}