import { describe, expect, it } from "vitest";

import {
  assertHostedSecurityConfig,
  getHostedSecurityConfigError,
} from "./security-config";

describe("hosted security config", () => {
  it("skips validation outside production", () => {
    const error = getHostedSecurityConfigError({
      NODE_ENV: "test",
      SPECFORGE_ENFORCE_HOSTED_SECURITY: "true",
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "true",
    });
    expect(error).toBeNull();
  });

  it("requires auth bypass to be disabled when hosted security is enforced", () => {
    const error = getHostedSecurityConfigError({
      NODE_ENV: "production",
      SPECFORGE_ENFORCE_HOSTED_SECURITY: "true",
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "true",
    });
    expect(error).toContain("NEXT_PUBLIC_SKIP_AUTH_OVERRIDE must be false");
  });

  it("requires OAuth variables in hosted production mode", () => {
    const error = getHostedSecurityConfigError({
      NODE_ENV: "production",
      SPECFORGE_ENFORCE_HOSTED_SECURITY: "true",
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "id",
    });
    expect(error).toContain("Missing required OAuth env");
  });

  it("requires secure secrets when secure-secrets mode is enabled", () => {
    const error = getHostedSecurityConfigError({
      NODE_ENV: "production",
      SPECFORGE_ENFORCE_HOSTED_SECURITY: "true",
      SPECFORGE_REQUIRE_SECURE_SECRETS: "true",
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "id",
      GITHUB_CLIENT_SECRET: "secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "https://example.com/api/auth/callback",
      SPECFORGE_SESSION_SECRET: "session",
    });
    expect(error).toContain("Missing required secure secret env");
  });

  it("requires session secret in hosted production mode", () => {
    const error = getHostedSecurityConfigError({
      NODE_ENV: "production",
      SPECFORGE_ENFORCE_HOSTED_SECURITY: "true",
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "id",
      GITHUB_CLIENT_SECRET: "secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "https://example.com/api/auth/callback",
    });
    expect(error).toContain("Missing required session secret env");
  });

  it("passes when all required hosted values are set", () => {
    const env = {
      NODE_ENV: "production",
      SPECFORGE_ENFORCE_HOSTED_SECURITY: "true",
      SPECFORGE_REQUIRE_SECURE_SECRETS: "true",
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "id",
      GITHUB_CLIENT_SECRET: "secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "https://example.com/api/auth/callback",
      SPECFORGE_SESSION_SECRET: "session",
      SPECFORGE_COLLAB_SECRET: "collab",
    };

    expect(getHostedSecurityConfigError(env as NodeJS.ProcessEnv)).toBeNull();
    expect(() => assertHostedSecurityConfig(env as NodeJS.ProcessEnv)).not.toThrow();
  });

  it("requires upstash config when upstash backend is selected", () => {
    const error = getHostedSecurityConfigError({
      NODE_ENV: "production",
      SPECFORGE_ENFORCE_HOSTED_SECURITY: "true",
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "id",
      GITHUB_CLIENT_SECRET: "secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "https://example.com/api/auth/callback",
      SPECFORGE_SESSION_SECRET: "session",
      SPECFORGE_RATE_LIMIT_BACKEND: "upstash",
    });
    expect(error).toContain("Missing required upstash rate-limit env");
  });

  it("requires stripe billing config when BILLING_PROVIDER=stripe", () => {
    const error = getHostedSecurityConfigError({
      NODE_ENV: "production",
      SPECFORGE_ENFORCE_HOSTED_SECURITY: "true",
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "id",
      GITHUB_CLIENT_SECRET: "secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "https://example.com/api/auth/callback",
      SPECFORGE_SESSION_SECRET: "session",
      BILLING_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_test_123",
    });
    expect(error).toContain("Missing required Stripe billing env");
  });
});
