/**
 * Retry mechanism for handling transient failures
 * Exponential backoff with jitter for production resilience
 */

import { logger } from "../logger";
import { getMetricsCollector } from "./metrics";

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  value?: T;
  error?: Error;
  attempts: number;
  totalDurationMs: number;
}

export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts || 3,
      initialDelayMs: config.initialDelayMs || 1000,
      maxDelayMs: config.maxDelayMs || 30000,
      backoffMultiplier: config.backoffMultiplier || 2,
      jitter: config.jitter !== undefined ? config.jitter : true,
    };
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      attempts = attempt;
      
      try {
        const value = await fn();
        const duration = Date.now() - startTime;
        
        const metrics = getMetricsCollector();
        metrics.increment('retry.success', 1, { context, attempts: attempt.toString() });

        return {
          success: true,
          value,
          attempts,
          totalDurationMs: duration,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const metrics = getMetricsCollector();
        metrics.increment('retry.failure', 1, { context, attempts: attempt.toString() });

        logger.warn('Retry attempt failed', {
          context,
          attempt,
          maxAttempts: this.config.maxAttempts,
          error: lastError.message,
        });

        // Don't retry on last attempt
        if (attempt === this.config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    const duration = Date.now() - startTime;
    metrics.increment('retry.exhausted', 1, { context });

    return {
      success: false,
      error: lastError,
      attempts,
      totalDurationMs: duration,
    };
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    let delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.maxDelayMs);

    if (this.config.jitter) {
      // Add random jitter (±25%)
      const jitterFactor = 0.75 + Math.random() * 0.5;
      delay = delay * jitterFactor;
    }

    return Math.floor(delay);
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error: Error): boolean {
    // Network errors, timeouts, and 5xx errors are retryable
    const retryablePatterns = [
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
      /timeout/i,
      /5\d{2}/, // 5xx HTTP status codes
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Execute with conditional retry based on error type
   */
  async executeConditional<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<RetryResult<T>> {
    const result = await this.execute(fn, context);
    
    if (!result.success && result.error && !this.isRetryable(result.error)) {
      logger.warn('Non-retryable error encountered', {
        context,
        error: result.error.message,
      });
      metrics.increment('retry.non_retryable', 1, { context });
    }

    return result;
  }
}

// Singleton instance with default config
let defaultRetryHandler: RetryHandler | null = null;

export function getRetryHandler(config?: Partial<RetryConfig>): RetryHandler {
  if (!defaultRetryHandler || config) {
    defaultRetryHandler = new RetryHandler(config);
  }
  return defaultRetryHandler;
}