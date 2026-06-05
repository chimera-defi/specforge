/**
 * Request validation middleware using Zod schemas
 * Provides automatic request body, query, and params validation
 */

import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { logger } from "../logger";

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

/**
 * Validate request using Zod schemas
 */
export async function validateRequest<T = unknown>(
  request: Request,
  options: ValidationOptions
): Promise<ValidationResult<T>> {
  try {
    const data: Record<string, unknown> = {};

    // Validate body
    if (options.body) {
      const body = await request.clone().json().catch(() => ({}));
      const validatedBody = options.body.parse(body);
      Object.assign(data, validatedBody);
    }

    // Validate query
    if (options.query) {
      const url = new URL(request.url);
      const query = Object.fromEntries(url.searchParams.entries());
      const validatedQuery = options.query.parse(query);
      Object.assign(data, validatedQuery);
    }

    // Validate params (extracted from URL)
    if (options.params) {
      // Params would need to be extracted by the route handler
      // This is a placeholder for params validation
      const validatedParams = options.params.parse({});
      Object.assign(data, validatedParams);
    }

    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((err) => ({
        path: err.path.map(String),
        message: err.message,
      }));

      return {
        success: false,
        errors,
      };
    }

    return {
      success: false,
      errors: [
        {
          path: [],
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}

/**
 * Middleware to validate requests
 */
export function withValidation<T = unknown>(
  handler: (request: Request, context?: unknown) => Promise<NextResponse>,
  options: ValidationOptions
) {
  return async (request: Request, context?: unknown): Promise<NextResponse> => {
    const validation = await validateRequest<T>(request, options);

    if (!validation.success) {
      logger.warn("Request validation failed", {
        errors: validation.errors,
        url: request.url,
        method: request.method,
      });

      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Attach validated data to request headers for handler to use
    const requestClone = new Request(request, {
      headers: new Headers(request.headers),
    });
    requestClone.headers.set("x-validated-data", JSON.stringify(validation.data));

    return handler(requestClone, context);
  };
}

/**
 * Extract validated data from request headers
 */
export function getValidatedData<T = unknown>(request: Request): T | null {
  const data = request.headers.get("x-validated-data");
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Document ID validation
  documentId: (id: string) => {
    return /^[a-zA-Z0-9_-]{1,100}$/.test(id);
  },

  // Workspace ID validation
  workspaceId: (id: string) => {
    return /^ws_[a-zA-Z0-9_-]{1,50}$/.test(id);
  },

  // Email validation
  email: (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Pagination
  pagination: {
    page: 1,
    limit: 50,
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  },
};
