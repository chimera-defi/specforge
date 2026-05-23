import crypto from "node:crypto";

const DEFAULT_SESSION_SECRET = "specforge-local-session-secret";
export const WORKSPACE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type StoredWorkspaceSession = {
  actor_id: string;
  workspace_id: string;
  role: string;
  githubLogin: string;
  githubUrl?: string;
  issuedAt: number;
  exp?: number;
};

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function normalizeEpochSeconds(value: number) {
  return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
}

function getSessionSecret(env: NodeJS.ProcessEnv = process.env) {
  const configuredSecret = env.SPECFORGE_SESSION_SECRET?.trim();

  if (env.NODE_ENV === "production" && !configuredSecret) {
    throw new Error("SPECFORGE_SESSION_SECRET must be configured in production");
  }

  if (env.SPECFORGE_REQUIRE_SECURE_SECRETS === "true" && !configuredSecret) {
    throw new Error("SPECFORGE_SESSION_SECRET must be configured outside local demo mode");
  }

  return configuredSecret || DEFAULT_SESSION_SECRET;
}

function signPayload(payload: string, env: NodeJS.ProcessEnv = process.env) {
  return base64UrlEncode(
    crypto.createHmac("sha256", getSessionSecret(env)).update(payload).digest(),
  );
}

export function createWorkspaceSessionToken(
  session: StoredWorkspaceSession,
  env: NodeJS.ProcessEnv = process.env,
) {
  const issuedAtSeconds = normalizeEpochSeconds(session.issuedAt);
  const normalizedSession: StoredWorkspaceSession = {
    ...session,
    issuedAt: issuedAtSeconds,
    exp: session.exp ?? issuedAtSeconds + WORKSPACE_SESSION_MAX_AGE_SECONDS,
  };
  const payload = base64UrlEncode(JSON.stringify(normalizedSession));
  const signature = signPayload(payload, env);
  return `${payload}.${signature}`;
}

export function verifyWorkspaceSessionToken(
  token: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  const [payload, signature] = String(token ?? "").split(".");

  if (!payload || !signature) {
    throw new Error("Malformed workspace session");
  }

  const expectedSignature = signPayload(payload, env);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid workspace session signature");
  }

  const parsed = JSON.parse(base64UrlDecode(payload)) as StoredWorkspaceSession;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const issuedAtSeconds = normalizeEpochSeconds(parsed.issuedAt);
  const expiresAt = parsed.exp ?? issuedAtSeconds + WORKSPACE_SESSION_MAX_AGE_SECONDS;

  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || expiresAt <= nowSeconds) {
    throw new Error("Expired workspace session");
  }

  return {
    ...parsed,
    issuedAt: issuedAtSeconds,
    exp: expiresAt,
  };
}
