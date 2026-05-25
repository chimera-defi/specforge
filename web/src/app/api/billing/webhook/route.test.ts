import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  validateAndParseStripeWebhookEventMock,
  updateWorkspacePlanMock,
  recordWorkspaceEventMock,
} = vi.hoisted(() => ({
  validateAndParseStripeWebhookEventMock: vi.fn(),
  updateWorkspacePlanMock: vi.fn(),
  recordWorkspaceEventMock: vi.fn(),
}));

vi.mock("../../../../lib/specforge/billing", async () => {
  const actual = await vi.importActual<typeof import("../../../../lib/specforge/billing")>(
    "../../../../lib/specforge/billing",
  );

  return {
    ...actual,
    validateAndParseStripeWebhookEvent: validateAndParseStripeWebhookEventMock,
  };
});

vi.mock("../../../../lib/specforge/store", () => ({
  updateWorkspacePlan: updateWorkspacePlanMock,
  recordWorkspaceEvent: recordWorkspaceEventMock,
}));

import { BillingProviderError } from "../../../../lib/specforge/billing";
import { POST } from "./route";

const ORIGINAL_BILLING_PROVIDER = process.env.BILLING_PROVIDER;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.BILLING_PROVIDER = "stripe";
  updateWorkspacePlanMock.mockResolvedValue({
    workspace_id: "ws_demo",
    name: "SpecForge Demo Workspace",
    plan: "pilot",
    created_at: new Date(0).toISOString(),
  });
  recordWorkspaceEventMock.mockResolvedValue(undefined);
});

afterEach(() => {
  if (typeof ORIGINAL_BILLING_PROVIDER === "string") {
    process.env.BILLING_PROVIDER = ORIGINAL_BILLING_PROVIDER;
  } else {
    delete process.env.BILLING_PROVIDER;
  }
});

describe("billing webhook route", () => {
  it("returns 503 when BILLING_PROVIDER is not stripe", async () => {
    process.env.BILLING_PROVIDER = "local";

    const response = await POST(
      new Request("http://localhost:3000/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      received: false,
      ignored: true,
      reason: "billing_provider_not_stripe",
    });
    expect(validateAndParseStripeWebhookEventMock).not.toHaveBeenCalled();
  });

  it("processes checkout.session.completed and syncs workspace plan", async () => {
    validateAndParseStripeWebhookEventMock.mockReturnValue({
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "ws_demo",
          metadata: {
            workspace_id: "ws_demo",
            plan_id: "pilot",
          },
        },
      },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/billing/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "t=1700000000,v1=sig",
        },
        body: JSON.stringify({
          type: "checkout.session.completed",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      received: true,
      applied: true,
      workspaceId: "ws_demo",
      workspacePlan: "pilot",
    });
    expect(updateWorkspacePlanMock).toHaveBeenCalledWith("ws_demo", "pilot");
    expect(recordWorkspaceEventMock).toHaveBeenCalledTimes(2);
  });

  it("ignores unsupported event types", async () => {
    validateAndParseStripeWebhookEventMock.mockReturnValue({
      id: "evt_ignored",
      type: "invoice.created",
      data: {
        object: {
          metadata: {
            workspace_id: "ws_demo",
          },
        },
      },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/billing/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "t=1700000000,v1=sig",
        },
        body: JSON.stringify({
          type: "invoice.created",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      received: true,
      applied: false,
      ignored: true,
      reason: "unsupported_event_type",
    });
    expect(updateWorkspacePlanMock).not.toHaveBeenCalled();
  });

  it("maps billing provider errors to structured responses", async () => {
    validateAndParseStripeWebhookEventMock.mockImplementation(() => {
      throw new BillingProviderError({
        message: "Missing Stripe-Signature header",
        code: "BILLING_WEBHOOK_INVALID_SIGNATURE",
        status: 400,
      });
    });

    const response = await POST(
      new Request("http://localhost:3000/api/billing/webhook", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      received: false,
      error: {
        message: "Missing Stripe-Signature header",
        code: "BILLING_WEBHOOK_INVALID_SIGNATURE",
        details: null,
      },
    });
  });
});
