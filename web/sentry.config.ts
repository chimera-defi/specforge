/**
 * Sentry Configuration
 * Configure Sentry for error tracking and performance monitoring
 */

import { initSentry } from "./src/lib/sentry";

// Initialize Sentry
initSentry({
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1"),
});