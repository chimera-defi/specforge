import path from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NextConfig } from "next";
import { assertHostedSecurityConfig } from "./src/lib/specforge/security-config";
import { validateConfigurationOnStartup } from "./src/lib/validation/config-validation";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

function validateServerConfiguration(phase: string) {
  assertHostedSecurityConfig(process.env);

  if (phase !== PHASE_PRODUCTION_BUILD) {
    validateConfigurationOnStartup();
  }
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    root: path.resolve(rootDir, ".."),
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Production performance
  productionBrowserSourceMaps: false,
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "img-src 'self' data: https://avatars.githubusercontent.com",
              "font-src 'self' data:",
              "connect-src 'self' ws://localhost:* wss://localhost:* ws://localhost:4322 wss://localhost:4322 ws://localhost:4323 wss://localhost:4323",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Cache control for static assets
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // API routes caching
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default function createNextConfig(phase: string): NextConfig {
  validateServerConfiguration(phase);
  return nextConfig;
}
