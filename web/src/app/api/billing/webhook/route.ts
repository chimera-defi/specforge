import { NextResponse } from "next/server";

import {
  isBillingProviderError,
  validateAndParseStripeWebhookEvent,
} from "../../../../lib/specforge/billing";
import { recordWorkspaceEvent, updateWorkspacePlan } from "../../../../lib/specforge/store";

export const runtime = "nodejs";

const STRIPE_WEBHOOK_ACTOR_ID = "stripe_webhook";

function toWebhookErrorResponse(error: unknown) {
  if (isBillingProviderError(error)) {
    return NextResponse.json(
      {
        received: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details ?? null,
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      received: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown webhook error",
        code: "BILLING_WEBHOOK_HANDLER_FAILED",
      },
    },
    { status: 500 },
  );
}

function getEventObject(event: {
  data?: {
    object?: Record<string, unknown>;
  };
}) {
  return event.data?.object ?? {};
}

function getMetadata(object: Record<string, unknown>) {
  const rawMetadata = object.metadata;
  if (rawMetadata && typeof rawMetadata === "object") {
    return rawMetadata as Record<string, unknown>;
  }
  return {};
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeWorkspacePlan(
  stripeStatus: string | null,
  planId: string | null,
): "demo" | "pilot" | null {
  const normalizedStatus = stripeStatus?.trim().toLowerCase() ?? "";
  const normalizedPlanId = planId?.trim().toLowerCase() ?? "";

  if (normalizedStatus === "canceled" || normalizedStatus === "unpaid" || normalizedStatus === "incomplete_expired") {
    return "demo";
  }

  if (normalizedStatus === "active" || normalizedStatus === "trialing" || normalizedStatus === "past_due") {
    return "pilot";
  }

  if (normalizedPlanId === "demo") {
    return "demo";
  }

  if (normalizedPlanId.length > 0) {
    return "pilot";
  }

  return null;
}

function extractWorkspaceContext(event: {
  type?: string;
  data?: {
    object?: Record<string, unknown>;
  };
}) {
  const object = getEventObject(event);
  const metadata = getMetadata(object);
  const eventType = getTrimmedString(event.type);

  const workspaceId =
    getTrimmedString(metadata.workspace_id) ||
    getTrimmedString(object.client_reference_id);

  const planId = getTrimmedString(metadata.plan_id) || null;
  const stripeStatus = getTrimmedString(object.status) || null;

  return {
    eventType,
    workspaceId,
    planId,
    stripeStatus,
  };
}

function isSupportedEventType(eventType: string) {
  return (
    eventType === "checkout.session.completed" ||
    eventType === "customer.subscription.created" ||
    eventType === "customer.subscription.updated" ||
    eventType === "customer.subscription.deleted"
  );
}

async function syncWorkspaceFromStripeWebhook(event: {
  id?: string;
  type?: string;
  data?: {
    object?: Record<string, unknown>;
  };
}) {
  const context = extractWorkspaceContext(event);

  if (!isSupportedEventType(context.eventType)) {
    return {
      applied: false,
      ignored: true,
      reason: "unsupported_event_type",
      eventType: context.eventType,
    };
  }

  if (!context.workspaceId) {
    return {
      applied: false,
      ignored: true,
      reason: "missing_workspace_id",
      eventType: context.eventType,
    };
  }

  const nextPlan = normalizeWorkspacePlan(context.stripeStatus, context.planId);

  await recordWorkspaceEvent({
    workspace_id: context.workspaceId,
    event_type: "billing.subscription_synced",
    actor_type: "system",
    actor_id: STRIPE_WEBHOOK_ACTOR_ID,
    payload: {
      source: "stripe_webhook",
      event_id: event.id ?? null,
      event_type: context.eventType,
      stripe_status: context.stripeStatus,
      billing_plan_id: context.planId,
      workspace_plan: nextPlan,
    },
  });

  if (!nextPlan) {
    return {
      applied: false,
      ignored: true,
      reason: "no_workspace_plan_mapping",
      eventType: context.eventType,
      workspaceId: context.workspaceId,
    };
  }

  await updateWorkspacePlan(context.workspaceId, nextPlan);

  await recordWorkspaceEvent({
    workspace_id: context.workspaceId,
    event_type: "workspace.plan_changed",
    actor_type: "system",
    actor_id: STRIPE_WEBHOOK_ACTOR_ID,
    payload: {
      source: "stripe_webhook",
      event_id: event.id ?? null,
      event_type: context.eventType,
      stripe_status: context.stripeStatus,
      billing_plan_id: context.planId,
      plan: nextPlan,
    },
  });

  return {
    applied: true,
    ignored: false,
    eventType: context.eventType,
    workspaceId: context.workspaceId,
    workspacePlan: nextPlan,
  };
}

export async function POST(request: Request) {
  try {
    const billingProvider = process.env.BILLING_PROVIDER?.trim().toLowerCase() ?? "local";
    if (billingProvider !== "stripe") {
      return NextResponse.json(
        {
          received: false,
          ignored: true,
          reason: "billing_provider_not_stripe",
        },
        { status: 503 },
      );
    }

    const payload = await request.text();
    const signatureHeader = request.headers.get("stripe-signature");
    const event = validateAndParseStripeWebhookEvent(payload, signatureHeader, process.env);
    const result = await syncWorkspaceFromStripeWebhook(event);

    return NextResponse.json({
      received: true,
      ...result,
    });
  } catch (error) {
    return toWebhookErrorResponse(error);
  }
}
