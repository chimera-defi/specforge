/**
 * API Versioning Middleware
 * Provides version handling for API routes
 */

import { NextResponse } from "next/server";

export type ApiVersion = "v1" | "v2" | "latest";

export const DEFAULT_API_VERSION: ApiVersion = "v1";
const SUPPORTED_VERSIONS: ApiVersion[] = ["v1", "v2", "latest"];

/**
 * Extract API version from request
 */
export function extractApiVersion(request: Request): ApiVersion {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Check for version in path (e.g., /api/v1/documents)
  if (pathParts[0] === "api" && SUPPORTED_VERSIONS.includes(pathParts[1] as ApiVersion)) {
    return pathParts[1] as ApiVersion;
  }
  
  // Check for version in header
  const versionHeader = request.headers.get("api-version") || request.headers.get("x-api-version");
  if (versionHeader && SUPPORTED_VERSIONS.includes(versionHeader as ApiVersion)) {
    return versionHeader as ApiVersion;
  }
  
  // Check for version in query parameter
  const versionQuery = url.searchParams.get("version") || url.searchParams.get("v");
  if (versionQuery && SUPPORTED_VERSIONS.includes(versionQuery as ApiVersion)) {
    return versionQuery as ApiVersion;
  }
  
  return DEFAULT_API_VERSION;
}

/**
 * Validate API version
 */
export function isValidApiVersion(version: string): version is ApiVersion {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion);
}

/**
 * Middleware to add API version to response headers
 */
export function withApiVersion<T>(
  handler: (request: Request, context?: unknown) => Promise<NextResponse<T>>
) {
  return async (request: Request, context?: unknown): Promise<NextResponse<T>> => {
    const version = extractApiVersion(request);
    
    const response = await handler(request, context);
    
    // Add version to response headers
    response.headers.set("API-Version", version);
    response.headers.set("X-API-Version", version);
    
    return response;
  };
}

/**
 * Create versioned route path
 */
export function versionedPath(path: string, version?: ApiVersion): string {
  const v = version || DEFAULT_API_VERSION;
  return `/api/${v}${path}`;
}

/**
 * Check if request is for a specific version
 */
export function isVersion(request: Request, version: ApiVersion): boolean {
  return extractApiVersion(request) === version;
}

/**
 * Get version from request (alias for extractApiVersion)
 */
export function getApiVersion(request: Request): ApiVersion {
  return extractApiVersion(request);
}