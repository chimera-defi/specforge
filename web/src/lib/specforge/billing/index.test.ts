import crypto from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BillingProviderError,
  getBillingProvider,
  validateAndParseStripeWebhookEvent,
  verifyStripeWebhookSignature,
} from "./index";

const ENV_KEYS = [
  "BILLING_PROVIDER",
  "STRIPE_SECRET_KEY",
  "STRIPE_CHECKOUT_SUCCESS_URL",
  "STRIPE_CHECKOUT_CANCEL_URL",
  "STRIPE_PRICE_ID_PILOT",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_WEBHOOK_TOLERANCE_SECONDS",
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

afterEach(() => {
  const restored: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    restored[key] = ORIGINAL_ENV.get(key);
  }
  applyEnv(restored);
  vi.restoreAllMocks();
});

describe("billing provider resolution", () => {
  it("defaults to local provider and keeps local behavior unchanged", async () => {
    applyEnv({
      BILLING_PROVIDER: undefined,
      STRIPE_SECRET_KEY: undefined,
      STRIPE_CHECKOUT_SUCCESS_URL: undefined,
      STRIPE_CHECKOUT_CANCEL_URL: undefined,
      STRIPE_PRICE_ID_PILOT: undefined,
      STRIPE_WEBHOOK_SECRET: undefined,
      STRIPE_WEBHOOK_TOLERANCE_SECONDS: undefined,
    });

    const provider = getBillingProvider();
    const subscription = await provider.getSubscription("ws_demo");
    const checkoutUrl = await provider.createCheckoutUrl("ws_demo", "pilot");

    expect(subscription).toMatchObject({
      workspaceId: "ws_demo",
      planId: "demo",
      status: "active",
      currentPeriodEnd: null,
    });
    expect(checkoutUrl).toBe("/pricing?mode=local");
  });

  it("resolves stripe provider and validates env at runtime", async () => {
    applyEnv({
      BILLING_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: undefined,
      STRIPE_CHECKOUT_SUCCESS_URL: undefined,
      STRIPE_CHECKOUT_CANCEL_URL: undefined,
      STRIPE_PRICE_ID_PILOT: undefined,
      STRIPE_WEBHOOK_SECRET: undefined,
      STRIPE_WEBHOOK_TOLERANCE_SECONDS: undefined,
    });

    const provider = getBillingProvider();
    await expect(provider.getSubscription("ws_demo")).rejects.toMatchObject({
      name: "BillingProviderError",
      code: "BILLING_PROVIDER_CONFIG_INVALID",
      details: {
        provider: "stripe",
      },
    });
  });

  it("throws a structured error for unsupported providers", () => {
    applyEnv({
      BILLING_PROVIDER: "unknown-provider",
      STRIPE_SECRET_KEY: undefined,
      STRIPE_CHECKOUT_SUCCESS_URL: undefined,
      STRIPE_CHECKOUT_CANCEL_URL: undefined,
      STRIPE_PRICE_ID_PILOT: undefined,
      STRIPE_WEBHOOK_SECRET: undefined,
      STRIPE_WEBHOOK_TOLERANCE_SECONDS: undefined,
    });

    try {
      getBillingProvider();
      throw new Error("expected provider resolution to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(BillingProviderError);
      expect(err).toMatchObject({
        code: "BILLING_PROVIDER_INVALID",
        details: {
          provider: "unknown-provider",
        },
      });
    }
  });

  it("creates a checkout URL through Stripe when configured", async () => {
    applyEnv({
      BILLING_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_test_example",
      STRIPE_CHECKOUT_SUCCESS_URL: "https://specforge.test/success",
      STRIPE_CHECKOUT_CANCEL_URL: "https://specforge.test/cancel",
      STRIPE_PRICE_ID_PILOT: "price_pilot_123",
      STRIPE_WEBHOOK_SECRET: undefined,
      STRIPE_WEBHOOK_TOLERANCE_SECONDS: undefined,
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ url: "https://checkout.stripe.test/c/session_123" }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const provider = getBillingProvider();
    const checkoutUrl = await provider.createCheckoutUrl("ws_demo", "pilot");

    expect(checkoutUrl).toBe("https://checkout.stripe.test/c/session_123");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/checkout/sessions",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = typeof requestInit?.body === "string" ? requestInit.body : "";
    expect(body).toContain("subscription_data%5Bmetadata%5D%5Bworkspace_id%5D=ws_demo");
    expect(body).toContain("subscription_data%5Bmetadata%5D%5Bplan_id%5D=pilot");
  });
});

describe("stripe webhook verification helpers", () => {
  it("validates a well-formed Stripe webhook signature", () => {
    const payload = JSON.stringify({
      id: "evt_123",
      type: "checkout.session.completed",
    });
    const webhookSecret = "whsec_test";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = awaitSignature(payload, timestamp, webhookSecret);

    expect(() =>
      verifyStripeWebhookSignature(
        payload,
        `t=${timestamp},v1=${signature}`,
        webhookSecret,
        {
          nowMs: timestamp * 1000,
          toleranceSeconds: 300,
        },
      ),
    ).not.toThrow();
  });

  it("rejects invalid Stripe webhook signatures", () => {
    const payload = JSON.stringify({
      id: "evt_123",
      type: "checkout.session.completed",
    });

    expect(() =>
      verifyStripeWebhookSignature(payload, "t=1700000000,v1=bad_signature", "whsec_test", {
        nowMs: 1_700_000_000 * 1000,
        toleranceSeconds: 300,
      }),
    ).toThrowError(BillingProviderError);
  });

  it("parses a validated Stripe webhook payload", () => {
    const payload = JSON.stringify({
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {
            workspace_id: "ws_demo",
            plan_id: "pilot",
          },
        },
      },
    });
    const webhookSecret = "whsec_test";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = awaitSignature(payload, timestamp, webhookSecret);

    const event = validateAndParseStripeWebhookEvent(payload, `t=${timestamp},v1=${signature}`, {
      STRIPE_WEBHOOK_SECRET: webhookSecret,
      STRIPE_WEBHOOK_TOLERANCE_SECONDS: "300",
    });

    expect(event.type).toBe("checkout.session.completed");
  });
});

function awaitSignature(payload: string, timestamp: number, webhookSecret: string) {
  return crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
}
