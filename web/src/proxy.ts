import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getHostedSecurityConfigError } from "./lib/specforge/security-config";

const WORKSPACE_SESSION_COOKIE = "specforge_session";
const DEFAULT_SESSION_SECRET = "specforge-local-session-secret";
const WORKSPACE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_READ_RATE_LIMIT = 240;
const DEFAULT_MUTATION_RATE_LIMIT = 90;
const MAX_RATE_LIMIT_PER_MINUTE = 5_000;
const MAX_RATE_BUCKETS = 5_000;
const DEFAULT_REMOTE_TIMEOUT_MS = 1_200;
const RATE_LIMIT_KEY_PREFIX = "specforge:rate-limit";
const trustForwardedFor = process.env.SPECFORGE_TRUST_X_FORWARDED_FOR === "true";
const rateLimitBackend = process.env.SPECFORGE_RATE_LIMIT_BACKEND?.trim().toLowerCase() ?? "memory";
const redisRestUrl = process.env.SPECFORGE_REDIS_REST_URL?.trim()?.replace(/\/+$/, "");
const redisRestToken = process.env.SPECFORGE_REDIS_REST_TOKEN?.trim();
const demoGateUsername = process.env.SPECFORGE_DEMO_GATE_USERNAME?.trim();
const demoGatePassword = process.env.SPECFORGE_DEMO_GATE_PASSWORD?.trim();
const demoGateRealm = process.env.SPECFORGE_DEMO_GATE_REALM?.trim() || "SpecForge demo";

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
};
const jsonContentSecurityPolicy = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";

type RateBucket = {
  count: number;
  resetAt: number;
};

type DecorateOptions = {
  includeContentSecurityPolicy?: boolean;
};

// Edge runtime memory is per-instance. Keep this as a baseline guardrail and
// enforce upstream distributed limits (e.g., CDN/WAF) for multi-instance deploys.
const rateBuckets = new Map<string, RateBucket>();

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, MAX_RATE_LIMIT_PER_MINUTE);
}

const readRateLimit = parsePositiveInt(
  process.env.SPECFORGE_RATE_LIMIT_READ_PER_MINUTE,
  DEFAULT_READ_RATE_LIMIT,
);
const mutationRateLimit = parsePositiveInt(
  process.env.SPECFORGE_RATE_LIMIT_MUTATION_PER_MINUTE,
  DEFAULT_MUTATION_RATE_LIMIT,
);
const remoteRateLimitTimeoutMs = parsePositiveInt(
  process.env.SPECFORGE_RATE_LIMIT_REMOTE_TIMEOUT_MS,
  DEFAULT_REMOTE_TIMEOUT_MS,
);
const hostedSecurityConfigError = getHostedSecurityConfigError(process.env);
let cachedHmacSecret = "";
let cachedHmacKey: CryptoKey | null = null;

function decorateResponse(response: NextResponse, requestId: string, options: DecorateOptions = {}) {
  response.headers.set("x-specforge-request-id", requestId);
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }
  if (options.includeContentSecurityPolicy) {
    response.headers.set("content-security-policy", jsonContentSecurityPolicy);
  }

  if (process.env.NODE_ENV === "production") {
    response.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }

  return response;
}

function getClientIp(request: NextRequest) {
  if (trustForwardedFor) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      const [firstIp] = forwardedFor.split(",");
      if (firstIp?.trim()) {
        return firstIp.trim();
      }
    }
  }
  const proxyHeaders = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("true-client-ip"),
    request.headers.get("x-real-ip"),
  ];
  for (const candidate of proxyHeaders) {
    if (candidate?.trim()) {
      return candidate.trim();
    }
  }

  const fingerprint = [
    request.headers.get("user-agent")?.slice(0, 80),
    request.headers.get("accept-language")?.slice(0, 32),
  ]
    .filter(Boolean)
    .join("|");

  return fingerprint ? `anonymous:${fingerprint}` : "unknown";
}

function cleanupRateBuckets(now: number) {
  if (rateBuckets.size <= MAX_RATE_BUCKETS) {
    return;
  }
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) {
      rateBuckets.delete(key);
    }
    if (rateBuckets.size <= MAX_RATE_BUCKETS) {
      break;
    }
  }
}

function buildRateLimitKey(clientIp: string, isMutation: boolean, pathname: string) {
  return `${RATE_LIMIT_KEY_PREFIX}:${isMutation ? "mut" : "read"}:${pathname}:${clientIp}`;
}

function normalizeEpochSeconds(value: number) {
  return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
}

function getSessionSecretForProxy() {
  const configuredSecret = process.env.SPECFORGE_SESSION_SECRET?.trim();

  if (process.env.NODE_ENV === "production" && !configuredSecret) {
    throw new Error("SPECFORGE_SESSION_SECRET must be configured in production");
  }

  if (process.env.SPECFORGE_REQUIRE_SECURE_SECRETS === "true" && !configuredSecret) {
    throw new Error("SPECFORGE_SESSION_SECRET must be configured outside local demo mode");
  }

  return configuredSecret || DEFAULT_SESSION_SECRET;
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized.length % 4 === 0 ? normalized : `${normalized}${"=".repeat(4 - (normalized.length % 4))}`;
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

function getDemoGateConfigError() {
  if ((!demoGateUsername && !demoGatePassword) || (demoGateUsername && demoGatePassword)) {
    return null;
  }

  return "SPECFORGE_DEMO_GATE_USERNAME and SPECFORGE_DEMO_GATE_PASSWORD must be configured together";
}

function isDemoGateEnabled() {
  return Boolean(demoGateUsername && demoGatePassword);
}

function isDemoGateProtectedPath(pathname: string) {
  if (
    pathname === "/workspace" ||
    pathname.startsWith("/workspace/") ||
    pathname === "/pilot-access" ||
    pathname.startsWith("/pilot-access/")
  ) {
    return true;
  }

  return pathname.startsWith("/api/");
}

function parseBasicAuth(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, encoded] = authorizationHeader.split(" ", 2);
  if (scheme?.toLowerCase() !== "basic" || !encoded) {
    return null;
  }

  try {
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex <= 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function isDemoGateAuthorized(request: NextRequest) {
  if (!demoGateUsername || !demoGatePassword) {
    return true;
  }

  const credentials = parseBasicAuth(request.headers.get("authorization"));
  if (!credentials) {
    return false;
  }

  return (
    constantTimeEqual(credentials.username, demoGateUsername) &&
    constantTimeEqual(credentials.password, demoGatePassword)
  );
}

function buildDemoGateChallenge(requestId: string) {
  const response = new NextResponse("Authentication required", { status: 401 });
  const realm = demoGateRealm.replace(/["\\]/g, "");
  response.headers.set("www-authenticate", `Basic realm="${realm}", charset="UTF-8"`);
  response.headers.set("cache-control", "no-store");
  return decorateResponse(response, requestId, { includeContentSecurityPolicy: true });
}

async function getProxyHmacKey(secret: string) {
  if (cachedHmacKey && cachedHmacSecret === secret) {
    return cachedHmacKey;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  cachedHmacSecret = secret;
  cachedHmacKey = key;
  return key;
}

async function verifyWorkspaceSessionTokenAtProxy(token: string) {
  const [payload, signature] = String(token ?? "").split(".");

  if (!payload || !signature) {
    throw new Error("Malformed workspace session");
  }

  const secret = getSessionSecretForProxy();
  const key = await getProxyHmacKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const expectedSignature = base64UrlEncodeBytes(new Uint8Array(signatureBuffer));

  if (!constantTimeEqual(signature, expectedSignature)) {
    throw new Error("Invalid workspace session signature");
  }

  const parsed = JSON.parse(base64UrlDecode(payload)) as {
    exp?: number;
    issuedAt: number;
  };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const issuedAtSeconds = normalizeEpochSeconds(Number(parsed.issuedAt));
  const expiresAt = parsed.exp ?? issuedAtSeconds + WORKSPACE_SESSION_MAX_AGE_SECONDS;

  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || expiresAt <= nowSeconds) {
    throw new Error("Expired workspace session");
  }
}

function consumeRateLimitInMemory(request: NextRequest, pathname: string) {
  const method = request.method.toUpperCase();
  const isMutation = !SAFE_METHODS.has(method);
  const limit = isMutation ? mutationRateLimit : readRateLimit;
  const clientIp = getClientIp(request);
  const now = Date.now();
  const key = buildRateLimitKey(clientIp, isMutation, pathname);
  const existing = rateBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateBuckets.set(key, { count: 1, resetAt });
    cleanupRateBuckets(now);
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  cleanupRateBuckets(now);

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

async function runRedisMultiExec(commands: string[][]) {
  if (!redisRestUrl || !redisRestToken) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), remoteRateLimitTimeoutMs);

  try {
    const response = await fetch(`${redisRestUrl}/multi-exec`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${redisRestToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    if (!Array.isArray(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function consumeRateLimitWithRedis(request: NextRequest, pathname: string) {
  const method = request.method.toUpperCase();
  const isMutation = !SAFE_METHODS.has(method);
  const limit = isMutation ? mutationRateLimit : readRateLimit;
  const clientIp = getClientIp(request);
  const key = buildRateLimitKey(clientIp, isMutation, pathname);
  const response = await runRedisMultiExec([
    ["SET", key, "0", "EX", String(RATE_LIMIT_WINDOW_SECONDS), "NX"],
    ["INCR", key],
    ["TTL", key],
  ]);

  if (!response || response.length < 3) {
    return null;
  }

  if (response.some((entry) => entry && typeof entry.error === "string")) {
    return null;
  }

  const countValue = response[1]?.result;
  const ttlValue = response[2]?.result;
  const count = typeof countValue === "number" ? countValue : Number(countValue);
  const ttlSeconds = typeof ttlValue === "number" ? ttlValue : Number(ttlValue);

  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }

  const effectiveTtlSeconds =
    Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : RATE_LIMIT_WINDOW_SECONDS;
  const now = Date.now();

  if (count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + effectiveTtlSeconds * 1000,
      retryAfterSeconds: Math.max(1, Math.ceil(effectiveTtlSeconds)),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - count),
    resetAt: now + effectiveTtlSeconds * 1000,
  };
}

async function consumeRateLimit(request: NextRequest, pathname: string) {
  if (rateLimitBackend === "upstash") {
    const remoteResult = await consumeRateLimitWithRedis(request, pathname);
    if (remoteResult) {
      return remoteResult;
    }
  }

  return consumeRateLimitInMemory(request, pathname);
}

function isCrossSiteMutation(request: NextRequest) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return false;
  }

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (
    secFetchSite &&
    secFetchSite !== "same-origin" &&
    secFetchSite !== "same-site" &&
    secFetchSite !== "none"
  ) {
    return true;
  }

  const requestOrigin = request.nextUrl.origin;
  const originHeader = request.headers.get("origin");
  if (originHeader && originHeader !== requestOrigin) {
    return true;
  }

  const refererHeader = request.headers.get("referer");
  if (!originHeader && refererHeader) {
    try {
      if (new URL(refererHeader).origin !== requestOrigin) {
        return true;
      }
    } catch {
      return true;
    }
  }

  return false;
}

function continueWithRequestId(requestHeaders: Headers, requestId: string, pathname: string) {
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  return decorateResponse(response, requestId, {
    includeContentSecurityPolicy: pathname.startsWith("/api/"),
  });
}

/**
 * Protect API routes when GitHub auth is enabled, while keeping local demo mode
 * and parity endpoints accessible for the delivery loop.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  const requestId =
    requestHeaders.get("x-specforge-request-id") ?? crypto.randomUUID();

  requestHeaders.set("x-specforge-request-id", requestId);

  if (
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/billing/webhook" ||
    pathname.startsWith("/api/parity/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/api/health" ||
    pathname === "/favicon.ico"
  ) {
    return continueWithRequestId(requestHeaders, requestId, pathname);
  }

  const demoGateConfigError = getDemoGateConfigError();
  if (demoGateConfigError && isDemoGateProtectedPath(pathname)) {
    return decorateResponse(
      NextResponse.json(
        {
          error: `Server misconfiguration: ${demoGateConfigError}`,
        },
        { status: 503 },
      ),
      requestId,
      { includeContentSecurityPolicy: true },
    );
  }

  if (isDemoGateEnabled() && isDemoGateProtectedPath(pathname) && !isDemoGateAuthorized(request)) {
    return buildDemoGateChallenge(requestId);
  }

  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH_OVERRIDE === "true";
  const githubConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID?.trim() &&
      process.env.GITHUB_CLIENT_SECRET?.trim() &&
      process.env.SPECFORGE_GITHUB_REDIRECT_URI?.trim(),
  );

  if (hostedSecurityConfigError) {
    return decorateResponse(
      NextResponse.json(
        {
          error: `Server misconfiguration: ${hostedSecurityConfigError}`,
        },
        { status: 503 },
      ),
      requestId,
      { includeContentSecurityPolicy: true },
    );
  }

  if (skipAuth || !githubConfigured) {
    return continueWithRequestId(requestHeaders, requestId, pathname);
  }

  if (pathname.startsWith("/api/")) {
    if (isCrossSiteMutation(request)) {
      return decorateResponse(
        NextResponse.json(
          {
            error: "Cross-site mutation blocked",
          },
          { status: 403 },
        ),
        requestId,
        { includeContentSecurityPolicy: true },
      );
    }

    const rate = await consumeRateLimit(request, pathname);
    if (!rate.allowed) {
      const response = NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfterSeconds: rate.retryAfterSeconds ?? 60,
        },
        { status: 429 },
      );
      response.headers.set("retry-after", String(rate.retryAfterSeconds ?? 60));
      return decorateResponse(response, requestId, { includeContentSecurityPolicy: true });
    }

    const sessionCookie = request.cookies.get(WORKSPACE_SESSION_COOKIE)?.value;

    if (!sessionCookie) {
      return decorateResponse(
        NextResponse.json({ error: "Authentication required" }, { status: 401 }),
        requestId,
        { includeContentSecurityPolicy: true },
      );
    }

    try {
      await verifyWorkspaceSessionTokenAtProxy(sessionCookie);
    } catch {
      return decorateResponse(
        NextResponse.json({ error: "Invalid or expired session" }, { status: 401 }),
        requestId,
        { includeContentSecurityPolicy: true },
      );
    }
  }

  return continueWithRequestId(requestHeaders, requestId, pathname);
}

export const config = {
  matcher: ["/workspace", "/workspace/:path*", "/pilot-access", "/pilot-access/:path*", "/api/:path*"],
};

export const __proxyInternals = {
  parsePositiveInt,
  getClientIp,
  consumeRateLimit,
  consumeRateLimitInMemory,
  consumeRateLimitWithRedis,
  isCrossSiteMutation,
  isDemoGateProtectedPath,
  parseBasicAuth,
  resetRateLimitBuckets: () => rateBuckets.clear(),
};
