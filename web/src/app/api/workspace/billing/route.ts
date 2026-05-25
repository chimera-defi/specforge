import { NextResponse } from "next/server";

import { getBillingProvider, isBillingProviderError } from "../../../../lib/specforge/billing";
import { getCurrentWorkspaceAccess } from "../../../../lib/specforge/workspace-access";
import { loadWorkspaceBillingSummary } from "../../../../lib/specforge/workspace-summary";

function toBillingErrorResponse(
  err: unknown,
  fallbackCode: string,
  fallbackStatus: number,
) {
  if (isBillingProviderError(err)) {
    return NextResponse.json(
      {
        error: {
          message: err.message,
          code: err.code,
          details: err.details ?? null,
        },
      },
      { status: err.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        message: err instanceof Error ? err.message : "Unknown error",
        code: fallbackCode,
      },
    },
    { status: fallbackStatus },
  );
}

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspaceAccess();
    const [summary, subscription] = await Promise.all([
      loadWorkspaceBillingSummary(workspaceId),
      getBillingProvider().getSubscription(workspaceId),
    ]);

    return NextResponse.json({
      ...summary,
      subscription,
    });
  } catch (err) {
    return toBillingErrorResponse(err, "BILLING_FETCH_FAILED", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspaceAccess();
    const body = await request.json() as {
      workspaceId?: unknown;
      planId?: unknown;
    };

    const requestedWorkspaceId =
      typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";

    if (!requestedWorkspaceId || !planId) {
      return NextResponse.json(
        {
          error: {
            message: "workspaceId and planId are required",
            code: "BILLING_CHECKOUT_REQUEST_INVALID",
          },
        },
        { status: 400 },
      );
    }

    if (requestedWorkspaceId !== workspaceId) {
      return NextResponse.json(
        {
          error: {
            message: "workspaceId does not match current workspace access",
            code: "BILLING_WORKSPACE_MISMATCH",
          },
        },
        { status: 403 },
      );
    }

    const checkoutUrl = await getBillingProvider().createCheckoutUrl(workspaceId, planId);
    return NextResponse.json({
      workspaceId,
      planId,
      checkoutUrl,
    });
  } catch (err) {
    return toBillingErrorResponse(err, "BILLING_CHECKOUT_CREATE_FAILED", 500);
  }
}
