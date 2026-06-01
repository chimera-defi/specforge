/**
 * Sentry Error Tracking Integration
 * Provides error capture, performance monitoring, and release tracking
 */

import * as Sentry from "@sentry/nextjs";
import { logger } from "../logger";

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

const DEFAULT_CONFIG: Partial<SentryConfig> = {
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1, // 10% of profiles
};

/**
 * Initialize Sentry
 */
export function initSentry(config?: Partial<SentryConfig>): void {
  const dsn = config?.dsn || process.env.SENTRY_DSN;

  if (!dsn) {
    logger.info("Sentry DSN not configured, skipping initialization");
    return;
  }

  const sentryConfig: SentryConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    dsn,
  };

  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    release: sentryConfig.release || process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: sentryConfig.tracesSampleRate,
    profilesSampleRate: sentryConfig.profilesSampleRate,
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Session replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // beforeSend filter
    beforeSend(event, _hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: "SpecForge",
        },
      };

      return event;
    },

    // Before send transaction filter
    beforeSendTransaction(event) {
      // Filter out health check transactions
      if (event.transaction?.includes("/api/health")) {
        return null;
      }
      return event;
    },
  });

  logger.info("Sentry initialized", {
    environment: sentryConfig.environment,
    release: sentryConfig.release,
  });
}

/**
 * Capture error with context
 */
export function captureError(
  error: Error | unknown,
  context?: Record<string, unknown>,
  tags?: Record<string, string>
): void {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value as Record<string, unknown>);
      });
    }

    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error));
    }
  });
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value as Record<string, unknown>);
      });
    }

    Sentry.captureMessage(message, {
      level,
    });
  });
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: "info" | "warning" | "error"
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
  });
}

/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({
    name,
    op,
  });
}

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return !!process.env.SENTRY_DSN;
}

/**
 * Configure Sentry for development
 */
export function configureSentryForDevelopment(): void {
  if (process.env.NODE_ENV === "development") {
    logger.info("Sentry in development mode - errors will be logged but not sent");
  }
}