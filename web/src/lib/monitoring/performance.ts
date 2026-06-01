/**
 * Performance monitoring utilities
 * Tracks request latency, database query time, and other performance metrics
 */

import { getMetricsCollector } from "./metrics";

interface PerformanceTimer {
  start: number;
  name: string;
  tags: Record<string, string>;
}

class PerformanceMonitor {
  private activeTimers: Map<string, PerformanceTimer> = new Map();

  /**
   * Start a performance timer
   */
  startTimer(name: string, tags: Record<string, string> = {}): string {
    const timerId = `${name}:${Date.now()}`;
    this.activeTimers.set(timerId, {
      start: performance.now(),
      name,
      tags,
    });
    return timerId;
  }

  /**
   * End a timer and record the duration
   */
  endTimer(timerId: string): number | null {
    const timer = this.activeTimers.get(timerId);
    if (!timer) {
      return null;
    }

    const duration = performance.now() - timer.start;
    const metrics = getMetricsCollector();
    metrics.histogram(timer.name, duration, timer.tags);

    this.activeTimers.delete(timerId);
    return duration;
  }

  /**
   * Measure an async function's execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const timerId = this.startTimer(name, tags);
    try {
      return await fn();
    } finally {
      this.endTimer(timerId);
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if (typeof performance === 'undefined' || !performance.memory) {
      return null;
    }

    const memory = performance.memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    };
  }

  /**
   * Get navigation timing metrics (browser only)
   */
  getNavigationTiming(): {
    domContentLoaded: number | null;
    loadComplete: number | null;
    firstPaint: number | null;
  } | null {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const firstPaint = paint.find((entry) => entry.name === 'first-paint')?.startTime || null;

    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd || null,
      loadComplete: navigation?.loadEventEnd || null,
      firstPaint,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.activeTimers.clear();
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export function destroyPerformanceMonitor(): void {
  if (performanceMonitor) {
    performanceMonitor.destroy();
    performanceMonitor = null;
  }
}