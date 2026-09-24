/**
 * API Error Handler Utility
 * Converts SpecForge errors to appropriate HTTP responses with proper status codes
 */

import { NextResponse } from "next/server";
import { logger } from "./logger";
import { getErrorStatusCode, getErrorMessage, SpecForgeError } from "@/engine/errors";

/**
 * Safely wrap an async API handler with error handling
 * Converts SpecForgeError instances to proper HTTP responses
 * Logs all errors for visibility
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  context?: { action?: string; resourceId?: string }
): Promise<NextResponse<{ error?: string; [key: string]: unknown }> | T> {
  try {
    return await handler();
  } catch (error) {
    const statusCode = getErrorStatusCode(error);
    const message = getErrorMessage(error);

    // Log the full error detail server-side for debugging
    logger.error(
      `API error: ${context?.action || "unknown action"}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        statusCode,
        resourceId: context?.resourceId,
        message,
      }
    );

    // For unexpected (non-SpecForge) errors return a generic message to avoid
    // leaking internal details (filesystem paths, DB schema, connection strings)
    // to callers. SpecForgeError messages are intentional and safe to surface.
    const clientMessage =
      error instanceof SpecForgeError ? message : "Internal server error";

    return NextResponse.json({ error: clientMessage }, { status: statusCode });
  }
}
