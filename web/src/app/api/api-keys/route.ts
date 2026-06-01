import { NextResponse } from "next/server";
import { getApiKeyManager, createApiKey } from "@/lib/api-keys";

/**
 * GET /api/api-keys - Get API keys
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const workspaceId = searchParams.get("workspaceId");

  const manager = getApiKeyManager();

  if (userId) {
    const keys = manager.getUserApiKeys(userId);
    return NextResponse.json({ keys });
  }

  if (workspaceId) {
    const keys = manager.getWorkspaceApiKeys(workspaceId);
    return NextResponse.json({ keys });
  }

  const keys = manager.getAllApiKeys();
  const stats = manager.getStats();

  return NextResponse.json({
    keys,
    stats,
  });
}

/**
 * POST /api/api-keys - Create an API key
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { name, userId, workspaceId, scopes, rateLimit, expiresIn } = body;

  if (!name || !userId) {
    return NextResponse.json(
      { error: "name and userId are required" },
      { status: 400 }
    );
  }

  const apiKey = createApiKey({
    name,
    userId,
    workspaceId,
    scopes,
    rateLimit,
    expiresIn,
  });

  return NextResponse.json({
    apiKey: {
      id: apiKey.id,
      key: apiKey.key,
      keyPrefix: apiKey.keyPrefix,
      name: apiKey.name,
      scopes: apiKey.scopes,
      rateLimit: apiKey.rateLimit,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    },
    status: "created",
  });
}

/**
 * DELETE /api/api-keys - Delete an API key
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get("keyId");

  if (!keyId) {
    return NextResponse.json(
      { error: "keyId is required" },
      { status: 400 }
    );
  }

  const manager = getApiKeyManager();
  manager.deleteApiKey(keyId);

  return NextResponse.json({
    keyId,
    status: "deleted",
  });
}