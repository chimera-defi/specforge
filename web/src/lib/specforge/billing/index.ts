import crypto from "node:crypto";

/**
 * Billing provider abstraction.
 *
 * Local stub for MVP; real provider switchable via BILLING_PROVIDER env.
 * This module decouples workspace billing queries from the data source
 * so Stripe (or another provider) can be wired in without touching routes.
 */

export type BillingProviderName = "local" | "stripe";
const BILLING_PROVIDER_NAMES: readonly BillingProviderName[] = ["local", "stripe"] as const;
const DEFAULT_STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;

export type PlanSubscription = {
  workspaceId: string;
  planId: string;
  status: "active" | "past_due" | "canceled" | "trialing";
  currentPeriodEnd: Date | null;
};

export type BillingProviderErrorCode =
  | "BILLING_PROVIDER_INVALID"
  | "BILLING_PROVIDER_CONFIG_INVALID"
  | "BILLING_PLAN_NOT_SUPPORTED"
  | "BILLING_PROVIDER_REQUEST_FAILED"
  | "BILLING_WEBHOOK_INVALID_SIGNATURE"
  | "BILLING_WEBHOOK_INVALID_PAYLOAD";

export class BillingProviderError extends Error {
  readonly code: BillingProviderErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(input: {
    message: string;
    code: BillingProviderErrorCode;
    status?: number;
    details?: Record<string, unknown>;
  }) {
    super(input.message);
    this.name = "BillingProviderError";
    this.code = input.code;
    this.status = input.status ?? 400;
    this.details = input.details;
  }
}

export function isBillingProviderError(error: unknown): error is BillingProviderError {
  return error instanceof BillingProviderError;
}

export interface BillingProviderInterface {
  getSubscription(workspaceId: string): Promise<PlanSubscription | null>;
  createCheckoutUrl(workspaceId: string, planId: string): Promise<string>;
  cancelSubscription(workspaceId: string): Promise<void>;
}

type StripeListResponse<T> = {
  data?: T[];
};

type StripeCheckoutSessionResponse = {
  url?: string;
};

type StripeSubscription = {
  id: string;
  status?: string;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: {
    data?: Array<{
      price?: {
        id?: string;
      };
    }>;
  };
};

export type StripeWebhookEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: Record<string, unknown>;
  };
  created?: number;
  livemode?: boolean;
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function missingEnv(env: NodeJS.ProcessEnv, keys: string[]) {
  return keys.filter((key) => !hasValue(env[key]));
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function mapStripeSubscriptionStatus(status: string | undefined): PlanSubscription["status"] {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "past_due";
  }
}

function getStripeSubscriptionPlanId(subscription: StripeSubscription): string {
  const fromMetadata = subscription.metadata?.plan_id?.trim();
  if (fromMetadata) {
    return fromMetadata;
  }

  const fromPrice = subscription.items?.data?.[0]?.price?.id?.trim();
  if (fromPrice) {
    return fromPrice;
  }

  return "pilot";
}

function resolveBillingProviderName(env: NodeJS.ProcessEnv): BillingProviderName {
  const rawProvider = env.BILLING_PROVIDER?.trim().toLowerCase() ?? "local";
  if (rawProvider === "local" || rawProvider === "stripe") {
    return rawProvider;
  }

  throw new BillingProviderError({
    message: `Unsupported billing provider "${rawProvider}"`,
    code: "BILLING_PROVIDER_INVALID",
    details: {
      provider: rawProvider,
      supportedProviders: BILLING_PROVIDER_NAMES,
    },
  });
}

function buildStripeSignature(payload: string, timestamp: number, webhookSecret: string) {
  return crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
}

function timingSafeHexEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function parseStripeSignatureHeader(signatureHeader: string) {
  const pieces = signatureHeader
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean);

  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const piece of pieces) {
    const [rawKey, ...rawValueParts] = piece.split("=");
    const key = rawKey?.trim();
    const value = rawValueParts.join("=").trim();

    if (!key || !value) {
      continue;
    }

    if (key === "t") {
      const parsedTimestamp = Number.parseInt(value, 10);
      if (Number.isFinite(parsedTimestamp)) {
        timestamp = parsedTimestamp;
      }
      continue;
    }

    if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    throw new BillingProviderError({
      message: "Stripe signature header is malformed",
      code: "BILLING_WEBHOOK_INVALID_SIGNATURE",
      status: 400,
    });
  }

  return {
    timestamp,
    signatures,
  };
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  webhookSecret: string,
  options?: {
    nowMs?: number;
    toleranceSeconds?: number;
  },
) {
  const parsed = parseStripeSignatureHeader(signatureHeader);
  const nowSeconds = Math.floor((options?.nowMs ?? Date.now()) / 1000);
  const toleranceSeconds =
    options?.toleranceSeconds ?? DEFAULT_STRIPE_WEBHOOK_TOLERANCE_SECONDS;

  if (Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) {
    throw new BillingProviderError({
      message: "Stripe webhook signature is outside the allowed timestamp tolerance",
      code: "BILLING_WEBHOOK_INVALID_SIGNATURE",
      status: 400,
      details: {
        timestamp: parsed.timestamp,
        toleranceSeconds,
      },
    });
  }

  const expected = buildStripeSignature(payload, parsed.timestamp, webhookSecret);
  const valid = parsed.signatures.some((signature) => timingSafeHexEqual(signature, expected));

  if (!valid) {
    throw new BillingProviderError({
      message: "Stripe webhook signature verification failed",
      code: "BILLING_WEBHOOK_INVALID_SIGNATURE",
      status: 400,
    });
  }
}

export function validateAndParseStripeWebhookEvent(
  payload: string,
  signatureHeader: string | null,
  env: NodeJS.ProcessEnv = process.env,
) {
  const missingWebhookConfig = missingEnv(env, ["STRIPE_WEBHOOK_SECRET"]);
  if (missingWebhookConfig.length > 0) {
    throw new BillingProviderError({
      message: `Missing required Stripe webhook env: ${missingWebhookConfig.join(", ")}`,
      code: "BILLING_PROVIDER_CONFIG_INVALID",
      status: 503,
      details: {
        provider: "stripe",
        missing: missingWebhookConfig,
      },
    });
  }

  if (!signatureHeader?.trim()) {
    throw new BillingProviderError({
      message: "Missing Stripe-Signature header",
      code: "BILLING_WEBHOOK_INVALID_SIGNATURE",
      status: 400,
    });
  }

  verifyStripeWebhookSignature(payload, signatureHeader, env.STRIPE_WEBHOOK_SECRET!.trim(), {
    toleranceSeconds: parsePositiveInt(
      env.STRIPE_WEBHOOK_TOLERANCE_SECONDS,
      DEFAULT_STRIPE_WEBHOOK_TOLERANCE_SECONDS,
    ),
  });

  try {
    const parsed = JSON.parse(payload) as StripeWebhookEvent;
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid event payload");
    }
    return parsed;
  } catch {
    throw new BillingProviderError({
      message: "Stripe webhook payload is not valid JSON",
      code: "BILLING_WEBHOOK_INVALID_PAYLOAD",
      status: 400,
    });
  }
}

/**
 * Local stub -- always returns an active demo subscription.
 * Suitable for local-first dev and design-partner testing.
 */
class LocalBillingProvider implements BillingProviderInterface {
  async getSubscription(workspaceId: string): Promise<PlanSubscription> {
    return {
      workspaceId,
      planId: "demo",
      status: "active",
      currentPeriodEnd: null,
    };
  }

  async createCheckoutUrl(
    _workspaceId: string,
    _planId: string,
  ): Promise<string> {
    return "/pricing?mode=local";
  }

  async cancelSubscription(_workspaceId: string): Promise<void> {
    // No-op in local mode
  }
}

class StripeBillingProvider implements BillingProviderInterface {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  private assertStripeEnv(keys: string[]) {
    const missing = missingEnv(this.env, keys);
    if (missing.length === 0) {
      return;
    }

    throw new BillingProviderError({
      message: `Missing required Stripe env: ${missing.join(", ")}`,
      code: "BILLING_PROVIDER_CONFIG_INVALID",
      details: {
        provider: "stripe",
        missing,
      },
    });
  }

  private getSecretKey() {
    this.assertStripeEnv(["STRIPE_SECRET_KEY"]);
    const secretKey = this.env.STRIPE_SECRET_KEY?.trim();

    if (!secretKey) {
      throw new BillingProviderError({
        message: "Stripe secret key failed validation",
        code: "BILLING_PROVIDER_CONFIG_INVALID",
        details: {
          provider: "stripe",
          key: "STRIPE_SECRET_KEY",
        },
      });
    }

    return secretKey;
  }

  private async stripeGetJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.getSecretKey()}`,
      },
    });

    if (!response.ok) {
      const stripeBody = await response.text();
      throw new BillingProviderError({
        message: "Stripe request failed",
        code: "BILLING_PROVIDER_REQUEST_FAILED",
        status: 502,
        details: {
          provider: "stripe",
          stripeStatus: response.status,
          stripeBody: stripeBody.slice(0, 500),
        },
      });
    }

    return (await response.json()) as T;
  }

  private mapStripeSubscription(workspaceId: string, subscription: StripeSubscription) {
    return {
      workspaceId,
      planId: getStripeSubscriptionPlanId(subscription),
      status: mapStripeSubscriptionStatus(subscription.status),
      currentPeriodEnd:
        typeof subscription.current_period_end === "number"
          ? new Date(subscription.current_period_end * 1000)
          : null,
    } satisfies PlanSubscription;
  }

  async getSubscription(workspaceId: string): Promise<PlanSubscription | null> {
    const query = encodeURIComponent(`metadata['workspace_id']:'${workspaceId}'`);

    try {
      const searchPayload = await this.stripeGetJson<StripeListResponse<StripeSubscription>>(
        `https://api.stripe.com/v1/subscriptions/search?query=${query}&limit=1`,
      );
      const subscription = searchPayload.data?.[0];
      if (subscription) {
        return this.mapStripeSubscription(workspaceId, subscription);
      }
    } catch {
      // Fall through to list-based fallback.
    }

    const listPayload = await this.stripeGetJson<StripeListResponse<StripeSubscription>>(
      "https://api.stripe.com/v1/subscriptions?status=all&limit=100",
    );

    const matched = listPayload.data?.find(
      (item) => item.metadata?.workspace_id?.trim() === workspaceId,
    );

    return matched ? this.mapStripeSubscription(workspaceId, matched) : null;
  }

  async createCheckoutUrl(workspaceId: string, planId: string): Promise<string> {
    const normalizedPlanId = planId.trim().toLowerCase();
    if (!normalizedPlanId) {
      throw new BillingProviderError({
        message: "planId is required",
        code: "BILLING_PLAN_NOT_SUPPORTED",
      });
    }

    const priceEnvKey = `STRIPE_PRICE_ID_${normalizedPlanId.toUpperCase()}`;
    this.assertStripeEnv([
      "STRIPE_SECRET_KEY",
      "STRIPE_CHECKOUT_SUCCESS_URL",
      "STRIPE_CHECKOUT_CANCEL_URL",
      priceEnvKey,
    ]);

    const secretKey = this.getSecretKey();
    const successUrl = this.env.STRIPE_CHECKOUT_SUCCESS_URL?.trim();
    const cancelUrl = this.env.STRIPE_CHECKOUT_CANCEL_URL?.trim();
    const priceId = this.env[priceEnvKey]?.trim();

    if (!successUrl || !cancelUrl || !priceId) {
      throw new BillingProviderError({
        message: "Stripe checkout env variables failed validation",
        code: "BILLING_PROVIDER_CONFIG_INVALID",
        details: {
          provider: "stripe",
          priceEnvKey,
        },
      });
    }

    const requestBody = new URLSearchParams();
    requestBody.set("mode", "subscription");
    requestBody.set("success_url", successUrl);
    requestBody.set("cancel_url", cancelUrl);
    requestBody.set("client_reference_id", workspaceId);
    requestBody.set("line_items[0][price]", priceId);
    requestBody.set("line_items[0][quantity]", "1");
    requestBody.set("metadata[workspace_id]", workspaceId);
    requestBody.set("metadata[plan_id]", normalizedPlanId);
    requestBody.set("subscription_data[metadata][workspace_id]", workspaceId);
    requestBody.set("subscription_data[metadata][plan_id]", normalizedPlanId);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody.toString(),
    });

    if (!response.ok) {
      const stripeBody = await response.text();
      throw new BillingProviderError({
        message: "Stripe checkout session creation failed",
        code: "BILLING_PROVIDER_REQUEST_FAILED",
        status: 502,
        details: {
          provider: "stripe",
          stripeStatus: response.status,
          stripeBody: stripeBody.slice(0, 500),
        },
      });
    }

    const payload = (await response.json()) as StripeCheckoutSessionResponse;
    if (typeof payload.url !== "string" || payload.url.trim().length === 0) {
      throw new BillingProviderError({
        message: "Stripe checkout response missing url",
        code: "BILLING_PROVIDER_REQUEST_FAILED",
        status: 502,
        details: {
          provider: "stripe",
        },
      });
    }

    return payload.url;
  }

  async cancelSubscription(_workspaceId: string): Promise<void> {
    this.assertStripeEnv(["STRIPE_SECRET_KEY"]);
    throw new BillingProviderError({
      message: "Stripe subscription cancellation is not implemented",
      code: "BILLING_PROVIDER_REQUEST_FAILED",
      status: 501,
      details: {
        provider: "stripe",
        operation: "cancelSubscription",
      },
    });
  }
}

/**
 * Resolve the billing provider based on the BILLING_PROVIDER env var.
 */
export function getBillingProvider(env: NodeJS.ProcessEnv = process.env): BillingProviderInterface {
  const provider = resolveBillingProviderName(env);

  if (provider === "stripe") {
    return new StripeBillingProvider(env);
  }

  return new LocalBillingProvider();
}
