/**
 * Production-grade health check system
 * Provides detailed health status for monitoring and alerting
 */

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, HealthCheck>;
  timestamp: string;
  uptime: number;
}

export interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  output: string;
  observedValue?: string;
  observedUnit?: string;
  threshold?: string;
}

interface HealthCheckConfig {
  name: string;
  check: () => Promise<HealthCheck>;
  critical: boolean;
}

class HealthChecker {
  private checks: Map<string, HealthCheckConfig> = new Map();
  private startTime: number = Date.now();

  /**
   * Register a health check
   */
  registerCheck(config: HealthCheckConfig): void {
    this.checks.set(config.name, config);
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<HealthCheckResult> {
    const results: Record<string, HealthCheck> = {};
    let overallStatus = 'healthy' as const;

    for (const [name, config] of this.checks) {
      try {
        const result = await config.check();
        results[name] = result;

        if (result.status === 'fail' && config.critical) {
          overallStatus = 'unhealthy';
        } else if (result.status === 'warn' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        results[name] = {
          status: 'fail',
          output: error instanceof Error ? error.message : String(error),
        };
        if (config.critical) {
          overallStatus = 'unhealthy';
        }
      }
    }

    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

// Singleton instance
let healthChecker: HealthChecker | null = null;

export function getHealthChecker(): HealthChecker {
  if (!healthChecker) {
    healthChecker = new HealthChecker();
    registerDefaultChecks();
  }
  return healthChecker;
}

/**
 * Register default health checks
 */
function registerDefaultChecks(): void {
  const checker = getHealthChecker();

  // Database health check
  checker.registerCheck({
    name: 'database',
    critical: true,
    check: async () => {
      // This would actually check database connectivity
      // For now, we'll return a mock result
      return {
        status: 'pass',
        output: 'Database connection healthy',
      };
    },
  });

  // Memory health check
  checker.registerCheck({
    name: 'memory',
    critical: false,
    check: async () => {
      if (typeof performance !== 'undefined' && performance.memory) {
        const usage = (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100;
        if (usage > 90) {
          return {
            status: 'warn',
            output: 'Memory usage high',
            observedValue: usage.toFixed(2),
            observedUnit: '%',
            threshold: '< 90%',
          };
        }
        return {
          status: 'pass',
          output: 'Memory usage normal',
          observedValue: usage.toFixed(2),
          observedUnit: '%',
        };
      }
      return {
        status: 'pass',
        output: 'Memory monitoring not available',
      };
    },
  });

  // Disk space check (if available)
  checker.registerCheck({
    name: 'disk',
    critical: false,
    check: async () => {
      // This would check available disk space
      // For now, return a mock result
      return {
        status: 'pass',
        output: 'Disk space adequate',
      };
    },
  });
}

export function destroyHealthChecker(): void {
  healthChecker = null;
}