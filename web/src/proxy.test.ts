import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createWorkspaceSessionToken } from "./lib/specforge/session-token";

const RATE_LIMIT_TTL_SECONDS = 60;

const ENV_KEYS = [
  "NODE_ENV",
  "NEXT_PUBLIC_SKIP_AUTH_OVERRIDE",
  "SPECFORGE_ENFORCE_HOSTED_SECURITY",
  "SPECFORGE_RATE_LIMIT_READ_PER_MINUTE",
  "SPECFORGE_RATE_LIMIT_MUTATION_PER_MINUTE",
  "SPECFORGE_RATE_LIMIT_BACKEND",
  "SPECFORGE_REDIS_REST_URL",
  "SPECFORGE_REDIS_REST_TOKEN",
  "SPECFORGE_RATE_LIMIT_REMOTE_TIMEOUT_MS",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "SPECFORGE_GITHUB_REDIRECT_URI",
] as const;

const ORIGINAL_ENV = new Map<string, string | undefined>(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

function applyEnv(overrides: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    const value = overrides[key];
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}

async function loadProxyModule(overrides: Record<string, string | undefined> = {}) {
  applyEnv({
    NODE_ENV: "test",
    NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "true",
    SPECFORGE_ENFORCE_HOSTED_SECURITY: "false",
    SPECFORGE_RATE_LIMIT_READ_PER_MINUTE: undefined,
    SPECFORGE_RATE_LIMIT_MUTATION_PER_MINUTE: undefined,
    SPECFORGE_RATE_LIMIT_BACKEND: undefined,
    SPECFORGE_REDIS_REST_URL: undefined,
    SPECFORGE_REDIS_REST_TOKEN: undefined,
    SPECFORGE_RATE_LIMIT_REMOTE_TIMEOUT_MS: undefined,
    GITHUB_CLIENT_ID: undefined,
    GITHUB_CLIENT_SECRET: undefined,
    SPECFORGE_GITHUB_REDIRECT_URI: undefined,
    ...overrides,
  });
  vi.resetModules();
  return import("./proxy");
}

function buildRequest(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init));
}

function buildValidSessionCookie() {
  const token = createWorkspaceSessionToken({
    actor_id: "workspace_owner",
    workspace_id: "ws_demo",
    role: "Workspace owner",
    githubLogin: "chimera-defi",
    issuedAt: Date.now(),
  });
  return `specforge_session=${token}`;
}

afterEach(() => {
  const restored: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    restored[key] = ORIGINAL_ENV.get(key);
  }
  applyEnv(restored);
  vi.resetModules();
});

describe("proxy hardening", () => {
  it("applies request id and security headers on passthrough responses", async () => {
    const { proxy } = await loadProxyModule();
    const response = await proxy(buildRequest("http://localhost:3000/api/health"));

    expect(response.headers.get("x-specforge-request-id")).toBeTruthy();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  it("blocks cross-site mutation requests when auth mode is active", async () => {
    const { proxy } = await loadProxyModule({
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "demo-client",
      GITHUB_CLIENT_SECRET: "demo-secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "http://localhost:3000/api/auth/callback",
    });
    const response = await proxy(
      buildRequest("http://localhost:3000/api/workspace/plans", {
        method: "POST",
        headers: new Headers({
          origin: "https://evil.example",
          cookie: "specforge_session=test-session",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Cross-site mutation blocked",
    });
  });

  it("requires workspace session for protected APIs when auth mode is active", async () => {
    const { proxy } = await loadProxyModule({
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "demo-client",
      GITHUB_CLIENT_SECRET: "demo-secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "http://localhost:3000/api/auth/callback",
    });
    const response = await proxy(
      buildRequest("http://localhost:3000/api/workspace/plans", {
        method: "GET",
        headers: new Headers({
          origin: "http://localhost:3000",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Authentication required",
    });
  });

  it("rejects malformed workspace sessions for protected APIs", async () => {
    const { proxy } = await loadProxyModule({
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "demo-client",
      GITHUB_CLIENT_SECRET: "demo-secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "http://localhost:3000/api/auth/callback",
    });
    const response = await proxy(
      buildRequest("http://localhost:3000/api/workspace/plans", {
        method: "GET",
        headers: new Headers({
          origin: "http://localhost:3000",
          cookie: "specforge_session=not-a-real-token",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid or expired session",
    });
  });

  it("allows Stripe webhook path without workspace session auth", async () => {
    const { proxy } = await loadProxyModule({
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "demo-client",
      GITHUB_CLIENT_SECRET: "demo-secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "http://localhost:3000/api/auth/callback",
    });

    const response = await proxy(
      buildRequest("http://localhost:3000/api/billing/webhook", {
        method: "POST",
        headers: new Headers({
          origin: "https://api.stripe.com",
        }),
      }),
    );

    expect(response.status).toBe(200);
  });

  it("enforces API rate limiting", async () => {
    const { proxy, __proxyInternals } = await loadProxyModule({
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "demo-client",
      GITHUB_CLIENT_SECRET: "demo-secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "http://localhost:3000/api/auth/callback",
      SPECFORGE_RATE_LIMIT_READ_PER_MINUTE: "1",
    });
    __proxyInternals.resetRateLimitBuckets();

    const first = await proxy(
      buildRequest("http://localhost:3000/api/workspace/plans", {
        method: "GET",
        headers: new Headers({
          origin: "http://localhost:3000",
          cookie: buildValidSessionCookie(),
          "x-forwarded-for": "198.51.100.21",
        }),
      }),
    );
    expect(first.status).toBe(200);

    const second = await proxy(
      buildRequest("http://localhost:3000/api/workspace/plans", {
        method: "GET",
        headers: new Headers({
          origin: "http://localhost:3000",
          cookie: buildValidSessionCookie(),
          "x-forwarded-for": "198.51.100.21",
        }),
      }),
    );
    expect(second.status).toBe(429);
    expect(second.headers.get("retry-after")).toBeTruthy();
  });

  it("uses the upstash backend when configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([{ result: "OK" }, { result: 1 }, { result: RATE_LIMIT_TTL_SECONDS }]),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const { proxy } = await loadProxyModule({
      NEXT_PUBLIC_SKIP_AUTH_OVERRIDE: "false",
      GITHUB_CLIENT_ID: "demo-client",
      GITHUB_CLIENT_SECRET: "demo-secret",
      SPECFORGE_GITHUB_REDIRECT_URI: "http://localhost:3000/api/auth/callback",
      SPECFORGE_RATE_LIMIT_BACKEND: "upstash",
      SPECFORGE_REDIS_REST_URL: "https://example-redis.upstash.io",
      SPECFORGE_REDIS_REST_TOKEN: "token",
      SPECFORGE_RATE_LIMIT_REMOTE_TIMEOUT_MS: "500",
    });

    const response = await proxy(
      buildRequest("http://localhost:3000/api/workspace/plans", {
        method: "GET",
        headers: new Headers({
          origin: "http://localhost:3000",
          cookie: buildValidSessionCookie(),
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
