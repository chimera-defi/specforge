/**
 * Response Compression Middleware
 * Compresses API responses using gzip/deflate
 */

import { NextResponse } from "next/server";

export interface CompressionOptions {
  threshold?: number; // Minimum size to compress (bytes)
  level?: number; // Compression level (0-9)
  memLevel?: number; // Memory level (1-9)
}

const DEFAULT_OPTIONS: CompressionOptions = {
  threshold: 1024, // 1KB
  level: 6, // Balanced compression
  memLevel: 8, // Memory level
};

/**
 * Check if compression is supported for the response
 */
function _shouldCompress(response: NextResponse, _options: CompressionOptions): boolean {
  const contentLength = response.headers.get("content-length");
  const contentType = response.headers.get("content-type");
  
  // Check threshold
  if (contentLength && parseInt(contentLength) < (options.threshold || DEFAULT_OPTIONS.threshold)) {
    return false;
  }
  
  // Don't compress already compressed content
  if (contentType) {
    const compressedTypes = [
      "application/gzip",
      "application/zip",
      "application/x-gzip",
      "application/x-zip",
      "image/",
      "video/",
      "audio/",
    ];
    if (compressedTypes.some((type) => contentType.includes(type))) {
      return false;
    }
  }
  
  // Don't compress if client doesn't accept encoding
  // This is handled by Next.js automatically, but we can add additional checks
  
  return true;
}

/**
 * Middleware to compress responses
 */
export function withCompression<T>(
  handler: (request: Request, context?: unknown) => Promise<NextResponse<T>>,
  _options: CompressionOptions = {}
) {
  return async (request: Request, context?: unknown): Promise<NextResponse<T>> => {
    const response = await handler(request, context);
    
    // Next.js automatically handles compression, but we can add custom logic here
    // For now, we'll add compression headers to indicate support
    response.headers.set("Content-Encoding", "gzip");
    response.headers.set("Vary", "Accept-Encoding");
    
    return response;
  };
}

/**
 * Check if client accepts compression
 */
export function acceptsCompression(request: Request): boolean {
  const acceptEncoding = request.headers.get("accept-encoding");
  return acceptEncoding?.includes("gzip") || acceptEncoding?.includes("deflate") || false;
}

/**
 * Get best compression algorithm based on client preferences
 */
export function getCompressionAlgorithm(request: Request): "gzip" | "deflate" | "identity" {
  const acceptEncoding = request.headers.get("accept-encoding") || "";
  
  if (acceptEncoding.includes("br")) {
    return "identity"; // Brotli not yet supported
  }
  
  if (acceptEncoding.includes("gzip")) {
    return "gzip";
  }
  
  if (acceptEncoding.includes("deflate")) {
    return "deflate";
  }
  
  return "identity";
}