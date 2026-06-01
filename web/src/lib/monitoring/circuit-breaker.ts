/**
 * Circuit breaker pattern implementation
 * Prevents cascading failures by failing fast when a service is unhealthy
 */

import { logger } from "../logger";
import { getMetricsCollector } from "./metrics";

export enum CircuitState {
  CLOSED = 'closed',   // Normal operation
  OPEN = 'open',       // Circuit is open, requests fail fast
  HALF_OPEN = 'half_open', // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;  // Number of failures before opening circuit
  timeoutMs: number;         // How long to stay open before attempting recovery
  successThreshold: number;  // Number of successes to close circuit
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.state = {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>, context: string): Promise<T> {
    // Check if circuit is open
    if (this.state.state === CircuitState.OPEN) {
      if (Date.now() >= this.state.nextAttemptTime) {
        // Transition to half-open to test recovery
        this.state.state = CircuitState.HALF_OPEN;
        logger.info('Circuit breaker transitioning to HALF_OPEN', { context });
      } else {
        // Circuit is still open, fail fast
        const metrics = getMetricsCollector();
        metrics.increment('circuit_breaker.open', 1, { context });
        throw new Error(`Circuit breaker is OPEN for ${context}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess(context);
      return result;
    } catch (error) {
      this.onFailure(context);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(context: string): void {
    if (this.state.state === CircuitState.HALF_OPEN) {
      this.state.successes++;
      logger.info('Circuit breaker success in HALF_OPEN', {
        context,
        successes: this.state.successes,
        threshold: this.config.successThreshold,
      });

      if (this.state.successes >= this.config.successThreshold) {
        this.reset(context);
      }
    } else {
      // Reset failures on success when closed
      this.state.failures = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(context: string): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    const metrics = getMetricsCollector();
    metrics.increment('circuit_breaker.failure', 1, { context });

    logger.warn('Circuit breaker failure', {
      context,
      failures: this.state.failures,
      threshold: this.config.failureThreshold,
    });

    if (this.state.failures >= this.config.failureThreshold) {
      this.open(context);
    }
  }

  /**
   * Open the circuit
   */
  private open(context: string): void {
    this.state.state = CircuitState.OPEN;
    this.state.nextAttemptTime = Date.now() + this.config.timeoutMs;

    const metrics = getMetricsCollector();
    metrics.increment('circuit_breaker.opened', 1, { context });

    logger.error('Circuit breaker OPEN', {
      context,
      failures: this.state.failures,
      timeoutMs: this.config.timeoutMs,
      nextAttempt: new Date(this.state.nextAttemptTime).toISOString(),
    });
  }

  /**
   * Reset the circuit to closed state
   */
  private reset(context: string): void {
    this.state = {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };

    logger.info('Circuit breaker reset to CLOSED', { context });
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state.state;
  }

  /**
   * Get circuit breaker stats
   */
  getStats() {
    return {
      state: this.state.state,
      failures: this.state.failures,
      successes: this.state.successes,
      lastFailureTime: this.state.lastFailureTime,
      nextAttemptTime: this.state.nextAttemptTime,
    };
  }
}

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker for a context
   */
  getBreaker(context: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(context)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        timeoutMs: 60000, // 1 minute
        successThreshold: 2,
      };
      this.breakers.set(context, new CircuitBreaker(config || defaultConfig));
    }
    return this.breakers.get(context)!;
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats() {
    const stats: Record<string, ReturnType<CircuitBreaker['getStats']>> = {};
    for (const [context, breaker] of this.breakers) {
      stats[context] = breaker.getStats();
    }
    return stats;
  }
}

// Singleton instance
let circuitBreakerRegistry: CircuitBreakerRegistry | null = null;

export function getCircuitBreakerRegistry(): CircuitBreakerRegistry {
  if (!circuitBreakerRegistry) {
    circuitBreakerRegistry = new CircuitBreakerRegistry();
  }
  return circuitBreakerRegistry;
}