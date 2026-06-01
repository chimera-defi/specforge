/**
 * Graceful shutdown handler for production deployments
 * Ensures clean shutdown of connections and resources
 */

import { logger } from "../logger";
import { destroyMetricsCollector } from "./metrics";
import { destroyPerformanceMonitor } from "./performance";
import { destroyHealthChecker } from "./health";

type ShutdownHandler = () => Promise<void>;

class GracefulShutdown {
  private isShuttingDown = false;
  private handlers: ShutdownHandler[] = [];
  private shutdownTimeout = 30000; // 30 seconds

  /**
   * Register a shutdown handler
   */
  registerHandler(handler: ShutdownHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Initiate graceful shutdown
   */
  async shutdown(reason: string = 'SIGTERM'): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress', { reason });
      return;
    }

    this.isShuttingDown = true;
    logger.info('Initiating graceful shutdown', { reason });

    // Run all shutdown handlers in parallel with timeout
    const shutdownPromise = Promise.race([
      Promise.all(this.handlers.map((handler) => handler())),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Shutdown timeout')), this.shutdownTimeout)
      ),
    ]);

    try {
      await shutdownPromise;
      logger.info('Graceful shutdown completed');
    } catch (error) {
      logger.error('Graceful shutdown failed', error instanceof Error ? error : undefined);
    } finally {
      // Cleanup monitoring resources
      destroyMetricsCollector();
      destroyPerformanceMonitor();
      destroyHealthChecker();
    }
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Set shutdown timeout
   */
  setShutdownTimeout(timeoutMs: number): void {
    this.shutdownTimeout = timeoutMs;
  }
}

// Singleton instance
let gracefulShutdown: GracefulShutdown | null = null;

export function getGracefulShutdown(): GracefulShutdown {
  if (!gracefulShutdown) {
    gracefulShutdown = new GracefulShutdown();
    setupShutdownSignals();
  }
  return gracefulShutdown;
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupShutdownSignals(): void {
  const shutdown = getGracefulShutdown();

  const handleSignal = (signal: string) => {
    shutdown.shutdown(signal);
  };

  // Only setup signal handlers in Node.js environment
  if (typeof process !== 'undefined') {
    process.on('SIGTERM', () => handleSignal('SIGTERM'));
    process.on('SIGINT', () => handleSignal('SIGINT'));
  }
}

export function destroyGracefulShutdown(): void {
  gracefulShutdown = null;
}