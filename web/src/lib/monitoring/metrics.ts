/**
 * Production-grade metrics collector
 * Tracks application performance, errors, and business metrics
 */

import { logger } from "../logger";

interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

interface Histogram {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private histograms: Histogram[] = [];
  private readonly maxBufferSize = 1000;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-flush metrics every 60 seconds
    if (typeof window === 'undefined') {
      this.flushInterval = setInterval(() => this.flush(), 60000);
    }
  }

  /**
   * Record a counter metric
   */
  increment(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });

    if (this.metrics.length > this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Record a histogram metric (for latency, sizes, etc.)
   */
  histogram(name: string, value: number, tags: Record<string, string> = {}): void {
    this.histograms.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });

    if (this.histograms.length > this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Record API request metrics
   */
  recordRequest(endpoint: string, method: string, statusCode: number, durationMs: number): void {
    this.increment('api.requests', 1, {
      endpoint,
      method,
      status: statusCode.toString(),
    });

    this.histogram('api.request_duration', durationMs, {
      endpoint,
      method,
      status: statusCode.toString(),
    });

    if (statusCode >= 500) {
      this.increment('api.errors', 1, {
        endpoint,
        method,
        status: statusCode.toString(),
      });
    }
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseQuery(operation: string, table: string, durationMs: number, success: boolean): void {
    this.histogram('db.query_duration', durationMs, {
      operation,
      table,
      success: success.toString(),
    });

    if (!success) {
      this.increment('db.errors', 1, {
        operation,
        table,
      });
    }
  }

  /**
   * Record business metrics
   */
  recordDocumentCreated(): void {
    this.increment('documents.created', 1);
  }

  recordPatchAccepted(): void {
    this.increment('patches.accepted', 1);
  }

  recordPatchRejected(): void {
    this.increment('patches.rejected', 1);
  }

  recordUserSession(): void {
    this.increment('users.sessions', 1);
  }

  /**
   * Flush metrics to logging system
   * In production, this would send to a metrics backend (Prometheus, Datadog, etc.)
   */
  flush(): void {
    if (this.metrics.length === 0 && this.histograms.length === 0) {
      return;
    }

    logger.info('metrics_flush', {
      metrics_count: this.metrics.length,
      histograms_count: this.histograms.length,
      metrics: this.metrics.slice(0, 100), // Log sample
      histograms: this.histograms.slice(0, 100),
    });

    this.metrics = [];
    this.histograms = [];
  }

  /**
   * Get current metrics summary
   */
  getSummary(): {
    summary: Record<string, number>;
    histograms: Record<string, { count: number; avg: number; min: number; max: number }>;
  } {
    const summary: Record<string, number> = {};
    const histograms: Record<string, { count: number; avg: number; min: number; max: number }> = {};

    // Aggregate counters
    for (const metric of this.metrics) {
      const key = `${metric.name}:${JSON.stringify(metric.tags)}`;
      summary[key] = (summary[key] || 0) + metric.value;
    }

    // Aggregate histograms
    for (const hist of this.histograms) {
      const key = `${hist.name}:${JSON.stringify(hist.tags)}`;
      if (!histograms[key]) {
        histograms[key] = { count: 0, avg: hist.value, min: hist.value, max: hist.value };
      } else {
        const h = histograms[key];
        h.count++;
        h.avg = (h.avg * (h.count - 1) + hist.value) / h.count;
        h.min = Math.min(h.min, hist.value);
        h.max = Math.max(h.max, hist.value);
      }
    }

    return { summary, histograms };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flush();
    }
  }
}

// Singleton instance
let metricsCollector: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
  }
  return metricsCollector;
}

export function destroyMetricsCollector(): void {
  if (metricsCollector) {
    metricsCollector.destroy();
    metricsCollector = null;
  }
}