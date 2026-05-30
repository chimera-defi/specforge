import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { assertHostedSecurityConfig } from "./src/lib/specforge/security-config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

assertHostedSecurityConfig(process.env);

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    root: path.resolve(rootDir, ".."),
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
        ],
      },
    ];
  },
};

export default nextConfig;
