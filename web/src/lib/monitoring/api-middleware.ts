/**
 * API middleware for automatic request tracking and monitoring
 */

import { NextResponse } from "next/server";
import { getMetricsCollector } from "./metrics";
import { getPerformanceMonitor } from "./performance";

export interface ApiMiddlewareOptions {
  trackMetrics?: boolean;
  trackPerformance?: boolean;
  includeRequestId?: boolean;
}

/**
 * Wrap an API handler with monitoring middleware
 */
export function withApiMonitoring<T>(
  handler: (request: Request, context?: unknown) => Promise<NextResponse<T>>,
  options: ApiMiddlewareOptions = {}
) {
  const {
    trackMetrics = true,
    includeRequestId = true,
  } = options;

  return async (request: Request, context?: unknown): Promise<NextResponse<T>> => {
    const perfMonitor = getPerformanceMonitor();
    const metrics = getMetricsCollector();
    const startTime = Date.now();
    const timerId = perfMonitor.startTimer('api_request', {
      method: request.method,
      url: request.url,
    });

    // Add request ID header if not present
    if (includeRequestId && !request.headers.get('x-request-id')) {
      const requestId = crypto.randomUUID();
      const requestClone = new Request(request, {
        headers: new Headers(request.headers),
      });
      requestClone.headers.set('x-request-id', requestId);
    }

    try {
      const response = await handler(request, context);
      
      const duration = Date.now() - startTime;
      perfMonitor.endTimer(timerId);
      
      if (trackMetrics) {
        metrics.recordRequest(
          new URL(request.url).pathname,
          request.method,
          response.status,
          duration
        );
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      perfMonitor.endTimer(timerId);
      
      if (trackMetrics) {
        metrics.recordRequest(
          new URL(request.url).pathname,
          request.method,
          500,
          duration
        );
      }

      throw error;
    }
  };
}