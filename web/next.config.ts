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
};

export default nextConfig;
