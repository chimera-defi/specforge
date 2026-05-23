const TRUTHY = "true";

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function missingEnv(env: NodeJS.ProcessEnv, keys: string[]) {
  return keys.filter((key) => !hasValue(env[key]));
}

export function getHostedSecurityConfigError(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.NODE_ENV !== "production") {
    return null;
  }

  const enforceHostedSecurity = env.SPECFORGE_ENFORCE_HOSTED_SECURITY === TRUTHY;
  if (!enforceHostedSecurity) {
    return null;
  }

  if (env.NEXT_PUBLIC_SKIP_AUTH_OVERRIDE === TRUTHY) {
    return "NEXT_PUBLIC_SKIP_AUTH_OVERRIDE must be false when SPECFORGE_ENFORCE_HOSTED_SECURITY=true";
  }

  const missingOauth = missingEnv(env, [
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "SPECFORGE_GITHUB_REDIRECT_URI",
  ]);

  if (missingOauth.length > 0) {
    return `Missing required OAuth env: ${missingOauth.join(", ")}`;
  }

  const missingSessionSecret = missingEnv(env, ["SPECFORGE_SESSION_SECRET"]);
  if (missingSessionSecret.length > 0) {
    return `Missing required session secret env: ${missingSessionSecret.join(", ")}`;
  }

  const requireSecureSecrets = env.SPECFORGE_REQUIRE_SECURE_SECRETS === TRUTHY;
  if (requireSecureSecrets) {
    const missingSecrets = missingEnv(env, ["SPECFORGE_COLLAB_SECRET"]);
    if (missingSecrets.length > 0) {
      return `Missing required secure secret env: ${missingSecrets.join(", ")}`;
    }
  }

  const rateLimitBackend = env.SPECFORGE_RATE_LIMIT_BACKEND?.trim().toLowerCase();
  if (rateLimitBackend === "upstash") {
    const missingUpstashConfig = missingEnv(env, [
      "SPECFORGE_REDIS_REST_URL",
      "SPECFORGE_REDIS_REST_TOKEN",
    ]);
    if (missingUpstashConfig.length > 0) {
      return `Missing required upstash rate-limit env: ${missingUpstashConfig.join(", ")}`;
    }
  }

  const billingProvider = env.BILLING_PROVIDER?.trim().toLowerCase() ?? "local";
  if (billingProvider === "stripe") {
    const missingStripeConfig = missingEnv(env, [
      "STRIPE_SECRET_KEY",
      "STRIPE_CHECKOUT_SUCCESS_URL",
      "STRIPE_CHECKOUT_CANCEL_URL",
      "STRIPE_PRICE_ID_PILOT",
      "STRIPE_WEBHOOK_SECRET",
    ]);
    if (missingStripeConfig.length > 0) {
      return `Missing required Stripe billing env: ${missingStripeConfig.join(", ")}`;
    }
  }

  return null;
}

export function assertHostedSecurityConfig(env: NodeJS.ProcessEnv = process.env) {
  const error = getHostedSecurityConfigError(env);
  if (error) {
    throw new Error(`SpecForge hosted security configuration invalid: ${error}`);
  }
}
