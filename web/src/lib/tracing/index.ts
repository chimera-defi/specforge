/**
 * Distributed Tracing with OpenTelemetry
 * Provides distributed tracing for production debugging
 */

import { trace } from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { logger } from "../logger";

let tracerProvider: NodeTracerProvider | null = null;

type SpanAttributes = Record<string, string | number | boolean>;

/**
 * Initialize OpenTelemetry tracing
 */
export function initTracing(serviceName: string = "specforge-web"): void {
  if (process.env.NODE_ENV === "development") {
    logger.info("OpenTelemetry tracing disabled in development");
    return;
  }

  try {
    tracerProvider = new NodeTracerProvider({
      resource: resourceFromAttributes({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || "1.0.0",
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
      }),
    });

    tracerProvider.register();

    logger.info("OpenTelemetry tracing initialized", { serviceName });
  } catch (error) {
    logger.error("Failed to initialize OpenTelemetry", { error });
  }
}

/**
 * Get a tracer for a specific module
 */
export function getTracer(name: string, version: string = "1.0.0") {
  return trace.getTracer(name, version);
}

/**
 * Create a span with automatic context propagation
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: SpanAttributes
): Promise<T> {
  const tracer = getTracer("specforge");

  return tracer.startActiveSpan(name, async (span) => {
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }

    try {
      const result = await fn();
      span.setStatus({ code: 1 });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: String(error) });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Add attributes to current span
 */
export function addSpanAttributes(attributes: SpanAttributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: SpanAttributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Check if tracing is enabled
 */
export function isTracingEnabled(): boolean {
  return tracerProvider !== null && process.env.NODE_ENV !== "development";
}
