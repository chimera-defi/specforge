import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentWorkspaceAccessMock,
  createCheckoutUrlMock,
  getSubscriptionMock,
} = vi.hoisted(() => ({
  getCurrentWorkspaceAccessMock: vi.fn(),
  createCheckoutUrlMock: vi.fn(),
  getSubscriptionMock: vi.fn(),
}));

vi.mock("../../../../lib/specforge/workspace-access", () => ({
  getCurrentWorkspaceAccess: getCurrentWorkspaceAccessMock,
}));

vi.mock("../../../../lib/specforge/billing", async () => {
  const actual = await vi.importActual<typeof import("../../../../lib/specforge/billing")>(
    "../../../../lib/specforge/billing",
  );

  return {
    ...actual,
    getBillingProvider: () => ({
      getSubscription: getSubscriptionMock,
      createCheckoutUrl: createCheckoutUrlMock,
      cancelSubscription: vi.fn(),
    }),
  };
});

import { BillingProviderError } from "../../../../lib/specforge/billing";
import { POST } from "./route";

describe("workspace billing route POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      workspaceId: "ws_demo",
    });
  });

  it("returns a checkout URL for the current workspace", async () => {
    createCheckoutUrlMock.mockResolvedValue("https://checkout.stripe.test/c/session_123");

    const response = await POST(
      new Request("http://localhost:3000/api/workspace/billing", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: "ws_demo",
          planId: "pilot",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      workspaceId: "ws_demo",
      planId: "pilot",
      checkoutUrl: "https://checkout.stripe.test/c/session_123",
    });
    expect(createCheckoutUrlMock).toHaveBeenCalledWith("ws_demo", "pilot");
  });

  it("returns a structured error when workspace access does not match", async () => {
    createCheckoutUrlMock.mockResolvedValue("https://checkout.stripe.test/c/session_123");

    const response = await POST(
      new Request("http://localhost:3000/api/workspace/billing", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: "ws_other",
          planId: "pilot",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        message: "workspaceId does not match current workspace access",
        code: "BILLING_WORKSPACE_MISMATCH",
      },
    });
    expect(createCheckoutUrlMock).not.toHaveBeenCalled();
  });

  it("maps billing provider errors into structured responses", async () => {
    createCheckoutUrlMock.mockRejectedValue(
      new BillingProviderError({
        message: "Missing required Stripe env: STRIPE_SECRET_KEY",
        code: "BILLING_PROVIDER_CONFIG_INVALID",
        details: {
          provider: "stripe",
          missing: ["STRIPE_SECRET_KEY"],
        },
      }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/workspace/billing", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: "ws_demo",
          planId: "pilot",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        message: "Missing required Stripe env: STRIPE_SECRET_KEY",
        code: "BILLING_PROVIDER_CONFIG_INVALID",
        details: {
          provider: "stripe",
          missing: ["STRIPE_SECRET_KEY"],
        },
      },
    });
  });
});
