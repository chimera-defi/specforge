import { NextResponse } from "next/server";
import { getWebhookManager } from "@/lib/webhooks/manager";

/**
 * GET /api/webhooks - Get all webhooks
 */
export async function GET() {
  const manager = getWebhookManager();
  const webhooks = manager.getAllWebhooks();
  const stats = manager.getStats();

  return NextResponse.json({
    webhooks,
    stats,
  });
}

/**
 * POST /api/webhooks - Register a new webhook
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { url, events, secret } = body;

  if (!url || !events || !Array.isArray(events)) {
    return NextResponse.json(
      { error: "url and events array are required" },
      { status: 400 }
    );
  }

  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { error: "secret must be at least 32 characters" },
      { status: 400 }
    );
  }

  const manager = getWebhookManager();
  const webhookId = manager.register({
    url,
    events,
    secret,
    active: true,
  });

  return NextResponse.json({
    webhookId,
    status: "registered",
  });
}

/**
 * DELETE /api/webhooks - Delete a webhook
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const webhookId = searchParams.get("webhookId");

  if (!webhookId) {
    return NextResponse.json(
      { error: "webhookId is required" },
      { status: 400 }
    );
  }

  const manager = getWebhookManager();
  manager.deleteWebhook(webhookId);

  return NextResponse.json({
    webhookId,
    status: "deleted",
  });
}